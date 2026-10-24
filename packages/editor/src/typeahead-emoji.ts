import data from "emojibase-data/en/data.json"
import shortcodes from "emojibase-data/en/shortcodes/emojibase.json"
import metadata from "emojibase-data/meta/groups.json"
import { z } from "zod"

import { mentionIdentitySchema } from "./mention-codec"

export interface EditorEmoji {
  readonly id: string
  readonly label: string
  readonly emoji: string
  readonly aliases: readonly string[]
  readonly category?: string
}

const aliases: Readonly<Record<string, readonly string[] | string>> = shortcodes

const groups: Readonly<Record<string, string>> = metadata.groups

const segmenter = new Intl.Segmenter("en", { granularity: "grapheme" })

const aliasSchema = z.string().regex(/^[\w+-]{1,128}$/)

const emojiSchema = z.object({
  id: aliasSchema,
  label: mentionIdentitySchema.shape.label,
  emoji: z
    .string()
    .max(64)
    .refine(
      (emoji) =>
        /(?:\p{Extended_Pictographic}|\p{Regional_Indicator}|\p{Emoji_Modifier}|[0-9#*]\uFE0F?\u20E3)/u.test(
          emoji,
        ) && [...segmenter.segment(emoji)].length === 1,
    ),
  aliases: z.array(aliasSchema).max(32),
  category: z
    .string()
    .regex(/^[\w-]{1,64}$/)
    .optional(),
})

const shortcodesSchema = z.union([
  z.string().transform((value) => [value]),
  z.array(z.string()),
])

const inventorySchema = z
  .array(emojiSchema)
  .max(10000)
  .refine(
    (entries) =>
      new Set(entries.map((entry) => entry.id)).size === entries.length,
  )

export const parseEditorEmojiInventory =
  inventorySchema.parse.bind(inventorySchema)

const validatedEmojiSchema = emojiSchema.nullable().catch(null)

export const validateEditorEmoji =
  validatedEmojiSchema.parse.bind(validatedEmojiSchema)

export const editorEmojiInventory: readonly EditorEmoji[] = data.flatMap(
  (entry) =>
    [entry, ...("skins" in entry ? (entry.skins ?? []) : [])].map((item) => ({
      id: item.hexcode,
      label: item.label,
      emoji: item.emoji,
      category:
        groups[
          String(("group" in item ? item.group : undefined) ?? entry.group)
        ] ?? "component",
      aliases: shortcodesSchema.parse(aliases[item.hexcode] ?? []),
    })),
)

export function searchEditorEmoji(
  query: string,
  inventory: readonly EditorEmoji[] = editorEmojiInventory,
  filter?: (emoji: EditorEmoji) => boolean,
  offset = 0,
) {
  if (
    query.length > 64 ||
    inventory.length > 10000 ||
    !Number.isInteger(offset) ||
    offset < 0 ||
    offset > 10000
  )
    return []

  const words = query
    .toLocaleLowerCase("en")
    .replaceAll("_", " ")
    .split(/\s+/)
    .filter(Boolean)

  return inventory
    .filter((entry) => {
      if (!validateEditorEmoji(entry) || (filter && !filter(entry)))
        return false

      const text =
        `${entry.label} ${entry.aliases.join(" ").replaceAll("_", " ")}`.toLocaleLowerCase(
          "en",
        )

      return words.every((word) => text.includes(word))
    })
    .slice(offset, offset + 50)
}
