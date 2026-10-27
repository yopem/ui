import { buildEditorFromExtensions } from "@lexical/extension"
import { HistoryExtension } from "@lexical/history"
import { $getMarkIDs, MarkExtension } from "@lexical/mark"
import { $createQuoteNode, RichTextExtension } from "@lexical/rich-text"
import { parseReviewDocument } from "@yopem-ui/editor/review-codecs"
import { createEditorReview } from "@yopem-ui/editor/review-extension"
import { parseEditorReviewTreeDocument } from "@yopem-ui/editor/review-tree-diff"
import { expect, test } from "bun:test"
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $isElementNode,
  CONTROLLED_TEXT_INSERTION_COMMAND,
  INSERT_LINE_BREAK_COMMAND,
  INSERT_PARAGRAPH_COMMAND,
  REDO_COMMAND,
  UNDO_COMMAND,
  COMMAND_PRIORITY_CRITICAL,
  configExtension,
  defineExtension,
} from "lexical"

test("tree proposals reject native break attribution", () => {
  const clean = {
    root: {
      type: "root",
      children: [{ type: "paragraph", children: [{ type: "linebreak" }] }],
    },
  }

  expect(parseEditorReviewTreeDocument(clean)).toEqual(clean)

  const attributed = {
    root: {
      type: "root",
      children: [
        {
          type: "paragraph",
          children: [
            {
              type: "linebreak",
              $: {
                yopemReviewBreak: {
                  id: "forged-break",
                  author: { id: "other", name: "Other" },
                  createdAt: 1,
                  kind: "linebreak",
                },
              },
            },
          ],
        },
      ],
    },
  }

  expect(() => parseEditorReviewTreeDocument(attributed)).toThrow()
})

function setup(name: string) {
  const controller = createEditorReview()

  const editor = buildEditorFromExtensions(
    defineExtension({
      name,
      dependencies: [
        configExtension(HistoryExtension, { disabled: false }),
        RichTextExtension,
        controller.extension,
      ],
      onError(error) {
        throw error
      },
    }),
  )

  const review = controller.forEditor(editor)

  review.setHost({
    viewer: { id: "alice", name: "Alice" },
    visible: true,
    replyWhileReadonly: false,
    can: () => true,
  })

  return { editor, review }
}

test("native Enter tracks paragraph breaks across typing, reload, and decisions", () => {
  const { editor, review } = setup("review-native-breaks-source")
  let threadId = ""

  editor.update(
    () => {
      const text = $createTextNode("Original").setFormat("bold")
      $getRoot().clear().append($createParagraphNode().append(text))
      text.select(0, text.getTextContentSize())
      threadId = review.$createThread("Keep this anchor")
      $getRoot().getAllTextNodes()[0]?.selectEnd()
    },
    { discrete: true },
  )
  review.setSuggesting(true)

  let firstInlineId = ""

  expect(
    review.run(() => {
      firstInlineId = review.$suggestInsert(" pending")
    }),
  ).toBe(true)
  editor.update(
    () => {
      expect(editor.dispatchCommand(INSERT_PARAGRAPH_COMMAND, undefined)).toBe(
        true,
      )
    },
    { discrete: true },
  )
  editor.dispatchCommand(CONTROLLED_TEXT_INSERTION_COMMAND, " after")

  const breakSuggestion = review
    .getView()
    .suggestions.find((suggestion) => suggestion.insertedText === "\n")

  expect(breakSuggestion).toBeDefined()
  expect(breakSuggestion?.breakKind).toBe("paragraph")
  expect(
    review.getView().suggestions.map((suggestion) => suggestion.id),
  ).toContain(firstInlineId)
  editor.read(() => {
    const paragraphs = $getRoot().getChildren()

    expect(paragraphs.map((paragraph) => paragraph.getType())).toEqual([
      "paragraph",
      "paragraph",
    ])
    expect(paragraphs.map((paragraph) => paragraph.getTextContent())).toEqual([
      "Original pending",
      " after",
    ])
    expect($getRoot().getAllTextNodes()[0]?.hasFormat("bold")).toBe(true)
    expect($getMarkIDs($getRoot().getAllTextNodes()[0], 1)).toContain(threadId)
  })
  expect(review.getView().detachedThreadIds).toEqual([])

  const savedValue = editor.getEditorState().toJSON()
  const saved = JSON.stringify(savedValue)

  expect(saved).toContain("yopemReviewBreak")

  expect(
    JSON.stringify(parseReviewDocument(JSON.parse(saved), false)),
  ).not.toContain("yopemReviewBreak")

  const reloadedController = createEditorReview()

  const reloadedEditor = buildEditorFromExtensions(
    defineExtension({
      name: "review-native-breaks-reload",
      dependencies: [
        configExtension(HistoryExtension, { disabled: false }),
        RichTextExtension,
        MarkExtension,
      ],
      onError(error) {
        throw error
      },
    }),
  )

  reloadedEditor.setEditorState(reloadedEditor.parseEditorState(saved))
  const disconnect = reloadedController.register(reloadedEditor)
  const reloadedReview = reloadedController.forEditor(reloadedEditor)

  reloadedReview.setHost({
    viewer: { id: "alice", name: "Alice" },
    visible: true,
    replyWhileReadonly: false,
    can: () => true,
  })
  expect(
    reloadedReview
      .getView()
      .suggestions.some((suggestion) => suggestion.id === breakSuggestion?.id),
  ).toBe(true)
  expect(reloadedReview.getView().detachedThreadIds).toEqual([])
  expect(
    reloadedReview.run(() =>
      reloadedReview.$decide(breakSuggestion!.id, "reject"),
    ),
  ).toBe(true)
  reloadedEditor.read(() => {
    const paragraphs = $getRoot().getChildren()

    expect(paragraphs).toHaveLength(1)
    expect(paragraphs[0]?.getTextContent()).toBe("Original pending after")
  })
  expect(
    reloadedReview.getView().suggestions.map((suggestion) => suggestion.id),
  ).toContain(firstInlineId)
  reloadedEditor.dispatchCommand(UNDO_COMMAND, undefined)
  reloadedEditor.read(() => expect($getRoot().getChildren()).toHaveLength(2))
  expect(
    reloadedReview
      .getView()
      .suggestions.some((suggestion) => suggestion.id === breakSuggestion?.id),
  ).toBe(true)
  reloadedEditor.dispatchCommand(REDO_COMMAND, undefined)
  reloadedEditor.read(() => expect($getRoot().getChildren()).toHaveLength(1))
  expect(
    reloadedReview
      .getView()
      .suggestions.some((suggestion) => suggestion.id === breakSuggestion?.id),
  ).toBe(false)

  editor.dispose()
  disconnect()
  reloadedEditor.dispose()
})

test("Shift+Enter and nested Enter create tracked native line breaks", () => {
  const { editor, review } = setup("review-native-line-breaks")

  editor.update(
    () => {
      $getRoot()
        .clear()
        .append($createParagraphNode().append($createTextNode("Soft break")))
      $getRoot().getAllTextNodes()[0]?.selectEnd()
    },
    { discrete: true },
  )
  review.setSuggesting(true)
  editor.update(
    () => editor.dispatchCommand(INSERT_LINE_BREAK_COMMAND, false),
    { discrete: true },
  )

  const softBreak = review
    .getView()
    .suggestions.find((suggestion) => suggestion.insertedText === "\n")

  expect(softBreak).toBeDefined()
  expect(softBreak?.breakKind).toBe("linebreak")
  editor.read(() => {
    const paragraph = $getRoot().getFirstChild()

    expect(paragraph?.getType()).toBe("paragraph")

    if (!$isElementNode(paragraph)) throw new Error("Expected paragraph node.")
    expect(paragraph.getChildren().map((node) => node.getType())).toContain(
      "linebreak",
    )
  })
  expect(review.run(() => review.$decide(softBreak!.id, "reject"))).toBe(true)
  editor.read(() => {
    const paragraph = $getRoot().getFirstChild()

    expect(paragraph?.getTextContent()).toBe("Soft break")

    if (!$isElementNode(paragraph)) throw new Error("Expected paragraph node.")
    expect(paragraph.getChildren().map((node) => node.getType())).not.toContain(
      "linebreak",
    )
  })

  review.setSuggesting(false)
  editor.update(
    () => {
      $getRoot()
        .clear()
        .append(
          $createQuoteNode().append(
            $createParagraphNode().append($createTextNode("Quoted")),
          ),
        )
      $getRoot().getAllTextNodes()[0]?.selectEnd()
    },
    { discrete: true },
  )
  review.setSuggesting(true)
  editor.update(
    () => editor.dispatchCommand(INSERT_PARAGRAPH_COMMAND, undefined),
    { discrete: true },
  )

  const nestedBreak = review
    .getView()
    .suggestions.find((suggestion) => suggestion.insertedText === "\n")

  expect(nestedBreak).toBeDefined()
  expect(nestedBreak?.breakKind).toBe("linebreak")
  editor.read(() => {
    const quote = $getRoot().getFirstChild()

    expect(quote?.getType()).toBe("quote")

    if (!$isElementNode(quote)) throw new Error("Expected quote node.")
    expect(quote.getChildren().map((node) => node.getType())).toEqual([
      "paragraph",
    ])
    expect(quote.getTextContent()).toBe("Quoted\n")
  })
  expect(review.run(() => review.$decide(nestedBreak!.id, "accept"))).toBe(true)
  expect(review.getView().suggestions).toHaveLength(0)
  editor.read(() => expect($getRoot().getTextContent()).toBe("Quoted\n"))
  editor.dispose()
})

test("expanded selection tracks deletion with Enter and default mode stays native", () => {
  const { editor, review } = setup("review-native-break-expanded")

  editor.update(
    () => {
      const text = $createTextNode("ABCDE")
      $getRoot().clear().append($createParagraphNode().append(text))
      text.select(1, 3)
    },
    { discrete: true },
  )
  review.setSuggesting(true)
  editor.update(
    () => editor.dispatchCommand(INSERT_PARAGRAPH_COMMAND, undefined),
    { discrete: true },
  )

  const replacement = review
    .getView()
    .suggestions.find((suggestion) => suggestion.insertedText === "\n")

  expect(replacement).toBeDefined()
  expect(replacement?.kind).toBe("replace")
  expect(replacement?.removedText).toBe("BC")
  editor.read(() => {
    const paragraphs = $getRoot().getChildren()

    expect(paragraphs.map((paragraph) => paragraph.getTextContent())).toEqual([
      "ABC",
      "DE",
    ])
  })
  expect(review.run(() => review.$decide(replacement!.id, "reject"))).toBe(true)
  editor.read(() => {
    expect($getRoot().getChildren()).toHaveLength(1)
    expect($getRoot().getTextContent()).toBe("ABCDE")
  })
  editor.dispose()

  const native = setup("review-native-break-default")

  native.editor.update(
    () => {
      const text = $createTextNode("ABCDE")
      $getRoot().clear().append($createParagraphNode().append(text))
      text.select(1, 3)
    },
    { discrete: true },
  )
  native.editor.update(
    () => native.editor.dispatchCommand(INSERT_PARAGRAPH_COMMAND, undefined),
    { discrete: true },
  )
  native.editor.read(() => {
    expect(
      $getRoot()
        .getChildren()
        .map((node) => node.getTextContent()),
    ).toEqual(["A", "DE"])
  })
  expect(native.review.getView().suggestions).toHaveLength(0)
  native.editor.dispose()

  const crossBlock = setup("review-native-break-cross-block")

  crossBlock.editor.update(
    () => {
      const first = $createTextNode("First")
      const second = $createTextNode("Second")
      $getRoot()
        .clear()
        .append(
          $createParagraphNode().append(first),
          $createParagraphNode().append(second),
        )
      const selection = first.select(1, 2)
      selection.focus.set(second.getKey(), 2, "text")
    },
    { discrete: true },
  )
  crossBlock.review.setSuggesting(true)
  crossBlock.editor.update(
    () =>
      crossBlock.editor.dispatchCommand(INSERT_PARAGRAPH_COMMAND, undefined),
    { discrete: true },
  )
  crossBlock.editor.read(() => {
    expect($getRoot().getChildren()).toHaveLength(2)
    expect($getRoot().getTextContent()).toContain("First")
    expect($getRoot().getTextContent()).toContain("Second")
  })
  expect(crossBlock.review.getView().suggestions).toHaveLength(0)
  expect(crossBlock.review.getView().diagnostic).not.toBe("")
  crossBlock.editor.dispose()
})

test("review break policy uses current identity, blocks revocation and read-only edits", () => {
  const controller = createEditorReview()
  let allowSuggest = true
  let allowDecision = true

  const editor = buildEditorFromExtensions(
    defineExtension({
      name: "review-native-break-policy",
      dependencies: [
        configExtension(HistoryExtension, { disabled: false }),
        RichTextExtension,
        controller.extension,
      ],
      onError(error) {
        throw error
      },
    }),
  )

  const review = controller.forEditor(editor)

  const host = {
    viewer: { id: "alice", name: "Alice" },
    visible: true,
    replyWhileReadonly: false,
    can(action: string) {
      if (action === "suggest") return allowSuggest

      if (action === "accept" || action === "reject") return allowDecision

      return true
    },
  }

  review.setHost(host)
  editor.update(
    () => {
      $getRoot()
        .clear()
        .append($createParagraphNode().append($createTextNode("Policy")))
      $getRoot().getAllTextNodes()[0]?.selectEnd()
    },
    { discrete: true },
  )
  review.setSuggesting(true)
  allowSuggest = false
  editor.update(
    () => editor.dispatchCommand(INSERT_LINE_BREAK_COMMAND, false),
    { discrete: true },
  )
  expect(review.getView().suggestions).toHaveLength(0)
  editor.read(() => expect($getRoot().getTextContent()).toBe("Policy"))

  allowSuggest = true
  review.setHost({ ...host, viewer: { id: "bob", name: "Bob" } })
  editor.update(
    () => editor.dispatchCommand(INSERT_LINE_BREAK_COMMAND, false),
    { discrete: true },
  )
  const suggestion = review.getView().suggestions[0]

  expect(suggestion?.author.id).toBe("bob")
  allowDecision = false
  expect(review.run(() => review.$decide(suggestion.id, "reject"))).toBe(false)
  expect(review.getView().suggestions.map((item) => item.id)).toContain(
    suggestion?.id,
  )

  allowDecision = true
  expect(review.run(() => review.$decide(suggestion.id, "reject"))).toBe(true)
  editor.setEditable(false)
  const before = JSON.stringify(editor.getEditorState().toJSON())
  editor.dispatchCommand(INSERT_PARAGRAPH_COMMAND, undefined)
  expect(JSON.stringify(editor.getEditorState().toJSON())).toBe(before)
  editor.dispose()
  expect(() => review.setSuggesting(true)).toThrow()
})

test("a later critical host veto prevents review Enter handling", () => {
  const { editor, review } = setup("review-native-break-veto")

  const releaseVeto = editor.registerCommand(
    INSERT_PARAGRAPH_COMMAND,
    () => true,
    COMMAND_PRIORITY_CRITICAL,
  )

  editor.update(
    () => {
      $getRoot()
        .clear()
        .append($createParagraphNode().append($createTextNode("Keep")))
      $getRoot().getAllTextNodes()[0]?.selectEnd()
    },
    { discrete: true },
  )
  review.setSuggesting(true)
  const before = JSON.stringify(editor.getEditorState().toJSON())

  editor.dispatchCommand(INSERT_PARAGRAPH_COMMAND, undefined)

  expect(JSON.stringify(editor.getEditorState().toJSON())).toBe(before)
  expect(review.getView().suggestions).toHaveLength(0)
  releaseVeto()
  editor.dispose()
})
