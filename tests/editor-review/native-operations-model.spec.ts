import { createEditorReviewNativeOperationSnapshots } from "@editor/review-operation-native"
import { buildEditorFromExtensions } from "@lexical/extension"
import { MarkExtension } from "@lexical/mark"
import { RichTextExtension } from "@lexical/rich-text"
import { parseReviewDocumentJSON } from "@yopem-ui/editor/review-codecs"
import { createEditorReview } from "@yopem-ui/editor/review-extension"
import { deriveEditorReviewTreeDiff } from "@yopem-ui/editor/review-tree-diff"
import { expect, test } from "bun:test"
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  defineExtension,
  type SerializedEditorState,
} from "lexical"
import { z } from "zod"

const jsonValueSchema = z.json()

const jsonObjectSchema = z.record(z.string(), jsonValueSchema)

const reviewDocumentSchema = z.object({ root: jsonObjectSchema })

type JsonObject = z.infer<typeof jsonObjectSchema>

type ReviewDocument = z.infer<typeof reviewDocumentSchema>

type NativeDocumentInput = ReviewDocument | SerializedEditorState

function createNativeEditor() {
  return buildEditorFromExtensions(
    defineExtension({
      name: `review-native-operation-${crypto.randomUUID()}`,
      dependencies: [MarkExtension, RichTextExtension],
      onError(error) {
        throw error
      },
    }),
  )
}

function document(...children: JsonObject[]): ReviewDocument {
  return reviewDocumentSchema.parse({ root: { type: "root", children } })
}

function paragraph(text: string, properties: JsonObject = {}): JsonObject {
  return jsonObjectSchema.parse({
    type: "paragraph",
    ...properties,
    children: [{ type: "text", text }],
  })
}

function parseSnapshot(source: string): ReviewDocument {
  return reviewDocumentSchema.parse(parseReviewDocumentJSON(source, true, true))
}

function cloneDocument(input: NativeDocumentInput): ReviewDocument {
  const serialized = JSON.stringify(input)

  if (serialized === undefined) throw new Error("Snapshot is not serializable.")

  return parseSnapshot(serialized)
}

function rootOf(input: ReviewDocument): JsonObject {
  return jsonObjectSchema.parse(input.root)
}

function changesFor(before: string, after: string) {
  return deriveEditorReviewTreeDiff(parseSnapshot(before), parseSnapshot(after))
}

test("validates native block insertion, deletion, move, and property changes", () => {
  const cases = [
    {
      before: document(paragraph("One"), paragraph("Two")),
      after: document(paragraph("One"), paragraph("Added"), paragraph("Two")),
      kind: "insert",
    },
    {
      before: document(paragraph("One"), paragraph("Two")),
      after: document(paragraph("One")),
      kind: "remove",
    },
    {
      before: document(paragraph("One"), paragraph("Two")),
      after: document(paragraph("Two"), paragraph("One")),
      kind: "move",
    },
    {
      before: document(paragraph("One")),
      after: document(paragraph("One", { indent: 1 })),
      kind: "property",
    },
  ] as const

  for (const item of cases) {
    using editor = createNativeEditor()

    const snapshots = createEditorReviewNativeOperationSnapshots(
      editor,
      item.before,
      item.after,
    )

    expect(snapshots).not.toBeNull()

    if (!snapshots) throw new Error("Expected a validated native operation.")

    expect(
      changesFor(snapshots.before, snapshots.after).map(({ kind }) => kind),
    ).toContain(item.kind)
  }
})

test("normalizes native defaults and rejects a canonical no-op", () => {
  using editor = createNativeEditor()

  const before = document({
    type: "paragraph",
    children: [{ type: "text", text: "Same" }],
  })

  const after = document({
    type: "paragraph",
    version: 1,
    direction: null,
    format: "",
    indent: 0,
    textFormat: 0,
    textStyle: "",
    children: [
      {
        type: "text",
        version: 1,
        text: "Same",
        format: 0,
        detail: 0,
        mode: "normal",
        style: "",
      },
    ],
  })

  expect(
    createEditorReviewNativeOperationSnapshots(editor, before, after),
  ).toBeNull()
})

test("rejects unsupported, oversized, deep, and pending-review documents", () => {
  using editor = createNativeEditor()
  const oversized = document(paragraph("x".repeat(140000)))

  const overNodeLimit = document(
    ...Array.from({ length: 5 }, () =>
      jsonObjectSchema.parse({
        type: "paragraph",
        children: Array.from({ length: 256 }, (_, index) => ({
          type: "text",
          text: "x",
          format: index % 2,
        })),
      }),
    ),
  )

  const pendingReview = document(paragraph("Pending"))
  pendingReview.root.$ = {
    yopemReviewStructural: {
      version: 1,
      proposals: [],
    },
  }
  let deepNode = paragraph("Deep")

  for (let depth = 0; depth < 26; depth++)
    deepNode = jsonObjectSchema.parse({
      type: "paragraph",
      children: [deepNode],
    })

  expect(() =>
    createEditorReviewNativeOperationSnapshots(
      editor,
      document(paragraph("Small")),
      oversized,
    ),
  ).toThrow()
  expect(() =>
    createEditorReviewNativeOperationSnapshots(
      editor,
      document(paragraph("Small")),
      overNodeLimit,
    ),
  ).toThrow()
  expect(() =>
    createEditorReviewNativeOperationSnapshots(
      editor,
      document(paragraph("Small")),
      document(deepNode),
    ),
  ).toThrow()
  expect(() =>
    createEditorReviewNativeOperationSnapshots(
      editor,
      document(paragraph("Small")),
      pendingReview,
    ),
  ).toThrow()
  expect(() =>
    createEditorReviewNativeOperationSnapshots(
      editor,
      document(paragraph("Small")),
      document({ type: "unregistered-native-node" }),
    ),
  ).toThrow()
})

test("retains native formatting, comment marks, and the trusted root review state", () => {
  using editor = createNativeEditor()
  const controller = createEditorReview()
  const cleanup = controller.register(editor)
  const review = controller.forEditor(editor)
  review.setHost({
    viewer: { id: "alice", name: "Alice" },
    visible: true,
    replyWhileReadonly: false,
    can: () => true,
  })
  editor.update(
    () => {
      $getRoot().append(
        $createParagraphNode().append($createTextNode("Anchor text")),
      )
    },
    { discrete: true },
  )
  editor.update(
    () => {
      $getRoot().getAllTextNodes()[0]?.select(0, 6)
      review.$createThread("Comment")
    },
    { discrete: true },
  )
  const before = editor.getEditorState().toJSON()

  editor.update(
    () => {
      $getRoot().getAllTextNodes()[0]?.setFormat("bold")
    },
    { discrete: true },
  )

  const after = cloneDocument(editor.getEditorState().toJSON())
  const afterRoot = rootOf(after)
  const afterState = jsonObjectSchema.parse(afterRoot.$)
  delete afterState.yopemReview
  afterRoot.$ = afterState
  after.root = afterRoot

  const snapshots = createEditorReviewNativeOperationSnapshots(
    editor,
    before,
    after,
  )

  expect(snapshots).not.toBeNull()

  if (!snapshots) throw new Error("Expected a validated native operation.")

  const beforeRoot = rootOf(parseSnapshot(snapshots.before))
  const normalizedAfterRoot = rootOf(parseSnapshot(snapshots.after))
  const normalizedAfterState = jsonObjectSchema.parse(normalizedAfterRoot.$)

  const markNodes = normalizedAfterRoot.children
    ? z.array(jsonValueSchema).parse(normalizedAfterRoot.children)
    : []

  expect(normalizedAfterState.yopemReview).toEqual(
    jsonObjectSchema.parse(beforeRoot.$).yopemReview,
  )
  expect(JSON.stringify(markNodes)).toContain('"type":"mark"')
  expect(JSON.stringify(markNodes)).toContain('"ids"')
  expect(JSON.stringify(markNodes)).toContain('"format":1')
  cleanup()
})

test("rejects changed root review authority without mutating either input", () => {
  using editor = createNativeEditor()
  const controller = createEditorReview()
  const cleanup = controller.register(editor)
  const review = controller.forEditor(editor)
  review.setHost({
    viewer: { id: "alice", name: "Alice" },
    visible: true,
    replyWhileReadonly: false,
    can: () => true,
  })
  editor.update(
    () => {
      $getRoot().append(
        $createParagraphNode().append($createTextNode("Anchor text")),
      )
    },
    { discrete: true },
  )
  editor.update(
    () => {
      $getRoot().getAllTextNodes()[0]?.select(0, 6)
      review.$createThread("Comment")
    },
    { discrete: true },
  )

  const before = cloneDocument(editor.getEditorState().toJSON())
  const after = cloneDocument(before)
  const afterRoot = rootOf(after)
  const afterState = jsonObjectSchema.parse(afterRoot.$)
  const overlay = jsonObjectSchema.parse(afterState.yopemReview)
  afterState.yopemReview = { ...overlay, threads: [] }
  afterRoot.$ = afterState
  after.root = afterRoot
  const beforeSource = JSON.stringify(before)
  const afterSource = JSON.stringify(after)

  expect(() =>
    createEditorReviewNativeOperationSnapshots(editor, before, after),
  ).toThrow()
  expect(JSON.stringify(before)).toBe(beforeSource)
  expect(JSON.stringify(after)).toBe(afterSource)
  cleanup()
})
