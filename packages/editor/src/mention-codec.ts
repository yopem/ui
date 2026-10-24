import { z } from "zod"

export const mentionIdentitySchema = z.object({
  id: z
    .string()
    .max(128)
    .regex(/^[\p{L}\p{N}_.:@-]{1,128}$/u),
  label: z
    .string()
    .min(1)
    .max(128)
    .refine(
      (label) =>
        label.trim() === label &&
        /[\p{L}\p{N}\p{P}\p{S}]/u.test(label) &&
        !/[\p{Cc}\p{Zl}\p{Zp}\uD800-\uDFFF]/u.test(label) &&
        !/\p{Cf}/u.test(label.replaceAll(/[\u200C\u200D]/gu, "")),
    ),
})

export type MentionIdentity = Readonly<z.infer<typeof mentionIdentitySchema>>

export const mentionNodeSchema = z
  .looseObject({
    type: z.literal("mention"),
    version: z.literal(1),
    identity: mentionIdentitySchema,
    text: z.string().min(2).max(129),
    format: z.number().int().min(0).max(65535),
    detail: z.number().int().min(0).max(3),
    mode: z.literal("token"),
    style: z.string().max(4096),
  })
  .refine((node) => node.text === `@${node.identity.label}`)

const decodedMentionSchema = mentionIdentitySchema.nullable().catch(null)

export const decodeMention =
  decodedMentionSchema.parse.bind(decodedMentionSchema)

export function encodeMention(value: MentionIdentity) {
  return mentionIdentitySchema.parse(value)
}

export function mentionPlainText(value: MentionIdentity) {
  return `@${encodeMention(value).label}`
}

export function mentionMarkdown(value: MentionIdentity) {
  const identity = encodeMention(value)

  return `@[${encodeURIComponent(identity.label)}](mention:${encodeURIComponent(identity.id)})`
}

export function parseMentionMarkdown(value: string) {
  if (value.length > 4096) return null

  const match = /^@\[([^\]]+)\]\(mention:([^)]+)\)$/.exec(value)

  if (!match?.[1] || !match[2]) return null

  try {
    return decodeMention({
      id: decodeURIComponent(match[2]),
      label: decodeURIComponent(match[1]),
    })
  } catch {
    return null
  }
}

const profileURLSchema = z
  .url()
  .max(2048)
  .transform((value) => new URL(value))
  .refine((url) => url.protocol === "https:" && !url.username && !url.password)
  .transform((url) => url.href)

const resolvedProfileURLSchema = profileURLSchema.nullable().catch(null)

export const safeMentionProfileURL = resolvedProfileURLSchema.parse.bind(
  resolvedProfileURLSchema,
)
