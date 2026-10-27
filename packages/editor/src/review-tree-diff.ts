import { z } from "zod"

import { checkReviewComplexity, reviewStringSchema } from "./review-validation"

type ReviewJsonValue =
  | string
  | number
  | boolean
  | null
  | ReviewJsonValue[]
  | { [key: string]: ReviewJsonValue }

const reviewJsonValueSchema: z.ZodType<ReviewJsonValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number().finite(),
    z.boolean(),
    z.null(),
    z.array(reviewJsonValueSchema),
    z.record(z.string(), reviewJsonValueSchema),
  ]),
)

const reviewJsonObjectSchema = z.record(z.string(), reviewJsonValueSchema)

const reviewTreeNodeTypeSchema = z.object({ type: z.string() })

const reviewTreeByteLimit = 131072

const reviewTreeNodeLimit = 1024

const reviewTreeDepthLimit = 24

const reviewTreeChildrenLimit = 256

const reviewTreeChangeLimit = 128

const reviewMarkIdsSchema = z
  .array(
    z
      .string()
      .min(1)
      .max(128)
      .regex(/^[A-Za-z0-9_-]+$/),
  )
  .min(1)
  .max(256)
  .refine((ids) => new Set(ids).size === ids.length)

export interface EditorReviewTreeDocument {
  readonly root: Readonly<Record<string, ReviewJsonValue>>
}

export type EditorReviewTreeChangeKind =
  | "break"
  | "insert"
  | "move"
  | "property"
  | "remove"
  | "replace"

export interface EditorReviewTreeChange {
  readonly kind: EditorReviewTreeChangeKind
  readonly path: readonly number[]
  readonly fromPath?: readonly number[]
  readonly toPath?: readonly number[]
  readonly nodeType?: string
  readonly beforeType?: string
  readonly afterType?: string
  readonly property?: string
  readonly before?: string
  readonly after?: string
}

interface EditorReviewTreePair {
  readonly beforeIndex: number
  readonly afterIndex: number
  readonly exact: boolean
}

function isReviewJsonObject(
  value: ReviewJsonValue,
): value is Record<string, ReviewJsonValue> {
  return reviewJsonObjectSchema.safeParse(value).success
}

function canonicalizeReviewJson(value: ReviewJsonValue): ReviewJsonValue {
  if (Array.isArray(value)) return value.map(canonicalizeReviewJson)

  if (!isReviewJsonObject(value)) return value

  const result: Record<string, ReviewJsonValue> = {}

  for (const key of Object.keys(value).sort())
    result[key] = canonicalizeReviewJson(value[key])

  return result
}

function freezeReviewJson(value: ReviewJsonValue): ReviewJsonValue {
  if (Array.isArray(value)) {
    for (const child of value) freezeReviewJson(child)

    Object.freeze(value)

    return value
  }

  if (isReviewJsonObject(value)) {
    for (const child of Object.values(value)) freezeReviewJson(child)

    Object.freeze(value)

    return value
  }

  return value
}

function reviewTreeNodeType(value: ReviewJsonValue) {
  const node = reviewTreeNodeTypeSchema.safeParse(value)

  if (!node.success) throw new Error("Review tree nodes require a type.")

  return node.data.type
}

function validateReviewTreeNode(value: ReviewJsonValue, depth: number) {
  if (depth > reviewTreeDepthLimit) throw new Error("Review tree is too deep.")
  const node = reviewJsonObjectSchema.parse(value)
  const type = reviewTreeNodeType(node)

  if (type.length > 128 || type === "mark")
    throw new Error("Review tree contains unsupported review markup.")

  const state = node.$

  if (state !== undefined) {
    const parsedState = reviewJsonObjectSchema.parse(state)

    if (
      [
        "yopemReview",
        "yopemReviewStructural",
        "yopemSuggestion",
        "yopemReviewBreak",
      ].some((key) => key in parsedState)
    )
      throw new Error("Review tree cannot contain review overlays.")
  }

  const children = node.children

  if (children !== undefined) {
    if (!Array.isArray(children) || children.length > reviewTreeChildrenLimit)
      throw new Error("Review tree has an invalid child list.")

    for (const child of children) validateReviewTreeNode(child, depth + 1)
  }

  const slots = node.$slots

  if (slots !== undefined) {
    const parsedSlots = reviewJsonObjectSchema.parse(slots)

    if (Object.keys(parsedSlots).length > 32)
      throw new Error("Review tree has too many named slots.")

    for (const slot of Object.values(parsedSlots))
      validateReviewTreeNode(slot, depth + 1)
  }
}

function countReviewTreeNodes(node: ReviewJsonValue) {
  let count = 0
  const pending = [node]

  while (pending.length) {
    const value = pending.pop()!
    const current = reviewJsonObjectSchema.parse(value)

    if (++count > reviewTreeNodeLimit)
      throw new Error("Review tree exceeds its node limit.")

    if (Array.isArray(current.children)) pending.push(...current.children)

    if (current.$slots !== undefined) {
      const slots = reviewJsonObjectSchema.parse(current.$slots)
      pending.push(...Object.values(slots))
    }
  }

  return count
}

export function parseEditorReviewTreeDocument<Input>(input: Input) {
  checkReviewComplexity(input, 64)
  const document = reviewJsonObjectSchema.parse(input)
  const root = reviewJsonObjectSchema.parse(document.root)

  if (root.type !== "root" || !Array.isArray(root.children))
    throw new Error("Expected a Lexical root with children.")

  validateReviewTreeNode(root, 0)
  countReviewTreeNodes(root)

  const canonicalRoot = reviewJsonObjectSchema.parse(
    canonicalizeReviewJson(root),
  )

  const canonical = Object.freeze({ root: canonicalRoot })

  if (
    new TextEncoder().encode(JSON.stringify(canonical)).byteLength >
    reviewTreeByteLimit
  )
    throw new Error("Review tree exceeds its byte limit.")

  freezeReviewJson(canonical.root)

  return canonical
}

export function canonicalEditorReviewTreeJSON<Input>(input: Input) {
  const document = parseEditorReviewTreeDocument(input)

  return JSON.stringify(document)
}

function nodeSignature(value: ReviewJsonValue) {
  return JSON.stringify(canonicalizeReviewJson(value))
}

function withoutNodeState(value: ReviewJsonValue): ReviewJsonValue {
  if (Array.isArray(value)) return value.map(withoutNodeState)

  if (!isReviewJsonObject(value)) return value

  const result: Record<string, ReviewJsonValue> = {}

  for (const key of Object.keys(value).sort())
    if (key !== "$") result[key] = withoutNodeState(value[key])

  return result
}

function nodeStructureSignature(value: ReviewJsonValue) {
  return JSON.stringify(canonicalizeReviewJson(withoutNodeState(value)))
}

function mergeMatchingNodeState(
  before: ReviewJsonValue,
  after: ReviewJsonValue,
): ReviewJsonValue {
  const beforeNode = reviewJsonObjectSchema.parse(before)
  const afterNode = reviewJsonObjectSchema.parse(after)

  if (beforeNode.type !== afterNode.type) return after
  const result = { ...afterNode }
  const beforeState = reviewJsonObjectSchema.parse(beforeNode.$ ?? {})
  const afterState = reviewJsonObjectSchema.parse(afterNode.$ ?? {})
  const state = { ...beforeState, ...afterState }

  if (Object.keys(state).length) result.$ = state
  else delete result.$

  const beforeChildren = Array.isArray(beforeNode.children)
    ? beforeNode.children
    : []

  const afterChildren = Array.isArray(afterNode.children)
    ? afterNode.children
    : []

  if (beforeChildren.length && afterChildren.length) {
    const pairs: EditorReviewTreePair[] = []
    const usedBefore = new Set<number>()
    const usedAfter = new Set<number>()
    appendLcsPairs(
      beforeChildren,
      afterChildren,
      pairs,
      usedBefore,
      usedAfter,
      nodeStructureSignature,
    )
    const children = afterChildren.slice()

    for (const pair of pairs)
      children[pair.afterIndex] = mergeMatchingNodeState(
        beforeChildren[pair.beforeIndex],
        afterChildren[pair.afterIndex],
      )

    result.children = children
  }

  const beforeSlots = beforeNode.$slots
  const afterSlots = afterNode.$slots

  if (
    beforeSlots !== undefined &&
    isReviewJsonObject(beforeSlots) &&
    afterSlots !== undefined &&
    isReviewJsonObject(afterSlots)
  ) {
    const slots = { ...afterSlots }

    for (const [name, beforeSlot] of Object.entries(beforeSlots)) {
      const afterSlot = slots[name]

      if (afterSlot !== undefined)
        slots[name] = mergeMatchingNodeState(beforeSlot, afterSlot)
    }

    result.$slots = slots
  }

  return result
}

export function mergeEditorReviewTreeNodeState<BeforeInput, AfterInput>(
  beforeInput: BeforeInput,
  afterInput: AfterInput,
) {
  const before = parseEditorReviewTreeDocument(beforeInput)
  const after = parseEditorReviewTreeDocument(afterInput)

  return parseEditorReviewTreeDocument({
    root: mergeMatchingNodeState(before.root, after.root),
  })
}

export function preserveEditorReviewTreeMarks<SourceInput, TargetInput>(
  sourceInput: SourceInput,
  targetInput: TargetInput,
): EditorReviewTreeDocument | null {
  checkReviewComplexity(sourceInput, 64)
  const sourceDocument = reviewJsonObjectSchema.parse(sourceInput)
  const sourceRoot = reviewJsonObjectSchema.parse(sourceDocument.root)
  const target = parseEditorReviewTreeDocument(targetInput)
  const sourceTextCounts = new Map<string, number>()
  const targetTextCounts = new Map<string, number>()
  const markNodesByText = new Map<string, Record<string, ReviewJsonValue>[]>()
  const markIds = new Set<string>()
  const anchoredIds = new Set<string>()
  let unsupportedMark = false

  if (sourceRoot.type !== "root")
    throw new Error("Expected a Lexical source root.")

  function visitSource(
    value: ReviewJsonValue,
    inheritedMarks: Record<string, ReviewJsonValue>[],
  ) {
    const node = reviewJsonObjectSchema.parse(value)
    const type = reviewTreeNodeType(node)
    const marks = [...inheritedMarks]

    if (type === "mark") {
      const nodeIds = reviewMarkIdsSchema.parse(node.ids)
      const descriptor = { ...node }
      delete descriptor.children
      marks.push(descriptor)

      const inheritedIds = new Set(
        inheritedMarks.flatMap((mark) => reviewMarkIdsSchema.parse(mark.ids)),
      )

      if (
        !Array.isArray(node.children) ||
        node.children.length === 0 ||
        node.children.some(
          (child) =>
            !isReviewJsonObject(child) ||
            (child.type !== "text" && child.type !== "mark"),
        ) ||
        node.$slots !== undefined ||
        nodeIds.some((id) => inheritedIds.has(id))
      )
        unsupportedMark = true

      for (const id of nodeIds) markIds.add(id)
    } else if (marks.length && type !== "text") unsupportedMark = true

    if (type === "text") {
      const textValue = reviewStringSchema.safeParse(node.text)

      if (textValue.success) {
        const text = textValue.data

        if (node.mode === undefined || node.mode === "normal") {
          sourceTextCounts.set(text, (sourceTextCounts.get(text) ?? 0) + 1)

          if (marks.length) {
            if (!text.length) unsupportedMark = true

            const ids = marks.flatMap((mark) =>
              reviewMarkIdsSchema.parse(mark.ids),
            )

            const descriptors = markNodesByText.get(text) ?? []

            for (const id of ids) anchoredIds.add(id)
            markNodesByText.set(text, [...descriptors, ...marks])
          }
        } else if (marks.length) unsupportedMark = true
      } else if (marks.length) unsupportedMark = true
    }

    if (node.children !== undefined) {
      if (!Array.isArray(node.children))
        throw new Error("Review mark children must be an array.")

      for (const child of node.children) visitSource(child, marks)
    }

    if (node.$slots !== undefined) {
      const slots = reviewJsonObjectSchema.parse(node.$slots)

      for (const slot of Object.values(slots)) visitSource(slot, marks)
    }
  }

  visitSource(sourceRoot, [])

  if (!markIds.size) return target

  if (unsupportedMark || [...markIds].some((id) => !anchoredIds.has(id)))
    return null

  function visitTarget(value: ReviewJsonValue) {
    const node = reviewJsonObjectSchema.parse(value)

    if (node.type === "text") {
      const textValue = reviewStringSchema.safeParse(node.text)

      if (
        textValue.success &&
        (node.mode === undefined || node.mode === "normal")
      ) {
        const text = textValue.data
        targetTextCounts.set(text, (targetTextCounts.get(text) ?? 0) + 1)
      }
    }

    if (Array.isArray(node.children))
      for (const child of node.children) visitTarget(child)

    if (node.$slots !== undefined) {
      const slots = reviewJsonObjectSchema.parse(node.$slots)

      for (const slot of Object.values(slots)) visitTarget(slot)
    }
  }

  visitTarget(target.root)

  for (const text of markNodesByText.keys())
    if (sourceTextCounts.get(text) !== 1 || targetTextCounts.get(text) !== 1)
      return null

  function addMarks(value: ReviewJsonValue): ReviewJsonValue {
    if (Array.isArray(value)) return value.map(addMarks)

    if (!isReviewJsonObject(value)) return value

    const node = { ...value }

    if (Array.isArray(node.children))
      node.children = node.children.map(addMarks)

    if (node.$slots !== undefined) {
      const slots = reviewJsonObjectSchema.parse(node.$slots)
      node.$slots = Object.fromEntries(
        Object.entries(slots).map(([name, slot]) => [name, addMarks(slot)]),
      )
    }

    if (node.type === "text") {
      const textValue = reviewStringSchema.safeParse(node.text)

      if (textValue.success) {
        const marks = markNodesByText.get(textValue.data)

        if (marks) {
          let markedNode: ReviewJsonValue = node

          for (let index = marks.length - 1; index >= 0; index--)
            markedNode = { ...marks[index], children: [markedNode] }

          return markedNode
        }
      }
    }

    return node
  }

  return { root: reviewJsonObjectSchema.parse(addMarks(target.root)) }
}

function nodeText(value: ReviewJsonValue) {
  const pieces: string[] = []
  const pending = [value]
  let size = 0

  while (pending.length && size < 96) {
    const currentValue = pending.pop()!
    const current = reviewJsonObjectSchema.parse(currentValue)

    const textValue = reviewStringSchema.safeParse(current.text)

    if (textValue.success) {
      const remaining = 96 - size
      const part = textValue.data.slice(0, remaining)
      pieces.push(part)
      size += part.length
    }

    if (Array.isArray(current.children))
      pending.push(...current.children.slice().reverse())
  }

  return pieces.join("").slice(0, 96)
}

function nodeSummary(value: ReviewJsonValue) {
  const type = reviewTreeNodeType(value)
  const text = nodeText(value)
  const summary = text ? `${type}: ${text}` : type

  return summary.length > 128 ? `${summary.slice(0, 125)}...` : summary
}

function fieldSummary(value: ReviewJsonValue | undefined) {
  if (value === undefined) return "(unset)"
  const serialized = JSON.stringify(canonicalizeReviewJson(value))

  return serialized.length > 96 ? `${serialized.slice(0, 93)}...` : serialized
}

function appendLcsPairs(
  before: ReviewJsonValue[],
  after: ReviewJsonValue[],
  pairs: EditorReviewTreePair[],
  usedBefore: Set<number>,
  usedAfter: Set<number>,
  signature: (node: ReviewJsonValue) => string = nodeSignature,
) {
  const width = after.length + 1
  const table = new Uint16Array((before.length + 1) * width)
  const signaturesBefore = before.map(signature)
  const signaturesAfter = after.map(signature)

  for (let beforeIndex = before.length - 1; beforeIndex >= 0; beforeIndex--)
    for (let afterIndex = after.length - 1; afterIndex >= 0; afterIndex--)
      table[beforeIndex * width + afterIndex] =
        signaturesBefore[beforeIndex] === signaturesAfter[afterIndex]
          ? 1 + table[(beforeIndex + 1) * width + afterIndex + 1]
          : Math.max(
              table[(beforeIndex + 1) * width + afterIndex],
              table[beforeIndex * width + afterIndex + 1],
            )

  let beforeIndex = 0
  let afterIndex = 0

  while (beforeIndex < before.length && afterIndex < after.length) {
    if (signaturesBefore[beforeIndex] === signaturesAfter[afterIndex]) {
      pairs.push({ beforeIndex, afterIndex, exact: true })
      usedBefore.add(beforeIndex)
      usedAfter.add(afterIndex)
      beforeIndex++
      afterIndex++
    } else if (
      table[(beforeIndex + 1) * width + afterIndex] >=
      table[beforeIndex * width + afterIndex + 1]
    )
      beforeIndex++
    else afterIndex++
  }

  const beforeBySignature = new Map<string, number[]>()
  const afterBySignature = new Map<string, number[]>()

  for (let index = 0; index < before.length; index++) {
    const signature = signaturesBefore[index]
    const indexes = beforeBySignature.get(signature) ?? []
    indexes.push(index)
    beforeBySignature.set(signature, indexes)
  }

  for (let index = 0; index < after.length; index++) {
    const signature = signaturesAfter[index]
    const indexes = afterBySignature.get(signature) ?? []
    indexes.push(index)
    afterBySignature.set(signature, indexes)
  }

  for (const [signature, beforeIndexes] of beforeBySignature) {
    const afterIndexes = afterBySignature.get(signature)

    if (
      beforeIndexes.length !== 1 ||
      afterIndexes?.length !== 1 ||
      usedBefore.has(beforeIndexes[0]) ||
      usedAfter.has(afterIndexes[0])
    )
      continue

    const sourceIndex = beforeIndexes[0]
    const targetIndex = afterIndexes[0]
    pairs.push({
      beforeIndex: sourceIndex,
      afterIndex: targetIndex,
      exact: true,
    })
    usedBefore.add(sourceIndex)
    usedAfter.add(targetIndex)
  }
}

function diffReviewTreeNode(
  before: ReviewJsonValue,
  after: ReviewJsonValue,
  path: number[],
  changes: EditorReviewTreeChange[],
) {
  const beforeType = reviewTreeNodeType(before)
  const afterType = reviewTreeNodeType(after)

  if (beforeType !== afterType) {
    changes.push({
      kind: "replace",
      path: [...path],
      beforeType,
      afterType,
      before: nodeSummary(before),
      after: nodeSummary(after),
    })

    return
  }

  const beforeNode = reviewJsonObjectSchema.parse(before)
  const afterNode = reviewJsonObjectSchema.parse(after)

  const propertyKeys = new Set([
    ...Object.keys(beforeNode).filter(
      (key) => key !== "children" && key !== "type",
    ),
    ...Object.keys(afterNode).filter(
      (key) => key !== "children" && key !== "type",
    ),
  ])

  for (const property of [...propertyKeys].sort()) {
    const beforeValue = beforeNode[property]
    const afterValue = afterNode[property]

    if (
      beforeValue === undefined
        ? afterValue === undefined
        : afterValue !== undefined &&
          nodeSignature(beforeValue) === nodeSignature(afterValue)
    )
      continue

    changes.push({
      kind: "property",
      path: [...path],
      nodeType: beforeType,
      property,
      before: fieldSummary(beforeValue),
      after: fieldSummary(afterValue),
    })
  }

  const beforeChildren = Array.isArray(beforeNode.children)
    ? beforeNode.children
    : []

  const afterChildren = Array.isArray(afterNode.children)
    ? afterNode.children
    : []

  diffReviewTreeChildren(beforeChildren, afterChildren, path, changes)
}

function diffReviewTreeChildren(
  before: ReviewJsonValue[],
  after: ReviewJsonValue[],
  parentPath: number[],
  changes: EditorReviewTreeChange[],
) {
  const pairs: EditorReviewTreePair[] = []
  const usedBefore = new Set<number>()
  const usedAfter = new Set<number>()
  appendLcsPairs(before, after, pairs, usedBefore, usedAfter)

  const beforeRemaining = before.flatMap((node, index) =>
    usedBefore.has(index) ? [] : [{ node, index }],
  )

  const afterRemaining = after.flatMap((node, index) =>
    usedAfter.has(index) ? [] : [{ node, index }],
  )

  const sharedLength = Math.min(beforeRemaining.length, afterRemaining.length)

  for (let index = 0; index < sharedLength; index++) {
    const source = beforeRemaining[index]
    const target = afterRemaining[index]

    if (reviewTreeNodeType(source.node) !== reviewTreeNodeType(target.node)) {
      if (beforeRemaining.length !== 1 || afterRemaining.length !== 1) continue

      pairs.push({
        beforeIndex: source.index,
        afterIndex: target.index,
        exact: false,
      })
      usedBefore.add(source.index)
      usedAfter.add(target.index)

      continue
    }

    if (
      reviewTreeNodeType(source.node) === "linebreak" &&
      nodeSignature(source.node) !== nodeSignature(target.node)
    )
      continue

    pairs.push({
      beforeIndex: source.index,
      afterIndex: target.index,
      exact: nodeSignature(source.node) === nodeSignature(target.node),
    })
    usedBefore.add(source.index)
    usedAfter.add(target.index)
  }

  pairs.sort((left, right) => left.beforeIndex - right.beforeIndex)
  let greatestAfterIndex = -1

  for (const pair of pairs) {
    const source = before[pair.beforeIndex]!
    const target = after[pair.afterIndex]!

    if (pair.afterIndex < greatestAfterIndex) {
      const nodeType = reviewTreeNodeType(source)
      changes.push({
        kind: "move",
        path: [...parentPath, pair.beforeIndex],
        fromPath: [...parentPath, pair.beforeIndex],
        toPath: [...parentPath, pair.afterIndex],
        nodeType,
        before: nodeSummary(source),
        after: nodeSummary(target),
      })
    }

    greatestAfterIndex = Math.max(greatestAfterIndex, pair.afterIndex)

    if (!pair.exact)
      diffReviewTreeNode(
        source,
        target,
        [...parentPath, pair.beforeIndex],
        changes,
      )
  }

  for (let index = 0; index < before.length; index++) {
    if (usedBefore.has(index)) continue
    const node = before[index]!
    const kind = reviewTreeNodeType(node) === "linebreak" ? "break" : "remove"

    changes.push({
      kind,
      path: [...parentPath, index],
      nodeType: reviewTreeNodeType(node),
      before: nodeSummary(node),
      after: "(removed)",
    })
  }

  for (let index = 0; index < after.length; index++) {
    if (usedAfter.has(index)) continue
    const node = after[index]!
    const kind = reviewTreeNodeType(node) === "linebreak" ? "break" : "insert"

    changes.push({
      kind,
      path: [...parentPath, index],
      nodeType: reviewTreeNodeType(node),
      before: "(inserted)",
      after: nodeSummary(node),
    })
  }
}

export function deriveEditorReviewTreeDiff<BeforeInput, AfterInput>(
  beforeInput: BeforeInput,
  afterInput: AfterInput,
) {
  const before = parseEditorReviewTreeDocument(beforeInput)
  const after = parseEditorReviewTreeDocument(afterInput)
  const changes: EditorReviewTreeChange[] = []

  diffReviewTreeNode(before.root, after.root, [], changes)

  if (changes.length > reviewTreeChangeLimit)
    throw new Error("Review tree diff exceeds its change limit.")

  return Object.freeze(
    changes.map((change) => {
      const frozenChange = {
        ...change,
        path: Object.freeze([...change.path]),
      }

      if (change.fromPath)
        frozenChange.fromPath = Object.freeze([...change.fromPath])

      if (change.toPath) frozenChange.toPath = Object.freeze([...change.toPath])

      return Object.freeze(frozenChange)
    }),
  )
}
