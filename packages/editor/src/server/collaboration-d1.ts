import { z } from "zod"

import { CollaborationError } from "./collaboration/protocol"
import { rowSchema } from "./document-validation"

const bootstrapSchema = rowSchema.extend({
  phase: z.enum(["prepared", "active"]).nullable(),
  coordinator_id: z
    .string()
    .regex(/^[0-9a-f]{64}$/)
    .nullable(),
  seed: z
    .union([
      z.instanceof(ArrayBuffer),
      z.array(z.number().int().min(0).max(255)).max(61440),
    ])
    .nullable(),
  seed_generation: z.string().nullable(),
  seed_revision: z.string().nullable(),
})

export type CanonicalDocument =
  | (Omit<z.infer<typeof bootstrapSchema>, "seed"> & {
      seed: Uint8Array | null
    })
  | null

export interface CollaborationCanonical {
  read(documentId: string): Promise<CanonicalDocument>
  prepare(
    document: NonNullable<CanonicalDocument>,
    seed: Uint8Array,
    coordinatorId: string,
  ): Promise<void>
  activate(document: NonNullable<CanonicalDocument>): Promise<void>
}

export type CollaborationD1Row = z.input<typeof bootstrapSchema>

export interface CollaborationD1Result {
  success: boolean
}

export interface CollaborationD1Statement {
  bind(...values: (string | ArrayBuffer | null)[]): CollaborationD1Statement
  first(): Promise<CollaborationD1Row | null>
  run(): Promise<CollaborationD1Result & { meta: { changes: number } }>
}

export interface CollaborationD1Session {
  prepare(sql: string): CollaborationD1Statement
  batch(
    statements: CollaborationD1Statement[],
  ): Promise<CollaborationD1Result[]>
}

export interface CollaborationD1Binding {
  withSession(constraint: "first-primary"): CollaborationD1Session
}

export function createD1CollaborationCanonical(
  binding: CollaborationD1Binding,
) {
  return {
    async read(documentId: string) {
      const result = await binding
        .withSession("first-primary")
        .prepare(
          `SELECT d.document_id,d.generation,CAST(d.revision AS TEXT) AS revision,d.mode,d.state_json,d.schema_version,d.deleted,b.phase,b.coordinator_id,b.seed,b.generation AS seed_generation,b.revision AS seed_revision FROM editor_documents d LEFT JOIN editor_do_bootstrap b ON b.document_id=d.document_id WHERE d.document_id=?`,
        )
        .bind(documentId)
        .first()

      if (result === null) return null
      const row = bootstrapSchema.parse(result)

      if (
        row.phase !== null &&
        (row.mode !== "yjs" ||
          row.deleted !== 0 ||
          row.generation !== row.seed_generation ||
          row.revision !== row.seed_revision ||
          row.seed === null ||
          row.coordinator_id === null)
      )
        throw new CollaborationError("conflict")

      return {
        ...row,
        seed:
          row.seed === null
            ? null
            : new Uint8Array(
                row.seed instanceof ArrayBuffer ? row.seed : row.seed,
              ),
      }
    },
    async prepare(
      document: NonNullable<CanonicalDocument>,
      seed: Uint8Array,
      coordinatorId: string,
    ) {
      const session = binding.withSession("first-primary")

      const results = await session.batch([
        session
          .prepare(
            `INSERT INTO editor_do_bootstrap(document_id,generation,revision,seed,coordinator_id,phase) SELECT document_id,generation,CAST(revision AS TEXT),?,?,'prepared' FROM editor_documents WHERE document_id=? AND generation=? AND CAST(revision AS TEXT)=? AND mode='snapshot' AND deleted=0 ON CONFLICT(document_id) DO NOTHING`,
          )
          .bind(
            seed.slice().buffer,
            coordinatorId,
            document.document_id,
            document.generation,
            document.revision,
          ),
        session
          .prepare(
            `UPDATE editor_documents SET mode='yjs' WHERE document_id=? AND generation=? AND CAST(revision AS TEXT)=? AND mode='snapshot' AND deleted=0 AND EXISTS(SELECT 1 FROM editor_do_bootstrap b WHERE b.document_id=editor_documents.document_id AND b.generation=editor_documents.generation AND b.revision=CAST(editor_documents.revision AS TEXT) AND b.phase='prepared')`,
          )
          .bind(document.document_id, document.generation, document.revision),
      ])

      if (
        results.length !== 2 ||
        results.some((result) => result.success !== true)
      )
        throw new CollaborationError("uncertain")
    },
    async activate(document: NonNullable<CanonicalDocument>) {
      const result = await binding
        .withSession("first-primary")
        .prepare(
          `UPDATE editor_do_bootstrap SET phase='active' WHERE document_id=? AND generation=? AND revision=? AND coordinator_id=? AND EXISTS(SELECT 1 FROM editor_documents d WHERE d.document_id=editor_do_bootstrap.document_id AND d.generation=editor_do_bootstrap.generation AND CAST(d.revision AS TEXT)=editor_do_bootstrap.revision AND d.mode='yjs' AND d.deleted=0)`,
        )
        .bind(
          document.document_id,
          document.generation,
          document.revision,
          document.coordinator_id,
        )
        .run()

      if (!result.success || result.meta.changes !== 1)
        throw new CollaborationError("uncertain")
    },
  }
}
