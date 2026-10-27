import type {
  LexicalEditor,
  SerializedEditorState,
  SerializedLexicalNode,
} from "lexical"

import { z } from "zod"

import {
  parseReviewDocumentJSON,
  type EditorReviewNativeFragment,
} from "./review-codecs"
import {
  deriveEditorReviewTreeDiff,
  parseEditorReviewTreeDocument,
  preserveEditorReviewTreeMarks,
  type EditorReviewTreeDocument,
} from "./review-tree-diff"
import { checkReviewComplexity } from "./review-validation"

const nativeOperationSnapshotLimit = 131072

const reviewJsonValueSchema = z.json()

const reviewJsonObjectSchema = z.record(z.string(), reviewJsonValueSchema)

const reviewJsonDocumentSchema = z.object({ root: reviewJsonObjectSchema })

type ReviewJsonValue = z.infer<typeof reviewJsonValueSchema>

type ReviewJsonObject = z.infer<typeof reviewJsonObjectSchema>

type ReviewJsonDocument = z.infer<typeof reviewJsonDocumentSchema>

type EditorReviewNativeOperationInput =
  | ReviewJsonDocument
  | SerializedEditorState
  | { root: SerializedLexicalNode }

type ReviewSnapshotInput =
  | EditorReviewNativeOperationInput
  | EditorReviewTreeDocument

export type EditorReviewNativeOperationSnapshots = Readonly<
  Pick<EditorReviewNativeFragment, "before" | "after">
>

function serializeSnapshot(input: ReviewSnapshotInput) {
  checkReviewComplexity(input, 64)
  const serialized = JSON.stringify(input)

  if (serialized === undefined)
    throw new Error("Native review snapshot is not serializable.")

  return serialized
}

function assertSnapshotSize(snapshot: string) {
  if (
    new TextEncoder().encode(snapshot).byteLength > nativeOperationSnapshotLimit
  )
    throw new Error("Native review snapshot exceeds its byte limit.")
}

function rootOf(document: ReviewJsonDocument) {
  return reviewJsonObjectSchema.parse(
    reviewJsonDocumentSchema.parse(document).root,
  )
}

function rootReviewState(document: ReviewJsonDocument) {
  const root = rootOf(document)
  const state = reviewJsonObjectSchema.parse(root.$ ?? {})

  return state.yopemReview
}

function canonicalJSON(value: ReviewJsonValue): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJSON).join(",")}]`

  const object = reviewJsonObjectSchema.safeParse(value)

  if (object.success) {
    return `{${Object.keys(object.data)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJSON(object.data[key])}`)
      .join(",")}}`
  }

  const serialized = JSON.stringify(value)

  if (serialized === undefined)
    throw new Error("Native review state is not serializable.")

  return serialized
}

function assertRootReviewStateUnchanged(
  before: ReviewJsonDocument,
  after: ReviewJsonDocument,
) {
  const beforeState = rootReviewState(before)
  const afterState = rootReviewState(after)

  if (
    afterState !== undefined &&
    (beforeState === undefined ||
      canonicalJSON(beforeState) !== canonicalJSON(afterState))
  )
    throw new Error("Native operation cannot change review authority.")
}

function assertNoPendingReviewState(document: ReviewJsonDocument) {
  const root = rootOf(document)
  const pending: ReviewJsonObject[] = [root]

  while (pending.length) {
    const node = pending.pop()!
    const state = reviewJsonObjectSchema.parse(node.$ ?? {})

    if (
      state.yopemReviewStructural != null ||
      state.yopemReviewNativeFragment != null ||
      state.yopemSuggestion != null ||
      state.yopemReviewBreak != null
    )
      throw new Error("Native operation cannot replace pending review state.")

    if (node.$slots !== undefined) {
      const slots = reviewJsonObjectSchema.parse(node.$slots)

      if (Object.keys(slots).length)
        throw new Error("Native operation cannot include named slots.")

      pending.push(
        ...Object.values(slots).map((slot) =>
          reviewJsonObjectSchema.parse(slot),
        ),
      )
    }

    if (Array.isArray(node.children))
      pending.push(
        ...node.children.map((child) => reviewJsonObjectSchema.parse(child)),
      )
  }
}

function normalizedSnapshot(
  editor: LexicalEditor,
  input: ReviewJsonDocument,
): ReviewJsonDocument {
  const serialized = serializeSnapshot(input)

  assertSnapshotSize(serialized)

  const validated = reviewJsonDocumentSchema.parse(
    parseReviewDocumentJSON(serialized, true, true),
  )

  const normalizedSerialized = serializeSnapshot(
    editor.parseEditorState(serializeSnapshot(validated)).toJSON(),
  )

  assertSnapshotSize(normalizedSerialized)

  return reviewJsonDocumentSchema.parse(
    parseReviewDocumentJSON(normalizedSerialized, true, true),
  )
}

function nativeTree(document: ReviewJsonDocument) {
  return parseEditorReviewTreeDocument(
    parseReviewDocumentJSON(serializeSnapshot(document), false, true),
  )
}

function preserveTrustedMarks(
  trustedBefore: ReviewJsonDocument,
  target: EditorReviewTreeDocument,
) {
  const result = preserveEditorReviewTreeMarks(trustedBefore, target)

  if (!result)
    throw new Error("Native operation cannot preserve comment anchors.")

  return result
}

function withTrustedRootReviewState(
  document: EditorReviewTreeDocument,
  trustedReviewState: ReviewJsonValue | undefined,
) {
  const root = reviewJsonObjectSchema.parse(document.root)
  const state = reviewJsonObjectSchema.parse(root.$ ?? {})

  if (trustedReviewState === undefined) delete state.yopemReview
  else state.yopemReview = trustedReviewState

  if (Object.keys(state).length) root.$ = state
  else delete root.$

  return { root }
}

function serializeValidatedSnapshot(document: EditorReviewTreeDocument) {
  const serialized = serializeSnapshot(document)

  assertSnapshotSize(serialized)
  reviewJsonDocumentSchema.parse(
    parseReviewDocumentJSON(serialized, true, true),
  )

  return serialized
}

export function createEditorReviewNativeOperationSnapshots(
  editor: LexicalEditor,
  beforeInput: EditorReviewNativeOperationInput,
  afterInput: EditorReviewNativeOperationInput,
  expectedInsertPaths?: readonly (readonly number[])[],
): EditorReviewNativeOperationSnapshots | null {
  const beforeSerialized = serializeSnapshot(beforeInput)
  const afterSerialized = serializeSnapshot(afterInput)

  assertSnapshotSize(beforeSerialized)
  assertSnapshotSize(afterSerialized)

  const trustedBefore = reviewJsonDocumentSchema.parse(
    parseReviewDocumentJSON(beforeSerialized, true, true),
  )

  const trustedAfter = reviewJsonDocumentSchema.parse(
    parseReviewDocumentJSON(afterSerialized, true, true),
  )

  assertNoPendingReviewState(trustedBefore)
  assertNoPendingReviewState(trustedAfter)
  assertRootReviewStateUnchanged(trustedBefore, trustedAfter)

  const before = normalizedSnapshot(editor, trustedBefore)
  const after = normalizedSnapshot(editor, trustedAfter)
  const beforeTree = nativeTree(before)
  const afterTree = nativeTree(after)
  const changes = deriveEditorReviewTreeDiff(beforeTree, afterTree)

  if (!changes.length) return null

  if (expectedInsertPaths) {
    const expected = new Set(
      expectedInsertPaths.map((path) => JSON.stringify(path)),
    )

    const actual = new Set<string>()

    if (
      expected.size !== expectedInsertPaths.length ||
      changes.length !== expectedInsertPaths.length ||
      expectedInsertPaths.some((path) => path.length === 0)
    )
      throw new Error("Native operation does not match its returned nodes.")

    for (const change of changes) {
      if (change.kind !== "insert" || !change.path.length)
        throw new Error("Native operation does not match its returned nodes.")
      actual.add(JSON.stringify(change.path))
    }

    if (
      actual.size !== expected.size ||
      [...expected].some((path) => !actual.has(path))
    )
      throw new Error("Native operation does not match its returned nodes.")
  }

  const trustedReviewState = rootReviewState(trustedBefore)
  const beforeWithMarks = preserveTrustedMarks(before, beforeTree)
  const afterWithMarks = preserveTrustedMarks(before, afterTree)

  const validatedBefore = withTrustedRootReviewState(
    beforeWithMarks,
    trustedReviewState,
  )

  const validatedAfter = withTrustedRootReviewState(
    afterWithMarks,
    trustedReviewState,
  )

  return Object.freeze({
    before: serializeValidatedSnapshot(validatedBefore),
    after: serializeValidatedSnapshot(validatedAfter),
  })
}
