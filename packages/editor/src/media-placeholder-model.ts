import { z } from "zod"

export const mediaPlaceholderKindSchema = z.enum([
  "image",
  "video",
  "audio",
  "file",
])

export type MediaPlaceholderKind = z.infer<typeof mediaPlaceholderKindSchema>

export const mediaPlaceholderNodeSchema = z.strictObject({
  type: z.literal("editor-media-placeholder"),
  version: z.literal(1),
  uploadKind: mediaPlaceholderKindSchema,
})

export type SerializedMediaPlaceholder = z.infer<
  typeof mediaPlaceholderNodeSchema
>

export const MEDIA_PLACEHOLDER_LIMIT = 16

export const MEDIA_PLACEHOLDER_FILE_LIMIT = 16 * 1024 * 1024
