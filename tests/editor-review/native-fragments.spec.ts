import { parseEditorReviewNativeFragment } from "@editor/review-fragment-native"
import {
  editorReviewBreakState,
  editorReviewNativeOperationState,
  editorSuggestionState,
} from "@editor/review-state"
import {
  $insertDataTransferForRichText,
  ClipboardImportExtension,
} from "@lexical/clipboard"
import {
  $getPeerDependency,
  buildEditorFromExtensions,
} from "@lexical/extension"
import { HistoryExtension } from "@lexical/history"
import {
  $createListItemNode,
  $createListNode,
  ListExtension,
} from "@lexical/list"
import { MarkExtension } from "@lexical/mark"
import { RichTextExtension } from "@lexical/rich-text"
import {
  parseReviewDocumentJSON,
  reviewBreakSuggestionSchema,
  reviewNativeOperationSchema,
  reviewSuggestionSchema,
} from "@yopem-ui/editor/review-codecs"
import { createEditorReview } from "@yopem-ui/editor/review-extension"
import { expect, test } from "bun:test"
import {
  $createLineBreakNode,
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $getSelection,
  $getState,
  $isElementNode,
  $setState,
  $isRangeSelection,
  COMMAND_PRIORITY_CRITICAL,
  COMMAND_PRIORITY_HIGH,
  CONTROLLED_TEXT_INSERTION_COMMAND,
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

function selectionSnapshot(editor: LexicalEditor) {
  return editor.read(() => {
    const selection = $getSelection()

    if (!$isRangeSelection(selection))
      throw new Error("Expected a range selection.")

    return {
      anchor: {
        key: selection.anchor.key,
        offset: selection.anchor.offset,
        type: selection.anchor.type,
      },
      focus: {
        key: selection.focus.key,
        offset: selection.focus.offset,
        type: selection.focus.type,
      },
    }
  })
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
  expect(suggestion?.kind).toBe("replace")
  expect(suggestion?.removedText).toBe("Replace")
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

test("native paste denies unsupported, composing, and readonly states", () => {
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

test("empty native paste blocks resolve with their owning suggestion", () => {
  const { editor, review } = makeEditor("review-native-empty-operation-block")
  let anchorId = ""

  setHost(review)
  editor.update(
    () => {
      const anchor = $createTextNode("Anchor")
      const left = $createTextNode("Left target")
      const right = $createTextNode("Right target")
      $getRoot()
        .clear()
        .append(
          $createParagraphNode().append(anchor),
          $createParagraphNode().append(left),
          $createParagraphNode().append(right),
        )
      anchor.select(0, anchor.getTextContentSize())
      anchorId = review.$createThread("Keep anchor")
      left.select(5, left.getTextContentSize())
    },
    { discrete: true },
  )
  review.setSuggesting(true)

  expect(
    paste(editor, makeFragment(editor._config.namespace)).defaultPrevented,
  ).toBe(true)
  const firstId = review.getView().suggestions[0]?.id

  expect(firstId).toBeDefined()
  editor.update(
    () => {
      const right = $getRoot()
        .getAllTextNodes()
        .find((node) => node.getTextContent() === "Right target")

      if (!right) throw new Error("Expected the independent paste target.")
      right.selectEnd()
    },
    { discrete: true },
  )
  const beforeSecondPaste = JSON.stringify(editor.getEditorState().toJSON())

  const fragmentWithEmptyParagraph = JSON.stringify({
    namespace: editor._config.namespace,
    nodes: [
      { type: "paragraph", version: 1, children: [] },
      {
        type: "paragraph",
        version: 1,
        children: [
          {
            type: "text",
            version: 1,
            text: "Inserted",
            format: 0,
            detail: 0,
            mode: "normal",
            style: "",
          },
        ],
      },
    ],
  })

  expect(paste(editor, fragmentWithEmptyParagraph).defaultPrevented).toBe(true)

  const secondId = review
    .getView()
    .suggestions.find((suggestion) => suggestion.id !== firstId)?.id

  expect(secondId).toBeDefined()
  editor.update(
    () => {
      const anchor = $getRoot()
        .getAllTextNodes()
        .find((node) => node.getTextContent() === "Anchor")

      if (!anchor) throw new Error("Expected the comment anchor.")
      anchor.select(2, 2)
    },
    { discrete: true },
  )
  const decisionSelection = selectionSnapshot(editor)
  const decisionHistoryDepth = historyDepth(editor)

  const commentsBeforeDecision = JSON.stringify({
    threads: review.getView().data.threads,
    detachedThreadIds: review.getView().detachedThreadIds,
  })

  expect(review.run(() => review.$decide(secondId!, "reject"))).toBe(true)
  expect(JSON.stringify(editor.getEditorState().toJSON())).toBe(
    beforeSecondPaste,
  )
  expect(selectionSnapshot(editor)).toEqual(decisionSelection)
  expect(historyDepth(editor)).toBe(decisionHistoryDepth + 1)
  expect(
    review.getView().suggestions.map((suggestion) => suggestion.id),
  ).toEqual([firstId])
  expect(
    JSON.stringify({
      threads: review.getView().data.threads,
      detachedThreadIds: review.getView().detachedThreadIds,
    }),
  ).toBe(commentsBeforeDecision)
  expect(review.getView().data.threads.map((thread) => thread.id)).toContain(
    anchorId,
  )
  editor.dispose()
})

test("paste authorization revalidates suggestion mode for inserts and replacements", () => {
  for (const replaceSelection of [false, true]) {
    const { editor, review } = makeEditor(
      `review-native-reentrant-mode-${replaceSelection}`,
    )

    let reenter = false

    setHost(review, (action) => {
      if (reenter && action === "suggest") review.setSuggesting(false)

      return true
    })
    makeFixture(editor, review, replaceSelection)
    review.setSuggesting(true)
    const before = JSON.stringify(editor.getEditorState().toJSON())
    const selectionBefore = selectionSnapshot(editor)
    const historyBefore = historyDepth(editor)

    reenter = true
    const event = paste(editor, makeFragment(editor._config.namespace))

    expect(event.defaultPrevented).toBe(true)
    expect(review.getView().suggesting).toBe(false)
    expect(review.getView().suggestions).toHaveLength(0)
    expect(JSON.stringify(editor.getEditorState().toJSON())).toBe(before)
    expect(selectionSnapshot(editor)).toEqual(selectionBefore)
    expect(historyDepth(editor)).toBe(historyBefore)
    editor.dispose()
  }
})

test("native rich replacement retains formatted deletion and accepts fragment blocks", () => {
  const { editor, review } = makeEditor("review-native-replacement-accept")

  setHost(review)
  editor.update(
    () => {
      const target = $createTextNode("prefix TARGET suffix").setFormat(1)
      $getRoot().clear().append($createParagraphNode().append(target))
      target.select(8, 12)
    },
    { discrete: true },
  )
  review.setSuggesting(true)

  const event = paste(editor, makeFragment(editor._config.namespace))
  const suggestion = review.getView().suggestions[0]

  expect(event.defaultPrevented).toBe(true)
  expect(suggestion?.kind).toBe("replace")
  expect(suggestion?.removedText).toBe("ARGE")
  expect(suggestion?.insertedText).toContain("Inserted")
  const pendingJSON = JSON.stringify(editor.getEditorState().toJSON())

  expect(pendingJSON).toContain("yopemReviewNativeOperation")
  expect(pendingJSON).not.toContain("yopemReviewNativeFragment")
  editor.read(() => {
    const texts = $getRoot().getAllTextNodes()
    const removed = texts.find((node) => node.getTextContent() === "ARGE")
    const inserted = texts.find((node) => node.getTextContent() === "Inserted")

    const prefix = texts.find((node) => node.getTextContent() === "prefix T")
    const suffix = texts.find((node) => node.getTextContent() === "T suffix")

    expect(removed?.getFormat()).toBe(1)
    expect($getState(removed!, editorSuggestionState)?.kind).toBe("delete")
    expect($getState(removed!, editorSuggestionState)?.beforeFormat).toBe(1)
    expect(inserted?.getFormat()).toBe(1)
    expect($getState(inserted!, editorSuggestionState)?.kind).toBe("insert")
    expect(prefix).toBeDefined()
    expect(prefix?.getFormat()).toBe(1)
    expect($getState(prefix!, editorSuggestionState)).toBeNull()
    expect(suffix).toBeDefined()
    expect(suffix?.getFormat()).toBe(1)
    expect($getState(suffix!, editorSuggestionState)).toBeNull()
  })

  expect(review.run(() => review.$decide(suggestion.id, "accept"))).toBe(true)
  expect(review.getView().suggestions).toHaveLength(0)
  editor.read(() => {
    const texts = $getRoot().getAllTextNodes()

    expect(texts.map((node) => node.getTextContent()).join("")).toContain(
      "prefix TInserted",
    )
    expect(texts.map((node) => node.getTextContent()).join("")).toContain(
      "T suffix",
    )
    expect(texts.some((node) => node.getTextContent() === "ARGE")).toBe(false)
    expect(
      $getRoot()
        .getChildren()
        .some((node) => node.getType() === "list"),
    ).toBe(true)
  })
  editor.dispose()
})

test("full-block replacement resolves only owned structures", () => {
  for (const action of ["accept", "reject"] as const) {
    const { editor, review } = makeEditor(`review-native-full-block-${action}`)

    setHost(review)
    editor.update(
      () => {
        const replaced = $createTextNode("Replace")
        $getRoot()
          .clear()
          .append(
            $createParagraphNode().append(replaced),
            $createParagraphNode().append($createTextNode("Untouched")),
          )
        replaced.select(0, replaced.getTextContentSize())
      },
      { discrete: true },
    )
    review.setSuggesting(true)

    const event = paste(editor, makeFragment(editor._config.namespace))
    const suggestion = review.getView().suggestions[0]

    expect(event.defaultPrevented).toBe(true)
    expect(suggestion?.removedText).toBe("Replace")
    editor.read(() => {
      const source = $getRoot()
        .getChildren()
        .find((node) => node.getTextContent() === "Replace")

      const inserted = $getRoot()
        .getChildren()
        .find(
          (node) =>
            $getState(node, editorReviewNativeOperationState)?.kind ===
            "insert",
        )

      expect(source).toBeDefined()
      expect(inserted).toBeDefined()
      expect($getState(source!, editorReviewNativeOperationState)?.kind).toBe(
        "delete",
      )
    })

    expect(review.run(() => review.$decide(suggestion.id, action))).toBe(true)
    editor.read(() => {
      const text = $getRoot().getTextContent()

      expect(text).toContain("Untouched")
      expect(text.includes("Replace")).toBe(action === "reject")
      expect(text.includes("Inserted")).toBe(action === "accept")
    })
    editor.dispose()
  }
})

test("native rich replacement supports reversed cross-paragraph selections", () => {
  const { editor, review } = makeEditor("review-native-cross-paragraph")

  setHost(review)
  editor.update(
    () => {
      const first = $createTextNode("First paragraph")
      const second = $createTextNode("Second paragraph")
      $getRoot()
        .clear()
        .append(
          $createParagraphNode().append(first),
          $createParagraphNode().append(second),
        )
      const selection = second.select(2, 2)
      selection.focus.set(first.getKey(), 6, "text")
    },
    { discrete: true },
  )
  review.setSuggesting(true)

  const event = paste(editor, makeFragment(editor._config.namespace))
  const suggestion = review.getView().suggestions[0]

  expect(event.defaultPrevented).toBe(true)
  expect(suggestion?.kind).toBe("replace")
  expect(suggestion?.removedText).toBe("paragraphSe")
  expect(review.run(() => review.$decide(suggestion.id, "reject"))).toBe(true)
  editor.read(() => {
    expect(
      $getRoot()
        .getAllTextNodes()
        .map((node) => node.getTextContent())
        .join(""),
    ).toBe("First paragraphSecond paragraph")
  })
  editor.dispose()
})

test("native rich replacement supports nested-list text and keeps list structure", () => {
  const { editor, review } = makeEditor("review-native-nested-list")

  setHost(review)
  editor.update(
    () => {
      const nestedText = $createTextNode("Nested")

      const list = $createListNode("bullet").append(
        $createListItemNode().append(
          $createTextNode("Outer"),
          $createListNode("number").append(
            $createListItemNode().append(nestedText),
          ),
        ),
      )

      $getRoot().clear().append(list)
      nestedText.select(1, 5)
    },
    { discrete: true },
  )
  review.setSuggesting(true)

  const event = paste(editor, makeFragment(editor._config.namespace))
  const suggestion = review.getView().suggestions[0]

  expect(event.defaultPrevented).toBe(true)
  expect(suggestion?.removedText).toBe("este")
  expect(review.run(() => review.$decide(suggestion.id, "reject"))).toBe(true)
  editor.read(() => {
    const list = $getRoot().getFirstChild()

    expect(list?.getType()).toBe("list")

    if (!$isElementNode(list)) throw new Error("Expected the outer list.")
    const item = list.getFirstChild()

    expect(item?.getType()).toBe("listitem")

    if (!$isElementNode(item)) throw new Error("Expected the outer list item.")
    expect(item.getChildren().some((node) => node.getType() === "list")).toBe(
      true,
    )
    expect(
      $getRoot()
        .getAllTextNodes()
        .map((node) => node.getTextContent())
        .join(""),
    ).toContain("Nested")
  })
  editor.dispose()
})

test("native rich replacement rejects overlaps, comment anchors, and selected atoms", () => {
  const { editor, review } = makeEditor("review-native-target-refusals")

  setHost(review)
  makeFixture(editor, review, true)
  review.setSuggesting(true)
  const first = paste(editor, makeFragment(editor._config.namespace))
  expect(first.defaultPrevented).toBe(true)
  const firstId = review.getView().suggestions[0]?.id

  editor.update(
    () => {
      const removed = $getRoot()
        .getAllTextNodes()
        .find(
          (node) => $getState(node, editorSuggestionState)?.kind === "delete",
        )

      if (!removed) throw new Error("Expected retained deletion text.")
      removed.select(0, removed.getTextContentSize())
    },
    { discrete: true },
  )
  const overlapState = JSON.stringify(editor.getEditorState().toJSON())

  expect(
    paste(editor, makeFragment(editor._config.namespace)).defaultPrevented,
  ).toBe(true)
  expect(JSON.stringify(editor.getEditorState().toJSON())).toBe(overlapState)
  expect(review.getView().suggestions).toHaveLength(1)

  editor.update(
    () => {
      const anchor = $getRoot()
        .getAllTextNodes()
        .find((node) => node.getTextContent() === "Anchor")

      if (!anchor) throw new Error("Expected the comment anchor.")
      anchor.select(0, anchor.getTextContentSize())
    },
    { discrete: true },
  )
  const beforeComment = JSON.stringify(editor.getEditorState().toJSON())

  expect(
    paste(editor, makeFragment(editor._config.namespace)).defaultPrevented,
  ).toBe(true)
  expect(JSON.stringify(editor.getEditorState().toJSON())).toBe(beforeComment)

  expect(review.run(() => review.$decide(firstId, "reject"))).toBe(true)
  review.setSuggesting(false)
  editor.update(
    () => {
      const firstText = $createTextNode("Before")
      const secondText = $createTextNode("After")
      $getRoot()
        .clear()
        .append(
          $createParagraphNode().append(
            firstText,
            $createLineBreakNode(),
            secondText,
          ),
        )
      const selection = firstText.select(0, 0)
      selection.focus.set(
        secondText.getKey(),
        secondText.getTextContentSize(),
        "text",
      )
    },
    { discrete: true },
  )
  review.setSuggesting(true)
  const beforeAtom = JSON.stringify(editor.getEditorState().toJSON())

  expect(
    paste(editor, makeFragment(editor._config.namespace)).defaultPrevented,
  ).toBe(true)
  expect(JSON.stringify(editor.getEditorState().toJSON())).toBe(beforeAtom)
  editor.dispose()
})

test("independent rich paste and typing operations resolve in either order", () => {
  const decisionOrders = [
    [
      ["A", "accept"],
      ["C", "reject"],
      ["B", "reject"],
    ],
    [
      ["C", "accept"],
      ["A", "reject"],
      ["B", "accept"],
    ],
  ] as const

  for (const [caseIndex, decisions] of decisionOrders.entries()) {
    const { editor, review } = makeEditor(
      `review-independent-operations-${caseIndex}`,
    )

    setHost(review)
    editor.update(
      () => {
        $getRoot()
          .clear()
          .append(
            $createParagraphNode().append($createTextNode("Left target")),
            $createParagraphNode().append($createTextNode("Middle target")),
            $createParagraphNode().append($createTextNode("Right target")),
          )
        $getRoot().getAllTextNodes()[0].select(5, 11)
      },
      { discrete: true },
    )
    review.setSuggesting(true)

    const firstPaste = paste(editor, makeFragment(editor._config.namespace))
    const firstId = review.getView().suggestions[0]?.id

    expect(firstPaste.defaultPrevented).toBe(true)
    expect(firstId).toBeDefined()
    editor.update(
      () => {
        const middle = $getRoot()
          .getAllTextNodes()
          .find((node) => node.getTextContent() === "Middle target")

        if (!middle) throw new Error("Expected the middle text target.")
        middle.selectEnd()
        editor.dispatchCommand(CONTROLLED_TEXT_INSERTION_COMMAND, " typed")
      },
      { discrete: true },
    )

    const typedId = review
      .getView()
      .suggestions.find(
        (suggestion) => suggestion.insertedText === " typed",
      )?.id

    expect(typedId).toBeDefined()
    editor.update(
      () => {
        const right = $getRoot()
          .getAllTextNodes()
          .find((node) => node.getTextContent() === "Right target")

        if (!right) throw new Error("Expected the right text target.")
        right.select(6, 12)
      },
      { discrete: true },
    )
    const thirdPaste = paste(editor, makeFragment(editor._config.namespace))

    const thirdId = review
      .getView()
      .suggestions.find(
        (suggestion) => suggestion.id !== firstId && suggestion.id !== typedId,
      )?.id

    expect(thirdPaste.defaultPrevented).toBe(true)
    expect(thirdId).toBeDefined()
    expect(new Set([firstId, typedId, thirdId]).size).toBe(3)

    const ids = { A: firstId, B: typedId!, C: thirdId! }

    for (const [operation, action] of decisions) {
      expect(review.run(() => review.$decide(ids[operation], action))).toBe(
        true,
      )

      const remaining = decisions
        .slice(decisions.findIndex(([name]) => name === operation) + 1)
        .map(([name]) => ids[name])

      expect(review.getView().suggestions.map((item) => item.id)).toEqual(
        expect.arrayContaining(remaining),
      )
    }

    const acceptedPasteCount = decisions.filter(
      ([operation, action]) =>
        (operation === "A" || operation === "C") && action === "accept",
    ).length

    expect(review.getView().suggestions).toHaveLength(0)
    editor.read(() => {
      const texts = $getRoot().getAllTextNodes()

      const inserted = texts.filter(
        (node) => node.getTextContent() === "Inserted",
      )

      expect(inserted).toHaveLength(acceptedPasteCount)
      expect(inserted.every((node) => node.hasFormat("bold"))).toBe(true)
      expect(
        $getRoot()
          .getChildren()
          .filter((node) => node.getType() === "list"),
      ).toHaveLength(acceptedPasteCount)
      expect($getRoot().getTextContent()).toContain("Middle target")
    })
    editor.dispose()
  }
})

test("rich operation decisions persist through history and reload", () => {
  const { editor, review } = makeEditor("review-independent-history")

  setHost(review)
  editor.update(
    () => {
      const left = $createTextNode("Left")
      const right = $createTextNode("Right target")
      $getRoot()
        .clear()
        .append(
          $createParagraphNode().append(left),
          $createParagraphNode().append(right),
        )
      right.select(6, 12)
    },
    { discrete: true },
  )
  review.setSuggesting(true)
  expect(
    paste(editor, makeFragment(editor._config.namespace)).defaultPrevented,
  ).toBe(true)
  const pasteId = review.getView().suggestions[0]?.id

  expect(pasteId).toBeDefined()
  const saved = JSON.stringify(editor.getEditorState().toJSON())
  const historyDepthBeforeDecision = historyDepth(editor)

  expect(review.run(() => review.$decide(pasteId, "accept"))).toBe(true)
  expect(historyDepth(editor)).toBe(historyDepthBeforeDecision + 1)
  expect(review.getView().suggestions).toHaveLength(0)
  expect(editor.dispatchCommand(UNDO_COMMAND, undefined)).toBe(true)
  expect(historyDepth(editor)).toBe(historyDepthBeforeDecision)
  expect(review.getView().suggestions.map((item) => item.id)).toEqual([pasteId])
  expect(editor.dispatchCommand(REDO_COMMAND, undefined)).toBe(true)
  expect(historyDepth(editor)).toBe(historyDepthBeforeDecision + 1)
  expect(review.getView().suggestions).toHaveLength(0)

  const reloadedController = createEditorReview()

  const reloadedEditor = makeUnreviewedEditor(
    "review-independent-history-reload",
  )

  reloadedEditor.setEditorState(reloadedEditor.parseEditorState(saved))
  const disconnect = reloadedController.register(reloadedEditor)
  const reloadedReview = reloadedController.forEditor(reloadedEditor)

  setHost(reloadedReview)
  expect(reloadedReview.getView().suggestions.map((item) => item.id)).toEqual([
    pasteId,
  ])
  const reloadedHistoryDepthBeforeDecision = historyDepth(reloadedEditor)

  expect(
    reloadedReview.run(() => reloadedReview.$decide(pasteId, "accept")),
  ).toBe(true)
  expect(reloadedReview.getView().suggestions).toHaveLength(0)
  expect(reloadedEditor.dispatchCommand(UNDO_COMMAND, undefined)).toBe(true)
  expect(historyDepth(reloadedEditor)).toBe(reloadedHistoryDepthBeforeDecision)
  expect(reloadedReview.getView().suggestions.map((item) => item.id)).toEqual([
    pasteId,
  ])
  expect(reloadedEditor.dispatchCommand(REDO_COMMAND, undefined)).toBe(true)
  expect(historyDepth(reloadedEditor)).toBe(
    reloadedHistoryDepthBeforeDecision + 1,
  )
  expect(reloadedReview.getView().suggestions).toHaveLength(0)
  reloadedEditor.read(() =>
    expect($getRoot().getTextContent()).toContain("Inserted"),
  )

  editor.dispose()
  disconnect()
  reloadedEditor.dispose()
})

test("decisions preflight neighboring unrequested break targets", () => {
  const { editor, review } = makeEditor("review-break-operation-preflight")
  const author = { id: "alice", name: "Alice" }
  const breakId = "break-target"
  const operationId = "operation-target"

  setHost(review)
  editor.update(
    () => {
      const previous = $createParagraphNode().append(
        $createTextNode("Previous"),
      )

      const nextText = $createTextNode("Removed")
      const next = $createParagraphNode().append(nextText)
      $getRoot().clear().append(previous, next)
      $setState(
        previous,
        editorReviewBreakState,
        reviewBreakSuggestionSchema.parse({
          id: breakId,
          author,
          createdAt: 1,
          kind: "paragraph",
        }),
      )
      $setState(
        next,
        editorReviewNativeOperationState,
        reviewNativeOperationSchema.parse({
          version: 1,
          id: operationId,
          kind: "delete",
        }),
      )
      $setState(
        nextText,
        editorSuggestionState,
        reviewSuggestionSchema.parse({
          id: operationId,
          author,
          createdAt: 1,
          kind: "delete",
          beforeFormat: 0,
        }),
      )
    },
    { discrete: true, tag: "yopem-review-action" },
  )
  review.setSuggesting(true)

  expect(review.getView().suggestions.map((item) => item.id)).toEqual(
    expect.arrayContaining([breakId, operationId]),
  )
  const beforeDecision = JSON.stringify(editor.getEditorState().toJSON())

  expect(review.run(() => review.$decide(operationId, "accept"))).toBe(false)
  expect(JSON.stringify(editor.getEditorState().toJSON())).toBe(beforeDecision)
  expect(review.getView().suggestions.map((item) => item.id)).toEqual(
    expect.arrayContaining([breakId, operationId]),
  )
  editor.dispose()
})

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
