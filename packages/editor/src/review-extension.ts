import {
  $generateNodesFromSerializedNodes,
  $insertGeneratedNodes,
  ClipboardImportExtension,
  DEFAULT_IMPORT_MIME_TYPE,
  DEFAULT_IMPORT_MIME_TYPE_PRIORITY,
} from "@lexical/clipboard"
import { $getPeerDependency } from "@lexical/extension"
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
  $getNodeByKey,
  $getEditor,
  $getSelection,
  $getState,
  $setSelection,
  $setCompositionKey,
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
  COMMAND_PRIORITY_NORMAL,
  CONTROLLED_TEXT_INSERTION_COMMAND,
  COMPOSITION_START_COMMAND,
  COMPOSITION_END_COMMAND,
  COMPOSITION_START_TAG,
  COMPOSITION_END_TAG,
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
  type BaseSelection,
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

import { $guardEditorNativeJSON } from "./clipboard-guard"
import {
  $canResolveEditorReviewBreak,
  $getEditorReviewBreaks,
  $insertEditorReviewBreak,
  $resolveEditorReviewBreak,
} from "./review-break-native"
import {
  parseEditorReview,
  parseReviewDocument,
  parseReviewDocumentJSON,
  checkReviewComplexity,
  reviewIdSchema,
  reviewNativeFragmentSchema,
  reviewTextSchema,
  type EditorReviewBreakSuggestion,
  type EditorSuggestion,
  type EditorReviewData,
  type EditorReviewNativeFragment,
  type EditorReviewNativeOperation,
} from "./review-codecs"
import { registerReviewDecorations } from "./review-decorations"
import { EditorReviewTextDiffError } from "./review-diff"
import {
  $applyEditorReviewTextDiff,
  $reviewTextDiffSource,
} from "./review-diff-native"
import { parseEditorReviewNativeFragment } from "./review-fragment-native"
import { createEditorReviewHTMLConfig } from "./review-html"
import {
  createReviewSession,
  type EditorReviewHost,
  type EditorReviewAction,
} from "./review-model"
import { createEditorReviewNativeOperationSnapshots } from "./review-operation-native"
import {
  $setEditorReviewNativeOperation,
  $setEditorSuggestion,
  emptyReview,
  editorReviewBreakState,
  editorReviewNativeFragmentState,
  editorReviewNativeOperationState,
  editorReviewState,
  editorReviewStructuralState,
  editorSuggestionState,
} from "./review-state"
import {
  deriveEditorReviewStructuralAnchors,
  emptyEditorReviewStructural,
  parseEditorReviewStructural,
  type EditorReviewStructuralProposal,
} from "./review-structural"
import {
  canonicalEditorReviewTreeJSON,
  deriveEditorReviewTreeDiff,
  mergeEditorReviewTreeNodeState,
  parseEditorReviewTreeDocument,
  preserveEditorReviewTreeMarks,
} from "./review-tree-diff"
import {
  isReviewObject,
  parseReviewJSONValue,
  reviewStringSchema,
} from "./review-validation"
import {
  $isValidBookmarkPoint,
  createEditorSelectionBookmark,
} from "./selection-bookmark"

export {
  editorReviewState,
  editorReviewStructuralState,
  editorSuggestionState,
} from "./review-state"

export type { EditorSuggestion } from "./review-codecs"

class EditorReviewInputError extends Error {}

interface ReviewSerializedNode extends SerializedLexicalNode {
  text?: string
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
  readonly breakKind?: EditorReviewBreakSuggestion["kind"]
}

function hasNamedReviewSlots(node: ReviewSerializedNode) {
  if (node.$slots && Object.keys(node.$slots).length) return true

  return node.children?.some(hasNamedReviewSlots) ?? false
}

const nativeOperationBlockTypes = new Set(["paragraph", "list", "listitem"])

function $hasMarkedNativeOperationText(operation: EditorReviewNativeOperation) {
  const root = $getRoot()

  return root.getAllTextNodes().some((node) => {
    const suggestion = $getState(node, editorSuggestionState)

    if (
      node.getTextContentSize() === 0 ||
      !suggestion ||
      suggestion.id !== operation.id ||
      suggestion.kind !== operation.kind
    )
      return false

    let parent: LexicalNode | null = node.getParent()

    while (parent && parent !== root) {
      const marker = $getState(parent, editorReviewNativeOperationState)

      if (
        marker?.version === operation.version &&
        marker.id === operation.id &&
        marker.kind === operation.kind
      )
        return true

      parent = parent.getParent()
    }

    return false
  })
}

function $nativeOperationBlockIsOwned(
  node: LexicalNode,
  operation: EditorReviewNativeOperation,
  requireMarker: boolean,
) {
  if (!$isElementNode(node) || !nativeOperationBlockTypes.has(node.getType()))
    return false

  const pending: LexicalNode[] = [node]
  let hasText = false

  while (pending.length) {
    const current = pending.pop()

    if (!current) continue
    const marker = $getState(current, editorReviewNativeOperationState)

    if (
      current === node
        ? requireMarker
          ? JSON.stringify(marker) !== JSON.stringify(operation)
          : marker !== null
        : marker !== null
    )
      return false

    if ($getState(current, editorReviewBreakState)) return false

    if ($isTextNode(current)) {
      const suggestion = $getState(current, editorSuggestionState)

      if (
        !current.isSimpleText() ||
        current.getMode() !== "normal" ||
        !suggestion ||
        suggestion.id !== operation.id ||
        suggestion.kind !== operation.kind
      )
        return false

      hasText ||= current.getTextContentSize() > 0
      continue
    }

    if (current.getType() === "linebreak") {
      if (operation.kind !== "insert") return false

      continue
    }

    if (
      !$isElementNode(current) ||
      !nativeOperationBlockTypes.has(current.getType()) ||
      (operation.kind === "delete" && current.getChildrenSize() === 0)
    )
      return false

    pending.push(...current.getChildren())
  }

  return (
    hasText ||
    (operation.kind === "insert" && $hasMarkedNativeOperationText(operation))
  )
}

function $markNativeOperationBlocks(
  node: LexicalNode,
  operation: EditorReviewNativeOperation,
) {
  function visit(current: LexicalNode) {
    if (!$isElementNode(current)) return

    if ($nativeOperationBlockIsOwned(current, operation, false)) {
      $setEditorReviewNativeOperation(current, operation)

      return
    }

    for (const child of current.getChildren()) visit(child)
  }

  visit(node)
}

function $getNativeOperationTargets(
  root: LexicalNode,
  requested: ReadonlySet<string>,
) {
  const targets: {
    node: LexicalNode
    operation: EditorReviewNativeOperation
  }[] = []

  const pending: LexicalNode[] = [root]

  while (pending.length) {
    const node = pending.pop()

    if (!node) continue
    const operation = $getState(node, editorReviewNativeOperationState)

    if (operation && requested.has(operation.id))
      targets.push({ node, operation })

    if ($isElementNode(node)) pending.push(...node.getChildren())
  }

  return targets
}

function $serializeReviewRoot(textOverride?: { key: string; text: string }) {
  let count = 0

  function serialize(node: LexicalNode, depth: number): ReviewSerializedNode {
    if (++count > 10000 || depth > 24)
      throw new EditorReviewInputError(
        "Review document exceeds its size limit.",
      )
    const value = node.exportJSON()

    if (node.getKey() === textOverride?.key)
      return { ...value, text: textOverride.text }

    if (!$isElementNode(node)) return value

    if (node.getChildrenSize() + count > 10000)
      throw new EditorReviewInputError(
        "Review document exceeds its node limit.",
      )

    return {
      ...value,
      children: node.getChildren().map((child) => serialize(child, depth + 1)),
    }
  }

  return { root: serialize($getRoot(), 0) }
}

function $serializeReviewSubtree(node: LexicalNode) {
  let count = 0

  function serialize(
    current: LexicalNode,
    depth: number,
  ): ReviewSerializedNode {
    if (++count > 10000 || depth > 24)
      throw new EditorReviewInputError(
        "Review operation exceeds its size limit.",
      )

    const value = current.exportJSON()

    if (!$isElementNode(current)) return value

    if (current.getChildrenSize() + count > 10000)
      throw new EditorReviewInputError(
        "Review operation exceeds its node limit.",
      )

    return {
      ...value,
      children: current
        .getChildren()
        .map((child) => serialize(child, depth + 1)),
    }
  }

  return serialize(node, 0)
}

function $reviewNodePath(node: LexicalNode) {
  const path: string[] = []
  let current: LexicalNode | null = node

  while (current) {
    path.unshift(current.getKey())
    current = current.getParent()
  }

  return JSON.stringify(path)
}

function mergeReviewTreeRootState<AfterInput, CurrentInput>(
  afterInput: AfterInput,
  currentInput: CurrentInput,
  preserveReview: boolean,
) {
  const afterDocument = z.record(z.string(), z.json()).parse(afterInput)
  const currentDocument = z.record(z.string(), z.json()).parse(currentInput)
  const afterRoot = z.record(z.string(), z.json()).parse(afterDocument.root)
  const currentRoot = z.record(z.string(), z.json()).parse(currentDocument.root)
  const currentState = z.record(z.string(), z.json()).parse(currentRoot.$ ?? {})
  const state = { ...currentState }

  delete state.yopemReviewStructural
  delete state.yopemReviewNativeFragment
  delete state.yopemSuggestion

  if (!preserveReview) delete state.yopemReview

  const root = { ...afterRoot }

  if (Object.keys(state).length) root.$ = state
  else delete root.$

  return preserveReview ? { root } : parseEditorReviewTreeDocument({ root })
}

function hasCustomClipboardImportPipeline() {
  const dependency = $getPeerDependency<typeof ClipboardImportExtension>(
    ClipboardImportExtension.name,
  )

  if (!dependency) return false

  const mimes = new Set([
    ...Object.keys(DEFAULT_IMPORT_MIME_TYPE),
    ...Object.keys(dependency.config.$importMimeType),
  ])

  for (const mime of mimes) {
    const handlers = dependency.config.$importMimeType[mime] ?? []
    const defaults = DEFAULT_IMPORT_MIME_TYPE[mime] ?? []

    const hasGuard =
      mime === "application/x-lexical-editor" &&
      handlers.length === defaults.length + 1 &&
      handlers.at(-1) === $guardEditorNativeJSON

    if (
      handlers.length !== defaults.length + (hasGuard ? 1 : 0) ||
      defaults.some((handler, index) => handlers[index] !== handler)
    )
      return true
  }

  for (const mime of new Set([
    ...Object.keys(DEFAULT_IMPORT_MIME_TYPE_PRIORITY),
    ...Object.keys(dependency.config.priority),
  ]))
    if (
      dependency.config.priority[mime] !==
      DEFAULT_IMPORT_MIME_TYPE_PRIORITY[mime]
    )
      return true

  return false
}

function parseReviewSnapshot<Input>(
  input: Input,
  trusted: boolean,
  allowStructuralTreeDepth = false,
) {
  checkReviewComplexity(input, 64)
  const serialized = JSON.stringify(input)

  if (serialized === undefined)
    throw new EditorReviewInputError("Review document is not serializable.")

  return parseReviewDocumentJSON(serialized, trusted, allowStructuralTreeDepth)
}

function $currentReviewTreeJSON() {
  try {
    return canonicalEditorReviewTreeJSON(
      parseReviewSnapshot($serializeReviewRoot(), false),
    )
  } catch {
    return null
  }
}

function withoutNativeFragmentState<Input>(input: Input) {
  const serialized = JSON.stringify(input)

  if (serialized === undefined)
    throw new EditorReviewInputError("Review document is not serializable.")

  const document = z
    .record(z.string(), z.json())
    .parse(parseReviewJSONValue(serialized))

  const root = z.record(z.string(), z.json()).parse(document.root)
  const state = z.record(z.string(), z.json()).parse(root.$ ?? {})

  delete state.yopemReviewNativeFragment

  if (Object.keys(state).length) root.$ = state
  else delete root.$

  return JSON.stringify({ root })
}

function normalizedNativeFragmentSnapshot<Input>(
  current: LexicalEditor,
  input: Input,
) {
  const parsed = current.parseEditorState(withoutNativeFragmentState(input))

  return withoutNativeFragmentState(parsed.toJSON())
}

interface NativeInsertNodeKey {
  getKey(): string
}

function isNativeInsertNodeKey(value: unknown): value is NativeInsertNodeKey {
  return (
    isReviewObject(value) &&
    "getKey" in value &&
    z.function().safeParse(value.getKey).success
  )
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
  let decidingStructural = false
  let nativeInsertInProgress = false

  let composition: {
    key: string
    text: string
    draft: string
    expected: string | null
    input: InputEvent | null
    range: RangeSelection
    caret: RangeSelection
    source: string
    ending: CompositionEvent | null
    assertCurrent: () => void
  } | null = null

  let nativeInsertMarker: {
    editor: LexicalEditor
    id: string
    after: string
    assertCurrent: () => void
  } | null = null

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

    const nativeFragment = hasActiveLexicalContext()
      ? $getState($getRoot(), editorReviewNativeFragmentState)
      : current
          .getEditorState()
          .read(() => $getState($getRoot(), editorReviewNativeFragmentState))

    if (
      nativeFragment &&
      !(
        (action === "accept" || action === "reject") &&
        id === nativeFragment.id
      ) &&
      action !== "undo" &&
      action !== "redo"
    )
      return fail("Resolve the native fragment before other review actions.")

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

  function $hasReviewSuggestions() {
    return (
      $getState($getRoot(), editorReviewNativeFragmentState) !== null ||
      $getRoot()
        .getAllTextNodes()
        .some((node) => $getState(node, editorSuggestionState)) ||
      $getEditorReviewBreaks().length > 0
    )
  }

  function nativeFragmentIsCurrent(fragment: EditorReviewNativeFragment) {
    try {
      const active = $getState($getRoot(), editorReviewNativeFragmentState)

      return (
        active !== null &&
        JSON.stringify(active) === JSON.stringify(fragment) &&
        normalizedNativeFragmentSnapshot(instance(), $serializeReviewRoot()) ===
          normalizedNativeFragmentSnapshot(
            instance(),
            parseReviewJSONValue(fragment.after),
          )
      )
    } catch {
      return false
    }
  }

  function nativeFragmentBeforeNodes(fragment: EditorReviewNativeFragment) {
    try {
      const parsed = instance().parseEditorState(fragment.before).toJSON()

      return $generateNodesFromSerializedNodes(parsed.root.children)
    } catch {
      return fail("Native fragment rollback cannot be validated.")
    }
  }

  function $restoreNativeFragmentBefore(children: LexicalNode[]) {
    const root = $getRoot()

    $setState(root, editorReviewNativeFragmentState, null)
    root.clear().append(...children)
    root.selectEnd()
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
    if ($getState($getRoot(), editorReviewStructuralState).proposals.length)
      return fail("Resolve structural proposals before suggesting text.")
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

    const savedRange = range.clone()
    const source = JSON.stringify($serializeReviewRoot())
    const suggestingBeforeAuthorization = suggesting
    const currentEditor = instance()

    function assertTarget() {
      if (
        editor !== currentEditor ||
        !currentEditor.isEditable() ||
        suggesting !== suggestingBeforeAuthorization ||
        !$getSelection()?.is(savedRange) ||
        source !== JSON.stringify($serializeReviewRoot())
      )
        return fail(
          "Completed review insertion target changed during authorization.",
        )
    }

    const suggestion = newSuggestion("insert")
    assertTarget()
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
        assertTarget()
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

  function $suggestNativeInsertNodes(insert: () => readonly LexicalNode[]) {
    $assertEditor()
    const current = instance()

    if (
      nativeInsertInProgress ||
      nativeInsertMarker ||
      !current.isEditable() ||
      !suggesting ||
      $getState($getRoot(), editorReviewStructuralState).proposals.length ||
      $hasReviewSuggestions()
    )
      return fail(
        "Native insertion requires suggestion mode with no pending review state.",
      )

    nativeInsertInProgress = true

    try {
      const beforeRoot = $serializeReviewRoot()
      const before = normalizedNativeFragmentSnapshot(current, beforeRoot)

      if (
        hasNamedReviewSlots(beforeRoot.root) ||
        new TextEncoder().encode(before).byteLength > 131072
      )
        return fail(
          "Native review snapshots exceed the supported document scope.",
        )

      parseReviewDocumentJSON(before, true, true)
      const selectionBefore = $getSelection()

      if (!selectionBefore)
        return fail("Native insertion requires an active selection.")

      const savedSelection: BaseSelection = selectionBefore.clone()
      const permit = authorize("suggest")

      permit.assertCurrent()

      if (
        editor !== current ||
        $getEditor() !== current ||
        !current.isEditable() ||
        !suggesting ||
        normalizedNativeFragmentSnapshot(current, $serializeReviewRoot()) !==
          before ||
        !savedSelection.is($getSelection())
      )
        return fail("Native insertion target changed during authorization.")

      const root = $getRoot()
      const existingKeys = new Set<string>()
      const pendingNodes: LexicalNode[] = [root]

      while (pendingNodes.length) {
        const node = pendingNodes.pop()

        if (!node) continue
        existingKeys.add(node.getKey())

        if ($isElementNode(node)) pendingNodes.push(...node.getChildren())
      }

      let output: unknown

      try {
        output = insert()
      } catch {
        return fail("Native insertion callback failed.")
      }

      if (isReviewObject(output) && "then" in output) {
        void Promise.resolve(output).catch(() => undefined)

        return fail("Native insertion callbacks must be synchronous.")
      }

      if (!Array.isArray(output) || !output.length)
        return fail("Native insertion must return its inserted nodes.")

      const returnedNodes: unknown[] = output
      const returnedKeys: string[] = []
      const insertedKeys = new Set<string>()

      for (const value of returnedNodes) {
        if (!isNativeInsertNodeKey(value))
          return fail("Native insertion returned an invalid node.")

        const key = reviewStringSchema.parse(value.getKey())

        if (existingKeys.has(key) || insertedKeys.has(key))
          return fail("Native insertion must return new, unique nodes.")
        insertedKeys.add(key)
        returnedKeys.push(key)
      }

      const attachedNodes = new Map<
        string,
        { node: LexicalNode; path: number[] }
      >()

      const pendingPaths: {
        node: LexicalNode
        path: number[]
        marked: boolean
      }[] = [{ node: root, path: [], marked: false }]

      while (pendingPaths.length) {
        const currentNode = pendingPaths.pop()

        if (!currentNode) continue
        const { node, path, marked } = currentNode
        const key = node.getKey()

        if (insertedKeys.has(key)) {
          if (!path.length)
            return fail("Native insertion returned the document root.")

          if (marked || node instanceof MarkNode)
            return fail("Native insertion cannot change comment anchors.")
          attachedNodes.set(key, { node, path })
        }

        if ($isElementNode(node)) {
          const children = node.getChildren()

          for (let index = children.length - 1; index >= 0; index--) {
            const child = children[index]

            if (child)
              pendingPaths.push({
                node: child,
                path: [...path, index],
                marked: marked || node instanceof MarkNode,
              })
          }
        }
      }

      if (attachedNodes.size !== returnedKeys.length)
        return fail("Native insertion returned a detached node.")

      const insertedNodes: LexicalNode[] = []
      const insertedPaths: number[][] = []

      for (const key of returnedKeys) {
        const inserted = attachedNodes.get(key)

        if (!inserted) return fail("Native insertion returned a detached node.")

        insertedNodes.push(inserted.node)
        insertedPaths.push(inserted.path)
      }

      const insertedText = insertedNodes.flatMap((node) =>
        $isTextNode(node)
          ? [node]
          : $isElementNode(node)
            ? node.getAllTextNodes()
            : [],
      )

      if (
        !insertedText.length ||
        insertedText.some(
          (node) => !node.isSimpleText() || node.getMode() !== "normal",
        ) ||
        !insertedText.some((node) => node.getTextContentSize() > 0)
      )
        return fail("Native insertion requires normal text descendants.")

      if (savedSelection.is($getSelection()))
        return fail("Native insertion must use the native selection operation.")

      const afterRoot = $serializeReviewRoot()

      if (
        JSON.stringify({ ...beforeRoot.root, children: undefined }) !==
        JSON.stringify({ ...afterRoot.root, children: undefined })
      )
        return fail("Native insertion cannot change root review state.")

      const snapshots = createEditorReviewNativeOperationSnapshots(
        current,
        beforeRoot,
        afterRoot,
        insertedPaths,
      )

      if (!snapshots)
        return fail("Native insertion must add the returned nodes.")

      permit.assertCurrent()

      if (editor !== current || !current.isEditable() || !suggesting)
        return fail("Native insertion authorization expired.")

      const suggestion: EditorSuggestion = {
        id: reviewIdSchema.parse(crypto.randomUUID()),
        author: permit.author,
        createdAt: Date.now(),
        kind: "insert",
        beforeFormat: 0,
      }

      for (const node of insertedText) $setEditorSuggestion(node, suggestion)

      const insertedTextContent = insertedText
        .map((node) => node.getTextContent())
        .join("")

      const attributedText = root
        .getAllTextNodes()
        .filter(
          (node) =>
            $getState(node, editorSuggestionState)?.id === suggestion.id,
        )

      if (
        attributedText.length !== insertedText.length ||
        attributedText.map((node) => node.getTextContent()).join("") !==
          insertedTextContent
      )
        return fail("Native insertion changed the returned nodes.")

      const attributedRoot = $serializeReviewRoot()
      const after = normalizedNativeFragmentSnapshot(current, attributedRoot)

      if (new TextEncoder().encode(after).byteLength > 131072)
        return fail(
          "Native review snapshots exceed the supported document scope.",
        )
      checkReviewComplexity(attributedRoot, 24)
      parseReviewSnapshot(attributedRoot, true, true)

      if (root.getTextContentSize() > 1048576)
        return fail("Review document exceeds growth limits.")

      const fragment = reviewNativeFragmentSchema.parse({
        version: 1,
        id: suggestion.id,
        author: suggestion.author,
        createdAt: suggestion.createdAt,
        before: snapshots.before,
        after,
      })

      $setState(root, editorReviewNativeFragmentState, fragment)
      nativeInsertMarker = {
        editor: current,
        id: suggestion.id,
        after,
        assertCurrent: permit.assertCurrent,
      }
      diagnostic = ""

      return suggestion.id
    } catch (error) {
      if (error instanceof EditorReviewInputError) throw error

      return fail("Native insertion could not be validated.")
    } finally {
      nativeInsertInProgress = false
    }
  }

  function $suggestDocumentTree<Input>(input: Input) {
    $assertEditor()
    const permit = authorize("suggest")
    const current = instance()

    if (
      suggesting ||
      $getState($getRoot(), editorReviewStructuralState).proposals.length ||
      $hasReviewSuggestions()
    )
      return fail("Stop suggestion mode and resolve current suggestions first.")
    const rawBefore = $serializeReviewRoot()

    const before = parseEditorReviewTreeDocument(
      parseReviewSnapshot(rawBefore, false, true),
    )

    const target = parseEditorReviewTreeDocument(
      parseReviewSnapshot(input, false, true),
    )

    const mergedRootState = mergeReviewTreeRootState(target, before, false)
    const mergedTarget = mergeEditorReviewTreeNodeState(before, mergedRootState)

    const parsedTarget = current.parseEditorState(
      canonicalEditorReviewTreeJSON(mergedTarget),
    )

    const after = parseEditorReviewTreeDocument(
      parseReviewSnapshot(parsedTarget.toJSON(), false, true),
    )

    const precondition = canonicalEditorReviewTreeJSON(before)
    const changes = deriveEditorReviewTreeDiff(before, after)

    if (!changes.length) return fail("Structural proposal has no changes.")
    permit.assertCurrent()

    const proposal = parseEditorReviewStructural({
      version: 1,
      proposals: [
        {
          id: crypto.randomUUID(),
          author: permit.author,
          createdAt: Date.now(),
          before,
          after,
          precondition,
          changes,
          anchors: deriveEditorReviewStructuralAnchors(changes),
        },
      ],
    }).proposals[0]

    if (!proposal) return fail("Structural proposal is invalid.")
    $addUpdateTag(HISTORY_PUSH_TAG)
    $addUpdateTag("yopem-review-action")
    $addUpdateTag("yopem-review-structural-action")
    $setState($getRoot(), editorReviewStructuralState, {
      version: 1,
      proposals: [proposal],
    })
    saved = null

    return proposal.id
  }

  function $suggestCompletedText<Input>(input: Input) {
    const parsed = insertionTextSchema.safeParse(input)

    if (!parsed.success)
      return fail("Completed review text must be bounded inline text.")
    const selected = selection(false)
    $addUpdateTag(HISTORY_PUSH_TAG)

    if (selected.isCollapsed()) return $suggestInsert(parsed.data)

    const range = selectedText()
    const removed = range.getTextContent()

    if (
      removed.length > 16384 ||
      $getRoot().getTextContentSize() - removed.length + parsed.data.length >
        1048576
    )
      return fail("Completed review replacement exceeds document limits.")

    const nodes = range.getNodes()
    const root = $getRoot()

    if (
      !nodes.length ||
      nodes.some((node) => {
        let current: LexicalNode | null = node

        while (current && current !== root) {
          if (
            current instanceof MarkNode ||
            $getState(current, editorReviewNativeOperationState) ||
            $getState(current, editorReviewBreakState)
          )
            return true

          current = current.getParent()
        }

        return false
      })
    )
      return fail(
        "Completed review replacement cannot change comments or review structure.",
      )

    const savedRange = range.clone()
    const source = JSON.stringify($serializeReviewRoot())
    const suggestingBeforeAuthorization = suggesting
    const currentEditor = instance()
    const suggestion = newSuggestion("insert")
    const activeRange = selection()

    if (
      editor !== currentEditor ||
      !currentEditor.isEditable() ||
      suggesting !== suggestingBeforeAuthorization ||
      !activeRange.is(savedRange) ||
      activeRange.getTextContent() !== removed ||
      source !== JSON.stringify($serializeReviewRoot())
    )
      return fail(
        "Completed review replacement target changed during authorization.",
      )

    const removedNodes = range.extract().filter($isTextNode)

    if (!removedNodes.length)
      return fail("Completed review replacement has no valid target.")

    const deletion: EditorSuggestion = { ...suggestion, kind: "delete" }
    $addUpdateTag("yopem-review-action")

    for (const node of removedNodes) {
      $setEditorSuggestion(node, {
        ...deletion,
        beforeFormat: node.getFormat(),
      })
    }

    range.anchor.set(range.focus.key, range.focus.offset, range.focus.type)
    const caret = $getSelection()

    if (!$isRangeSelection(caret) || !caret.isCollapsed())
      return fail("Completed review replacement lost its insertion point.")

    const inserted = $createTextNode(parsed.data)
      .setFormat(caret.format)
      .setStyle(caret.style)

    $setEditorSuggestion(inserted, { ...suggestion, beforeFormat: 0 })
    caret.insertNodes([inserted])

    return suggestion.id
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
    const root = $getRoot()
    const nodes = root.getAllTextNodes()
    const requested = new Set(ids)
    const found = new Set<string>()
    const fragment = $getState(root, editorReviewNativeFragmentState)

    const fragmentTarget =
      fragment && requested.has(fragment.id) ? fragment : null

    const targets = nodes.filter((node) => {
      const value = $getState(node, editorSuggestionState)

      if (!value || !requested.has(value.id)) return false
      found.add(value.id)

      return true
    })

    const operationTargets = $getNativeOperationTargets(root, requested)

    for (const { operation } of operationTargets) found.add(operation.id)

    const breakTargets = $getEditorReviewBreaks().filter((target) => {
      if (!requested.has(target.suggestion.id)) return false
      found.add(target.suggestion.id)

      return true
    })

    if (fragmentTarget) found.add(fragmentTarget.id)

    if (ids.some((id) => !found.has(id)))
      return fail("Suggestion no longer exists.")

    if (
      operationTargets.some(
        ({ node, operation }) =>
          !$nativeOperationBlockIsOwned(node, operation, true),
      )
    )
      return fail(
        "Native review operation changed and cannot be resolved safely.",
      )

    if (breakTargets.some((target) => !$canResolveEditorReviewBreak(target)))
      return fail("Review break target is no longer valid.")

    if (fragmentTarget && !nativeFragmentIsCurrent(fragmentTarget))
      return fail(
        "Native review fragment changed and cannot be resolved safely.",
      )

    const restored =
      fragmentTarget && action === "reject"
        ? nativeFragmentBeforeNodes(fragmentTarget)
        : null

    const textSnapshots = targets.map((node) => ({
      node,
      key: node.getKey(),
      serialized: JSON.stringify(node.exportJSON()),
      path: $reviewNodePath(node),
    }))

    const operationSnapshots = operationTargets.map((target) => ({
      ...target,
      operationJSON: JSON.stringify(target.operation),
      subtree: JSON.stringify($serializeReviewSubtree(target.node)),
      path: $reviewNodePath(target.node),
    }))

    const permits = ids.map((id) => authorize(action, id))

    for (const permit of permits) permit.assertCurrent()

    if (fragmentTarget && !nativeFragmentIsCurrent(fragmentTarget))
      return fail("Native review fragment changed during authorization.")

    const activeBreaks = $getEditorReviewBreaks()

    if (
      breakTargets.some((target) => {
        const active = activeBreaks.find(
          (item) => item.suggestion.id === target.suggestion.id,
        )

        return (
          !active ||
          active.node !== target.node ||
          JSON.stringify(active.suggestion) !==
            JSON.stringify(target.suggestion) ||
          !$canResolveEditorReviewBreak(active)
        )
      })
    )
      return fail("Review break target changed during authorization.")

    const activeTexts = root.getAllTextNodes().filter((node) => {
      const value = $getState(node, editorSuggestionState)

      return value !== null && requested.has(value.id)
    })

    const activeTextByKey = new Map(
      activeTexts.map((node) => [node.getKey(), node]),
    )

    const activeOperations = $getNativeOperationTargets(root, requested)

    const activeOperationByKey = new Map(
      activeOperations.map((target) => [target.node.getKey(), target]),
    )

    if (
      activeTexts.length !== textSnapshots.length ||
      textSnapshots.some(({ node, key, serialized, path }) => {
        const active = activeTextByKey.get(key)

        return (
          !active ||
          active !== node ||
          JSON.stringify(active.exportJSON()) !== serialized ||
          $reviewNodePath(active) !== path
        )
      }) ||
      activeOperations.length !== operationSnapshots.length ||
      operationSnapshots.some(
        ({ node, operation, operationJSON, subtree, path }) => {
          const active = activeOperationByKey.get(node.getKey())

          return (
            !active ||
            active.node !== node ||
            JSON.stringify(active.operation) !== operationJSON ||
            JSON.stringify($serializeReviewSubtree(active.node)) !== subtree ||
            $reviewNodePath(active.node) !== path ||
            !$nativeOperationBlockIsOwned(active.node, operation, true)
          )
        },
      )
    )
      return fail("Review targets changed during authorization.")

    const removedOperationBlocks = operationTargets.filter(
      ({ operation }) =>
        (operation.kind === "insert" && action === "reject") ||
        (operation.kind === "delete" && action === "accept"),
    )

    if (
      $getEditorReviewBreaks().some((target) => {
        if (target.suggestion.kind !== "paragraph") return false
        const next = target.node.getNextSibling()

        return removedOperationBlocks.some(
          ({ node }) => node === target.node || node === next,
        )
      })
    )
      return fail("Native operation would invalidate a review break target.")

    const textInsideRemovedBlocks = new Set(
      targets.filter((node) =>
        removedOperationBlocks.some(({ node: block }) => {
          let current: LexicalNode | null = node

          while (current) {
            if (current === block) return true
            current = current.getParent()
          }

          return false
        }),
      ),
    )

    $addUpdateTag(HISTORY_PUSH_TAG)
    $addUpdateTag("yopem-review-action")

    for (const { node } of removedOperationBlocks) node.remove()

    for (const node of targets) {
      if (textInsideRemovedBlocks.has(node)) continue
      const value = $getState(node, editorSuggestionState)!

      if (fragmentTarget?.id === value.id && action === "reject") continue

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

    for (const { node } of operationTargets) {
      if (removedOperationBlocks.some((target) => target.node === node))
        continue
      $setEditorReviewNativeOperation(node, null)
    }

    for (const target of breakTargets) {
      if (fragmentTarget?.id === target.suggestion.id) continue

      if (!$resolveEditorReviewBreak(target, action))
        return fail("Review break target changed before decision.")
    }

    if (fragmentTarget) {
      if (action === "reject") {
        if (!restored) return fail("Native fragment rollback is unavailable.")
        $restoreNativeFragmentBefore(restored)
      } else {
        $setState(root, editorReviewNativeFragmentState, null)
      }
    }
  }

  function $suggestBreak(
    requestedKind: EditorReviewBreakSuggestion["kind"],
    selectStart = false,
  ) {
    if (editor?.isComposing())
      return fail(
        "This native input is not supported in suggestion mode. Original content is unchanged.",
      )

    const range = selection(false)
    let removed: TextNode[] = []

    if (!range.isCollapsed()) {
      const selected = selectedText().getNodes()
      removed = selected.filter($isTextNode)

      if (
        removed.length !== selected.length ||
        !removed.length ||
        removed.some(
          (node) =>
            node.getTopLevelElement() !==
            range.anchor.getNode().getTopLevelElement(),
        )
      )
        return fail("Break suggestions require text within one block.")
    }

    const block = range.anchor.getNode().getTopLevelElement()

    if (!$isElementNode(block))
      return fail("Break suggestions require a text block.")

    const kind: EditorReviewBreakSuggestion["kind"] =
      requestedKind === "paragraph" &&
      block.getType() === "paragraph" &&
      block.getParent() === $getRoot()
        ? "paragraph"
        : "linebreak"

    if (kind === "paragraph" && $getState(block, editorReviewBreakState))
      return fail("Resolve this paragraph break before adding another.")

    const source = JSON.stringify($serializeReviewRoot())
    const savedRange = range.clone()
    const suggestion = newSuggestion("insert")
    const activeRange = $getSelection()

    if (
      source !== JSON.stringify($serializeReviewRoot()) ||
      !$isRangeSelection(activeRange) ||
      !activeRange.is(savedRange)
    )
      return fail("Break suggestion target changed during authorization.")

    const breakSuggestion: EditorReviewBreakSuggestion = {
      id: suggestion.id,
      author: suggestion.author,
      createdAt: suggestion.createdAt,
      kind,
    }

    $addUpdateTag(HISTORY_PUSH_TAG)
    $addUpdateTag("yopem-review-action")

    if (removed.length) {
      const extracted = range.extract().filter($isTextNode)

      if (!extracted.length || extracted.length !== removed.length)
        return fail("Break suggestion could not retain selected text.")

      for (const node of extracted) {
        $setEditorSuggestion(node, {
          ...suggestion,
          kind: "delete",
          beforeFormat: node.getFormat(),
        })
      }

      extracted.at(-1)!.selectEnd()
    }

    if (
      !$insertEditorReviewBreak(selection(false), breakSuggestion, selectStart)
    )
      return fail("This native break cannot be tracked safely.")

    saved = null

    return suggestion.id
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

    for (const target of $getEditorReviewBreaks()) ids.add(target.suggestion.id)

    const nativeFragment = $getState(
      $getRoot(),
      editorReviewNativeFragmentState,
    )

    if (nativeFragment) ids.add(nativeFragment.id)

    decisions([...ids], action)
  }

  function structuralProposal(current: LexicalEditor, id: string) {
    return current
      .getEditorState()
      .read(() =>
        $getState($getRoot(), editorReviewStructuralState).proposals.find(
          (proposal) => proposal.id === id,
        ),
      )
  }

  function hasActiveLexicalContext() {
    try {
      $getEditor()

      return true
    } catch {
      return false
    }
  }

  function structuralProposalIsCurrent(
    current: LexicalEditor,
    proposal: EditorReviewStructuralProposal,
  ) {
    return current.read("pending", () => {
      const root = $getRoot()

      const active = $getState(
        root,
        editorReviewStructuralState,
      ).proposals.find((item) => item.id === proposal.id)

      return (
        !root.isDirty() &&
        active === proposal &&
        $currentReviewTreeJSON() === proposal.precondition
      )
    })
  }

  function decideStructural(id: string, action: "accept" | "reject") {
    if (decidingStructural) return false
    decidingStructural = true
    diagnostic = ""

    try {
      if (hasActiveLexicalContext())
        return fail(
          "Structural decisions must run outside Lexical state contexts.",
        )
      const current = instance()
      const targetId = reviewIdSchema.parse(id)

      if (current.read("pending", () => $getRoot().isDirty()))
        return fail("Structural decisions require a committed editor state.")
      const proposal = structuralProposal(current, targetId)

      if (!proposal) return fail("Structural proposal no longer exists.")

      if (suggesting)
        return fail(
          "Stop suggestion mode before deciding structural proposals.",
        )

      if (!structuralProposalIsCurrent(current, proposal))
        return fail("Structural proposal is stale.")

      const before = current
        .getEditorState()
        .read(() => $currentReviewTreeJSON())

      if (before !== proposal.precondition)
        return fail("Structural proposal is stale.")
      const permit = authorize(action, targetId)

      if (!structuralProposalIsCurrent(current, proposal))
        return fail("Structural proposal changed during authorization.")

      if (action === "accept") {
        const source = parseReviewSnapshot(
          current.getEditorState().toJSON(),
          true,
          true,
        )

        const merged = mergeReviewTreeRootState(proposal.after, source, false)
        const targetWithMarks = preserveEditorReviewTreeMarks(source, merged)

        if (!targetWithMarks)
          return fail(
            "Structural review cannot preserve one or more comment anchors.",
          )

        const targetWithSourceState = mergeReviewTreeRootState(
          targetWithMarks,
          source,
          true,
        )

        const trustedTarget = parseReviewDocument(
          targetWithSourceState,
          true,
          true,
        )

        const cleanTarget = parseReviewDocument(
          targetWithSourceState,
          false,
          true,
        )

        parseEditorReviewTreeDocument(cleanTarget)
        const next = current.parseEditorState(JSON.stringify(trustedTarget))
        permit.assertCurrent()

        if (editor !== current || !current.isEditable())
          return fail("Structural review action is read-only or expired.")

        if (!structuralProposalIsCurrent(current, proposal))
          return fail("Structural proposal changed before commit.")
        current.setEditorState(next, { tag: HISTORY_PUSH_TAG })
      } else {
        permit.assertCurrent()
        let removed = false
        current.update(
          () => {
            const root = $getRoot()

            const active = $getState(
              root,
              editorReviewStructuralState,
            ).proposals.find((item) => item.id === targetId)

            if (
              root.isDirty() ||
              active !== proposal ||
              $currentReviewTreeJSON() !== proposal.precondition
            )
              return
            $addUpdateTag("yopem-review-action")
            $addUpdateTag("yopem-review-structural-action")
            $setState(
              root,
              editorReviewStructuralState,
              emptyEditorReviewStructural,
            )
            removed = true
          },
          { tag: HISTORY_PUSH_TAG, discrete: true },
        )

        if (!removed || structuralProposal(current, targetId))
          return fail("Structural proposal changed before rejection.")
      }

      diagnostic = ""
      publish()

      return true
    } catch (error) {
      diagnostic =
        error instanceof EditorReviewInputError
          ? error.message
          : "Structural review action failed."
      publish()

      return false
    } finally {
      decidingStructural = false
    }
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

  function $restoreComposition(restoreSelection = true, active = composition) {
    composition = null

    if (!active) return null
    $setCompositionKey(null)

    try {
      const node = $getNodeByKey(active.key)
      const range = $getSelection()
      const ownedSelection = range?.is(active.caret) === true

      if (
        !$isTextNode(node) ||
        !node.isAttached() ||
        node.getTextContent() !== active.draft ||
        JSON.stringify(
          $serializeReviewRoot({ key: active.key, text: active.text }),
        ) !== active.source
      )
        return null

      node.setTextContent(active.text)

      if (restoreSelection && ownedSelection)
        $setSelection(active.range.clone())
      $addUpdateTag("yopem-review-action")
      $addUpdateTag(COMPOSITION_END_TAG)

      return ownedSelection ? active : null
    } catch {
      return null
    }
  }

  function cancelComposition(restoreSelection = true) {
    if (!composition || !editor) return
    editor.update(
      () => {
        $restoreComposition(restoreSelection)
      },
      { tag: HISTORIC_TAG, discrete: true },
    )
  }

  function setHost(host: EditorReviewHost | null) {
    if (disposed) {
      if (host === null) return
      throw new Error("Review is not mounted.")
    }

    cancelComposition()
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

    if (value) {
      const current = instance()

      if (
        current
          .getEditorState()
          .read(
            () =>
              $getState($getRoot(), editorReviewStructuralState).proposals
                .length > 0,
          )
      )
        return fail("Resolve structural proposals before suggestion mode.")
      authorize("suggest")
    }

    cancelComposition()
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

    const nativeFragment = editor
      .getEditorState()
      .read(() => $getState($getRoot(), editorReviewNativeFragmentState))

    if (
      nativeFragment &&
      !(
        (action === "accept" || action === "reject") &&
        id === nativeFragment.id
      ) &&
      action !== "undo" &&
      action !== "redo"
    )
      return false

    if (
      nativeFragment &&
      (action === "accept" || action === "reject") &&
      !editor
        .getEditorState()
        .read(() => nativeFragmentIsCurrent(nativeFragment))
    )
      return false

    if (id && (action === "accept" || action === "reject")) {
      const current = editor

      const currentTarget = current.getEditorState().read(() => {
        const root = $getRoot()

        const proposal = $getState(
          root,
          editorReviewStructuralState,
        ).proposals.find((item) => item.id === id)

        const operations = $getNativeOperationTargets(root, new Set([id]))

        return (
          (!proposal || $currentReviewTreeJSON() === proposal.precondition) &&
          operations.every(({ node, operation }) =>
            $nativeOperationBlockIsOwned(node, operation, true),
          )
        )
      })

      if (!currentTarget) return false
    }

    if (
      action === "suggest" &&
      editor
        .getEditorState()
        .read(
          () =>
            $getState($getRoot(), editorReviewStructuralState).proposals
              .length > 0,
        )
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

        for (const { suggestion } of $getEditorReviewBreaks()) {
          const previous = suggestions.get(suggestion.id)

          const kind =
            previous?.kind === "delete"
              ? "replace"
              : (previous?.kind ?? "insert")

          suggestions.set(
            suggestion.id,
            Object.freeze({
              id: suggestion.id,
              author: previous?.author ?? suggestion.author,
              createdAt: previous?.createdAt ?? suggestion.createdAt,
              beforeFormat: previous?.beforeFormat ?? 0,
              kind,
              breakKind: suggestion.kind,
              insertedText: `${previous?.insertedText ?? ""}\n`.slice(0, 160),
              removedText: previous?.removedText ?? "",
              formattedText: previous?.formattedText ?? "",
            }),
          )
        }

        const visible = session.getHost()?.visible === true
        const currentTreeJSON = $currentReviewTreeJSON()

        const structuralProposals = $getState(
          $getRoot(),
          editorReviewStructuralState,
        ).proposals.filter(
          (proposal) => proposal.precondition === currentTreeJSON,
        )

        const anchors = new Set(
          $nodesOfType(MarkNode)
            .filter((mark) => mark.getTextContentSize() > 0)
            .flatMap((mark) => mark.getIDs()),
        )

        return {
          text: $getRoot().getTextContent(),
          diffAvailable: $reviewTextDiffSource() !== null,
          visible,
          commentRequest,
          detachedThreadIds: visible
            ? data()
                .threads.filter((item) => !anchors.has(item.id))
                .map((item) => item.id)
            : [],
          data: visible ? data() : emptyReview,
          suggestions: visible ? [...suggestions.values()] : [],
          structuralProposals: visible ? structuralProposals : [],
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

      if (node) return [node]

      const target = $getEditorReviewBreaks().find(
        (item) => item.suggestion.id === id,
      )

      if (!target) return []

      if ($isElementNode(target.node)) {
        const ownTexts = target.node.getAllTextNodes()

        if (ownTexts.length) return ownTexts
        const next = target.node.getNextSibling()

        return $isElementNode(next) ? next.getAllTextNodes() : []
      }

      const parent = target.node.getParent()

      return $isElementNode(parent) ? parent.getAllTextNodes() : []
    })
  }

  function handleError(error: Error) {
    if (!(error instanceof EditorReviewInputError)) return false
    cancelComposition()
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
      try {
        const snapshot = $serializeReviewRoot()

        if (
          !$hasUpdateTag("yopem-review-structural-action") &&
          !$getState($getRoot(), editorReviewStructuralState).proposals
            .length &&
          hasNamedReviewSlots(snapshot.root)
        )
          throw new EditorReviewInputError(
            "Review does not support named slot updates.",
          )

        const structuralAction =
          $hasUpdateTag("yopem-review-structural-action") ||
          $getState($getRoot(), editorReviewStructuralState).proposals.length >
            0

        checkReviewComplexity(snapshot, structuralAction ? 64 : 24)
        parseReviewDocumentJSON(
          JSON.stringify(snapshot),
          true,
          structuralAction,
        )

        const nativeFragment = $getState(
          $getRoot(),
          editorReviewNativeFragmentState,
        )

        if (nativeFragment && !nativeFragmentIsCurrent(nativeFragment))
          throw new EditorReviewInputError(
            "Native review fragment changed and cannot be resolved safely.",
          )
      } catch (error) {
        throw error instanceof EditorReviewInputError
          ? error
          : new EditorReviewInputError(
              "Review document is invalid or too large.",
            )
      }
    }

    function $hasCurrentPending() {
      return (
        $getState($getRoot(), editorReviewStructuralState).proposals.length >
          0 || $hasReviewSuggestions()
      )
    }

    function paste(event: ClipboardEvent | InputEvent | KeyboardEvent) {
      if (event.defaultPrevented) return true

      if (!current.isEditable()) {
        event.preventDefault()
        diagnostic = "Review paste is read-only."
        publish()

        return true
      }

      if (!suggesting) {
        if (!$hasCurrentPending()) return false
        event.preventDefault()
        diagnostic = "Resolve pending suggestions before pasting."
        publish()

        return true
      }

      event.preventDefault()

      if (
        $getState($getRoot(), editorReviewStructuralState).proposals.length ||
        $getState($getRoot(), editorReviewNativeFragmentState) ||
        $getEditorReviewBreaks().length
      ) {
        diagnostic = "Resolve pending suggestions before pasting."
        publish()

        return true
      }

      if ("isComposing" in event && event.isComposing) {
        diagnostic = "Native paste is not supported during composition."
        publish()

        return true
      }

      let nativePastePhase = "clipboard"

      try {
        if (hasCustomClipboardImportPipeline())
          return fail(
            "Native review paste is unavailable with custom clipboard import handlers.",
          )

        const transfer =
          "clipboardData" in event
            ? event.clipboardData
            : "dataTransfer" in event
              ? event.dataTransfer
              : null

        if (!transfer || transfer.files.length || transfer.types.length > 16)
          return fail("This native clipboard content is not supported.")
        const data = transfer.getData("application/x-lexical-editor")

        const parsed = parseEditorReviewNativeFragment(
          data,
          current._config.namespace,
        )

        if (parsed.status !== "validated")
          return fail(
            "This native rich-text fragment is invalid or unsupported.",
          )
        nativePastePhase = "staging"

        const staging = current.parseEditorState(
          JSON.stringify({
            root: { type: "root", children: parsed.blocks },
          }),
        )

        const stagedJSON = JSON.stringify(staging.toJSON())

        if (stagedJSON === undefined)
          return fail("Native rich-text fragment is not serializable.")

        const stagedDocument = z
          .record(z.string(), z.json())
          .parse(parseReviewJSONValue(stagedJSON))

        const stagedRoot = z
          .record(z.string(), z.json())
          .parse(stagedDocument.root)

        const normalized = parseEditorReviewNativeFragment(
          JSON.stringify({
            namespace: current._config.namespace,
            nodes: stagedRoot.children,
          }),
          current._config.namespace,
        )

        if (normalized.status !== "validated")
          return fail("This native rich-text fragment is not supported here.")

        nativePastePhase = "selection"
        const range = selection(false)
        const root = $getRoot()
        const anchor = range.anchor.getNode()
        const focus = range.focus.getNode()
        const selectedNodes = range.getNodes()
        const selectedTextNodes = selectedNodes.filter($isTextNode)
        const backward = range.isBackward()
        const startPoint = backward ? range.focus : range.anchor
        const endPoint = backward ? range.anchor : range.focus

        const textSelection =
          range.anchor.type === "text" &&
          range.focus.type === "text" &&
          $isTextNode(anchor) &&
          $isTextNode(focus) &&
          anchor.isSimpleText() &&
          focus.isSimpleText() &&
          anchor.getMode() === "normal" &&
          focus.getMode() === "normal"

        const emptyParagraphCaret =
          range.isCollapsed() &&
          range.anchor.type === "element" &&
          range.focus.type === "element" &&
          anchor === focus &&
          $isElementNode(anchor) &&
          anchor.getType() === "paragraph" &&
          anchor.getParent() === root &&
          anchor.getChildrenSize() === 0

        const spans = textSelection
          ? selectedTextNodes.flatMap((node) => {
              const start =
                node.getKey() === startPoint.key ? startPoint.offset : 0

              const end =
                node.getKey() === endPoint.key
                  ? endPoint.offset
                  : node.getTextContentSize()

              return start < end ? [{ node, start, end }] : []
            })
          : []

        function hasCommentAnchor(node: LexicalNode) {
          let current: LexicalNode | null = node

          while (current && current !== root) {
            if (current instanceof MarkNode) return true
            current = current.getParent()
          }

          return false
        }

        function supportedTargetPath(node: LexicalNode) {
          let current: LexicalNode | null = node

          while (current && current !== root) {
            if (
              current instanceof MarkNode ||
              $getState(current, editorReviewNativeOperationState) ||
              $getState(current, editorReviewBreakState)
            )
              return false

            if ($isTextNode(current)) {
              if (
                !current.isSimpleText() ||
                current.getMode() !== "normal" ||
                $getState(current, editorSuggestionState)
              )
                return false
            } else if (
              !$isElementNode(current) ||
              !nativeOperationBlockTypes.has(current.getType())
            ) {
              return false
            }

            current = current.getParent()
          }

          return current === root
        }

        if (
          (!textSelection && !emptyParagraphCaret) ||
          (!range.isCollapsed() && !spans.length) ||
          (!selectedNodes.length && !range.isCollapsed()) ||
          selectedNodes.some(
            (node) =>
              node !== root &&
              !$isTextNode(node) &&
              (!$isElementNode(node) ||
                !nativeOperationBlockTypes.has(node.getType())),
          ) ||
          [...selectedNodes, anchor, focus].some(
            (node) => hasCommentAnchor(node) || !supportedTargetPath(node),
          ) ||
          spans.some(
            ({ node, start, end }) =>
              start < 0 || end > node.getTextContentSize() || start >= end,
          )
        )
          return fail(
            "Native paste requires an unannotated normal-text selection.",
          )

        nativePastePhase = "serialize before"
        const beforeRoot = $serializeReviewRoot()
        nativePastePhase = "clean before"
        const before = normalizedNativeFragmentSnapshot(current, beforeRoot)
        nativePastePhase = "check bounds"

        if (
          hasNamedReviewSlots(beforeRoot.root) ||
          new TextEncoder().encode(before).byteLength > 131072
        )
          return fail(
            "Native review snapshots exceed the supported document scope.",
          )

        nativePastePhase = "before snapshot"
        parseReviewDocumentJSON(before, true, true)
        const savedRange = range.clone()
        const permit = authorize("suggest")

        permit.assertCurrent()

        const activeRange = $getSelection()

        if (
          !suggesting ||
          JSON.stringify($serializeReviewRoot()) !== before ||
          !$isRangeSelection(activeRange) ||
          !activeRange.is(savedRange)
        )
          return fail("Native paste target changed during authorization.")

        const suggestion: EditorSuggestion = {
          id: reviewIdSchema.parse(crypto.randomUUID()),
          author: permit.author,
          createdAt: Date.now(),
          kind: "insert",
          beforeFormat: 0,
        }

        const deleteOperation: EditorReviewNativeOperation = {
          version: 1,
          id: suggestion.id,
          kind: "delete",
        }

        const insertOperation: EditorReviewNativeOperation = {
          version: 1,
          id: suggestion.id,
          kind: "insert",
        }

        const inserted = $generateNodesFromSerializedNodes(normalized.blocks)

        const insertedText = inserted.flatMap((node) =>
          $isTextNode(node)
            ? [node]
            : $isElementNode(node)
              ? node.getAllTextNodes()
              : [],
        )

        if (
          !inserted.length ||
          !insertedText.length ||
          !insertedText.some((node) => node.getTextContentSize() > 0)
        )
          return fail("Native fragment has no supported text nodes.")

        $addUpdateTag(PASTE_TAG)
        $addUpdateTag(HISTORY_PUSH_TAG)
        $addUpdateTag("yopem-review-action")

        try {
          if (!range.isCollapsed()) {
            const removed = range.extract().filter($isTextNode)

            if (removed.length !== spans.length)
              throw new EditorReviewInputError(
                "Native replacement could not retain the selected text.",
              )

            for (const node of removed) {
              $setEditorSuggestion(node, {
                ...suggestion,
                kind: "delete",
                beforeFormat: node.getFormat(),
              })
            }

            const insertionPoint = backward ? range.focus : range.anchor
            range.anchor.set(
              insertionPoint.key,
              insertionPoint.offset,
              insertionPoint.type,
            )
            range.focus.set(
              insertionPoint.key,
              insertionPoint.offset,
              insertionPoint.type,
            )
          }

          for (const node of insertedText)
            $setEditorSuggestion(node, suggestion)

          nativePastePhase = "insert"
          $insertGeneratedNodes(current, inserted, range)
          nativePastePhase = "after snapshot"
          permit.assertCurrent()

          const insertedTextContent = insertedText
            .map((node) => node.getTextContent())
            .join("")

          const attributedText = $getRoot()
            .getAllTextNodes()
            .filter((node) => {
              const value = $getState(node, editorSuggestionState)

              return value?.id === suggestion.id && value.kind === "insert"
            })

          if (
            !attributedText.length ||
            attributedText.map((node) => node.getTextContent()).join("") !==
              insertedTextContent
          )
            throw new EditorReviewInputError(
              "Native insertion changed the staged fragment.",
            )

          for (const node of inserted) {
            if ($isElementNode(node) && node.isAttached())
              $markNativeOperationBlocks(node, insertOperation)
          }

          for (const node of inserted) {
            if (
              $isElementNode(node) &&
              node.isAttached() &&
              !$getState(node, editorReviewNativeOperationState)
            )
              $markNativeOperationBlocks(node, insertOperation)
          }

          $markNativeOperationBlocks($getRoot(), deleteOperation)

          const afterRoot = $serializeReviewRoot()
          const after = normalizedNativeFragmentSnapshot(current, afterRoot)

          if (new TextEncoder().encode(after).byteLength > 131072)
            throw new EditorReviewInputError(
              "Native review snapshots exceed the supported document scope.",
            )
          checkReviewComplexity(afterRoot, 24)
          parseReviewSnapshot(afterRoot, true, true)

          if ($getRoot().getTextContentSize() > 1048576)
            throw new EditorReviewInputError(
              "Review document exceeds growth limits.",
            )
        } catch (error) {
          const parsedBefore = current.parseEditorState(before).toJSON()

          $getRoot()
            .clear()
            .append(
              ...$generateNodesFromSerializedNodes(parsedBefore.root.children),
            )
          $getRoot().selectEnd()
          $setState($getRoot(), editorReviewNativeFragmentState, null)

          throw error
        }

        diagnostic = ""
        publish()

        return true
      } catch (error) {
        throw error instanceof EditorReviewInputError
          ? error
          : new EditorReviewInputError(
              `${nativePastePhase}: ${error instanceof Error ? error.message : String(error)}`,
            )
      }
    }

    function cut(event: ClipboardEvent | KeyboardEvent | null) {
      if (!suggesting && !$hasCurrentPending()) return false
      event?.preventDefault()
      diagnostic =
        "Resolve suggestions and stop suggestion mode before cutting."
      publish()

      return true
    }

    function command<T>(
      key: LexicalCommand<T>,
      handler: (payload: T) => void,
      nativeComposition = false,
    ) {
      return current.registerCommand(
        key,
        (payload: T) => {
          if (!current.isEditable()) {
            diagnostic = "Review action is read-only."
            publish()

            return true
          }

          if (composition && nativeComposition) return false

          if (!suggesting) {
            if (!$hasCurrentPending()) return false
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

    function breakCommand<T>(
      key: LexicalCommand<T>,
      handler: (payload: T) => void,
    ) {
      return current.registerCommand(
        key,
        (payload: T) => {
          if (!current.isEditable()) {
            diagnostic = "Review action is read-only."
            publish()

            return true
          }

          if (!suggesting) {
            if (!$hasCurrentPending()) return false
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
        COMMAND_PRIORITY_NORMAL,
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
      return fail(
        "Structural, clipboard and composition review changes require explicit host handling.",
      )
    }

    let attachedRoot: HTMLElement | null = null

    function expectCompositionInput(event: InputEvent) {
      const active = composition

      if (!active || event.defaultPrevented || !current.isEditable())
        return false

      if (
        event.inputType !== "insertCompositionText" &&
        event.inputType !== "deleteCompositionText" &&
        event.inputType !== "insertFromComposition" &&
        !(active.ending && event.inputType === "insertText")
      )
        return false

      const text = event.data ?? active.ending?.data ?? ""

      const start = Math.min(
        active.range.anchor.offset,
        active.range.focus.offset,
      )

      const end = Math.max(
        active.range.anchor.offset,
        active.range.focus.offset,
      )

      active.expected =
        active.text.slice(0, start) + text + active.text.slice(end)
      active.input = event

      return true
    }

    function compositionInput(event: Event) {
      if (event instanceof InputEvent) expectCompositionInput(event)
    }

    function $finishComposition(event: CompositionEvent) {
      try {
        const active = $restoreComposition()

        if (!active) {
          $addUpdateTag(HISTORIC_TAG)

          return
        }

        active.assertCurrent()

        if (event.data && !event.defaultPrevented) {
          if (!suggesting) return unsupported()
          $suggestCompletedText(event.data)
        } else $addUpdateTag(HISTORIC_TAG)

        diagnostic = ""
      } catch (error) {
        $addUpdateTag(HISTORIC_TAG)
        diagnostic =
          error instanceof Error ? error.message : "Review edit rejected."
        publish()
      }
    }

    function compositionEnd(event: CompositionEvent) {
      const active = composition

      if (!active) return
      active.ending = event
      setTimeout(() => {
        if (composition !== active || editor !== current) return
        current.update(
          () => {
            $finishComposition(event)
          },
          { discrete: true },
        )
      }, 0)
    }

    function beforeInput(event: InputEvent) {
      if (event.defaultPrevented) return

      const pending = current
        .getEditorState()
        .read(
          () =>
            $getState($getRoot(), editorReviewStructuralState).proposals
              .length > 0 || $hasReviewSuggestions(),
        )

      if (!suggesting && !pending) return

      if (expectCompositionInput(event)) return

      event.preventDefault()
      event.stopImmediatePropagation()

      if (!suggesting) {
        diagnostic = "Resolve pending suggestions before normal editing."
        publish()

        return
      }

      if (event.isComposing || current.isComposing()) {
        diagnostic =
          "This native input is not supported in suggestion mode. Original content is unchanged."
        publish()

        return
      }

      if (event.inputType === "insertText" && event.data) {
        current.dispatchCommand(CONTROLLED_TEXT_INSERTION_COMMAND, event.data)
      } else if (event.inputType === "insertParagraph") {
        current.dispatchCommand(INSERT_PARAGRAPH_COMMAND, undefined)
      } else if (event.inputType === "insertLineBreak") {
        current.dispatchCommand(INSERT_LINE_BREAK_COMMAND, false)
      } else if (
        event.inputType === "deleteContentBackward" ||
        event.inputType === "deleteContentForward"
      ) {
        current.dispatchCommand(
          DELETE_CHARACTER_COMMAND,
          event.inputType === "deleteContentBackward",
        )
      } else if (
        event.inputType === "deleteWordBackward" ||
        event.inputType === "deleteWordForward"
      ) {
        current.dispatchCommand(
          DELETE_WORD_COMMAND,
          event.inputType === "deleteWordBackward",
        )
      } else if (
        event.inputType === "deleteHardLineBackward" ||
        event.inputType === "deleteHardLineForward" ||
        event.inputType === "deleteSoftLineBackward" ||
        event.inputType === "deleteSoftLineForward"
      ) {
        current.dispatchCommand(
          DELETE_LINE_COMMAND,
          event.inputType.endsWith("Backward"),
        )
      } else {
        diagnostic =
          "This native input is not supported in suggestion mode. Original content is unchanged."
        publish()
      }
    }

    function detachRoot() {
      cancelComposition()
      attachedRoot?.removeEventListener("beforeinput", beforeInput, true)
      attachedRoot?.removeEventListener("input", compositionInput, true)
      attachedRoot?.removeEventListener("compositionend", compositionEnd, true)
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

    let initialReviewState = true

    return mergeRegister(
      unsubscribeBookmark,
      current.registerCommand(
        COMPOSITION_START_COMMAND,
        (event) => {
          if (!suggesting && !$hasCurrentPending()) return false

          if (event.defaultPrevented) return true

          try {
            if (!suggesting || !current.isEditable() || composition)
              return unsupported()
            const range = selection(false)
            const node = range.anchor.getNode()

            if (
              !$isTextNode(node) ||
              !node.isSimpleText() ||
              node.getMode() !== "normal" ||
              range.anchor.key !== range.focus.key ||
              range.anchor.type !== "text" ||
              range.focus.type !== "text" ||
              node.getFormat() !== range.format ||
              node.getStyle() !== range.style ||
              $getState(node, editorSuggestionState) ||
              $getState($getRoot(), editorReviewStructuralState).proposals
                .length
            )
              return unsupported()

            validateDocument()
            const source = JSON.stringify($serializeReviewRoot())
            const savedRange = range.clone()
            const permit = authorize("suggest")
            permit.assertCurrent()

            if (
              !suggesting ||
              !range.is(savedRange) ||
              !$getSelection()?.is(savedRange) ||
              source !== JSON.stringify($serializeReviewRoot())
            )
              return fail("Composition target changed during authorization.")

            composition = {
              key: node.getKey(),
              text: node.getTextContent(),
              draft: node.getTextContent(),
              expected: null,
              input: null,
              range: savedRange,
              caret: savedRange.clone(),
              source,
              ending: null,
              assertCurrent: permit.assertCurrent,
            }
            $setCompositionKey(node.getKey())
            $addUpdateTag(COMPOSITION_START_TAG)
            diagnostic = ""
          } catch (error) {
            event.preventDefault()
            diagnostic =
              error instanceof Error ? error.message : "Review edit rejected."
            publish()
          }

          return true
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
      current.registerCommand(
        COMPOSITION_END_COMMAND,
        (event) => {
          if (!composition) return false

          if (composition.ending !== event) $finishComposition(event)

          return true
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
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
        attachedRoot?.addEventListener("input", compositionInput, true)
        attachedRoot?.addEventListener("compositionend", compositionEnd, true)

        if (root) decorations.refresh()
      }),
      detachRoot,
      current.registerNodeTransform(RootNode, () => {
        if (nativeInsertMarker) {
          const marker = nativeInsertMarker
          nativeInsertMarker = null

          try {
            marker.assertCurrent()

            if (
              marker.editor !== current ||
              editor !== current ||
              !current.isEditable() ||
              !suggesting ||
              $getState($getRoot(), editorReviewNativeFragmentState)?.id !==
                marker.id ||
              normalizedNativeFragmentSnapshot(
                current,
                $serializeReviewRoot(),
              ) !== marker.after
            )
              throw new EditorReviewInputError(
                "Native insertion changed before validation.",
              )
          } catch (error) {
            throw error instanceof EditorReviewInputError
              ? error
              : new EditorReviewInputError(
                  "Native insertion authorization expired.",
                )
          }

          $addUpdateTag(HISTORY_PUSH_TAG)
          $addUpdateTag("yopem-review-action")
          validateDocument()

          return
        }

        if (initialReviewState) {
          initialReviewState = false

          if (
            $getState($getRoot(), editorReviewStructuralState).proposals
              .length ||
            $hasReviewSuggestions()
          )
            validateDocument()

          return
        }

        if (composition) {
          const active = composition
          const node = $getNodeByKey(active.key)
          const range = $getSelection()

          try {
            active.assertCurrent()
            const content = $isTextNode(node) ? node.getTextContent() : null

            const start = Math.min(
              active.range.anchor.offset,
              active.range.focus.offset,
            )

            const end = Math.max(
              active.range.anchor.offset,
              active.range.focus.offset,
            )

            const suffix = active.text.slice(end)

            const inserted = content?.slice(
              start,
              content.length - suffix.length,
            )

            const unchanged =
              content === active.draft && range?.is(active.caret)

            if (
              suggesting &&
              current.isEditable() &&
              $isTextNode(node) &&
              node.isAttached() &&
              $isRangeSelection(range) &&
              $getRoot().getTextContentSize() <= 1048576 &&
              JSON.stringify(
                $serializeReviewRoot({ key: active.key, text: active.text }),
              ) === active.source &&
              (unchanged ||
                (content === active.expected &&
                  active.input !== null &&
                  !active.input.defaultPrevented &&
                  inserted !== undefined &&
                  (inserted === "" ||
                    insertionTextSchema.safeParse(inserted).success) &&
                  [range.anchor, range.focus].every(
                    (point) =>
                      point.key === active.key &&
                      point.type === "text" &&
                      point.offset >= start &&
                      point.offset <= start + inserted.length,
                  )))
            ) {
              active.draft = node.getTextContent()
              active.caret = range.clone()
              active.expected = null
              active.input = null
              $addUpdateTag(HISTORIC_TAG)

              return
            }
          } catch {
            diagnostic = "Composition authorization or target expired."
          }

          composition = null
          $setCompositionKey(null)
          queueMicrotask(() => {
            if (editor !== current || composition) return
            current.update(
              () => {
                $restoreComposition(false, active)
              },
              { tag: HISTORIC_TAG, discrete: true },
            )
          })
        }

        if ($hasUpdateTag("yopem-review-action")) {
          validateDocument()

          return
        }

        if ($hasUpdateTag(HISTORIC_TAG)) {
          const proposals = $getState(
            $getRoot(),
            editorReviewStructuralState,
          ).proposals

          if (
            proposals.length &&
            proposals.some(
              (proposal) => proposal.precondition !== $currentReviewTreeJSON(),
            )
          )
            $setState(
              $getRoot(),
              editorReviewStructuralState,
              emptyEditorReviewStructural,
            )

          return
        }

        const previousSuggestion = current
          .getEditorState()
          .read(() => $hasReviewSuggestions())

        if (suggesting || previousSuggestion)
          throw new EditorReviewInputError(
            "Untracked edits are blocked. Resolve pending suggestions or use review actions.",
          )

        const structuralProposals = $getState(
          $getRoot(),
          editorReviewStructuralState,
        ).proposals

        if (
          structuralProposals.length &&
          structuralProposals.some(
            (proposal) => proposal.precondition !== $currentReviewTreeJSON(),
          )
        )
          $setState(
            $getRoot(),
            editorReviewStructuralState,
            emptyEditorReviewStructural,
          )

        const pending =
          $getState($getRoot(), editorReviewStructuralState).proposals.length >
            0 || $hasReviewSuggestions()

        if (suggesting || pending)
          throw new EditorReviewInputError(
            "Untracked edits are blocked. Resolve pending suggestions or use review actions.",
          )
      }),
      command<string | InputEvent>(
        CONTROLLED_TEXT_INSERTION_COMMAND,
        (payload) => {
          let text: string

          if (payload instanceof Object) {
            if (payload.isComposing || payload.inputType !== "insertText")
              return unsupported()
            text = payload.data ?? ""
          } else {
            text = payload
          }

          const selected = $getSelection()

          if ($isRangeSelection(selected) && !selected.isCollapsed())
            $suggestCompletedText(text)
          else $suggestInsert(text)
        },
        true,
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
      breakCommand(INSERT_PARAGRAPH_COMMAND, () => $suggestBreak("paragraph")),
      breakCommand(INSERT_LINE_BREAK_COMMAND, (selectStart) =>
        $suggestBreak("linebreak", selectStart),
      ),
      current.registerCommand(PASTE_COMMAND, paste, COMMAND_PRIORITY_NORMAL),
      current.registerCommand(CUT_COMMAND, cut, COMMAND_PRIORITY_LOW),
      current.registerUpdateListener(
        ({ editorState, dirtyElements, dirtyLeaves }) => {
          if (nativeInsertMarker?.editor === current) nativeInsertMarker = null

          if (composition) {
            const active = composition

            const owned = editorState.read(() => {
              const node = $getNodeByKey(active.key)

              return (
                $isTextNode(node) &&
                node.isAttached() &&
                node.getTextContent() === active.draft &&
                JSON.stringify(
                  $serializeReviewRoot({ key: active.key, text: active.text }),
                ) === active.source
              )
            })

            if (!owned) {
              composition = null
              current.update(() => {
                $setCompositionKey(null)
              })
            } else if (
              !editorState.read(() => $getSelection()?.is(active.caret))
            ) {
              cancelComposition(false)
            }
          }

          if (dirtyElements.size || dirtyLeaves.size) saved = null
          publish()
        },
      ),
      decorations.dispose,
      current.registerEditableListener(() => {
        cancelComposition()
        saved = null
        publish()
      }),
      () => {
        saved = null
        suggesting = false
        composition = null
        nativeInsertMarker = null
        nativeInsertInProgress = false
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
    decideStructural,
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
    $suggestNativeInsertNodes,
    $suggestDelete,
    $suggestFormat,
    $suggestDocumentText,
    $suggestDocumentTree,
    $suggestCompletedText,
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
