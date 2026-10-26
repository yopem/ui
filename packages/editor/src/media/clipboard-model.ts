import type { MediaKind } from "./schema"

export const MEDIA_FILE_CLIPBOARD_MAX_FILES = 1

const richClipboardTypes = new Set([
  "application/x-lexical-editor",
  "text/html",
  "text/markdown",
  "text/rtf",
])

export function getMediaClipboardKind(
  file: Pick<File, "type">,
): Exclude<MediaKind, "embed"> {
  const type = file.type.toLowerCase()

  if (type.startsWith("image/")) return "image"

  if (type.startsWith("video/")) return "video"

  if (type.startsWith("audio/")) return "audio"

  return "file"
}

export function hasRichMediaClipboardType(types: readonly string[]) {
  return types.some((type) => richClipboardTypes.has(type.toLowerCase()))
}

export function isMediaClipboardFileCountAllowed(count: number) {
  return Number.isInteger(count) && count === MEDIA_FILE_CLIPBOARD_MAX_FILES
}
