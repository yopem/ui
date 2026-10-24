import { z } from "zod"

export const mediaKinds = ["image", "video", "audio", "file", "embed"] as const

export type MediaKind = (typeof mediaKinds)[number]

export function safeMediaUrl(value: string) {
  if (
    value.length > 4096 ||
    Array.from(value).some(
      (character) =>
        character.charCodeAt(0) <= 32 ||
        character.charCodeAt(0) === 127 ||
        character === "\\",
    )
  )
    throw new Error("Use an HTTPS URL without credentials.")

  let url: URL

  try {
    url = new URL(value)
  } catch {
    throw new Error("Use an HTTPS URL without credentials.")
  }

  if (url.protocol !== "https:" || url.username || url.password)
    throw new Error("Use an HTTPS URL without credentials.")

  return url.href
}

export function parseProvider(value: string) {
  const url = new URL(safeMediaUrl(value))

  if (url.port) throw new Error("Unsupported media provider.")
  const host = url.hostname
  let id: string | undefined
  let provider: string | undefined
  let prefix = ""
  const path = url.pathname.split("/").filter(Boolean)

  if (
    [
      "youtube.com",
      "www.youtube.com",
      "m.youtube.com",
      "youtu.be",
      "www.youtube-nocookie.com",
    ].includes(host)
  ) {
    id =
      host === "youtu.be"
        ? path[0]
        : (url.searchParams.get("v") ??
          (["embed", "shorts", "live", "v"].includes(path[0] ?? "")
            ? path[1]
            : undefined))

    if (!id || !/^[\w-]{11}$/u.test(id))
      throw new Error("Invalid YouTube video.")
    provider = "youtube"
    prefix = "https://www.youtube-nocookie.com/embed/"
  } else if (
    ["vimeo.com", "www.vimeo.com", "player.vimeo.com"].includes(host)
  ) {
    id = path.at(-1)

    if (!id || !/^\d+$/u.test(id)) throw new Error("Invalid Vimeo video.")
    provider = "vimeo"
    prefix = "https://player.vimeo.com/video/"
  } else if (
    ["dailymotion.com", "www.dailymotion.com", "dai.ly"].includes(host)
  ) {
    id =
      host === "dai.ly"
        ? path[0]
        : path.includes("video")
          ? path[path.indexOf("video") + 1]
          : undefined
    id = id?.split("_")[0]

    if (!id || !/^[a-zA-Z0-9]+$/u.test(id))
      throw new Error("Invalid Dailymotion video.")
    prefix = "https://www.dailymotion.com/embed/video/"
    provider = "dailymotion"
  } else if (
    ["coub.com", "www.coub.com"].includes(host) &&
    ["view", "embed"].includes(path[0] ?? "")
  ) {
    id = path[1]
    prefix = "https://coub.com/embed/"
    provider = "coub"
  } else if (["v.youku.com", "player.youku.com"].includes(host)) {
    id =
      path[0] === "embed"
        ? path[1]
        : path[1]?.replace(/^id_/u, "").replace(/\.html$/u, "")
    prefix = "https://player.youku.com/embed/"
    provider = "youku"
  }

  if (!provider || !id || !/^[\w=-]+$/u.test(id))
    throw new Error("Unsupported media provider.")

  return { provider, url: prefix + id }
}

const mediaSchema = z.object({
  kind: z.enum(mediaKinds),
  url: z.string().transform(safeMediaUrl),
  alt: z.string().max(2000).default(""),
  caption: z.string().max(10000).default(""),
  name: z.string().max(512).default("File"),
  trackUrl: z.string().transform(safeMediaUrl).optional(),
  width: z.number().int().min(64).max(4096).default(320),
  alignment: z.enum(["start", "center", "end"]).default("start"),
})

export type MediaInput = z.input<typeof mediaSchema>

export type MediaData = Readonly<z.output<typeof mediaSchema>>

export function parseMedia(value: MediaInput): MediaData {
  const data = mediaSchema.parse(value)

  return Object.freeze(
    data.kind === "embed"
      ? { ...data, url: parseProvider(data.url).url }
      : data,
  )
}
