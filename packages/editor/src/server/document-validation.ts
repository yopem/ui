import { z } from "zod"

export const idSchema = z
  .string()
  .max(256)
  .regex(/^[A-Za-z0-9_-]+:[A-Za-z0-9_:-]+$/)

export const rowSchema = z.object({
  document_id: idSchema,
  generation: z.string().regex(/^[0-9a-f]{64}$/),
  revision: z
    .string()
    .regex(/^[1-9][0-9]{0,18}$/)
    .refine((value) => BigInt(value) <= 9223372036854775807n),
  mode: z.enum(["snapshot", "yjs"]),
  state_json: z.string().max(1048576).nullable(),
  schema_version: z.number().int().positive().max(2147483647),
  deleted: z.union([z.literal(0), z.literal(1)]),
})

export const receiptSchema = rowSchema.extend({
  request_digest: z.string().regex(/^[0-9a-f]{64}$/),
})

export type DocumentRow = z.infer<typeof rowSchema>

export const identitySchema = z.object({
  provider: z.enum(["openauth", "better-auth"]),
  userId: z.string().min(1).max(1024),
})

export const callableSchema = z.function()

export const operationSchema = z.string().regex(/^[A-Za-z0-9_-]{16,128}$/)

export const envelopeSchema = z.object({
  root: z.object({ type: z.literal("root"), children: z.array(z.json()) }),
})

export const mutationSchema = z.strictObject({
  documentId: idSchema,
  operationId: operationSchema,
  expected: z.discriminatedUnion("kind", [
    z.strictObject({ kind: z.literal("absent") }),
    z.strictObject({ kind: z.literal("etag"), etag: z.string().max(100) }),
  ]),
  change: z.discriminatedUnion("kind", [
    z.strictObject({ kind: z.literal("delete") }),
    z.strictObject({
      kind: z.literal("save"),
      schemaVersion: z.number().int().positive().max(2147483647),
      state: z.string().max(1048576),
    }),
  ]),
})
