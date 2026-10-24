import { createEditorCollaborationInitializer } from "@editor/server/collaboration-initialize"
import { createPostgresCollaborationLog } from "@editor/server/collaboration-postgres"
import { PGlite } from "@electric-sql/pglite"
import { buildEditorFromExtensions } from "@lexical/extension"
import { HeadlessExtension } from "@lexical/headless"
import { afterEach, describe, expect, test } from "bun:test"
import { $createParagraphNode, $createTextNode, $getRoot } from "lexical"
import { readFile } from "node:fs/promises"
import * as Y from "yjs"

const databases: PGlite[] = []

const generation = "a".repeat(64)

function context() {
  return {
    identity: { provider: "openauth" as const, userId: "alice" },
    credentialExpiresAt: Date.now() + 60000,
    signal: new AbortController().signal,
    deadline: Date.now() + 10000,
  }
}

function createHeadlessTestEditor() {
  return buildEditorFromExtensions(HeadlessExtension, {
    name: "collaboration/test",
    namespace: "collaboration-test",
  })
}

async function expectRejection<T>(operation: Promise<T>) {
  try {
    await operation
  } catch (cause) {
    expect(cause).toBeInstanceOf(Error)

    return
  }

  throw new Error("Expected collaboration initialization to reject")
}

function snapshot(text: string) {
  const editor = createHeadlessTestEditor()
  editor.update(
    () => {
      $getRoot().append($createParagraphNode().append($createTextNode(text)))
    },
    { discrete: true },
  )
  const state = JSON.stringify(editor.getEditorState().toJSON())
  editor.dispose()

  return state
}

async function database() {
  const db = new PGlite()
  databases.push(db)
  await db.exec(
    await readFile(
      new URL(
        "../../packages/editor/src/server/migrations/postgres/0001-document-snapshots.sql",
        import.meta.url,
      ),
      "utf8",
    ),
  )
  await db.exec(
    await readFile(
      new URL(
        "../../packages/editor/src/server/collaboration/0002-collaboration.sql",
        import.meta.url,
      ),
      "utf8",
    ),
  )
  await db.query(
    "INSERT INTO editor_documents VALUES($1,$2,1,'snapshot',$3,1,0,$4)",
    ["host/doc", generation, snapshot("saved"), "b".repeat(64)],
  )
  await db.query("INSERT INTO editor_generations VALUES($1,$2)", [
    generation,
    "host/doc",
  ])

  return db
}

afterEach(async function closeDatabases() {
  for (const db of databases.splice(0)) await db.close()
})

describe("authoritative Lexical collaboration bootstrap", function bootstrapContracts() {
  test("converts a host-validated snapshot with the official Lexical Yjs binding", async function convertsSnapshot() {
    const initialize = createEditorCollaborationInitializer({
      createEditor() {
        return createHeadlessTestEditor()
      },
      validateState() {
        return true
      },
    })

    const update = await initialize({
      documentId: "host/doc",
      state: snapshot("saved text"),
      schemaVersion: 1,
      signal: new AbortController().signal,
    })

    const doc = new Y.Doc()
    Y.applyUpdate(doc, update)
    expect(update.byteLength).toBeLessThanOrEqual(61440)
    expect(doc.get("root", Y.XmlText).toJSON()).toContain("saved text")
    doc.destroy()
  })

  test("rejects invalid host schema, unsupported Lexical nodes, and oversized JSON", async function rejectsInvalidSnapshots() {
    const initialize = createEditorCollaborationInitializer({
      createEditor() {
        return createHeadlessTestEditor()
      },
      validateState() {
        return false
      },
    })

    const signal = new AbortController().signal
    await expectRejection(
      initialize({
        documentId: "host/doc",
        state: snapshot("saved"),
        schemaVersion: 1,
        signal,
      }),
    )

    const accepts = createEditorCollaborationInitializer({
      createEditor() {
        return createHeadlessTestEditor()
      },
      validateState() {
        return true
      },
    })

    await expectRejection(
      accepts({
        documentId: "host/doc",
        state: JSON.stringify({
          root: {
            type: "root",
            children: [{ type: "not-registered", version: 1 }],
          },
        }),
        schemaVersion: 1,
        signal,
      }),
    )
    await expectRejection(
      accepts({
        documentId: "host/doc",
        state: `{"root":{"type":"root","children":[]},"padding":"${"x".repeat(1048576)}"}`,
        schemaVersion: 1,
        signal,
      }),
    )
  })

  test("disposes a native extension editor after conversion rejects", async function disposesEditor() {
    let disposed = false

    const initialize = createEditorCollaborationInitializer({
      createEditor() {
        const editor = createHeadlessTestEditor()
        const dispose = editor.dispose

        return Object.assign(editor, {
          dispose() {
            disposed = true
            dispose()
          },
        })
      },
      validateState() {
        return true
      },
    })

    await expectRejection(
      initialize({
        documentId: "host/doc",
        state: JSON.stringify({
          root: {
            type: "root",
            children: [{ type: "not-registered", version: 1 }],
          },
        }),
        schemaVersion: 1,
        signal: new AbortController().signal,
      }),
    )
    expect(disposed).toBe(true)
  })

  test("failed conversion leaves canonical document in snapshot mode", async function modeIsUnchanged() {
    const db = await database()

    const transactions = {
      async run<T>(
        signal: AbortSignal,
        deadline: number,
        work: (
          query: (
            text: string,
            values: (string | Uint8Array)[],
          ) => Promise<unknown[]>,
        ) => Promise<T>,
      ) {
        return await db.transaction(async (tx) => {
          const value = await work(async (text, values) => {
            signal.throwIfAborted()

            if (Date.now() >= deadline) throw new Error("deadline")

            return (await tx.query(text, values)).rows
          })

          signal.throwIfAborted()

          if (Date.now() >= deadline) throw new Error("deadline")

          return value
        })
      },
    }

    const log = createPostgresCollaborationLog({
      transactions,
      timeoutMs: 1000,
      maxConcurrent: 2,
      policy: function allowCollaboration() {
        return Promise.resolve(true)
      },
    })

    const initialize = createEditorCollaborationInitializer({
      createEditor() {
        return createHeadlessTestEditor()
      },
      validateState() {
        return false
      },
    })

    await expectRejection(
      log.initialize(
        {
          documentId: "host/doc",
          generation,
          revision: "1",
          initialize,
        },
        context(),
      ),
    )

    const result = await db.query<{ mode: string }>(
      "SELECT mode FROM editor_documents WHERE document_id=$1",
      ["host/doc"],
    )

    expect(result.rows).toEqual([{ mode: "snapshot" }])
  })
})
