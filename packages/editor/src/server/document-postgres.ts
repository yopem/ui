import type { DocumentConfig, DocumentDriver } from "./document-model"

import { DocumentError } from "./document-model"
import { createDocumentService, withinSignal } from "./document-service"
import {
  mutationStatements,
  postgresSql,
  readDocumentSql,
} from "./document-sql"

export interface DocumentPgClient {
  query(config: {
    text: string
    values: (string | number | null)[]
    query_timeout: number
  }): Promise<{ rows: unknown[] }>
  release(destroy?: boolean): void
}

export interface DocumentPgPool {
  connect(): Promise<DocumentPgClient>
}

export function createPostgresDocumentService(
  pool: DocumentPgPool,
  config: DocumentConfig,
) {
  let acquiring = 0

  async function transaction<T>(
    id: string,
    signal: AbortSignal,
    work: (
      query: (
        text: string,
        values: (string | number | null)[],
      ) => Promise<unknown[]>,
    ) => Promise<T>,
  ) {
    signal.throwIfAborted()
    let released = false
    let client: DocumentPgClient | undefined

    function destroy() {
      if (client && !released) {
        released = true
        client.release(true)
      }
    }

    if (acquiring >= config.maxConcurrent) throw new DocumentError("budget")
    acquiring++

    const acquisition = pool
      .connect()
      .then(function connected(value) {
        client = value

        if (signal.aborted) destroy()

        return value
      })
      .finally(function settled() {
        acquiring--
      })

    await withinSignal(acquisition, signal)
    signal.addEventListener("abort", destroy, { once: true })

    if (signal.aborted) destroy()
    let began = false
    let committed = false

    async function query(
      text: string,
      values: (string | number | null)[] = [],
    ) {
      signal.throwIfAborted()

      if (!client || released) throw new DocumentError("aborted")

      const result = await withinSignal(
        client.query({ text, values, query_timeout: config.timeoutMs }),
        signal,
      )

      if (!Array.isArray(result.rows)) throw new DocumentError("corrupt")

      return result.rows
    }

    try {
      began = true
      await query("BEGIN", [])
      await query(
        "SELECT set_config('statement_timeout',$1,true),set_config('lock_timeout',$1,true)",
        [String(config.timeoutMs)],
      )
      await query("SELECT pg_advisory_xact_lock(hashtextextended($1,0))", [id])
      const result = await work(query)
      await query("COMMIT", [])
      committed = true

      return result
    } finally {
      signal.removeEventListener("abort", destroy)

      if (client && !released) {
        if (began && !committed) {
          try {
            await client.query({
              text: "ROLLBACK",
              values: [],
              query_timeout: config.timeoutMs,
            })
          } catch {
            destroy()
          }
        }

        if (!released) {
          released = true
          client.release()
        }
      }
    }
  }

  const driver: DocumentDriver = {
    read(id, signal) {
      return transaction(id, signal, function read(query) {
        return query(postgresSql(readDocumentSql), [id])
      })
    },
    mutate(input, signal) {
      return transaction(
        input.documentId,
        signal,
        async function mutate(query) {
          const results: unknown[][] = []

          for (const statement of mutationStatements(input))
            results.push(
              await query(postgresSql(statement.text), statement.values),
            )
          const receipt = results[3]
          const head = results[4]

          if (!receipt || !head) throw new DocumentError("corrupt")

          return { receipt, head }
        },
      )
    },
  }

  return createDocumentService(driver, config)
}
