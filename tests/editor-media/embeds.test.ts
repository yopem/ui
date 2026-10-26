import {
  createMediaEmbedPolicy,
  parseMedia,
  parseTweetUrl,
  resolveMediaEmbed,
  safeMediaIframeUrl,
} from "@editor/media/schema"
import { expect, test } from "bun:test"

test("Twitter and X status URLs resolve to the official tweet embed endpoint", () => {
  const tweet = parseTweetUrl(
    "https://twitter.com/YopemUI/status/1234567890123456789",
  )

  expect(tweet).toEqual({
    handle: "YopemUI",
    statusId: "1234567890123456789",
    sourceUrl: "https://x.com/YopemUI/status/1234567890123456789",
    embedUrl:
      "https://platform.twitter.com/embed/Tweet.html?id=1234567890123456789",
  })
  expect(parseTweetUrl("https://x.com/ada_lovelace/status/42").handle).toBe(
    "ada_lovelace",
  )
})

test("tweet parsing rejects untrusted hosts, malformed identities, and secrets", () => {
  for (const url of [
    "https://x.com.evil.test/owner/status/42",
    "https://evil.x.com/owner/status/42",
    "https://x.com/invalid-handle/status/42",
    "https://x.com/owner/status/not-a-status-id",
    "https://x.com/owner/status/42?token=secret",
    "https://x.com/owner/status/42#private",
    "https://x.com/%6fwner/status/42",
  ])
    expect(() => parseTweetUrl(url)).toThrow()
})

test("configured iframe URLs require exact public HTTPS origins", () => {
  const policy = createMediaEmbedPolicy({
    iframeOrigins: ["https://embed.example.com"],
  })

  const configured = parseMedia({
    kind: "embed",
    embedType: "iframe",
    url: "https://embed.example.com/player/42",
  })

  const lookalike = parseMedia({
    kind: "embed",
    embedType: "iframe",
    url: "https://embed.example.com.evil.test/player/42",
  })

  expect(resolveMediaEmbed(configured, policy)).toEqual({
    provider: "iframe",
    url: "https://embed.example.com/player/42",
    origin: "https://embed.example.com",
    sourceUrl: "https://embed.example.com/player/42",
  })
  expect(resolveMediaEmbed(lookalike, policy)).toBeNull()
  expect(
    resolveMediaEmbed(
      configured,
      createMediaEmbedPolicy({ iframeOrigins: ["https://other.example.com"] }),
    ),
  ).toBeNull()
  expect(resolveMediaEmbed(configured)).toBeNull()
})

test("iframe URL validation rejects credentials, secrets, encoded paths, and private hosts", () => {
  for (const url of [
    "//embed.example.com/player/42",
    "http://embed.example.com/player/42",
    "https://user:secret@embed.example.com/player/42",
    "https://embed.example.com/player/42?token=secret",
    "https://embed.example.com/player/42#secret",
    "https://embed.example.com/%2e%2e/admin",
    "https://embed.example.com/player%2f42",
    "https://localhost/player/42",
    "https://127.0.0.1/player/42",
    "https://[::1]/player/42",
  ])
    expect(() => safeMediaIframeUrl(url)).toThrow()
})

test("saved embed metadata does not grant provider or iframe authorization", () => {
  const tweet = parseMedia({
    kind: "embed",
    embedType: "tweet",
    url: "https://x.com/YopemUI/status/1234567890123456789",
  })

  const iframe = parseMedia({
    kind: "embed",
    embedType: "iframe",
    url: "https://untrusted.example.com/player/42",
  })

  const xPolicy = createMediaEmbedPolicy({ providers: ["x"] })

  expect(resolveMediaEmbed(tweet)).toBeNull()
  expect(resolveMediaEmbed(tweet, xPolicy)?.url).toBe(
    "https://platform.twitter.com/embed/Tweet.html?id=1234567890123456789",
  )
  expect(resolveMediaEmbed(iframe, xPolicy)).toBeNull()
})

test("legacy video-provider embeds keep their canonical serialized data", () => {
  expect(
    parseMedia({ kind: "embed", url: "https://vimeo.com/123456" }),
  ).toEqual({
    kind: "embed",
    url: "https://player.vimeo.com/video/123456",
    alt: "",
    caption: "",
    name: "File",
    width: 320,
    alignment: "start",
  })
})
