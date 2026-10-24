import {
  MarkExtension,
  MarkNode,
  $wrapSelectionInMarkNode,
  $unwrapMarkNode,
} from "@lexical/mark"
import { $moveCaretSelection } from "@lexical/selection"
import {
  $createTextNode,
  $getRoot,
  $getEditor,
  $getSelection,
  $getState,
  $isElementNode,
  $isRangeSelection,
  $isTextNode,
  $nodesOfType,
  $setState,
  $addUpdateTag,
  $hasUpdateTag,
  defineExtension,
  mergeRegister,
  RootNode,
  HISTORIC_TAG,
  COMMAND_PRIORITY_CRITICAL,
  COMMAND_PRIORITY_LOW,
  CONTROLLED_TEXT_INSERTION_COMMAND,
  DELETE_CHARACTER_COMMAND,
  DELETE_WORD_COMMAND,
  DELETE_LINE_COMMAND,
  REMOVE_TEXT_COMMAND,
  FORMAT_TEXT_COMMAND,
  INSERT_PARAGRAPH_COMMAND,
  INSERT_LINE_BREAK_COMMAND,
  PASTE_COMMAND,
  CUT_COMMAND,
  HISTORY_PUSH_TAG,
  SKIP_DOM_SELECTION_TAG,
  PASTE_TAG,
  UNDO_COMMAND,
  REDO_COMMAND,
  KEY_DOWN_COMMAND,
  type LexicalEditor,
  type LexicalNode,
  type SerializedLexicalNode,
  type LexicalCommand,
  type RangeSelection,
  type TextFormatType,
  type TextNode,
} from "lexical"
import { z } from "zod"

import type { EditorReviewRichContent } from "./review-richtext"

import {
  parseEditorReview,
  parseReviewDocumentJSON,
  checkReviewComplexity,
  sanitizeEditorReviewClipboard,
  reviewIdSchema,
  reviewTextSchema,
  type EditorSuggestion,
  type EditorReviewData,
} from "./review-codecs"
import { registerReviewDecorations } from "./review-decorations"
import { EditorReviewTextDiffError } from "./review-diff"
import {
  $applyEditorReviewTextDiff,
  $reviewTextDiffSource,
} from "./review-diff-native"
import { createEditorReviewHTMLConfig } from "./review-html"
import {
  createReviewSession,
  type EditorReviewHost,
  type EditorReviewAction,
} from "./review-model"
import {
  $setEditorSuggestion,
  emptyReview,
  editorReviewState,
  editorSuggestionState,
} from "./review-state"
import { reviewStringSchema, isReviewObject } from "./review-validation"
import {
  $isValidBookmarkPoint,
  createEditorSelectionBookmark,
} from "./selection-bookmark"

export { editorReviewState, editorSuggestionState } from "./review-state"

export type { EditorSuggestion } from "./review-codecs"

class EditorReviewInputError extends Error {}

interface ReviewSerializedNode extends SerializedLexicalNode {
  children?: ReviewSerializedNode[]
}

const insertionTextSchema = reviewStringSchema.pipe(
  z
    .string()
    .min(1)
    .max(16384)
    .refine((value) => !/[\r\n]/.test(value)),
)

const reviewFormatSchema = z.enum([
  "bold",
  "italic",
  "underline",
  "strikethrough",
  "code",
  "subscript",
  "superscript",
  "highlight",
  "lowercase",
  "uppercase",
  "capitalize",
])

const reviewDecisionSchema = z.enum(["accept", "reject"])

type EditorReviewSuggestionSummary = Omit<EditorSuggestion, "kind"> & {
  readonly kind: EditorSuggestion["kind"] | "replace"
  readonly insertedText: string
  readonly removedText: string
  readonly formattedText: string
}

function createReviewController() {
  const session = createReviewSession()
  let editor: LexicalEditor | null = null
  let disposed = false
  let refreshDecorations: (() => void) | undefined
  let saved: { range: RangeSelection } | null = null
  let bookmark: ReturnType<typeof createEditorSelectionBookmark> | null = null

  let commentRequest = 0
  let suggesting = false
  let diagnostic = ""
  let version = 0
  const listeners = new Set<() => void>()

  function publish() {
    version++

    for (const listener of listeners) listener()
  }

  function fail(message: string): never {
    diagnostic = message
    publish()
    throw new EditorReviewInputError(message)
  }

  function instance() {
    if (!editor) return fail("Review is not mounted.")

    return editor
  }

  function authorize(action: EditorReviewAction, id?: string) {
    const current = instance()
    const host = session.getHost()

    const discussion =
      action === "reply" ||
      action === "edit" ||
      action === "delete" ||
      action === "resolve" ||
      action === "reopen"

    if (!current.isEditable() && !(discussion && host?.replyWhileReadonly))
      return fail("Review action is read-only.")
    const permit = session.authorize(action, id)

    function assertCurrent() {
      permit.assertCurrent()

      if (
        editor !== current ||
        (!current.isEditable() &&
          !(discussion && session.getHost()?.replyWhileReadonly))
      )
        return fail("Review action is read-only or expired.")
    }

    assertCurrent()

    return { author: permit.author, assertCurrent }
  }

  function $assertEditor() {
    if ($getEditor() !== instance())
      return fail("Review action belongs to another document.")
  }

  function data() {
    $assertEditor()

    return $getState($getRoot(), editorReviewState)
  }

  function setData(next: EditorReviewData, focusEditor = false) {
    if (!focusEditor) $addUpdateTag(SKIP_DOM_SELECTION_TAG)
    $addUpdateTag(HISTORY_PUSH_TAG)
    $addUpdateTag("yopem-review-action")
    $setState($getRoot(), editorReviewState, parseEditorReview(next))
  }

  function thread(id: string) {
    const found = data().threads.find((item) => item.id === id)

    if (!found) return fail("Review thread no longer exists.")

    return found
  }

  function selection(expanded = true) {
    $assertEditor()
    const range = $getSelection()

    if (
      !$isRangeSelection(range) ||
      ![range.anchor, range.focus].every($isValidBookmarkPoint)
    )
      return fail("Review requires a current text selection.")

    if (expanded && range.isCollapsed()) return fail("Select text for review.")

    return range
  }

  function selectedText() {
    const range = selection()
    const nodes = range.getNodes()
    const texts = nodes.filter($isTextNode)

    if (
      !texts.length ||
      texts.length !== nodes.length ||
      texts.some(
        (node) =>
          !node.isSimpleText() || $getState(node, editorSuggestionState),
      )
    )
      return fail("This selection contains unsupported review content.")
    const parent = texts[0].getParent()

    if (texts.some((node) => node.getParent() !== parent))
      return fail("Structural review changes are not supported.")

    return range
  }

  function newSuggestion(
    kind: EditorSuggestion["kind"],
    beforeFormat = 0,
  ): EditorSuggestion {
    const permit = authorize("suggest")

    return {
      id: crypto.randomUUID(),
      author: permit.author,
      createdAt: Date.now(),
      kind,
      beforeFormat,
    }
  }

  function $createThread(text: string, richContent?: EditorReviewRichContent) {
    const permit = authorize("create")
    const content = reviewTextSchema.parse(text)
    const range = selection(false)

    if (range.isCollapsed()) {
      const parent = range.anchor.getNode().getTopLevelElementOrThrow()
      parent.selectStart()
      const expanded = selection(false)
      const last = parent.getAllTextNodes().at(-1)

      if (!last) return fail("Cannot anchor an empty block.")
      expanded.focus.set(last.getKey(), last.getTextContentSize(), "text")
    }

    const current = selection()
    const anchors = current.getNodes().filter($isTextNode)

    if (!anchors.length || anchors.some((node) => !node.isSimpleText()))
      return fail(
        "Comment anchors require normal text. Token and highlighted code text are not supported.",
      )
    const id = crypto.randomUUID()
    const now = Date.now()

    const comment = {
      id: crypto.randomUUID(),
      author: permit.author,
      text: content,
      createdAt: now,
      updatedAt: now,
    }

    const next = parseEditorReview({
      version: 1,
      threads: [
        ...data().threads,
        {
          id,
          resolved: false,
          comments: [
            richContent ? { ...comment, content: richContent } : comment,
          ],
        },
      ],
    })

    permit.assertCurrent()
    $addUpdateTag("yopem-review-action")
    $wrapSelectionInMarkNode(current, current.isBackward(), id)

    if (
      !$nodesOfType(MarkNode).some(
        (mark) => mark.hasID(id) && mark.getTextContentSize() > 0,
      )
    )
      return fail("This selection cannot retain a comment anchor.")
    setData(next, true)
    saved = null

    return id
  }

  function $reply(
    id: string,
    text: string,
    richContent?: EditorReviewRichContent,
  ) {
    const permit = authorize("reply", id)
    const target = thread(id)

    if (target.resolved) return fail("Reopen the thread before replying.")
    const now = Date.now()

    const comment = {
      id: crypto.randomUUID(),
      author: permit.author,
      text: reviewTextSchema.parse(text),
      createdAt: now,
      updatedAt: now,
    }

    const next = parseEditorReview({
      ...data(),
      threads: data().threads.map((item) =>
        item.id === id
          ? {
              ...target,
              comments: [
                ...target.comments,
                richContent ? { ...comment, content: richContent } : comment,
              ],
            }
          : item,
      ),
    })

    permit.assertCurrent()
    setData(next)

    return comment.id
  }

  function $editComment(
    id: string,
    commentId: string,
    text: string,
    richContent?: EditorReviewRichContent,
  ) {
    const permit = authorize("edit", commentId)
    const target = thread(id)

    if (!target.comments.some((comment) => comment.id === commentId))
      return fail("Comment no longer exists.")
    const content = reviewTextSchema.parse(text)
    permit.assertCurrent()
    setData({
      ...data(),
      threads: data().threads.map((item) =>
        item.id === id
          ? {
              ...item,
              comments: item.comments.map((comment) => {
                if (comment.id !== commentId) return comment

                const next = {
                  id: comment.id,
                  author: comment.author,
                  createdAt: comment.createdAt,
                  text: content,
                  updatedAt: Math.max(Date.now(), comment.updatedAt),
                }

                return richContent ? { ...next, content: richContent } : next
              }),
            }
          : item,
      ),
    })
  }

  function $deleteComment(id: string, commentId: string) {
    const permit = authorize("delete", commentId)
    const target = thread(id)

    if (!target.comments.some((comment) => comment.id === commentId))
      return fail("Comment no longer exists.")

    if (target.comments.length === 1) return $deleteThread(id)
    permit.assertCurrent()
    setData({
      ...data(),
      threads: data().threads.map((item) =>
        item.id === id
          ? {
              ...item,
              comments: item.comments.filter(
                (comment) => comment.id !== commentId,
              ),
            }
          : item,
      ),
    })
  }

  function $resolve(id: string, resolved: boolean) {
    const permit = authorize(resolved ? "resolve" : "reopen", id)
    thread(id)
    permit.assertCurrent()
    setData({
      ...data(),
      threads: data().threads.map((item) =>
        item.id === id ? { ...item, resolved } : item,
      ),
    })
  }

  function $deleteThread(id: string) {
    const permit = authorize("delete", id)
    thread(id)
    permit.assertCurrent()
    $addUpdateTag("yopem-review-action")

    for (const mark of $nodesOfType(MarkNode)) {
      if (!mark.hasID(id)) continue
      mark.deleteID(id)

      if (!mark.getIDs().length) $unwrapMarkNode(mark)
    }

    setData({
      ...data(),
      threads: data().threads.filter((item) => item.id !== id),
    })
  }

  function $suggestInsert<Input>(input: Input) {
    const suggestion = newSuggestion("insert")

    const parsed = insertionTextSchema.safeParse(input)

    if (!parsed.success) return fail("Insertion requires bounded inline text.")
    const text = parsed.data
    const range = selection(false)

    if (
      $getRoot().getAllTextNodes().length > 10000 ||
      $getRoot().getTextContentSize() + text.length > 1048576
    )
      return fail("Review document exceeds growth limits.")

    if (!range.isCollapsed())
      return fail("Insert suggestions require a collapsed caret.")

    const anchor = range.anchor.getNode()

    const existing = $isTextNode(anchor)
      ? $getState(anchor, editorSuggestionState)
      : null

    if (existing && $isTextNode(anchor)) {
      if (
        existing.kind === "insert" &&
        existing.author.id === suggestion.author.id
      ) {
        const permit = authorize("suggest", existing.id)
        permit.assertCurrent()
        $addUpdateTag("yopem-review-action")

        if (
          anchor.getFormat() === range.format &&
          anchor.getStyle() === range.style
        )
          anchor.spliceText(range.anchor.offset, 0, text, true)
        else {
          const node = $createTextNode(text)
            .setFormat(range.format)
            .setStyle(range.style)

          $setEditorSuggestion(node, existing)
          range.insertNodes([node])
          node.selectEnd()
        }

        return existing.id
      }

      if (
        range.anchor.offset !== 0 &&
        range.anchor.offset !== anchor.getTextContentSize()
      )
        return fail("Resolve the current suggestion before editing it.")
    }

    const node = $createTextNode(text)
    node.setFormat(range.format)
    node.setStyle(range.style)
    $setEditorSuggestion(node, suggestion)
    $addUpdateTag("yopem-review-action")
    range.insertNodes([node])
    node.selectEnd()

    return suggestion.id
  }

  function $suggestDelete() {
    const suggestion = newSuggestion("delete")
    const selected = selection()
    const nodes = selected.getNodes()
    const first = nodes[0]

    const inserted = $isTextNode(first)
      ? $getState(first, editorSuggestionState)
      : null

    if (
      inserted?.kind === "insert" &&
      inserted.author.id === suggestion.author.id &&
      nodes.every((node) => {
        if (!$isTextNode(node) || !node.isSimpleText()) return false
        const value = $getState(node, editorSuggestionState)

        return (
          node.getParent() === first?.getParent() &&
          value?.kind === "insert" &&
          value.id === inserted.id &&
          value.author.id === suggestion.author.id
        )
      })
    ) {
      const permit = authorize("suggest", inserted.id)
      permit.assertCurrent()
      $addUpdateTag("yopem-review-action")
      selected.removeText()

      return inserted.id
    }

    const range = selectedText()

    const adjacent = [
      nodes[0]?.getPreviousSibling(),
      nodes.at(-1)?.getNextSibling(),
    ]
      .flatMap((node) =>
        $isTextNode(node) ? [$getState(node, editorSuggestionState)] : [],
      )
      .find(
        (value) =>
          value?.kind === "delete" && value.author.id === suggestion.author.id,
      )

    const proposal = adjacent ?? suggestion

    if (adjacent) authorize("suggest", adjacent.id).assertCurrent()
    $addUpdateTag("yopem-review-action")

    for (const node of range.extract()) {
      if ($isTextNode(node)) $setEditorSuggestion(node, proposal)
    }

    range.anchor.set(range.focus.key, range.focus.offset, range.focus.type)

    return proposal.id
  }

  function $suggestDocumentText(target: string) {
    $assertEditor()
    const permit = authorize("suggest")

    try {
      $applyEditorReviewTextDiff(target, newSuggestion, permit.assertCurrent)
    } catch (error) {
      if (error instanceof EditorReviewTextDiffError) return fail(error.message)
      throw error
    }

    saved = null
  }

  function formatFromCommand(format: TextFormatType) {
    if (!reviewFormatSchema.safeParse(format).success)
      return fail("Unsupported review text format.")
    const range = selection(false)

    if (!range.isCollapsed()) {
      $suggestFormat(format)

      return
    }

    const permit = authorize("suggest")
    permit.assertCurrent()
    range.formatText(format)
  }

  function $suggestFormat<Input>(input: Input) {
    const parsed = reviewFormatSchema.safeParse(input)

    if (!parsed.success) return fail("Unsupported review text format.")
    const format = parsed.data
    const suggestion = newSuggestion("format")
    const range = selectedText()
    $addUpdateTag("yopem-review-action")
    const nodes = range.extract().filter($isTextNode)

    for (const node of nodes) {
      $setEditorSuggestion(node, {
        ...suggestion,
        beforeFormat: node.getFormat(),
      })
      node.toggleFormat(format)
    }

    return suggestion.id
  }

  function decisions(ids: string[], action: "accept" | "reject") {
    if (!reviewDecisionSchema.safeParse(action).success)
      return fail("Review decision must accept or reject.")
    $assertEditor()
    const nodes = $getRoot().getAllTextNodes()

    const requested = new Set(ids)
    const found = new Set<string>()

    const targets = nodes.filter((node) => {
      const value = $getState(node, editorSuggestionState)

      if (!value || !requested.has(value.id)) return false
      found.add(value.id)

      return true
    })

    if (ids.some((id) => !found.has(id)))
      return fail("Suggestion no longer exists.")
    const permits = ids.map((id) => authorize(action, id))

    for (const permit of permits) permit.assertCurrent()
    $addUpdateTag("yopem-review-action")

    for (const node of targets) {
      const value = $getState(node, editorSuggestionState)!

      if (
        (value.kind === "insert" && action === "reject") ||
        (value.kind === "delete" && action === "accept")
      )
        node.remove()
      else {
        if (value.kind === "format" && action === "reject")
          node.setFormat(value.beforeFormat)
        $setEditorSuggestion(node, null)
      }
    }
  }

  function $decide(id: string, action: "accept" | "reject") {
    decisions([reviewIdSchema.parse(id)], action)
  }

  function $decideAll<Input>(input: Input) {
    $assertEditor()
    const parsed = reviewDecisionSchema.safeParse(input)

    if (!parsed.success) return fail("Review decision must accept or reject.")
    const action = parsed.data
    const ids = new Set<string>()

    for (const node of $getRoot().getAllTextNodes()) {
      const value = $getState(node, editorSuggestionState)

      if (value) ids.add(value.id)
    }

    decisions([...ids], action)
  }

  function capture() {
    const current = instance()
    current.getEditorState().read(() => {
      const range = $getSelection()
      saved = $isRangeSelection(range) ? { range: range.clone() } : null
      bookmark?.capture()
    })
  }

  function requestComment() {
    try {
      const permit = authorize("create")
      capture()

      if (!saved) {
        diagnostic = "Select text or a paragraph caret before commenting."
        publish()

        return false
      }

      permit.assertCurrent()
      diagnostic = ""
      commentRequest++
      publish()

      return true
    } catch {
      diagnostic = "Comment request denied or expired."
      publish()

      return false
    }
  }

  function restore() {
    $assertEditor()
    const active = $getSelection()

    if (
      !saved ||
      (active !== null && !active.is(saved.range)) ||
      ![saved.range.anchor, saved.range.focus].every($isValidBookmarkPoint)
    )
      return fail("Review selection expired.")

    if (!bookmark?.restore()) return fail("Review selection expired.")
    bookmark.clear()
    saved = null
  }

  function setHost(host: EditorReviewHost | null) {
    if (disposed) {
      if (host === null) return
      throw new Error("Review is not mounted.")
    }

    saved = null
    bookmark?.clear()

    try {
      session.replace(host)
    } finally {
      refreshDecorations?.()
      publish()
    }
  }

  function setSuggesting<Input>(input: Input) {
    const parsed = z.boolean().safeParse(input)

    if (!parsed.success) return fail("Suggestion mode requires a boolean.")
    const value = parsed.data
    instance()

    if (value) authorize("suggest")
    suggesting = value
    saved = null
    publish()
  }

  function available(action: EditorReviewAction, id?: string) {
    if (!editor) return false

    const discussion = [
      "reply",
      "edit",
      "delete",
      "resolve",
      "reopen",
    ].includes(action)

    if (
      !editor.isEditable() &&
      !(discussion && session.getHost()?.replyWhileReadonly)
    )
      return false

    try {
      session.authorize(action, id)

      return true
    } catch {
      return false
    }
  }

  function availableAllDecisions(action: "accept" | "reject") {
    if (!editor) return false
    const { suggestions } = getView()

    return (
      suggestions.length > 0 &&
      suggestions.every((suggestion) => available(action, suggestion.id))
    )
  }

  function availableDeleteComment(id: string, commentId: string) {
    if (!editor) return false
    const target = getView().data.threads.find((item) => item.id === id)

    return (
      target !== undefined &&
      target.comments.some((comment) => comment.id === commentId) &&
      available("delete", commentId) &&
      (target.comments.length !== 1 || available("delete", id))
    )
  }

  function getSnapshot() {
    return version
  }

  function subscribe(listener: () => void) {
    listeners.add(listener)

    return function unsubscribe() {
      listeners.delete(listener)
    }
  }

  function getView() {
    const current = instance()

    return current.getEditorState().read(
      () => {
        const suggestions = new Map<string, EditorReviewSuggestionSummary>()

        for (const node of $getRoot().getAllTextNodes()) {
          const value = $getState(node, editorSuggestionState)

          if (value) {
            const previous = suggestions.get(value.id)

            const kind =
              previous &&
              previous.kind !== value.kind &&
              previous.kind !== "format" &&
              value.kind !== "format"
                ? "replace"
                : (previous?.kind ?? value.kind)

            const field =
              value.kind === "insert"
                ? "insertedText"
                : value.kind === "delete"
                  ? "removedText"
                  : "formattedText"

            const snippet = (
              (previous?.[field] ?? "") + node.getTextContent().slice(0, 160)
            )
              .slice(0, 160)
              .replace(/[\uD800-\uDBFF]$/, "")

            suggestions.set(
              value.id,
              Object.freeze({
                ...(previous ?? value),
                kind,
                insertedText: previous?.insertedText ?? "",
                removedText: previous?.removedText ?? "",
                formattedText: previous?.formattedText ?? "",
                [field]: snippet,
              }),
            )
          }
        }

        const visible = session.getHost()?.visible === true

        const anchors = new Set(
          $nodesOfType(MarkNode)
            .filter((mark) => mark.getTextContentSize() > 0)
            .flatMap((mark) => mark.getIDs()),
        )

        return {
          text: $getRoot().getTextContent(),
          diffAvailable: $reviewTextDiffSource() !== null,
          commentRequest,
          detachedThreadIds: visible
            ? data()
                .threads.filter((item) => !anchors.has(item.id))
                .map((item) => item.id)
            : [],
          data: visible ? data() : emptyReview,
          suggestions: visible ? [...suggestions.values()] : [],
          suggesting,
          diagnostic,
        }
      },
      { editor: current },
    )
  }

  function goToText(findText: () => TextNode[]) {
    if (!session.getHost()?.visible) return false
    const current = instance()
    let key: string | null = null
    current.update(
      () => {
        if (!session.getHost()?.visible) return
        const texts = findText()
        const first = texts[0]
        const last = texts.at(-1)

        if (!first || !last) return
        const range = first.selectStart()
        range.focus.set(last.getKey(), last.getTextContentSize(), "text")
        key = first.getKey()
      },
      { discrete: true },
    )

    if (key && editor === current && session.getHost()?.visible) {
      current.focus()
      current.getElementByKey(key)?.scrollIntoView({ block: "nearest" })

      return true
    }

    return false
  }

  function goToThread(id: string) {
    return goToText(
      () =>
        $nodesOfType(MarkNode)
          .find((node) => node.hasID(id) && node.getTextContentSize() > 0)
          ?.getAllTextNodes() ?? [],
    )
  }

  function goToSuggestion(id: string) {
    return goToText(() => {
      const node = $getRoot()
        .getAllTextNodes()
        .find((text) => $getState(text, editorSuggestionState)?.id === id)

      return node ? [node] : []
    })
  }

  function handleError(error: Error) {
    if (!(error instanceof EditorReviewInputError)) return false
    diagnostic = error.message
    publish()

    return true
  }

  function run<Result>(action: () => Result) {
    diagnostic = ""

    try {
      instance().update(
        () => {
          try {
            const result = action()

            if (isReviewObject(result) && "then" in result) {
              void Promise.resolve(result).catch(() => undefined)
              fail("Review actions must be synchronous.")
            }
          } catch (error) {
            throw error instanceof EditorReviewInputError
              ? error
              : new EditorReviewInputError("Review action failed.")
          }
        },
        { tag: HISTORY_PUSH_TAG, discrete: true },
      )
    } catch (error) {
      diagnostic =
        error instanceof EditorReviewInputError
          ? error.message
          : "Review action failed."
      publish()
    }

    return diagnostic === ""
  }

  function register(current: LexicalEditor) {
    if (editor || disposed)
      throw new Error(
        "Create a new review controller for each mounted document.",
      )
    editor = current
    const selectionBookmark = createEditorSelectionBookmark(current)
    bookmark = selectionBookmark
    const unsubscribeBookmark = selectionBookmark.subscribe(publish)

    const decorations = registerReviewDecorations(
      current,
      () => session.getHost()?.visible === true,
      (node) => $getState(node, editorSuggestionState),
    )

    refreshDecorations = decorations.refresh

    function validateDocument() {
      let count = 0

      function serialize(
        node: LexicalNode,
        depth: number,
      ): ReviewSerializedNode {
        if (++count > 10000 || depth > 24)
          throw new EditorReviewInputError(
            "Review document exceeds its size limit.",
          )
        const value = node.exportJSON()

        if (value.$slots && Object.keys(value.$slots).length > 0)
          throw new EditorReviewInputError(
            "Review does not support named slot updates.",
          )

        if (!$isElementNode(node)) return value

        if (node.getChildrenSize() + count > 10000)
          throw new EditorReviewInputError(
            "Review document exceeds its node limit.",
          )

        return {
          ...value,
          children: node
            .getChildren()
            .map((child) => serialize(child, depth + 1)),
        }
      }

      try {
        const snapshot = { root: serialize($getRoot(), 0) }
        checkReviewComplexity(snapshot)
        const canonical = JSON.stringify(snapshot)
        parseReviewDocumentJSON(canonical, true)
      } catch (error) {
        throw error instanceof EditorReviewInputError
          ? error
          : new EditorReviewInputError(
              "Review document is invalid or too large.",
            )
      }
    }

    function hasPending() {
      return current.getEditorState().read(() =>
        $getRoot()
          .getAllTextNodes()
          .some((node) => $getState(node, editorSuggestionState)),
      )
    }

    function paste(event: ClipboardEvent | InputEvent | KeyboardEvent) {
      if (event.defaultPrevented) return true
      event.preventDefault()

      if (suggesting || hasPending()) {
        diagnostic =
          "Resolve suggestions and stop suggestion mode before pasting."
        publish()

        return true
      }

      if (!current.isEditable()) return true

      try {
        const transfer =
          "clipboardData" in event
            ? event.clipboardData
            : "dataTransfer" in event
              ? event.dataTransfer
              : null

        if (!transfer || transfer.files.length || transfer.types.length > 16)
          return fail("This clipboard content is not supported.")
        const native = transfer.getData("application/x-lexical-editor")

        if (native) sanitizeEditorReviewClipboard(native)
        else if (transfer.getData("text/html"))
          return fail("Rich clipboard content is not supported.")
        const text = transfer.getData("text/plain")

        if (
          !text ||
          text.length > 1048576 ||
          $getRoot().getTextContentSize() + text.length > 1048576
        )
          return fail("Clipboard text is empty or too large.")
        let budget = 10000 - text.split(/\r\n?|\n/).length * 2
        const nodes: LexicalNode[] = [$getRoot()]

        while (nodes.length) {
          const node = nodes.pop()!

          if (--budget < 0)
            return fail("Clipboard content exceeds the node limit.")

          if ($isElementNode(node)) {
            if (node.getChildrenSize() > budget)
              return fail("Clipboard content exceeds the node limit.")
            nodes.push(...node.getChildren())
          }
        }

        const range = $getSelection()

        if (!$isRangeSelection(range))
          return fail("Clipboard content requires a text selection.")
        $addUpdateTag(PASTE_TAG)
        $addUpdateTag(HISTORY_PUSH_TAG)
        range.insertRawText(text)
        diagnostic = ""
        publish()

        return true
      } catch (error) {
        throw error instanceof EditorReviewInputError
          ? error
          : new EditorReviewInputError("Clipboard content was not imported.")
      }
    }

    function cut(event: ClipboardEvent | KeyboardEvent | null) {
      if (!suggesting && !hasPending()) return false
      event?.preventDefault()
      diagnostic =
        "Resolve suggestions and stop suggestion mode before cutting."
      publish()

      return true
    }

    function command<T>(key: LexicalCommand<T>, handler: (payload: T) => void) {
      return current.registerCommand(
        key,
        (payload: T) => {
          if (!suggesting) {
            const pending = current.getEditorState().read(() =>
              $getRoot()
                .getAllTextNodes()
                .some((node) => $getState(node, editorSuggestionState)),
            )

            if (!pending) return false
            diagnostic = "Resolve pending suggestions before normal editing."
            publish()

            return true
          }

          try {
            handler(payload)
            diagnostic = ""
          } catch (error) {
            throw error instanceof EditorReviewInputError
              ? error
              : new EditorReviewInputError("Review edit rejected.")
          }

          return true
        },
        COMMAND_PRIORITY_CRITICAL,
      )
    }

    function history(action: "undo" | "redo") {
      try {
        authorize(action)
        diagnostic = ""
        saved = null
        publish()

        return false
      } catch {
        diagnostic = "Review history action denied."
        publish()

        return true
      }
    }

    function unsupported() {
      fail(
        "Structural, clipboard and composition review changes require explicit host handling.",
      )
    }

    let attachedRoot: HTMLElement | null = null

    function beforeInput(event: InputEvent) {
      if (event.defaultPrevented) return

      const pending = current.getEditorState().read(() =>
        $getRoot()
          .getAllTextNodes()
          .some((node) => $getState(node, editorSuggestionState)),
      )

      if (!suggesting && !pending) return
      event.preventDefault()
      event.stopImmediatePropagation()

      if (!suggesting) {
        diagnostic = "Resolve pending suggestions before normal editing."
        publish()

        return
      }

      if (
        event.inputType === "insertText" &&
        event.data &&
        !event.isComposing
      ) {
        current.dispatchCommand(CONTROLLED_TEXT_INSERTION_COMMAND, event.data)
      } else if (
        event.inputType === "deleteContentBackward" ||
        event.inputType === "deleteContentForward"
      ) {
        current.dispatchCommand(
          DELETE_CHARACTER_COMMAND,
          event.inputType === "deleteContentBackward",
        )
      } else {
        diagnostic =
          "This native input is not supported in suggestion mode. Original content is unchanged."
        publish()
      }
    }

    function detachRoot() {
      attachedRoot?.removeEventListener("beforeinput", beforeInput, true)
      attachedRoot = null
    }

    function remove(
      backward: boolean,
      granularity: "character" | "word" | "lineboundary",
    ) {
      const range = selection(false)

      if (range.isCollapsed())
        $moveCaretSelection(range, true, backward, granularity)
      $suggestDelete()
    }

    return mergeRegister(
      unsubscribeBookmark,
      current.registerCommand(
        KEY_DOWN_COMMAND,
        (event) => {
          if (
            !(event.ctrlKey || event.metaKey) ||
            !event.shiftKey ||
            event.altKey ||
            !/^m$/i.test(event.key)
          )
            return false
          event.preventDefault()
          requestComment()

          return true
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
      current.registerCommand(
        UNDO_COMMAND,
        () => history("undo"),
        COMMAND_PRIORITY_CRITICAL,
      ),
      current.registerCommand(
        REDO_COMMAND,
        () => history("redo"),
        COMMAND_PRIORITY_CRITICAL,
      ),
      current.registerRootListener((root) => {
        detachRoot()
        attachedRoot = root
        attachedRoot?.addEventListener("beforeinput", beforeInput, true)

        if (root) decorations.refresh()
      }),
      detachRoot,
      current.registerNodeTransform(RootNode, () => {
        if ($hasUpdateTag("yopem-review-action")) {
          validateDocument()

          return
        }

        if ($hasUpdateTag(HISTORIC_TAG)) return

        const pending = current.getEditorState().read(() =>
          $getRoot()
            .getAllTextNodes()
            .some((node) => $getState(node, editorSuggestionState)),
        )

        if (suggesting || pending)
          throw new EditorReviewInputError(
            "Untracked edits are blocked. Resolve pending suggestions or use review actions.",
          )
      }),
      command<string | InputEvent>(
        CONTROLLED_TEXT_INSERTION_COMMAND,
        (payload) => {
          if (payload instanceof Object) {
            if (payload.isComposing || payload.inputType !== "insertText")
              return unsupported()
            $suggestInsert(payload.data ?? "")
          } else {
            $suggestInsert(payload)
          }
        },
      ),
      command<boolean>(DELETE_CHARACTER_COMMAND, (backward) =>
        remove(backward, "character"),
      ),
      command<boolean>(DELETE_WORD_COMMAND, (backward) =>
        remove(backward, "word"),
      ),
      command<boolean>(DELETE_LINE_COMMAND, (backward) =>
        remove(backward, "lineboundary"),
      ),
      command(REMOVE_TEXT_COMMAND, $suggestDelete),
      command<TextFormatType>(FORMAT_TEXT_COMMAND, formatFromCommand),
      command(INSERT_PARAGRAPH_COMMAND, unsupported),
      command(INSERT_LINE_BREAK_COMMAND, unsupported),
      current.registerCommand(PASTE_COMMAND, paste, COMMAND_PRIORITY_LOW),
      current.registerCommand(CUT_COMMAND, cut, COMMAND_PRIORITY_LOW),
      current.registerUpdateListener(({ dirtyElements, dirtyLeaves }) => {
        if (dirtyElements.size || dirtyLeaves.size) saved = null
        publish()
      }),
      decorations.dispose,
      current.registerEditableListener(() => {
        saved = null
        suggesting = false
        publish()
      }),
      () => {
        saved = null
        suggesting = false
        editor = null
        disposed = true
        session.dispose()
        bookmark = null
        refreshDecorations = undefined
        publish()
      },
    )
  }

  return {
    register,
    setHost,
    setSuggesting,
    available,
    availableAllDecisions,
    availableDeleteComment,
    getSnapshot,
    subscribe,
    getView,
    goToThread,
    goToSuggestion,
    handleError,
    capture,
    requestComment,
    restore,
    run,
    $createThread,
    $reply,
    $editComment,
    $deleteComment,
    $deleteThread,
    $resolve,
    $suggestInsert,
    $suggestDelete,
    $suggestFormat,
    $suggestDocumentText,
    $decide,
    $decideAll,
  }
}

export function createEditorReview() {
  const bindings = new WeakMap<LexicalEditor, EditorReviewBinding>()

  function forEditor(current: LexicalEditor) {
    const binding = bindings.get(current)

    if (!binding) throw new Error("Review is not registered for this document.")

    return binding
  }

  function register(current: LexicalEditor) {
    if (bindings.has(current))
      throw new Error("Review is already registered for this document.")
    const binding = createReviewController()
    bindings.set(current, binding)
    const unregister = binding.register(current)

    return function disconnect() {
      unregister()

      if (bindings.get(current) === binding) bindings.delete(current)
    }
  }

  const extension = defineExtension({
    name: "@yopem-ui/editor/review",
    dependencies: [MarkExtension],
    init(config) {
      config.html = createEditorReviewHTMLConfig(config.html)
      const previousError = config.onError
      config.onError = function handleEditorError(error, current) {
        if (bindings.get(current)?.handleError(error)) return

        if (previousError) previousError(error, current)
        else throw error
      }
    },
    register,
  })

  return { extension, register, forEditor }
}

export type EditorReviewBinding = ReturnType<typeof createReviewController>

export type EditorReviewController = ReturnType<typeof createEditorReview>
