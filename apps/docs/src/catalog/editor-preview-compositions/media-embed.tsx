"use client"

import { AspectRatio } from "@registry/components/ui/aspect-ratio"
import { Button } from "@registry/components/ui/button"
import { Stack } from "@registry/components/ui/stack"
import { Text } from "@registry/components/ui/text"
import * as stylex from "@stylexjs/stylex"
import {
  createMediaEmbedPolicy,
  MediaEmbedContent,
  parseMedia,
} from "@yopem-ui/editor/media"
import { useState } from "react"

const styles = stylex.create({
  frame: { maxInlineSize: "24rem", minBlockSize: "16rem" },
})

const policy = createMediaEmbedPolicy({
  providers: ["youtube", "x"],
  iframeOrigins: ["https://example.com"],
})

const media = [
  parseMedia({
    kind: "embed",
    url: "https://youtu.be/jNQXAC9IVRw",
    alt: "Configured video",
  }),
  parseMedia({
    kind: "embed",
    embedType: "tweet",
    url: "https://x.com/jack/status/20",
    alt: "Configured public post",
  }),
  parseMedia({
    kind: "embed",
    embedType: "iframe",
    url: "https://example.com",
    alt: "Configured public page",
  }),
]

export function MediaEmbedComposition() {
  const [disabled, setDisabled] = useState(false)
  const [configured, setConfigured] = useState(true)

  return (
    <Stack>
      <Text>
        External frames need an explicit provider policy and consent. An origin
        allowlist does not validate DNS or redirects.
      </Text>
      <Button variant="outline" onClick={() => setDisabled((value) => !value)}>
        {disabled ? "Enable external content" : "Disable external content"}
      </Button>
      <Button
        variant="outline"
        onClick={() => setConfigured((value) => !value)}
      >
        {configured ? "Remove provider policy" : "Restore provider policy"}
      </Button>
      {media.map((item) => (
        <AspectRatio key={item.url} ratio={1} xstyle={styles.frame}>
          <MediaEmbedContent
            media={item}
            policy={configured ? policy : undefined}
            disabled={disabled}
          />
        </AspectRatio>
      ))}
    </Stack>
  )
}
