import { readEditorAiProposal, requestEditorAi } from "@editor/ai-client"
import { expect, test } from "bun:test"

const encoder = new TextEncoder()

const complete = 'event: complete\ndata: {"version":1}\n\n'

const text = 'event: text\ndata: {"text":"héllo 🦊 <script>"}\n\n'

function body(wire: string | Uint8Array, fragment = 1) {
  const bytes = wire instanceof Uint8Array ? wire : encoder.encode(wire)
  let offset = 0

  return new ReadableStream<Uint8Array>({
    pull(controller) {
      if (offset === bytes.length) controller.close()
      else {
        controller.enqueue(bytes.slice(offset, offset + fragment))
        offset = Math.min(offset + fragment, bytes.length)
      }
    },
  })
}

function read(wire: string | Uint8Array) {
  return readEditorAiProposal(
    body(wire),
    new AbortController().signal,
    () => undefined,
  )
}

async function rejects(pending: Promise<unknown>, message?: string) {
  try {
    await pending
  } catch (error) {
    expect(error).toBeInstanceOf(Error)

    if (message && error instanceof Error) expect(error.message).toBe(message)

    return
  }

  throw new Error("Expected rejection")
}

test("portable fixture: fragmented UTF8, CR/LF, comments, multiline JSON and progressive plain text", async () => {
  for (const ending of ["\n", "\r", "\r\n"]) {
    const progress: string[] = []

    const wire = (
      ': ping\n\nevent: text\ndata: {\ndata: "text":"héllo 🦊 <script>"}\n\n' +
      complete
    ).replaceAll("\n", ending)

    expect(
      await readEditorAiProposal(
        body(wire),
        new AbortController().signal,
        (value) => progress.push(value),
      ),
    ).toBe("héllo 🦊 <script>")
    expect(progress).toEqual(["héllo 🦊 <script>"])
  }
})

test("portable fixture: incomplete, invalid, ambiguous and truncated streams fail closed", async () => {
  for (const wire of [
    text,
    text + complete.trimEnd(),
    text + complete + text,
    complete + complete,
    'event: text\ndata: {"text":1}\n\n',
    'event: text\ndata: {"text":"x","html":"bad"}\n\n' + complete,
    'event: complete\ndata: {"version":2}\n\n',
    "event: unknown\ndata: {}\n\n",
    'event: text\nevent: complete\ndata: {"version":1}\n\n',
    text + 'event: error\ndata: {"code":"truncated"}\n\n',
    new Uint8Array([255]),
    encoder.encode(text + complete).slice(0, -1),
  ]) {
    await rejects(read(wire))
  }
})

test("portable fixture: byte limits and abort release readers", async () => {
  await rejects(
    read(
      'event: text\ndata: {"text":"' + "x".repeat(65_537) + '"}\n\n' + complete,
    ),
  )
  let cancelled = false

  const stream = new ReadableStream<Uint8Array>({
    cancel() {
      cancelled = true
    },
  })

  const controller = new AbortController()

  const pending = readEditorAiProposal(
    stream,
    controller.signal,
    () => undefined,
  )

  controller.abort()
  await rejects(pending)
  expect(cancelled).toBe(true)
})

test("portable fixture: host headers, same origin, fixed POST, no retry and deadline", async () => {
  let calls = 0

  const config = {
    endpoint: "/host-ai",
    documentId: "doc",
    headers: () => ({
      "x-csrf-token": "fixture-only",
      authorization: "Bearer fixture-only",
    }),
    timeoutMs: 50,
  }

  const input = {
    operation: "generate" as const,
    instruction: "Draft",
    selectedText: "",
    context: "",
  }

  const transport = (url: string, init: RequestInit) => {
    calls++
    expect(String(url)).toBe("https://editor.example/host-ai")
    expect(init?.redirect).toBe("error")
    expect(init?.credentials).toBe("same-origin")
    const headers = new Headers(init?.headers)
    expect(headers.get("x-editor-request")).toBe("1")
    expect(headers.get("x-csrf-token")).toBe("fixture-only")

    return Promise.resolve(
      new Response(body(text + complete), {
        headers: { "content-type": "text/event-stream" },
      }),
    )
  }

  expect(
    await requestEditorAi(
      config,
      input,
      "https://editor.example",
      new AbortController().signal,
      () => undefined,
      transport,
    ),
  ).toContain("héllo")

  for (const endpoint of [
    "https://evil.example/ai",
    "/ai?token=bad",
    "/ai#secret",
    "https://user:secret@editor.example/ai",
  ]) {
    await rejects(
      requestEditorAi(
        { ...config, endpoint },
        input,
        "https://editor.example",
        new AbortController().signal,
        () => undefined,
        transport,
      ),
    )
  }

  expect(calls).toBe(1)
  await rejects(
    requestEditorAi(
      config,
      input,
      "https://editor.example",
      new AbortController().signal,
      () => undefined,
      () => {
        calls++

        return Promise.resolve(new Response("secret", { status: 429 }))
      },
    ),
    "request_failed",
  )
  expect(calls).toBe(2)
  await rejects(
    requestEditorAi(
      { ...config, timeoutMs: 5, headers: () => new Promise(() => undefined) },
      input,
      "https://editor.example",
      new AbortController().signal,
      () => undefined,
      transport,
    ),
    "deadline",
  )
  expect(calls).toBe(2)
})

for (const ending of ["\n", "\r", "\r\n"]) {
  test(`portable fixture: exact UTF8 frame boundary ${JSON.stringify(ending)}`, async () => {
    for (const fragment of [1, 131_072]) {
      for (const size of [65_536, 65_537]) {
        const prefix =
          ":" + "x".repeat(size - 1 - 2 * ending.length) + ending + ending

        const progress: string[] = []

        const pending = readEditorAiProposal(
          body(prefix + text + complete, fragment),
          new AbortController().signal,
          (value) => progress.push(value),
        )

        if (size === 65_536) {
          expect(await pending).toBe("héllo 🦊 <script>")
          expect(progress).toEqual(["héllo 🦊 <script>"])
        } else {
          await rejects(pending, "output_limit")
          expect(progress).toEqual([])
        }
      }
    }
  })
}
