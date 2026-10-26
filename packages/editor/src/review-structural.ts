import { z } from "zod"

import {
  canonicalEditorReviewTreeJSON,
  deriveEditorReviewTreeDiff,
  parseEditorReviewTreeDocument,
  type EditorReviewTreeChange,
  type EditorReviewTreeDocument,
} from "./review-tree-diff"
import { checkReviewComplexity } from "./review-validation"

const reviewIdSchema = z
  .string()
  .min(1)
  .max(128)
  .regex(/^[A-Za-z0-9_-]+$/)

const authorSchema = z
  .strictObject({
    id: reviewIdSchema,
    name: z.string().trim().min(1).max(200),
  })
  .readonly()

const pathSchema = z.array(z.number().int().min(0).max(255)).max(24).readonly()

const changeSchema = z
  .strictObject({
    kind: z.enum(["break", "insert", "move", "property", "remove", "replace"]),
    path: pathSchema,
    fromPath: pathSchema.optional(),
    toPath: pathSchema.optional(),
    nodeType: z.string().min(1).max(128).optional(),
    beforeType: z.string().min(1).max(128).optional(),
    afterType: z.string().min(1).max(128).optional(),
    property: z.string().min(1).max(128).optional(),
    before: z.string().max(128).optional(),
    after: z.string().max(128).optional(),
  })
  .readonly()

const anchorSchema = z
  .strictObject({
    changeIndex: z.number().int().min(0).max(127),
    beforePath: pathSchema.nullable(),
    afterPath: pathSchema.nullable(),
  })
  .readonly()

const proposalSchema = z.strictObject({
  id: reviewIdSchema,
  author: authorSchema,
  createdAt: z.number().int().nonnegative().max(8640000000000000),
  before: z.unknown(),
  after: z.unknown(),
  precondition: z.string().max(262144),
  changes: z.array(changeSchema).min(1).max(128).readonly(),
  anchors: z.array(anchorSchema).min(1).max(128).readonly(),
})

const structuralStateSchema = z
  .strictObject({
    version: z.literal(1),
    proposals: z.array(proposalSchema).max(1).readonly(),
  })
  .readonly()

export interface EditorReviewStructuralAnchor {
  readonly changeIndex: number
  readonly beforePath: readonly number[] | null
  readonly afterPath: readonly number[] | null
}

export interface EditorReviewStructuralProposal {
  readonly id: string
  readonly author: {
    readonly id: string
    readonly name: string
  }
  readonly createdAt: number
  readonly before: EditorReviewTreeDocument
  readonly after: EditorReviewTreeDocument
  readonly precondition: string
  readonly changes: readonly EditorReviewTreeChange[]
  readonly anchors: readonly EditorReviewStructuralAnchor[]
}

export interface EditorReviewStructuralState {
  readonly version: 1
  readonly proposals: readonly EditorReviewStructuralProposal[]
}

function anchorsFor(changes: readonly EditorReviewTreeChange[]) {
  return Object.freeze(
    changes.map((change, changeIndex) =>
      Object.freeze({
        changeIndex,
        beforePath:
          change.kind === "insert" ||
          (change.kind === "break" && change.before === "(inserted)")
            ? null
            : (change.fromPath ?? change.path),
        afterPath:
          change.kind === "remove" ||
          (change.kind === "break" && change.after === "(removed)")
            ? null
            : (change.toPath ?? change.path),
      }),
    ),
  )
}

export function parseEditorReviewStructural<Input>(input: Input) {
  checkReviewComplexity(input, 64)
  const value = structuralStateSchema.parse(input)
  const proposalIds = new Set<string>()

  const proposals = value.proposals.map((proposal) => {
    if (proposalIds.has(proposal.id))
      throw new Error("Structural proposal IDs must be unique.")
    proposalIds.add(proposal.id)

    const before = parseEditorReviewTreeDocument(proposal.before)
    const after = parseEditorReviewTreeDocument(proposal.after)
    const beforeJSON = canonicalEditorReviewTreeJSON(before)
    const afterJSON = canonicalEditorReviewTreeJSON(after)

    if (proposal.precondition !== beforeJSON)
      throw new Error(
        "Structural proposal precondition does not match its source.",
      )
    const changes = deriveEditorReviewTreeDiff(before, after)

    if (
      !changes.length ||
      JSON.stringify(changes) !== JSON.stringify(proposal.changes)
    )
      throw new Error("Structural proposal changes do not match its documents.")
    const anchors = anchorsFor(changes)

    if (JSON.stringify(anchors) !== JSON.stringify(proposal.anchors))
      throw new Error("Structural proposal anchors do not match its changes.")

    if (new TextEncoder().encode(beforeJSON).byteLength > 131072)
      throw new Error("Structural proposal source exceeds its byte limit.")

    if (new TextEncoder().encode(afterJSON).byteLength > 131072)
      throw new Error("Structural proposal target exceeds its byte limit.")

    return Object.freeze({
      id: proposal.id,
      author: proposal.author,
      createdAt: proposal.createdAt,
      before,
      after,
      precondition: proposal.precondition,
      changes,
      anchors,
    })
  })

  return Object.freeze({
    version: value.version,
    proposals: Object.freeze(proposals),
  }) satisfies EditorReviewStructuralState
}

export const emptyEditorReviewStructural = parseEditorReviewStructural({
  version: 1,
  proposals: [],
})

export { anchorsFor as deriveEditorReviewStructuralAnchors }
