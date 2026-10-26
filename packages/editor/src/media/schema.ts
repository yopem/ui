import { z } from "zod"

export const mediaKinds = ["image", "video", "audio", "file", "embed"] as const

export type MediaKind = (typeof mediaKinds)[number]

const mediaEmbedProviders = [
  "youtube",
  "vimeo",
  "dailymotion",
  "coub",
  "youku",
  "x",
] as const

export type MediaEmbedProvider = (typeof mediaEmbedProviders)[number]

export type MediaEmbedType = "tweet" | "iframe"

export type MediaEmbedPolicyInput = Readonly<{
  providers?: readonly MediaEmbedProvider[]
  iframeOrigins?: readonly string[]
}>

export type MediaEmbedPolicy = Readonly<{
  providers: readonly MediaEmbedProvider[]
  iframeOrigins: readonly string[]
}>

export type ResolvedMediaEmbed = Readonly<{
  provider: MediaEmbedProvider | "iframe"
  url: string
  origin: string
  sourceUrl: string
}>

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

function hasAmbiguousPath(value: string) {
  const path = /^https:\/\/[^/?#]+([^?#]*)/iu.exec(value)?.[1] ?? ""

  return (
    path.includes("%") ||
    path.split("/").some((segment) => segment === "." || segment === "..")
  )
}

function isPrivateEmbedHost(host: string) {
  const localSuffixes = [
    ".localhost",
    ".local",
    ".internal",
    ".lan",
    ".test",
    ".invalid",
    ".example",
    ".home",
    ".corp",
    ".intranet",
    ".private",
    ".home.arpa",
    ".onion",
  ]

  return (
    !host.includes(".") ||
    host.endsWith(".") ||
    host.startsWith("[") ||
    host.includes(":") ||
    /^\d{1,3}(?:\.\d{1,3}){3}$/u.test(host) ||
    host.endsWith(".arpa") ||
    localSuffixes.some((suffix) => host.endsWith(suffix))
  )
}

export function safeMediaIframeUrl(value: string) {
  const canonical = safeMediaUrl(value)
  const url = new URL(canonical)

  if (
    value.includes("?") ||
    value.includes("#") ||
    value.includes("%") ||
    hasAmbiguousPath(value) ||
    isPrivateEmbedHost(url.hostname)
  )
    throw new Error(
      "Use a public HTTPS iframe URL without credentials or secrets.",
    )

  return canonical
}

function safeMediaEmbedOrigin(value: string) {
  const url = new URL(safeMediaIframeUrl(value))

  if (url.pathname !== "/")
    throw new Error("Use an HTTPS origin without a path or secrets.")

  return url.origin
}

export function createMediaEmbedPolicy(
  input: MediaEmbedPolicyInput = {},
): MediaEmbedPolicy {
  const providers = Array.from(new Set(input.providers ?? []))

  for (const provider of providers)
    if (!mediaEmbedProviders.includes(provider))
      throw new Error("Unsupported media embed provider.")

  const iframeOrigins = Array.from(
    new Set((input.iframeOrigins ?? []).map(safeMediaEmbedOrigin)),
  )

  return Object.freeze({
    providers: Object.freeze(providers),
    iframeOrigins: Object.freeze(iframeOrigins),
  })
}

export function parseTweetUrl(value: string) {
  const canonical = safeMediaUrl(value)
  const url = new URL(canonical)
  const trustedHosts = ["x.com", "www.x.com", "twitter.com", "www.twitter.com"]
  const path = url.pathname.split("/").filter(Boolean)

  if (
    !trustedHosts.includes(url.hostname) ||
    url.port ||
    value.includes("?") ||
    value.includes("#") ||
    value.includes("%") ||
    hasAmbiguousPath(value) ||
    path.length !== 3 ||
    path[1] !== "status" ||
    !/^[A-Za-z0-9_]{1,15}$/u.test(path[0] ?? "") ||
    !/^[1-9]\d{0,19}$/u.test(path[2] ?? "")
  )
    throw new Error("Use a valid Twitter or X status URL.")

  const handle = path[0] ?? ""
  const statusId = path[2] ?? ""
  const sourceUrl = `https://x.com/${handle}/status/${statusId}`

  return Object.freeze({
    handle,
    statusId,
    sourceUrl,
    embedUrl: `https://platform.twitter.com/embed/Tweet.html?id=${statusId}`,
  })
}

export function parseProvider(value: string) {
  const url = new URL(safeMediaUrl(value))

  if (url.port) throw new Error("Unsupported media provider.")
  const host = url.hostname
  let id: string | undefined
  let provider: MediaEmbedProvider | undefined
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

export const mediaSchema = z
  .object({
    kind: z.enum(mediaKinds),
    url: z.string(),
    embedType: z.enum(["tweet", "iframe"]).optional(),
    alt: z.string().max(2000).default(""),
    caption: z.string().max(10000).default(""),
    name: z.string().max(512).default("File"),
    trackUrl: z.string().optional(),
    width: z.number().int().min(64).max(4096).default(320),
    alignment: z.enum(["start", "center", "end"]).default("start"),
  })
  .superRefine((data, context) => {
    if (data.kind !== "embed" && data.embedType !== undefined)
      context.addIssue({
        code: "custom",
        message: "Embed type needs embed media.",
      })

    try {
      if (data.kind === "embed" && data.embedType === "iframe")
        safeMediaIframeUrl(data.url)
      else if (data.kind === "embed" && data.embedType === "tweet")
        parseTweetUrl(data.url)
      else safeMediaUrl(data.url)
    } catch {
      context.addIssue({
        code: "custom",
        path: ["url"],
        message: "Use a valid safe HTTPS media URL.",
      })
    }

    if (data.trackUrl !== undefined) {
      try {
        safeMediaUrl(data.trackUrl)
      } catch {
        context.addIssue({
          code: "custom",
          path: ["trackUrl"],
          message: "Use a valid safe HTTPS media URL.",
        })
      }
    }
  })
  .transform((data) => {
    const media = { ...data, url: safeMediaUrl(data.url) }

    if (media.trackUrl !== undefined)
      media.trackUrl = safeMediaUrl(media.trackUrl)

    return media
  })

export type MediaInput = z.input<typeof mediaSchema>

export type MediaData = Readonly<z.output<typeof mediaSchema>>

export function parseMedia(value: MediaInput): MediaData {
  const data = mediaSchema.parse(value)

  if (data.kind !== "embed") return Object.freeze(data)

  if (data.embedType === "tweet")
    return Object.freeze({ ...data, url: parseTweetUrl(data.url).sourceUrl })

  if (data.embedType === "iframe")
    return Object.freeze({ ...data, url: safeMediaIframeUrl(data.url) })

  return Object.freeze({ ...data, url: parseProvider(data.url).url })
}

export function resolveMediaEmbed(
  value: MediaInput,
  policy?: MediaEmbedPolicy,
): ResolvedMediaEmbed | null {
  const data = parseMedia(value)

  if (!policy) return null

  const configured = createMediaEmbedPolicy(policy)

  if (data.kind !== "embed") return null

  if (data.embedType === "tweet") {
    if (!configured.providers.includes("x")) return null
    const tweet = parseTweetUrl(data.url)
    const url = new URL(tweet.embedUrl)

    return Object.freeze({
      provider: "x",
      url: tweet.embedUrl,
      origin: url.origin,
      sourceUrl: tweet.sourceUrl,
    })
  }

  if (data.embedType === "iframe") {
    const url = new URL(safeMediaIframeUrl(data.url))

    if (!configured.iframeOrigins.includes(url.origin)) return null

    return Object.freeze({
      provider: "iframe",
      url: url.href,
      origin: url.origin,
      sourceUrl: url.href,
    })
  }

  const provider = parseProvider(data.url)

  if (!configured.providers.includes(provider.provider)) return null
  const url = new URL(provider.url)

  return Object.freeze({
    provider: provider.provider,
    url: provider.url,
    origin: url.origin,
    sourceUrl: data.url,
  })
}
