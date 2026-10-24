import { createHeadlessEditor } from "@lexical/headless"
import {
  documentNodes,
  documentLimits,
  importDocument,
  exportDocument,
  streamMarkdown,
  DocumentError,
} from "@yopem-ui/editor/document"
import { expect, test } from "bun:test"
import { $getRoot } from "lexical"

function editor() {
  const instance = createHeadlessEditor({
    namespace: "stream",
    nodes: documentNodes,
    onError(error) {
      throw error
    },
  })

  importDocument(instance, "Before", "markdown")

  return instance
}

test("verified EOF commits without calling producer return", async () => {
  const instance = editor()
  let done = false
  let returned = false

  const chunks: AsyncIterableIterator<string> = {
    [Symbol.asyncIterator]() {
      return this
    },
    next() {
      if (done) return Promise.resolve({ done: true, value: undefined })
      done = true

      return Promise.resolve({ done: false, value: "Complete" })
    },
    return() {
      returned = true
      throw new Error("cleanup unavailable")
    },
  }

  expect(await streamMarkdown(instance, chunks)).toBe("Complete")
  expect(returned).toBe(false)
  expect(exportDocument(instance, "markdown").trim()).toBe("Complete")
})

test("producer failure and malformed final content leave old state", async () => {
  for (const invalid of [false, true]) {
    const instance = editor()
    const before = instance.getEditorState()

    async function* chunks() {
      await Promise.resolve()
      yield "Partial"

      if (invalid) yield "<script>x</script>"
      else throw new Error("producer failed")
    }

    const failure = await streamMarkdown(instance, chunks()).catch(
      (error: Error) => error,
    )

    expect(failure).toBeInstanceOf(Error)
    expect(instance.getEditorState()).toBe(before)
  }
})

test("abort releases blocked producer; synchronous cleanup failure cannot replace cancellation", async () => {
  const instance = editor()
  const before = instance.getEditorState()
  const controller = new AbortController()
  let returned = false

  const chunks: AsyncIterableIterator<string> = {
    [Symbol.asyncIterator]() {
      return this
    },
    next() {
      controller.abort()

      return new Promise(() => undefined)
    },
    return() {
      returned = true
      throw new Error("cleanup unavailable")
    },
  }

  const failure = await streamMarkdown(instance, chunks, {
    signal: controller.signal,
  }).catch((error: Error) => error)

  expect(failure).toBeInstanceOf(DocumentError)
  expect(failure).toHaveProperty("message", "Stream cancelled.")
  await Promise.resolve()
  expect(returned).toBe(true)
  expect(instance.getEditorState()).toBe(before)
})

test("stream size rejection preserves state and closes producer", async () => {
  const instance = editor()
  const before = instance.getEditorState()
  let returned = false

  async function* chunks() {
    await Promise.resolve()

    try {
      yield "X".repeat(1_048_577)
    } finally {
      returned = true
    }
  }

  const failure = await streamMarkdown(instance, chunks()).catch(
    (error: Error) => error,
  )

  expect(failure).toBeInstanceOf(DocumentError)
  await Promise.resolve()
  expect(returned).toBe(true)
  expect(instance.getEditorState()).toBe(before)
})

for (const fragment of ["", "x"]) {
  test(`timer cancellation stays responsive for immediate ${fragment ? "text" : "empty"} fragments`, async () => {
    const instance = editor()
    const before = instance.getEditorState()
    const controller = new AbortController()
    let returned = false

    async function* chunks() {
      await Promise.resolve()

      try {
        while (true) yield fragment
      } finally {
        returned = true
      }
    }

    const timer = setTimeout(() => controller.abort(), 20)

    try {
      const failure = await streamMarkdown(instance, chunks(), {
        signal: controller.signal,
      }).catch((error: Error) => error)

      expect(failure).toBeInstanceOf(DocumentError)
      expect(failure).toHaveProperty("message", "Stream cancelled.")
      await Promise.resolve()
      expect(returned).toBe(true)
      expect(instance.getEditorState()).toBe(before)
    } finally {
      clearTimeout(timer)
    }
  })
}

test("stream UTF8 source reaches EOF at its byte limit before the serialized tree limit", async () => {
  const instance = editor()
  const before = instance.getEditorState()
  const prefix = "x".repeat(documentLimits.bytes - 4)
  let eof = false
  let progress = ""

  async function* chunks() {
    await Promise.resolve()
    yield prefix
    yield "\ud83d"
    yield ""
    yield "\ude00"
    eof = true
  }

  const failure = await streamMarkdown(instance, chunks(), {
    onProgress(value) {
      progress = value
    },
  }).catch((error: Error) => error)

  expect(failure).toBeInstanceOf(DocumentError)
  expect(failure).toHaveProperty("message", "Document exceeds 1 MiB.")
  expect(eof).toBe(true)
  expect(progress).toBe(`${prefix}😀`)
  expect(instance.getEditorState()).toBe(before)
}, 20_000)

test("stream UTF8 overrun after a split pair preserves the prior document and returns the producer", async () => {
  const instance = editor()
  const before = instance.getEditorState()
  let returned = false

  async function* chunks() {
    await Promise.resolve()

    try {
      yield "x".repeat(documentLimits.bytes - 4)
      yield "\ud83d"
      yield ""
      yield "\ude00"
      yield "x"
    } finally {
      returned = true
    }
  }

  const failure = await streamMarkdown(instance, chunks()).catch(
    (error: Error) => error,
  )

  expect(failure).toBeInstanceOf(DocumentError)
  expect(failure).toHaveProperty("message", "Document exceeds 1 MiB.")
  await Promise.resolve()
  expect(returned).toBe(true)
  expect(instance.getEditorState()).toBe(before)
}, 20_000)

test("many small fragments preserve text and final progress", async () => {
  const instance = editor()
  let progress = ""

  async function* chunks() {
    await Promise.resolve()

    for (let index = 0; index < 4096; index += 1) {
      yield ""
      yield "a"
      yield "\ud83d"
      yield "\ude00"
    }
  }

  const source = await streamMarkdown(instance, chunks(), {
    onProgress(value) {
      progress = value
    },
  })

  expect(source).toBe("a😀".repeat(4096))
  expect(progress).toBe(source)
  expect(
    instance.getEditorState().read(() => $getRoot().getTextContent()),
  ).toBe(source)
}, 20_000)
