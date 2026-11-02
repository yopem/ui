import { createEditorSetup } from "@editor/extension"
import {
  $insertDataTransferForRichText,
  ClipboardImportExtension,
} from "@lexical/clipboard"
import { buildEditorFromExtensions } from "@lexical/extension"
import { HeadlessExtension } from "@lexical/headless"
import { withDOM } from "@workspace/tests/fixtures/lexical-dom"
import { createEditorReview } from "@yopem-ui/editor/review-extension"
import { expect, test } from "bun:test"
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_CRITICAL,
  COMMAND_PRIORITY_HIGH,
  PASTE_COMMAND,
  configExtension,
  defineExtension,
  type AnyLexicalExtensionArgument,
  type LexicalEditor,
} from "lexical"

const mime = "application/x-lexical-editor"

const namespace = "yopem-ui-editor"

const textNode = {
  type: "text",
  version: 1,
  detail: 0,
  format: 0,
  mode: "normal",
  style: "",
  text: "Inserted",
}

const paragraph = {
  type: "paragraph",
  version: 1,
  children: [textNode],
  direction: null,
  format: "",
  indent: 0,
  textFormat: 0,
  textStyle: "",
}

const document = {
  root: {
    type: "root",
    version: 1,
    children: [paragraph],
    direction: null,
    format: "",
    indent: 0,
  },
}

function editorWith(extensions: readonly AnyLexicalExtensionArgument[] = []) {
  const setup = createEditorSetup({
    extensions: [HeadlessExtension, ...extensions],
  })

  const editor = buildEditorFromExtensions(setup.extension)
  editor.setEditable(true)
  editor.update(
    () => {
      const text = $createTextNode("Keep selected text")
      $getRoot().clear().append($createParagraphNode().append(text))
      text.select(5, 13)
    },
    { discrete: true },
  )

  return editor
}

function selected(editor: LexicalEditor) {
  return editor.getEditorState().read(() => {
    const selection = $getSelection()

    if (!$isRangeSelection(selection)) throw new Error("Missing range")

    return [
      selection.anchor.key,
      selection.anchor.offset,
      selection.focus.key,
      selection.focus.offset,
      selection.getTextContent(),
    ]
  })
}

function insert(editor: LexicalEditor, data: DataTransfer) {
  editor.update(
    () => {
      const selection = $getSelection()

      if (!$isRangeSelection(selection)) throw new Error("Missing range")
      $insertDataTransferForRichText(data, selection, editor)
    },
    { discrete: true },
  )
}

function transfer(window: typeof globalThis.window, raw: string) {
  const data = new window.DataTransfer()
  data.setData(mime, raw)
  data.setData("text/plain", "Fallback")

  return data
}

test("raw initialState rejects duplicate decoded keys at all levels, not already parsed objects", () => {
  const valid = JSON.stringify(document)

  for (const raw of [
    valid.replace('"root":', '"root":null,"root":'),
    valid.replace('"type":"root"', '"type":"root","t\\u0079pe":"root"'),
    valid.replace('"text":"Inserted"', '"text":"old","t\\u0065xt":"Inserted"'),
    valid.replace('"root":{', '"root":{"$slots":{"x":{},"x":{}},'),
    valid.replace('"root":', '"root":{"x":1,"x":2},"root":'),
  ]) {
    const saved = raw
    expect(() => createEditorSetup({ initialState: raw })).toThrow(/duplicate/i)
    expect(raw).toBe(saved)
  }

  expect(() => createEditorSetup({ initialState: valid })).not.toThrow()
  expect(() =>
    createEditorSetup({ initialState: JSON.parse(valid) }),
  ).not.toThrow()
  expect(() => createEditorSetup({ initialState: '{"a":1,}' })).toThrow(
    SyntaxError,
  )
  expect(() =>
    createEditorSetup({
      initialState: '{"a":{"x":1},"b":{"x":2},"é":1,"e\\u0301":2}',
    }),
  ).not.toThrow()
})

test("core native import rejects envelope duplicates without fallback or selection loss", () => {
  withDOM((window) => {
    const editor = editorWith()

    try {
      const valid = JSON.stringify({ namespace, nodes: [paragraph] })
      const before = editor.getEditorState().toJSON()
      const selection = selected(editor)

      for (const raw of [
        valid.replace('"namespace":', '"namespace":"foreign","namespace":'),
        valid.replace(
          '"namespace":"yopem-ui-editor"',
          '"namespace":"foreign","namespace":"foreign"',
        ),
        valid.replace('"nodes":', '"nodes":null,"n\\u006fdes":'),
        valid.replace(
          '"text":"Inserted"',
          '"text":"old","t\\u0065xt":"Inserted"',
        ),
        valid.replace('"nodes":', '"other":{"a":1,"a":2},"nodes":'),
        valid.replace('"nodes":', '"other":{"$slots":{"x":1,"x":2}},"nodes":'),
      ]) {
        insert(editor, transfer(window, raw))
        expect(editor.getEditorState().toJSON()).toEqual(before)
        expect(selected(editor)).toEqual(selection)
      }

      insert(editor, transfer(window, valid))
      expect(
        editor.getEditorState().read(() => $getRoot().getTextContent()),
      ).toContain("Inserted")
    } finally {
      editor.dispose()
    }
  })
})

test("unrelated and malformed native JSON retain plain fallback; foreign unique envelope falls back", () => {
  withDOM((window) => {
    for (const raw of [
      '{"x":1,"x":2}',
      '{"x":',
      JSON.stringify({ namespace: "foreign", nodes: [paragraph] }),
    ]) {
      const editor = editorWith()

      try {
        insert(editor, transfer(window, raw))
        expect(
          editor.getEditorState().read(() => $getRoot().getTextContent()),
        ).toContain("Fallback")
      } finally {
        editor.dispose()
      }
    }
  })
})

for (const priority of [
  COMMAND_PRIORITY_CRITICAL,
  COMMAND_PRIORITY_HIGH,
] as const) {
  test(`host priority ${priority} retains paste veto`, () => {
    withDOM((window) => {
      const editor = editorWith()
      let calls = 0

      const unregister = editor.registerCommand(
        PASTE_COMMAND,
        (event) => {
          calls++
          event?.preventDefault()

          return true
        },
        priority,
      )

      try {
        const before = editor.getEditorState().toJSON()

        const event = new window.ClipboardEvent("paste", {
          cancelable: true,
          clipboardData: transfer(
            window,
            JSON.stringify({ namespace, nodes: [paragraph] }),
          ),
        })

        editor.dispatchCommand(PASTE_COMMAND, event)
        expect(calls).toBe(1)
        expect(event.defaultPrevented).toBe(true)
        expect(editor.getEditorState().toJSON()).toEqual(before)
      } finally {
        unregister()
        editor.dispose()
      }
    })
  })
}

class ReviewPasteEvent extends Event implements InputEvent {
  readonly data = null
  readonly inputType = "insertFromPaste"
  readonly isComposing = false
  readonly detail = 0
  readonly view = null
  readonly which = 0
  constructor(readonly dataTransfer: DataTransfer) {
    super("paste", { cancelable: true })
  }
  getTargetRanges(): StaticRange[] {
    return []
  }
  initUIEvent(type: string, bubbles = false, cancelable = false) {
    this.initEvent(type, bubbles, cancelable)
  }
}

test("core guard permits review native suggestion but additional host middleware remains custom", () => {
  withDOM((window) => {
    for (const custom of ["none", "handler", "priority"] as const) {
      const controller = createEditorReview()

      const hostExtension = defineExtension({
        name: "test-host",
        dependencies:
          custom === "handler"
            ? [
                configExtension(ClipboardImportExtension, {
                  $importMimeType: {
                    [mime]: [(_data, _selection, next) => next()],
                  },
                }),
              ]
            : custom === "priority"
              ? [
                  configExtension(ClipboardImportExtension, {
                    priority: { [mime]: 99 },
                  }),
                ]
              : [],
      })

      const editor = editorWith([controller.extension, hostExtension])
      const review = controller.forEditor(editor)

      try {
        review.setHost({
          viewer: { id: "alice", name: "Alice" },
          visible: true,
          replyWhileReadonly: false,
          can: () => true,
        })
        review.setSuggesting(true)

        const event = new ReviewPasteEvent(
          transfer(window, JSON.stringify({ namespace, nodes: [paragraph] })),
        )

        editor.update(
          () => {
            editor.dispatchCommand(PASTE_COMMAND, event)
          },
          { discrete: true },
        )
        expect(event.defaultPrevented).toBe(true)

        if (custom !== "none") {
          expect(review.getView().suggestions).toHaveLength(0)
          expect(review.getView().diagnostic).toContain("custom clipboard")
        } else {
          expect(review.getView().diagnostic).toBe("")
          expect(review.getView().suggestions).toHaveLength(1)
        }
      } finally {
        editor.dispose()
      }
    }
  })
})
