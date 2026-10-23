import {
  createEditorCodeStore,
  $getSelectedCode,
  codeWrapState,
  codeLineNumbersState,
} from "@editor/code-model"
import {
  $createCodeNode,
  $isCodeNode,
  CodeNode,
  CodeHighlightNode,
} from "@lexical/code"
import { describe, expect, test } from "bun:test"
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $getSelection,
  $getState,
  $setSelection,
  $isRangeSelection,
  createEditor,
} from "lexical"

function setup() {
  const editor = createEditor({
    namespace: "code-model",
    nodes: [CodeNode, CodeHighlightNode],
    onError(error) {
      throw error
    },
  })

  editor.update(
    () => {
      $getRoot().append(
        $createCodeNode("javascript").append($createTextNode("const n = 1;")),
        $createParagraphNode().append($createTextNode("outside")),
      )
      $getRoot().getFirstChildOrThrow().selectStart()
    },
    { discrete: true },
  )
  const store = createEditorCodeStore(editor)
  const unsubscribe = store.subscribe(() => undefined)

  return { editor, store, unsubscribe }
}

describe("code controls with real Lexical state", () => {
  test("finds one code block, rejects cross-block and non-range selections", () => {
    const { editor, unsubscribe } = setup()
    editor.update(
      () => {
        expect($getSelectedCode()?.getLanguage()).toBe("javascript")
        const selection = $getSelection()
        const outside = $getRoot().getLastChildOrThrow()

        if ($isRangeSelection(selection)) {
          selection.focus.set(outside.getKey(), 0, "element")
          expect($getSelectedCode()).toBe(null)
        }

        outside.selectEnd()
        expect($getSelectedCode()).toBe(null)
        $setSelection(selection)
        $setSelection(null)
        expect($getSelectedCode()).toBe(null)
      },
      { discrete: true },
    )
    unsubscribe()
  })

  test("changes supported language and persisted presentation without moving selection", () => {
    const { editor, store, unsubscribe } = setup()
    const before = editor.getEditorState().read($getSelection)
    expect(store.getSnapshot()?.language).toBe("javascript")
    expect(store.setLanguage("python")).toBe(true)
    editor.update(() => undefined, { discrete: true })
    expect(store.getSnapshot()?.language).toBe("python")
    expect(store.setLanguage("constructor")).toBe(false)
    expect(store.setLanguage("unavailable-grammar")).toBe(false)
    store.toggle("wrap")
    editor.update(() => undefined, { discrete: true })
    store.toggle("lineNumbers")
    editor.update(() => undefined, { discrete: true })
    editor.getEditorState().read(() => {
      const code = $getRoot().getFirstChildOrThrow()
      expect($isCodeNode(code)).toBe(true)
      expect($getState(code, codeWrapState)).toBe(false)
      expect($getState(code, codeLineNumbersState)).toBe(true)
      expect($getSelection()?.is(before)).toBe(true)
      expect(code.exportJSON().$).toEqual({
        codeWrap: false,
        codeLineNumbers: true,
      })
    })
    unsubscribe()
  })

  test("copy text remains literal and available read-only; mutations do not", () => {
    const { editor, store, unsubscribe } = setup()
    editor.update(
      () => {
        $getRoot()
          .getFirstChildOrThrow<CodeNode>()
          .clear()
          .append($createTextNode('<img src=x onerror="alert(1)">'))
      },
      { discrete: true },
    )
    editor.setEditable(false)
    expect(store.readText()).toBe('<img src=x onerror="alert(1)">')
    expect(store.setLanguage("python")).toBe(false)
    expect(store.toggle("wrap")).toBe(false)
    editor.setEditable(true)
    expect(store.setLanguage("python")).toBe(true)
    unsubscribe()
  })

  test.each([
    "dirty",
    "replacement",
    "selection",
    "detach",
    "active-dirty",
    "active-replacement",
    "active-retained-state",
    "readonly-toggle",
  ])("rejects stale targets after %s", (kind) => {
    const { editor, store, unsubscribe } = setup()
    const state = editor.getEditorState()
    const revision = store.getRevision()
    const inactive = !kind.startsWith("active-") && kind !== "readonly-toggle"

    if (inactive)
      editor.update(
        () => {
          $setSelection(null)
        },
        { discrete: true },
      )

    if (kind === "dirty" || kind === "active-dirty")
      editor.update(
        () => {
          $getRoot()
            .getFirstChildOrThrow<CodeNode>()
            .append($createTextNode("changed"))
        },
        { discrete: true },
      )

    if (kind === "replacement")
      editor.setEditorState(editor.parseEditorState(JSON.stringify(state)))

    if (kind === "active-replacement")
      editor.setEditorState(
        editor.parseEditorState(JSON.stringify(state), () => {
          $getRoot().getFirstChildOrThrow().selectStart()
        }),
      )

    if (kind === "active-retained-state") editor.setEditorState(state.clone())

    if (kind === "readonly-toggle") {
      editor.setEditable(false)
      editor.setEditable(true)
    }

    if (kind === "selection")
      editor.update(
        () => {
          $getRoot().getLastChildOrThrow().selectEnd()
        },
        { discrete: true },
      )

    if (kind === "detach") unsubscribe()

    if (inactive) {
      expect(store.setLanguage("python")).toBe(false)
      expect(store.toggle("wrap")).toBe(false)
      expect(store.readText()).toBe(null)
    }

    expect(store.setLanguage("python", revision)).toBe(false)
    expect(store.toggle("wrap", revision)).toBe(false)
    expect(store.readText(revision)).toBe(null)
    unsubscribe()
  })

  test("unrelated live selection cannot be overwritten by captured code", () => {
    const { editor, store, unsubscribe } = setup()
    editor.update(
      () => {
        $getRoot().getLastChildOrThrow().selectEnd()
        expect(store.setLanguage("python")).toBe(false)
        expect($getSelectedCode()).toBe(null)
      },
      { discrete: true },
    )
    unsubscribe()
  })
})
