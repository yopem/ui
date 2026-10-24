import { createPostgresCollaborationTicketStore } from "@editor/server/collaboration-tickets"
import { PGlite } from "@electric-sql/pglite"
import { afterEach, describe, expect, test } from "bun:test"
import { rejects } from "node:assert/strict"
import { readFile } from "node:fs/promises"

const databases: PGlite[] = []

const generation = "a".repeat(64)

async function fixture() {
  const db = new PGlite()
  databases.push(db)
  await db.exec(
    await readFile(
      new URL(
        "../../packages/editor/src/server/collaboration/0003-collaboration-runtime.sql",
        import.meta.url,
      ),
      "utf8",
    ),
  )

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
        const result = await work(async (text, values) => {
          signal.throwIfAborted()

          if (Date.now() >= deadline) throw new Error("deadline")

          return (await tx.query(text, values)).rows
        })

        signal.throwIfAborted()

        if (Date.now() >= deadline) throw new Error("deadline")

        return result
      })
    },
  }

  const tickets = createPostgresCollaborationTicketStore({
    transactions,
    timeoutMs: 1000,
    maxTickets: 8,
  })

  return { db, tickets }
}

afterEach(async function closeDatabases() {
  for (const db of databases.splice(0)) await db.close()
})

describe("PostgreSQL collaboration tickets and client leases", function ticketContracts() {
  test("ticket binds identity, permission, generation, and verified expiry and has one atomic consumer", async function consumesOnce() {
    const { tickets } = await fixture()
    const credentialExpiresAt = Date.now() + 60000

    const token = await tickets.issue({
      documentId: "host/doc",
      generation,
      identity: { provider: "openauth", userId: "alice" },
      permission: "write",
      credentialExpiresAt,
      expiresAt: Math.min(Date.now() + 10000, credentialExpiresAt),
    })

    const consumed = await Promise.all([
      tickets.consume(token),
      tickets.consume(token),
    ])

    expect(consumed.filter((value) => value !== null)).toHaveLength(1)
    expect(consumed.find((value) => value !== null)).toMatchObject({
      documentId: "host/doc",
      generation,
      identity: { provider: "openauth", userId: "alice" },
      permission: "write",
      credentialExpiresAt,
    })
  })

  test("rejects expired credentials and issues distinct active client ids", async function boundsLeases() {
    const { tickets } = await fixture()
    await rejects(
      tickets.issue({
        documentId: "host/doc",
        generation,
        identity: { provider: "better-auth", userId: "alice" },
        permission: "read",
        credentialExpiresAt: Date.now() - 1,
        expiresAt: Date.now() - 1,
      }),
      Error,
    )

    const input = {
      documentId: "host/doc",
      generation,
      usedClientIds: new Set([1, 2, 3]),
      expiresAt: Date.now() + 30000,
    }

    const leases = await Promise.all([
      tickets.reserveClient(input),
      tickets.reserveClient(input),
    ])

    expect(leases[0].clientId).not.toBe(leases[1].clientId)
    expect(
      leases.every((lease) => !input.usedClientIds.has(lease.clientId)),
    ).toBe(true)
    expect(
      await tickets.renewClient(leases[0].leaseId, Date.now() + 60000),
    ).toBe(true)
    await tickets.releaseClient(leases[0].leaseId)
    await tickets.releaseClient(leases[1].leaseId)
    expect(
      await tickets.renewClient(leases[0].leaseId, Date.now() + 60000),
    ).toBe(false)
  })
})
