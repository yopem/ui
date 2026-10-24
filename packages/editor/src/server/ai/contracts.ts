import type {
  EditorAuthentication,
  EditorAuthorizationInput,
  EditorIdentity,
} from "@yopem-ui/editor/server"

export interface AiInput {
  documentId: string
  operation: "generate" | "rewrite" | "copilot"
  instruction: string
  selectedText: string
  context: string
}

export type AiEvent = { type: "text"; text: string } | { type: "complete" }

export interface EditorAiProvider {
  readonly maxTokens: number
  open(
    input: AiInput,
    signal: AbortSignal,
    deadline?: number,
  ): Promise<AsyncGenerator<AiEvent>>
}

export interface AiProviderOptions {
  apiKey: string
  model: string
  system: string
  maxTokens: number
  transport?: (request: Request) => Promise<Response>
}

export interface AiHandlerOptions {
  provider: EditorAiProvider
  trustedOrigin: string
  authenticate: EditorAuthentication
  policy: (
    input: EditorAuthorizationInput,
  ) => Promise<true | false | "unavailable">
  verifyCsrf: (request: Request) => Promise<boolean>
  reserve: (input: {
    identity: EditorIdentity
    documentId: string
    maxTokens: number
    signal: AbortSignal
  }) => Promise<"reserved" | "denied" | "unavailable">
  maxDurationMs: number
  maxInputBytes: number
  maxOutputBytes: number
}
