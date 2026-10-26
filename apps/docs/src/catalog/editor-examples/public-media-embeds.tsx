"use client"

import { AspectRatio } from "@registry/components/ui/aspect-ratio"
import { Box } from "@registry/components/ui/box"
import { Button } from "@registry/components/ui/button"
import { Figcaption } from "@registry/components/ui/figcaption"
import { Stack } from "@registry/components/ui/stack"
import { EditorContent, EditorRoot, EditorToolbar } from "@yopem-ui/editor"
import {
  createMediaEmbedPolicy,
  createMediaExtension,
  MediaContent,
  MediaEmbedContent,
  MediaInsertControl,
  parseMedia,
} from "@yopem-ui/editor/media"
import { useState } from "react"

const embedPolicy = createMediaEmbedPolicy({
  providers: ["x"],
  iframeOrigins: ["https://embed.example.com"],
})

const policyWithoutX = createMediaEmbedPolicy({
  iframeOrigins: ["https://embed.example.com"],
})

const extensions = [createMediaExtension({ embedPolicy })]

const firstTweet = parseMedia({
  kind: "embed",
  embedType: "tweet",
  url: "https://x.com/YopemUI/status/1234567890123456789",
  alt: "Yopem UI announcement",
  caption: "A public X post.",
})

const updatedTweet = parseMedia({
  kind: "embed",
  embedType: "tweet",
  url: "https://x.com/YopemUI/status/2234567890123456789",
  alt: "Yopem UI announcement",
  caption: "A second public X post.",
})

const independentTweet = parseMedia({
  kind: "embed",
  embedType: "tweet",
  url: "https://x.com/YopemUI/status/3234567890123456789",
  alt: "Independent X post",
})

const configuredFrame = parseMedia({
  kind: "embed",
  embedType: "iframe",
  url: "https://embed.example.com/player/42",
  alt: "Configured product frame",
})

const unconfiguredFrame = parseMedia({
  kind: "embed",
  embedType: "iframe",
  url: "https://untrusted.example.net/player/9",
  alt: "Untrusted frame",
})

const video = parseMedia({
  kind: "video",
  url: "https://media.test/video.webm",
  alt: "Video demo",
})

const audio = parseMedia({
  kind: "audio",
  url: "https://media.test/audio.wav",
  alt: "Audio demo",
})

export function PublicMediaEmbedsExample() {
  const [tweet, setTweet] = useState(firstTweet)
  const [xEmbedsEnabled, setXEmbedsEnabled] = useState(true)
  const [configuredEmbedDisabled, setConfiguredEmbedDisabled] = useState(false)
  const activePolicy = xEmbedsEnabled ? embedPolicy : policyWithoutX

  function changeTweet() {
    setTweet((current) =>
      current.url === firstTweet.url ? updatedTweet : firstTweet,
    )
  }

  return (
    <Box render={<section aria-label="Public media embed examples" />}>
      <Stack>
        <EditorRoot ariaLabel="Configured media editor" extensions={extensions}>
          <EditorToolbar aria-label="Configured media tools">
            <MediaInsertControl kind="embed" embedType="tweet" />
            <MediaInsertControl kind="embed" embedType="iframe" />
          </EditorToolbar>
          <EditorContent placeholder="Select a position, then insert an embed." />
        </EditorRoot>
        <Button
          variant="outline"
          onClick={() => setXEmbedsEnabled((current) => !current)}
        >
          {xEmbedsEnabled ? "Disable X embeds" : "Enable X embeds"}
        </Button>
        <Button variant="outline" onClick={changeTweet}>
          Change tweet source
        </Button>
        <Button
          variant="outline"
          onClick={() => setConfiguredEmbedDisabled((current) => !current)}
        >
          {configuredEmbedDisabled
            ? "Enable configured embed"
            : "Disable configured embed"}
        </Button>
        <Box render={<figure />}>
          <MediaContent media={tweet} embedPolicy={activePolicy} />
          <Figcaption>Load third-party content only after consent.</Figcaption>
        </Box>
        <Box render={<figure />}>
          <MediaContent media={independentTweet} embedPolicy={activePolicy} />
          <Figcaption>Consent stays local to this embed.</Figcaption>
        </Box>
        <Box render={<figure />}>
          <AspectRatio>
            <MediaEmbedContent
              media={configuredFrame}
              policy={activePolicy}
              disabled={configuredEmbedDisabled}
            />
          </AspectRatio>
          <Figcaption>Only configured HTTPS origins can load.</Figcaption>
        </Box>
        <Box render={<figure />}>
          <MediaContent media={unconfiguredFrame} embedPolicy={activePolicy} />
          <Figcaption>Unconfigured origins stay blocked.</Figcaption>
        </Box>
        <Box render={<figure />}>
          <MediaContent media={video} />
          <Figcaption>Native video controls stay available.</Figcaption>
        </Box>
        <Box render={<figure />}>
          <MediaContent media={audio} />
          <Figcaption>Native audio controls stay available.</Figcaption>
        </Box>
      </Stack>
    </Box>
  )
}
