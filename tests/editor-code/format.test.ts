import {
  formatEditorCode,
  getEditorCodeParser,
  prettierEditorCodeFormatter,
} from "@editor/code-format"
import {
  createEditorCodeStore,
  codeWrapState,
  type EditorCodeFormatter,
} from "@editor/code-model"
import { $createCodeNode, CodeNode, CodeHighlightNode } from "@lexical/code"
import { registerCodeHighlighting } from "@lexical/code-prism"
import { createEmptyHistoryState, registerHistory } from "@lexical/history"
import { expect, test } from "bun:test"
import {
  $createTextNode,
  $createParagraphNode,
  $getRoot,
  $getState,
  $setSelection,
  $setState,
  createEditor,
  UNDO_COMMAND,
  REDO_COMMAND,
  type ElementNode,
} from "lexical"

function setup(text = "const x={a:1}") {
  const editor = createEditor({
    namespace: "format",
    nodes: [CodeNode, CodeHighlightNode],
    onError(error) {
      throw error
    },
  })

  const unregisterHighlighting = registerCodeHighlighting(editor)

  editor.update(
    () => {
      const code = $createCodeNode("javascript").append($createTextNode(text))
      $setState(code, codeWrapState, false)
      $getRoot().append(
        code,
        $createParagraphNode().append($createTextNode("outside")),
      )
      code.selectStart()
    },
    { discrete: true },
  )
  const store = createEditorCodeStore(editor)
  const unsubscribeStore = store.subscribe(() => undefined)

  function unsubscribe() {
    unsubscribeStore()
    unregisterHighlighting()
  }

  return { editor, store, unsubscribe }
}

test.each([
  ["javascript", "const x={a:1}", "const x = { a: 1 };\n"],
  ["typescript", "const x:number=1", "const x: number = 1;\n"],
  ["json", '{"x":1}', '{ "x": 1 }\n'],
  ["css", "a{color:red}", "a {\n  color: red;\n}\n"],
  ["yaml", "x: [1,2]", "x: [1, 2]\n"],
  ["graphql", "query{user{id}}", "query {\n  user {\n    id\n  }\n}\n"],
])("formats actual %s parser", async (language, input, output) => {
  expect(prettierEditorCodeFormatter.supports(language)).toBe(true)
  expect(await formatEditorCode(input, language)).toBe(output)
})

test("unsupported and inherited names have no parser", () => {
  for (const language of ["python", "rust", "constructor", "", "sql"]) {
    expect(getEditorCodeParser(language)).toBe(null)
    expect(prettierEditorCodeFormatter.supports(language)).toBe(false)
  }
})

test("format is one undo transaction and preserves language and view state", async () => {
  const { editor, store, unsubscribe } = setup()
  const history = registerHistory(editor, createEmptyHistoryState(), 300)
  editor.update(() => $getRoot().getLastChildOrThrow().selectEnd(), {
    discrete: true,
  })
  editor.update(() => $getRoot().getFirstChildOrThrow().selectStart(), {
    discrete: true,
  })
  expect(await store.format(prettierEditorCodeFormatter)).toBe(true)
  expect(store.readText()).toBe("const x = { a: 1 };\n")
  editor.getEditorState().read(() => {
    const code = $getRoot().getFirstChildOrThrow<CodeNode>()
    expect(code.getLanguage()).toBe("javascript")
    expect($getState(code, codeWrapState)).toBe(false)
  })
  editor.dispatchCommand(UNDO_COMMAND, undefined)
  editor.update(() => undefined, { discrete: true })
  expect(store.readText()).toBe("const x={a:1}")
  editor.dispatchCommand(REDO_COMMAND, undefined)
  editor.update(() => undefined, { discrete: true })
  expect(store.readText()).toBe("const x = { a: 1 };\n")
  history()
  unsubscribe()
})

test.each([
  "dirty",
  "dirty-invalid",
  "language",
  "view",
  "selection",
  "readonly",
  "cancel",
  "detach",
  "replace",
])("rejects formatting after %s", async (kind) => {
  const original = kind === "dirty-invalid" ? "const =" : "const x={a:1}"
  const { editor, store, unsubscribe } = setup(original)
  const pending = store.format(prettierEditorCodeFormatter)
  expect(await store.format(prettierEditorCodeFormatter)).toBe(false)

  if (kind.startsWith("dirty"))
    editor.update(
      () => {
        $getRoot()
          .getLastChildOrThrow<ElementNode>()
          .append($createTextNode("changed"))
      },
      { discrete: true },
    )

  if (kind === "language") store.setLanguage("python")

  if (kind === "view") store.toggle("wrap")

  if (kind === "selection")
    editor.update(
      () => {
        $getRoot().getFirstChildOrThrow().selectEnd()
      },
      { discrete: true },
    )

  if (kind === "readonly") {
    editor.setEditable(false)
    editor.setEditable(true)
  }

  if (kind === "cancel") store.cancelFormat()

  if (kind === "detach") unsubscribe()

  if (kind === "replace")
    editor.setEditorState(
      editor.parseEditorState(JSON.stringify(editor.getEditorState())),
    )
  expect(await pending).toBe(false)
  expect(
    editor
      .getEditorState()
      .read(() => $getRoot().getFirstChildOrThrow().getTextContent()),
  ).toBe(original)

  if (kind === "dirty-invalid")
    expect(store.getFormatSnapshot()).toContain("discarded")
  unsubscribe()
})

test("formats retained toolbar range without restoring an invalid bookmark", async () => {
  const { editor, store, unsubscribe } = setup()
  store.enterControls()
  editor.update(() => $setSelection(null), { discrete: true })
  expect(await store.format(prettierEditorCodeFormatter)).toBe(true)
  expect(store.readText()).toBe("const x = { a: 1 };\n")
  unsubscribe()
})

test.each(["language", "view", "readonly"])(
  "discards retained toolbar range after %s change",
  async (kind) => {
    const { editor, store, unsubscribe } = setup()
    store.enterControls()
    editor.update(() => $setSelection(null), { discrete: true })

    if (kind === "language") store.setLanguage("typescript")

    if (kind === "view") store.toggle("wrap")

    if (kind === "readonly") {
      editor.setEditable(false)
      editor.setEditable(true)
    }

    expect(await store.format(prettierEditorCodeFormatter)).toBe(false)
    expect(store.readText()).toBe("const x={a:1}")
    unsubscribe()
  },
)

test("invalid syntax and unchanged code leave document intact", async () => {
  for (const text of ["const =", "const x = { a: 1 };\n"]) {
    const { store, unsubscribe } = setup(text)
    expect(await store.format(prettierEditorCodeFormatter)).toBe(false)
    expect(store.readText()).toBe(text)
    expect(store.getFormatSnapshot()).toMatch(/failed|unchanged/i)
    unsubscribe()
  }
})

test("missing or unsupported formatter leaves document and status intact", async () => {
  const { store, unsubscribe } = setup()
  expect(await store.format()).toBe(false)
  store.setLanguage("python")
  expect(await store.format(prettierEditorCodeFormatter)).toBe(false)
  expect(store.readText()).toBe("const x={a:1}")
  expect(store.getFormatSnapshot()).toBe("")
  unsubscribe()
})

test("host formatter can support languages outside Prettier", async () => {
  const { store, unsubscribe } = setup("print( 1 )")
  store.setLanguage("python")

  const formatter: EditorCodeFormatter = {
    supports(language) {
      return language === "python"
    },
    format(text, language) {
      expect(language).toBe("python")
      expect(text).toBe("print( 1 )")

      return "print(1)\n"
    },
  }

  expect(await store.format(formatter)).toBe(true)
  expect(store.readText()).toBe("print(1)\n")
  unsubscribe()
})

test.each(["cancel", "dirty", "readonly", "detach"])(
  "rejects deferred host result after %s",
  async (kind) => {
    const { editor, store, unsubscribe } = setup()
    const result = Promise.withResolvers<string>()

    const formatter: EditorCodeFormatter = {
      supports(language) {
        return language === "javascript"
      },
      format() {
        return result.promise
      },
    }

    const pending = store.format(formatter)
    expect(await store.format(formatter)).toBe(false)

    if (kind === "cancel") store.cancelFormat()

    if (kind === "dirty")
      editor.update(
        () => {
          $getRoot()
            .getLastChildOrThrow<ElementNode>()
            .append($createTextNode("changed"))
        },
        { discrete: true },
      )

    if (kind === "readonly") editor.setEditable(false)

    if (kind === "detach") unsubscribe()
    result.resolve("const x = { a: 1 };\n")
    expect(await pending).toBe(false)
    expect(
      editor
        .getEditorState()
        .read(() => $getRoot().getFirstChildOrThrow().getTextContent()),
    ).toBe("const x={a:1}")
    unsubscribe()
  },
)

test("read-only state never invokes host formatter", async () => {
  const { editor, store, unsubscribe } = setup()
  editor.setEditable(false)

  const formatter: EditorCodeFormatter = {
    supports() {
      return true
    },
    format() {
      throw new Error("Read-only formatting must not run")
    },
  }

  expect(await store.format(formatter)).toBe(false)
  expect(store.getFormatSnapshot()).toBe("")
  unsubscribe()
})
