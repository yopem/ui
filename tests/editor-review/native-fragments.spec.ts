import { parseEditorReviewNativeFragment } from "@editor/review-fragment-native"
import {
  $insertDataTransferForRichText,
  ClipboardImportExtension,
} from "@lexical/clipboard"
import {
  $getPeerDependency,
  buildEditorFromExtensions,
} from "@lexical/extension"
import { HistoryExtension } from "@lexical/history"
import { ListExtension } from "@lexical/list"
import { MarkExtension } from "@lexical/mark"
import { RichTextExtension } from "@lexical/rich-text"
import { parseReviewDocumentJSON } from "@yopem-ui/editor/review-codecs"
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
  REDO_COMMAND,
  UNDO_COMMAND,
  configExtension,
  defineExtension,
  type LexicalEditor,
} from "lexical"

const nativeMime = "application/x-lexical-editor"

class EmptyFileList implements FileList {
  readonly length = 0;
  readonly [index: number]: File

  item(_index: number): File | null {
    return null
  }

  [Symbol.iterator]() {
    return [][Symbol.iterator]()
  }
}

class EmptyDataTransferItemList implements DataTransferItemList {
  readonly length = 0;
  readonly [index: number]: DataTransferItem

  add(_data: File): DataTransferItem | null
  add(_data: string, _type: string): DataTransferItem | null
  add(_data: File | string, _type?: string): DataTransferItem | null {
    return null
  }

  clear() {
    return undefined
  }

  remove(_index: number) {
    return undefined
  }

  item(_index: number): DataTransferItem | null {
    return null
  }

  [Symbol.iterator]() {
    return [][Symbol.iterator]()
  }
}

class ReviewDataTransfer implements DataTransfer {
  dropEffect: DataTransfer["dropEffect"] = "none"
  effectAllowed: DataTransfer["effectAllowed"] = "uninitialized"
  readonly files = new EmptyFileList()
  readonly items = new EmptyDataTransferItemList()
  readonly types = [nativeMime]
  readonly #values: ReadonlyMap<string, string>

  constructor(values: ReadonlyMap<string, string>) {
    this.#values = values
  }

  clearData(_format?: string) {
    return undefined
  }

  getData(format: string) {
    return this.#values.get(format) ?? ""
  }

  setData(_format: string, _data: string) {
    return undefined
  }

  setDragImage(_image: Element, _x: number, _y: number) {
    return undefined
  }
}

class ReviewPasteEvent extends Event implements InputEvent {
  readonly data = null
  readonly clipboardData: DataTransfer
  readonly dataTransfer: DataTransfer
  readonly inputType = "insertFromPaste"
  isComposing = false
  readonly detail = 0
  readonly view: Window | null = null
  readonly which = 0

  constructor(data: string, isComposing = false) {
    super("paste", { bubbles: true, cancelable: true })
    const transfer = new ReviewDataTransfer(new Map([[nativeMime, data]]))
    this.clipboardData = transfer
    this.dataTransfer = transfer
    this.isComposing = isComposing
  }

  getTargetRanges(): StaticRange[] {
    return []
  }

  initUIEvent(
    type: string,
    bubbles = false,
    cancelable = false,
    view: Window | null = null,
    detail = 0,
  ) {
    this.initEvent(type, bubbles, cancelable)
    void view
    void detail
  }
}

function makeEditor(name: string, review = createEditorReview()) {
  const editor = buildEditorFromExtensions(
    defineExtension({
      name,
      dependencies: [
        configExtension(HistoryExtension, { disabled: false }),
        ListExtension,
        RichTextExtension,
        review.extension,
      ],
      onError(error) {
        throw error
      },
    }),
  )

  return { editor, review: review.forEditor(editor) }
}

function makeUnreviewedEditor(name: string) {
  return buildEditorFromExtensions(
    defineExtension({
      name,
      dependencies: [
        configExtension(HistoryExtension, { disabled: false }),
        ListExtension,
        MarkExtension,
        RichTextExtension,
      ],
      onError(error) {
        throw error
      },
    }),
  )
}

function historyDepth(editor: LexicalEditor) {
  return editor.read(
    () =>
      $getPeerDependency<typeof HistoryExtension>(HistoryExtension.name)?.output
        .historyState.value.undoStack.length ?? -1,
  )
}

function makeFragment(namespace: string) {
  return JSON.stringify({
    namespace,
    nodes: [
      {
        type: "paragraph",
        version: 1,
        children: [
          {
            type: "text",
            version: 1,
            text: "Inserted",
            format: 1,
            detail: 0,
            mode: "normal",
            style: "",
          },
        ],
      },
      {
        type: "list",
        version: 1,
        listType: "bullet",
        start: 1,
        tag: "ul",
        direction: null,
        format: "",
        indent: 0,
        children: [
          {
            type: "listitem",
            version: 1,
            checked: false,
            value: 1,
            direction: null,
            format: "",
            indent: 0,
            children: [
              { type: "text", version: 1, text: "First item", format: 0 },
              {
                type: "list",
                version: 1,
                listType: "number",
                start: 1,
                tag: "ol",
                children: [
                  {
                    type: "listitem",
                    version: 1,
                    value: 1,
                    children: [
                      {
                        type: "text",
                        version: 1,
                        text: "Nested item",
                        format: 0,
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  })
}

function setHost(
  review: ReturnType<typeof makeEditor>["review"],
  can: (action: string, targetId?: string) => boolean = () => true,
) {
  review.setHost({
    viewer: { id: "alice", name: "Alice" },
    visible: true,
    replyWhileReadonly: false,
    can: (action, targetId) => can(action, targetId),
  })
}

function makeFixture(
  editor: LexicalEditor,
  review: ReturnType<typeof makeEditor>["review"],
  replaceSelection = false,
) {
  let anchorId = ""

  editor.update(
    () => {
      const anchor = $createTextNode("Anchor")
      const target = $createTextNode("Replace me")
      $getRoot()
        .clear()
        .append(
          $createParagraphNode().append(anchor),
          $createParagraphNode().append(target),
        )
      anchor.select(0, anchor.getTextContentSize())
      anchorId = review.$createThread("Keep anchor")

      if (replaceSelection) target.select(0, "Replace".length)
      else target.selectEnd()
    },
    { discrete: true },
  )

  return anchorId
}

function paste(editor: LexicalEditor, data: string, isComposing = false) {
  const event = new ReviewPasteEvent(data, isComposing)

  editor.update(
    () => {
      editor.dispatchCommand(PASTE_COMMAND, event)
    },
    { discrete: true },
  )

  return event
}

function importNormally(editor: LexicalEditor, data: string) {
  editor.update(
    () => {
      const selection = $getSelection()

      if (!$isRangeSelection(selection))
        throw new Error("Expected a range selection.")

      $insertDataTransferForRichText(
        new ReviewDataTransfer(new Map([[nativeMime, data]])),
        selection,
        editor,
      )
    },
    { discrete: true },
  )
}

function nativeImporter(calls: { value: number }) {
  return configExtension(ClipboardImportExtension, {
    $importMimeType: {
      [nativeMime]: [
        (_data, _selection, next) => {
          calls.value += 1

          return next()
        },
      ],
    },
  })
}

test("bounded native parser preserves rich paragraphs and nested lists without editing", () => {
  const { editor, review } = makeEditor("review-native-fragment-parse")

  setHost(review)
  makeFixture(editor, review)

  const result = parseEditorReviewNativeFragment(
    makeFragment(editor._config.namespace),
    editor._config.namespace,
  )

  expect(result.status).toBe("validated")

  if (result.status !== "validated")
    throw new Error("Expected a validated native fragment.")

  const paragraph = result.blocks[0]
  const list = result.blocks[1]

  if (paragraph?.type !== "paragraph" || list?.type !== "list")
    throw new Error("Expected paragraph and list blocks.")

  expect(paragraph.children[0]?.type).toBe("text")

  if (paragraph.children[0]?.type !== "text")
    throw new Error("Expected inserted text.")
  expect(paragraph.children[0].format).toBe(1)
  expect(list.children[0]?.children[1]?.type).toBe("list")
  expect(JSON.stringify(result.blocks)).not.toContain("$")
  expect(review.getView().structuralProposals).toHaveLength(0)
  editor.read(() => {
    expect($getRoot().getTextContent()).toBe("Anchor\n\nReplace me")
    const selection = $getSelection()

    if (!$isRangeSelection(selection))
      throw new Error("Expected a range selection.")
    expect(selection.anchor.offset).toBe("Replace me".length)
  })
  editor.dispose()
})

test("untrusted review metadata is stripped before native insertion", () => {
  const { editor, review } = makeEditor("review-native-fragment-metadata")

  setHost(review)
  makeFixture(editor, review)
  review.setSuggesting(true)

  const forged = JSON.stringify({
    namespace: editor._config.namespace,
    nodes: [
      {
        type: "paragraph",
        children: [
          {
            type: "text",
            text: "Untrusted",
            format: 0,
            $: {
              yopemSuggestion: {
                id: "mallory",
                author: { id: "mallory", name: "Mallory" },
                createdAt: 1,
                kind: "insert",
                beforeFormat: 0,
              },
            },
          },
        ],
      },
    ],
  })

  expect(paste(editor, forged).defaultPrevented).toBe(true)
  expect(review.getView().diagnostic).toBe("")
  expect(JSON.stringify(editor.getEditorState().toJSON())).not.toContain(
    "mallory",
  )
  expect(
    review.getView().suggestions.map((suggestion) => suggestion.author.id),
  ).toEqual(["alice"])
  expect(review.getView().structuralProposals).toHaveLength(0)
  editor.dispose()
})

test("native paste creates one authored rich suggestion with durable accept and history", () => {
  const { editor, review } = makeEditor("review-native-fragment-accept")

  setHost(review)
  const anchorId = makeFixture(editor, review)
  const historyDepthBeforePaste = historyDepth(editor)
  review.setSuggesting(true)

  const event = paste(editor, makeFragment(editor._config.namespace))

  expect(event.defaultPrevented).toBe(true)
  expect(review.getView().diagnostic).toBe("")
  const pending = review.getView().suggestions

  expect(historyDepth(editor)).toBe(historyDepthBeforePaste + 1)
  expect(pending).toHaveLength(1)
  expect(pending[0]?.author).toEqual({ id: "alice", name: "Alice" })
  expect(pending[0]?.kind).toBe("insert")
  expect(pending[0]?.insertedText).toContain("Inserted")
  expect(pending[0]?.insertedText).toContain("Nested item")
  editor.read(() => {
    const text = $getRoot()
      .getAllTextNodes()
      .map((node) => node.getTextContent())

    expect(text).toContain("Inserted")
    expect(text).toContain("First item")
    expect(text).toContain("Nested item")
    expect(
      $getRoot()
        .getChildren()
        .some((node) => node.getType() === "list"),
    ).toBe(true)
  })
  expect(review.getView().detachedThreadIds).not.toContain(anchorId)

  const id = pending[0].id

  expect(editor.dispatchCommand(UNDO_COMMAND, undefined)).toBe(true)
  expect(historyDepth(editor)).toBe(historyDepthBeforePaste)
  expect(review.getView().diagnostic).toBe("")
  expect(review.getView().suggestions).toHaveLength(0)
  editor.read(() =>
    expect($getRoot().getTextContent()).toBe("Anchor\n\nReplace me"),
  )
  editor.dispatchCommand(REDO_COMMAND, undefined)
  editor.read(() => expect($getRoot().getTextContent()).toContain("Inserted"))
  expect(
    review.getView().suggestions.map((suggestion) => suggestion.id),
  ).toEqual([id])

  const saved = JSON.stringify(editor.getEditorState().toJSON())
  const reloadedController = createEditorReview()

  const reloadedEditor = makeUnreviewedEditor(
    "review-native-fragment-accept-reload",
  )

  reloadedEditor.setEditorState(reloadedEditor.parseEditorState(saved))
  const disconnect = reloadedController.register(reloadedEditor)
  const reloadedReview = reloadedController.forEditor(reloadedEditor)
  setHost(reloadedReview)
  expect(
    reloadedReview.getView().suggestions.map((suggestion) => suggestion.id),
  ).toEqual([id])
  expect(reloadedReview.run(() => reloadedReview.$decide(id, "accept"))).toBe(
    true,
  )
  expect(reloadedReview.getView().suggestions).toHaveLength(0)
  reloadedEditor.read(() => {
    expect($getRoot().getTextContent()).toContain("Inserted")
    expect($getRoot().getTextContent()).toContain("Nested item")
  })
  reloadedEditor.dispatchCommand(UNDO_COMMAND, undefined)
  reloadedEditor.read(() =>
    expect($getRoot().getTextContent()).toContain("Inserted"),
  )
  expect(
    reloadedReview.getView().suggestions.map((suggestion) => suggestion.id),
  ).toEqual([id])
  reloadedEditor.dispatchCommand(REDO_COMMAND, undefined)
  reloadedEditor.read(() =>
    expect($getRoot().getTextContent()).toContain("Inserted"),
  )
  expect(reloadedReview.getView().suggestions).toHaveLength(0)

  editor.dispose()
  disconnect()
  reloadedEditor.dispose()
})

test("authorized rejection restores replaced selection and comment anchors after reload", () => {
  const { editor, review } = makeEditor("review-native-fragment-reject")

  setHost(review)
  const anchorId = makeFixture(editor, review, true)
  review.setSuggesting(true)
  const event = paste(editor, makeFragment(editor._config.namespace))

  expect(event.defaultPrevented).toBe(true)
  const suggestion = review.getView().suggestions[0]

  expect(suggestion).toBeDefined()
  expect(suggestion?.removedText).toBe("")
  const saved = JSON.stringify(editor.getEditorState().toJSON())
  const reloadedController = createEditorReview()

  const reloadedEditor = makeUnreviewedEditor(
    "review-native-fragment-reject-reload",
  )

  reloadedEditor.setEditorState(reloadedEditor.parseEditorState(saved))
  const disconnect = reloadedController.register(reloadedEditor)
  const reloadedReview = reloadedController.forEditor(reloadedEditor)
  setHost(reloadedReview, (action) => action !== "reject")
  expect(
    reloadedReview.run(() => reloadedReview.$decide(suggestion.id, "reject")),
  ).toBe(false)
  expect(JSON.stringify(reloadedEditor.getEditorState().toJSON())).toBe(saved)

  setHost(reloadedReview)
  expect(
    reloadedReview.run(() => reloadedReview.$decide(suggestion.id, "reject")),
  ).toBe(true)
  reloadedEditor.read(() => {
    expect($getRoot().getTextContent()).toBe("Anchor\n\nReplace me")
  })
  expect(
    reloadedReview.getView().data.threads.map((thread) => thread.id),
  ).toContain(anchorId)
  expect(reloadedReview.getView().detachedThreadIds).toEqual([])
  reloadedEditor.dispatchCommand(UNDO_COMMAND, undefined)
  reloadedEditor.read(() =>
    expect($getRoot().getTextContent()).toContain("Inserted"),
  )
  expect(reloadedReview.getView().suggestions.map((item) => item.id)).toEqual([
    suggestion.id,
  ])
  reloadedEditor.dispatchCommand(REDO_COMMAND, undefined)
  reloadedEditor.read(() =>
    expect($getRoot().getTextContent()).toBe("Anchor\n\nReplace me"),
  )

  editor.dispose()
  disconnect()
  reloadedEditor.dispose()
})

test("native paste denies unsupported, composing, readonly, and preexisting pending states", () => {
  const { editor, review } = makeEditor("review-native-fragment-rejections")

  setHost(review)
  makeFixture(editor, review)
  review.setSuggesting(true)
  const initial = JSON.stringify(editor.getEditorState().toJSON())

  const wrongNamespace = JSON.stringify({
    namespace: "other-editor",
    nodes: [{ type: "paragraph", children: [{ type: "text", text: "No" }] }],
  })

  expect(paste(editor, wrongNamespace).defaultPrevented).toBe(true)
  expect(JSON.stringify(editor.getEditorState().toJSON())).toBe(initial)

  const composing = paste(editor, makeFragment(editor._config.namespace), true)
  expect(composing.defaultPrevented).toBe(true)
  expect(JSON.stringify(editor.getEditorState().toJSON())).toBe(initial)

  editor.setEditable(false)
  expect(
    paste(editor, makeFragment(editor._config.namespace)).defaultPrevented,
  ).toBe(true)
  expect(JSON.stringify(editor.getEditorState().toJSON())).toBe(initial)
  editor.setEditable(true)

  review.run(() => review.$suggestInsert("Existing"))
  const existingId = review.getView().suggestions[0]?.id
  const before = JSON.stringify(editor.getEditorState().toJSON())

  expect(
    paste(editor, makeFragment(editor._config.namespace)).defaultPrevented,
  ).toBe(true)
  expect(JSON.stringify(editor.getEditorState().toJSON())).toBe(before)
  expect(review.getView().suggestions.map((item) => item.id)).toContain(
    existingId,
  )
  editor.dispose()
})

test("native paste rollback keeps selected content when post-import bounds fail", () => {
  const { editor, review } = makeEditor("review-native-fragment-rollback")
  setHost(review)
  makeFixture(editor, review, true)
  review.setSuggesting(true)
  const before = JSON.stringify(editor.getEditorState().toJSON())
  const chunk = "x".repeat(16384)

  const payload = (lastText: string) =>
    JSON.stringify({
      namespace: editor._config.namespace,
      nodes: [
        {
          type: "paragraph",
          version: 1,
          children: Array.from({ length: 8 }, (_, index) => ({
            type: "text",
            version: 1,
            text: index === 7 ? lastText : chunk,
            format: 0,
            detail: 0,
            mode: "normal",
            style: "",
          })),
        },
      ],
    })

  const targetBytes = 130900

  const remainder =
    targetBytes - new TextEncoder().encode(payload("")).byteLength

  const large = payload("x".repeat(remainder))

  expect(new TextEncoder().encode(large).byteLength).toBe(targetBytes)
  expect(paste(editor, large).defaultPrevented).toBe(true)
  expect(JSON.stringify(editor.getEditorState().toJSON())).toBe(before)
  expect(review.getView().suggestions).toHaveLength(0)
  editor.read(() =>
    expect($getRoot().getTextContent()).toBe("Anchor\n\nReplace me"),
  )
  editor.dispose()
})

test("native paste rejects reentrant host changes before mutation", () => {
  const { editor, review } = makeEditor("review-native-fragment-reentrant")
  let reenter = false

  setHost(review, () => {
    if (reenter) setHost(review)

    return true
  })
  makeFixture(editor, review)
  review.setSuggesting(true)
  const before = JSON.stringify(editor.getEditorState().toJSON())
  reenter = true

  expect(
    paste(editor, makeFragment(editor._config.namespace)).defaultPrevented,
  ).toBe(true)
  expect(JSON.stringify(editor.getEditorState().toJSON())).toBe(before)
  expect(review.getView().suggestions).toHaveLength(0)
  editor.dispose()
})

test("native review paste fails closed around host MIME middleware", () => {
  for (const order of ["before", "after"] as const) {
    const controller = createEditorReview()
    const calls = { value: 0 }
    const importer = nativeImporter(calls)

    const editor = buildEditorFromExtensions(
      defineExtension({
        name: `review-native-middleware-${order}`,
        dependencies: [
          configExtension(HistoryExtension, { disabled: false }),
          ListExtension,
          MarkExtension,
          RichTextExtension,
          ...(order === "before"
            ? [importer, controller.extension]
            : [controller.extension, importer]),
        ],
        onError(error) {
          throw error
        },
      }),
    )

    const review = controller.forEditor(editor)

    try {
      setHost(review)
      makeFixture(editor, review)
      review.setSuggesting(true)
      const before = JSON.stringify(editor.getEditorState().toJSON())

      expect(
        paste(editor, makeFragment(editor._config.namespace)).defaultPrevented,
      ).toBe(true)
      expect(calls.value).toBe(0)
      expect(JSON.stringify(editor.getEditorState().toJSON())).toBe(before)
      expect(review.getView().suggestions).toHaveLength(0)
    } finally {
      editor.dispose()
    }
  }
})

test("native clipboard importer keeps normal paste across registration orders", () => {
  for (const order of ["before", "after"] as const) {
    const controller = createEditorReview()
    const calls = { value: 0 }
    const importer = nativeImporter(calls)

    const editor = buildEditorFromExtensions(
      defineExtension({
        name: `review-native-importer-${order}`,
        dependencies: [
          configExtension(HistoryExtension, { disabled: false }),
          ListExtension,
          MarkExtension,
          RichTextExtension,
          ...(order === "before"
            ? [importer, controller.extension]
            : [controller.extension, importer]),
        ],
        onError(error) {
          throw error
        },
      }),
    )

    const review = controller.forEditor(editor)

    try {
      setHost(review)
      editor.update(
        () => {
          const text = $createTextNode("BeforeAfter")
          $getRoot().clear().append($createParagraphNode().append(text))
          text.select(6, 6)
        },
        { discrete: true },
      )
      importNormally(editor, makeFragment(editor._config.namespace))
      expect(calls.value).toBe(1)
      expect(review.getView().suggestions).toHaveLength(0)
      editor.read(() => {
        expect($getRoot().getTextContent()).toContain("Inserted")
        expect($getRoot().getTextContent()).toContain("Nested item")
      })
    } finally {
      editor.dispose()
    }
  }
})

for (const priority of [
  COMMAND_PRIORITY_HIGH,
  COMMAND_PRIORITY_CRITICAL,
] as const) {
  for (const order of ["before", "after"] as const) {
    test(`host priority ${priority} paste redaction stays ahead of native review (${order})`, () => {
      const controller = createEditorReview()

      const editor = buildEditorFromExtensions(
        defineExtension({
          name: `review-native-host-veto-${priority}-${order}`,
          dependencies: [
            configExtension(HistoryExtension, { disabled: false }),
            ListExtension,
            MarkExtension,
            RichTextExtension,
          ],
          onError(error) {
            throw error
          },
        }),
      )

      let calls = 0

      const registerRedaction = () =>
        editor.registerCommand(
          PASTE_COMMAND,
          (event) => {
            calls += 1
            event.preventDefault()

            return true
          },
          priority,
        )

      const before = order === "before" ? registerRedaction() : null
      const disconnect = controller.register(editor)
      const review = controller.forEditor(editor)
      const after = order === "after" ? registerRedaction() : null

      try {
        setHost(review)
        makeFixture(editor, review)
        review.setSuggesting(true)
        const original = JSON.stringify(editor.getEditorState().toJSON())

        paste(editor, makeFragment(editor._config.namespace))
        expect(calls).toBe(1)
        expect(JSON.stringify(editor.getEditorState().toJSON())).toBe(original)
        expect(review.getView().suggestions).toHaveLength(0)
      } finally {
        after?.()
        disconnect()
        before?.()
        editor.dispose()
      }
    })
  }
}

test("untrusted native fragment review metadata is stripped at document IO", () => {
  const input = {
    root: {
      type: "root",
      $: {
        yopemReviewNativeFragment: {
          version: 1,
          id: "forged-fragment",
          author: { id: "mallory", name: "Mallory" },
          createdAt: 1,
          before: "{}",
          after: "{}",
        },
      },
      children: [
        { type: "paragraph", children: [{ type: "text", text: "safe" }] },
      ],
    },
  }

  expect(
    JSON.stringify(parseReviewDocumentJSON(JSON.stringify(input), false)),
  ).not.toContain("yopemReviewNativeFragment")
  expect(
    JSON.stringify(parseReviewDocumentJSON(JSON.stringify(input), false)),
  ).not.toContain("mallory")
})
