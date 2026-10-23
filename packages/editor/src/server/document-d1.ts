import type { DocumentConfig, DocumentDriver } from "./document-model"

import { DocumentError } from "./document-model"
import { createDocumentService } from "./document-service"
import { mutationStatements, readDocumentSql } from "./document-sql"

export interface DocumentD1Statement {
  bind(...values: (string | number | null)[]): DocumentD1Statement
  all(): Promise<{ success: boolean; results: unknown[] }>
}

export interface DocumentD1Session {
  prepare(sql: string): DocumentD1Statement
  batch(
    statements: DocumentD1Statement[],
  ): Promise<{ success: boolean; results: unknown[] }[]>
}

export interface DocumentD1Binding {
  withSession(constraint: "first-primary"): DocumentD1Session
}

export function createD1DocumentService(
  binding: DocumentD1Binding,
  config: DocumentConfig,
) {
  const driver: DocumentDriver = {
    async read(id, signal) {
      signal.throwIfAborted()

      const result = await binding
        .withSession("first-primary")
        .prepare(readDocumentSql)
        .bind(id)
        .all()

      if (result.success !== true || !Array.isArray(result.results))
        throw new DocumentError("unavailable")

      return result.results
    },
    async mutate(input, signal) {
      signal.throwIfAborted()
      const session = binding.withSession("first-primary")

      const statements = mutationStatements(input).map((statement) =>
        session.prepare(statement.text).bind(...statement.values),
      )

      const results = await session.batch(statements)

      if (
        results.length !== 5 ||
        results.some(
          (result) => result.success !== true || !Array.isArray(result.results),
        )
      )
        throw new DocumentError("unavailable")
      const receipt = results[3]
      const head = results[4]

      if (!receipt || !head) throw new DocumentError("corrupt")

      return { receipt: receipt.results, head: head.results }
    },
  }

  return createDocumentService(driver, config)
}
