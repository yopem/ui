import type { PreparedDocumentMutation } from "./document-model"

export const readDocumentSql =
  "SELECT document_id,generation,CAST(revision AS TEXT) AS revision,mode,state_json,schema_version,deleted FROM editor_documents WHERE document_id=?"

export const readReceiptSql =
  "SELECT document_id,generation,CAST(revision AS TEXT) AS revision,mode,state_json,schema_version,deleted,request_digest FROM editor_operations WHERE document_id=? AND operation_id=?"

export const mutateDocumentSql = `INSERT INTO editor_documents(document_id,generation,revision,mode,state_json,schema_version,deleted,mutation_marker)
SELECT ?,?,1,'snapshot',?,?,0,? WHERE NOT EXISTS(SELECT 1 FROM editor_operations WHERE document_id=? AND operation_id=?)
ON CONFLICT(document_id) DO UPDATE SET
 generation=excluded.generation,revision=1,state_json=excluded.state_json,
 schema_version=excluded.schema_version,deleted=0,mutation_marker=excluded.mutation_marker
WHERE editor_documents.mode='snapshot' AND editor_documents.deleted=1
 AND NOT EXISTS(SELECT 1 FROM editor_operations WHERE document_id=? AND operation_id=?)`

export const updateDocumentSql = `UPDATE editor_documents SET revision=revision+1,state_json=?,schema_version=CASE WHEN ?=1 THEN schema_version ELSE ? END,deleted=?,mutation_marker=?
WHERE document_id=? AND mode='snapshot' AND deleted=0 AND generation=? AND revision=CAST(? AS BIGINT) AND revision<9223372036854775807
AND NOT EXISTS(SELECT 1 FROM editor_operations WHERE document_id=? AND operation_id=?)`

export const generationSql =
  "INSERT INTO editor_generations(generation,document_id) SELECT generation,document_id FROM editor_documents WHERE document_id=? AND mutation_marker=? AND revision=1"

export const receiptSql = `INSERT INTO editor_operations(document_id,operation_id,request_digest,generation,revision,mode,state_json,schema_version,deleted)
SELECT document_id,?,?,generation,revision,mode,state_json,schema_version,deleted FROM editor_documents WHERE document_id=? AND mutation_marker=?`

export function mutationStatements(input: PreparedDocumentMutation) {
  const mutation =
    input.expectedGeneration === null
      ? {
          text: mutateDocumentSql,
          values: [
            input.documentId,
            input.generation,
            input.state,
            input.schemaVersion,
            input.marker,
            input.documentId,
            input.operationId,
            input.documentId,
            input.operationId,
          ],
        }
      : {
          text: updateDocumentSql,
          values: [
            input.state,
            input.deleted,
            input.schemaVersion,
            input.deleted,
            input.marker,
            input.documentId,
            input.expectedGeneration,
            input.expectedRevision,
            input.documentId,
            input.operationId,
          ],
        }

  return [
    mutation,
    { text: generationSql, values: [input.documentId, input.marker] },
    {
      text: receiptSql,
      values: [input.operationId, input.digest, input.documentId, input.marker],
    },
    { text: readReceiptSql, values: [input.documentId, input.operationId] },
    { text: readDocumentSql, values: [input.documentId] },
  ]
}

export function postgresSql(sql: string) {
  let position = 0

  return sql.replaceAll("?", () => `$${++position}`)
}
