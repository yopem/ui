import type {
  CanonicalDocument,
  CollaborationD1Binding,
  CollaborationD1Result,
  CollaborationD1Statement,
} from "@editor/server/collaboration-d1"

import { createD1CollaborationCanonical } from "@editor/server/collaboration-d1"
import { CollaborationError } from "@editor/server/collaboration/protocol"
import { describe, expect, test } from "bun:test"

const document: NonNullable<CanonicalDocument> = {
  document_id: "document:canonical",
  generation: "a".repeat(64),
  revision: "1",
  mode: "snapshot",
  state_json: '{"root":{"children":[],"type":"root","version":1}}',
  schema_version: 1,
  deleted: 0,
  phase: null,
  coordinator_id: null,
  seed: null,
  seed_generation: null,
  seed_revision: null,
}

function createBinding(results: CollaborationD1Result[]) {
  const statement: CollaborationD1Statement = {
    bind() {
      return statement
    },
    first() {
      return Promise.resolve(null)
    },
    run() {
      return Promise.resolve({ success: true, meta: { changes: 1 } })
    },
  }

  const binding: CollaborationD1Binding = {
    withSession() {
      return {
        prepare() {
          return statement
        },
        batch() {
          return Promise.resolve(results)
        },
      }
    },
  }

  return binding
}

describe("D1 canonical collaboration transition", () => {
  for (const results of [
    [],
    [{ success: true }],
    [{ success: true }, { success: true }, { success: true }],
    [{ success: false }, { success: true }],
    [{ success: true }, { success: false }],
    [{ success: false }, { success: false }],
  ]) {
    test(`rejects incomplete or failed batch ${JSON.stringify(results)}`, async () => {
      const canonical = createD1CollaborationCanonical(createBinding(results))

      let failure: CollaborationError | null = null

      try {
        await canonical.prepare(
          document,
          new Uint8Array([0, 0]),
          "b".repeat(64),
        )
      } catch (cause) {
        if (!(cause instanceof CollaborationError)) throw cause
        failure = cause
      }

      expect(failure?.code).toBe("uncertain")
    })
  }

  test("accepts exactly two successful transition results", async () => {
    const canonical = createD1CollaborationCanonical(
      createBinding([{ success: true }, { success: true }]),
    )

    await canonical.prepare(document, new Uint8Array([0, 0]), "b".repeat(64))
  })
})
