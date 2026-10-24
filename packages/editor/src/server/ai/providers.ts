import { z } from "zod"

import type { AiEvent, AiProviderOptions, EditorAiProvider } from "./contracts"

import { AiFailure, checkAiDeadline, readSse, untilAbort } from "./streams"

const configuredProviders = new WeakSet<EditorAiProvider>()

const optionsSchema = z.object({
  apiKey: z
    .string()
    .min(1)
    .max(16_384)
    .regex(/^[^\s]+$/),
  model: z
    .string()
    .min(1)
    .max(256)
    .regex(/^[\w@./:-]+$/),
  system: z.string().min(1).max(16_384),
  maxTokens: z.number().int().min(1).max(32_768),
})

const chatSchema = z.object({
  choices: z
    .array(
      z.object({
        index: z.literal(0),
        delta: z.object({
          content: z.string().nullable().optional(),
          role: z.literal("assistant").optional(),
          refusal: z.null().optional(),
          tool_calls: z.never().optional(),
          function_call: z.never().optional(),
        }),
        finish_reason: z.string().nullable(),
      }),
    )
    .length(1),
})

const envelopeSchema = z.object({
  type: z.string(),
  index: z.number().int().nonnegative().optional(),
  content_block: z
    .object({ type: z.literal("text"), text: z.literal("") })
    .optional(),
  delta: z
    .object({
      type: z.string().optional(),
      text: z.string().optional(),
      stop_reason: z.string().nullable().optional(),
    })
    .optional(),
})

export function isConfiguredProvider(provider: EditorAiProvider) {
  return configuredProviders.has(provider)
}

export function createOpenAiProvider(options: AiProviderOptions) {
  return createProvider(
    options,
    "https://api.openai.com/v1/chat/completions",
    "chat",
  )
}

export function createAnthropicProvider(options: AiProviderOptions) {
  return createProvider(
    options,
    "https://api.anthropic.com/v1/messages",
    "anthropic",
  )
}

export function createWorkersAiProvider(
  options: AiProviderOptions & {
    accountId: string
    schema: "chat-completions"
  },
) {
  if (
    !/^[a-f0-9]{32}$/.test(options.accountId) ||
    options.schema !== "chat-completions" ||
    !/^@cf\/[\w-]+\/[\w.-]+$/.test(options.model)
  )
    throw new Error("invalid_configuration")

  return createProvider(
    options,
    `https://api.cloudflare.com/client/v4/accounts/${options.accountId}/ai/v1/chat/completions`,
    "chat",
  )
}

function createProvider(
  options: AiProviderOptions,
  endpoint: string,
  format: "chat" | "anthropic",
): EditorAiProvider {
  const parsed = optionsSchema.safeParse(options)

  if (!parsed.success) throw new Error("invalid_configuration")

  const config = parsed.data
  const transport = options.transport ?? fetch

  if (!z.function().safeParse(transport).success)
    throw new Error("invalid_configuration")

  const provider: EditorAiProvider = {
    maxTokens: config.maxTokens,
    async open(input, signal, deadline = Infinity) {
      checkAiDeadline(signal, deadline)

      const content = JSON.stringify({
        operation: input.operation,
        instruction: input.instruction,
        selectedText: input.selectedText,
        context: input.context,
      })

      const messages = [{ role: "user", content }]

      const body =
        format === "anthropic"
          ? {
              model: config.model,
              system: config.system,
              messages,
              max_tokens: config.maxTokens,
              stream: true,
            }
          : {
              model: config.model,
              messages: [
                { role: "system", content: config.system },
                ...messages,
              ],
              max_completion_tokens: config.maxTokens,
              stream: true,
              n: 1,
            }

      const headers: HeadersInit =
        format === "anthropic"
          ? {
              "x-api-key": config.apiKey,
              "anthropic-version": "2023-06-01",
              "content-type": "application/json",
            }
          : {
              authorization: `Bearer ${config.apiKey}`,
              "content-type": "application/json",
            }

      const request = new Request(endpoint, {
        method: "POST",
        redirect: "error",
        headers,
        body: JSON.stringify(body),
        signal,
      })

      checkAiDeadline(signal, deadline)

      const pending = transport(request)

      pending
        .then((response) => {
          if (signal.aborted)
            return response.body?.cancel().catch(() => undefined)
        })
        .catch(() => undefined)
      const response = await untilAbort(pending, signal)

      try {
        checkAiDeadline(signal, deadline)
      } catch (error) {
        await response.body?.cancel().catch(() => undefined)
        throw error
      }

      if (
        !response.ok ||
        !response.body ||
        response.headers.get("content-type")?.split(";")[0]?.trim() !==
          "text/event-stream"
      ) {
        await response.body?.cancel().catch(() => undefined)
        throw new AiFailure("provider_unavailable")
      }

      return decode(response.body, signal, format, deadline)
    },
  }

  Object.freeze(provider)
  configuredProviders.add(provider)

  return provider
}

async function* decode(
  body: ReadableStream<Uint8Array>,
  signal: AbortSignal,
  format: "chat" | "anthropic",
  deadline: number,
): AsyncGenerator<AiEvent> {
  let stopped = false
  let started = false
  let blockIndex: number | undefined
  let nextBlock = 0

  try {
    for await (const frame of readSse(body, signal, deadline)) {
      checkAiDeadline(signal, deadline)

      if (format === "chat" && frame.data === "[DONE]") {
        if (!stopped) throw new AiFailure("truncated")
        yield { type: "complete" }

        return
      }

      const json: unknown = JSON.parse(frame.data)

      if (format === "chat") {
        const result = chatSchema.parse(json)
        const choice = result.choices[0]

        if (!choice || stopped) throw new AiFailure("invalid_stream")

        if (choice.delta.content)
          yield { type: "text", text: choice.delta.content }

        if (choice.finish_reason !== null) {
          if (choice.finish_reason !== "stop") throw new AiFailure("truncated")
          stopped = true
        }
      } else {
        const event = envelopeSchema.parse(json)

        if (frame.event && frame.event !== event.type)
          throw new AiFailure("invalid_stream")

        if (event.type === "error") throw new AiFailure("provider_unavailable")

        if (event.type === "message_start") {
          if (started) throw new AiFailure("invalid_stream")
          started = true
        } else if (event.type === "content_block_delta") {
          if (
            !started ||
            stopped ||
            blockIndex === undefined ||
            event.index !== blockIndex ||
            event.delta?.type !== "text_delta" ||
            !z.string().safeParse(event.delta.text).success
          )
            throw new AiFailure("invalid_stream")
          yield { type: "text", text: z.string().parse(event.delta.text) }
        } else if (event.type === "message_delta") {
          if (
            !started ||
            stopped ||
            blockIndex !== undefined ||
            event.delta?.stop_reason !== "end_turn"
          )
            throw new AiFailure("truncated")
          stopped = true
        } else if (event.type === "message_stop") {
          if (!stopped) throw new AiFailure("truncated")
          yield { type: "complete" }

          return
        } else if (event.type === "content_block_start") {
          if (
            !started ||
            stopped ||
            blockIndex !== undefined ||
            event.index !== nextBlock ||
            !event.content_block
          )
            throw new AiFailure("invalid_stream")
          blockIndex = event.index
        } else if (event.type === "content_block_stop") {
          if (blockIndex === undefined || event.index !== blockIndex)
            throw new AiFailure("invalid_stream")
          blockIndex = undefined
          nextBlock++
        } else if (event.type !== "ping") throw new AiFailure("invalid_stream")
      }
    }

    throw new AiFailure("truncated")
  } catch (error) {
    if (error instanceof AiFailure) throw error
    throw new AiFailure("invalid_stream")
  }
}
