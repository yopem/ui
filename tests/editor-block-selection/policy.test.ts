import type { EditorBlockSelectionOptions } from "@editor/block-selection"
import type { LexicalEditor } from "lexical"

import { createEditorBlockSelection } from "@editor/block-selection"
import { GetClipboardDataExtension } from "@lexical/clipboard"
import { buildEditorFromExtensions } from "@lexical/extension"
import { RichTextExtension } from "@lexical/rich-text"
import { expect, test } from "bun:test"
import {
  $createNodeSelection,
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $getSelection,
  $isElementNode,
  $isTextNode,
  $setSelection,
  configExtension,
  defineExtension,
  COMMAND_PRIORITY_HIGH,
  COMMAND_PRIORITY_CRITICAL,
  COPY_COMMAND,
  CUT_COMMAND,
  CUT_TAG,
  HISTORY_PUSH_TAG,
} from "lexical"

function setup(
  options: EditorBlockSelectionOptions = { authorizeCut: () => true },
  registerHost?: (editor: LexicalEditor) => () => void,
) {
  const controller = createEditorBlockSelection(options)

  const editor = buildEditorFromExtensions({
    name: "test/block-selection-policy",
    dependencies: [
      RichTextExtension,
      ...(registerHost
        ? [defineExtension({ name: "test/host-cut", register: registerHost })]
        : []),
      controller.extension,
      configExtension(GetClipboardDataExtension, {
        $exportMimeType: {
          "text/plain": [(selection) => selection?.getTextContent() ?? null],
          "text/html": [() => null],
          "application/x-lexical-editor": [() => null],
          "text/uri-list": [() => null],
        },
      }),
    ],
  })

  editor.update(
    () => {
      $getRoot()
        .clear()
        .append(
          $createParagraphNode().append($createTextNode("Alpha")),
          $createParagraphNode().append($createTextNode("Beta")),
        )
    },
    { discrete: true },
  )
  const keys = editor.read(() => $getRoot().getChildrenKeys())
  controller.select(keys[0])

  return { controller, editor, keys }
}

function transport() {
  const values = new Map<string, string>()

  const event = Object.assign(new Event("cut", { cancelable: true }), {
    clipboardData: null,
  })

  Object.defineProperty(event, "clipboardData", {
    value: {
      setData(mime: string, value: string) {
        values.set(mime, value)
      },
      getData(mime: string) {
        return values.get(mime) ?? ""
      },
    },
  })

  return { event: event, values }
}

function dispatch(
  editor: LexicalEditor,
  event: ClipboardEvent,
  cutting = true,
) {
  editor.update(
    () => {
      if (cutting) editor.dispatchCommand(CUT_COMMAND, event)
      else editor.dispatchCommand(COPY_COMMAND, event)
    },
    { discrete: true },
  )
}

for (const mode of ["collapsed", "other", "extra", "null"] as const) {
  test(`native ${mode} selection invalidates cached block targets`, () => {
    const { editor, controller, keys } = setup()
    editor.update(
      () => {
        if (mode === "collapsed") $getRoot().getLastChildOrThrow().selectEnd()
        else if (mode === "null") $setSelection(null)
        else {
          const selection = $createNodeSelection()
          selection.add(keys[1])

          if (mode === "extra") selection.add(keys[0])
          $setSelection(selection)
        }
      },
      { discrete: true },
    )
    const before = editor.getEditorState().toJSON()
    const selection = editor.read(() => $getSelection()?.clone() ?? null)
    expect(controller.getSnapshot().mode).toBe(false)
    expect(controller.move("down")).toBe(false)
    expect(controller.remove()).toBe(false)
    expect(controller.duplicate()).toBe(false)
    expect(editor.getEditorState().toJSON()).toEqual(before)
    expect(editor.read(() => $getSelection()?.is(selection))).toBe(
      selection ? true : undefined,
    )
    editor.dispose()
  })
}

test("selection changed inside command update cannot cut or copy stale blocks", () => {
  for (const cutting of [true, false]) {
    const { editor, controller } = setup()
    const before = editor.getEditorState().toJSON()
    const { event, values } = transport()
    editor.update(
      () => {
        $getRoot().getLastChildOrThrow().selectEnd()

        if (cutting) editor.dispatchCommand(CUT_COMMAND, event)
        else editor.dispatchCommand(COPY_COMMAND, event)
      },
      { discrete: true },
    )
    expect(values.size).toBe(0)
    expect(editor.getEditorState().toJSON()).toEqual(before)
    expect(controller.getSnapshot().mode).toBe(false)
    editor.dispose()
  }
})

for (const [name, value] of Object.entries({
  false: false,
  undefined: undefined,
  number: 1,
  string: "true",
  object: {},
  promise: Promise.resolve(false),
})) {
  test(`authorization rejects non-literal true: ${name}`, () => {
    const options: EditorBlockSelectionOptions = {}
    Reflect.set(options, "authorizeCut", () => value)
    const { editor } = setup(options)
    const before = editor.getEditorState().toJSON()
    const { event, values } = transport()
    dispatch(editor, event)
    expect(values.size).toBe(0)
    expect(editor.getEditorState().toJSON()).toEqual(before)
    editor.dispose()
  })
}

for (const [name, value] of Object.entries({
  false: false,
  undefined: undefined,
  number: 1,
  string: "true",
  object: {},
  promise: Promise.resolve(false),
})) {
  test(`document validation rejects non-literal true: ${name}`, () => {
    const options: EditorBlockSelectionOptions = {}
    Reflect.set(options, "validateDocument", () => value)
    const { editor, controller } = setup(options)
    const before = editor.getEditorState().toJSON()
    expect(controller.remove()).toBe(false)
    expect(editor.getEditorState().toJSON()).toEqual(before)
    editor.dispose()
  })
}

for (const change of [
  "content",
  "selection",
  "editable",
  "cancel",
  "throw",
  "data",
] as const) {
  test(`synchronous authorization ${change} prevents transport and deletion`, () => {
    const result = setup({
      authorizeCut(event, data) {
        if (change === "content") {
          const block = $getRoot().getFirstChildOrThrow()
          const text = $isElementNode(block) ? block.getFirstChild() : null

          if (!$isTextNode(text)) throw new Error("Missing text")
          text.setTextContent("Updated secret")
        }

        if (change === "selection") $getRoot().getLastChildOrThrow().selectEnd()

        if (change === "editable") result.editor.setEditable(false)

        if (change === "cancel") event.preventDefault()

        if (change === "throw") throw new Error("Denied")

        if (change === "data") Reflect.set(data, "text/plain", "Changed export")

        return true
      },
    })

    const before = result.editor.getEditorState().toJSON()
    const { event, values } = transport()
    dispatch(result.editor, event)
    expect(values.size).toBe(0)
    expect(result.editor.read(() => $getRoot().getChildrenSize())).toBe(2)

    if (change === "content")
      expect(result.editor.read(() => $getRoot().getTextContent())).toContain(
        "Updated secret",
      )
    else expect(result.editor.getEditorState().toJSON()).toEqual(before)
    result.editor.dispose()
  })
}

for (const priority of [
  COMMAND_PRIORITY_HIGH,
  COMMAND_PRIORITY_CRITICAL,
] as const) {
  for (const before of [true, false]) {
    for (const policy of ["handled", "cancel", "delegate"] as const) {
      test(`host CUT ${priority}, before=${before}, ${policy}`, () => {
        let calls = 0

        function register(editor: LexicalEditor) {
          return editor.registerCommand(
            CUT_COMMAND,
            (event) => {
              calls++

              if (policy !== "delegate") event?.preventDefault()

              return policy === "handled"
            },
            priority,
          )
        }

        const { editor } = setup(undefined, before ? register : undefined)

        if (!before) register(editor)
        const original = editor.getEditorState().toJSON()
        const { event, values } = transport()
        dispatch(editor, event)
        expect(calls).toBe(1)

        if (policy === "delegate") {
          expect(values.get("text/plain")).toBe("Alpha")
          expect(editor.read(() => $getRoot().getTextContent())).toBe("Beta")
        } else {
          expect(values.size).toBe(0)
          expect(editor.getEditorState().toJSON()).toEqual(original)
        }

        editor.dispose()
      })
    }
  }
}

test("native MIME veto remains authoritative and CUT emits native tags", () => {
  const { editor } = setup()
  const observed: Set<string>[] = []
  editor.registerUpdateListener(({ tags }) => observed.push(new Set(tags)))
  const copy = transport()
  dispatch(editor, copy.event, false)
  expect(copy.values.get("text/plain")).toBe("Alpha")
  expect(copy.values.get("text/html") ?? "").toBe("")
  expect(copy.values.get("application/x-lexical-editor") ?? "").toBe("")
  expect(copy.values.has("text/uri-list")).toBe(false)
  const cut = transport()
  dispatch(editor, cut.event)
  expect(cut.values).toEqual(copy.values)
  expect(editor.read(() => $getRoot().getTextContent())).toBe("Beta")
  expect(
    observed.some((tags) => tags.has(CUT_TAG) && tags.has(HISTORY_PUSH_TAG)),
  ).toBe(true)
  editor.dispose()
})
