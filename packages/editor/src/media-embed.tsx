"use client"

import { useStableCallback } from "@base-ui/utils/useStableCallback"
import { Button } from "@registry/components/ui/button"
import { Fieldset } from "@registry/components/ui/fieldset"
import { Text } from "@registry/components/ui/text"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"
import { useState, type ComponentProps } from "react"

import type { MediaData, MediaEmbedPolicy } from "./media/schema"

import { parseTweetUrl, resolveMediaEmbed } from "./media/schema"

const styles = stylex.create({
  frame: { borderWidth: 0, blockSize: "100%", inlineSize: "100%" },
  notice: {
    alignItems: "center",
    backgroundColor: tokens["--muted"],
    borderRadius: tokens["--radius-md"],
    boxSizing: "border-box",
    inlineSize: "100%",
    justifyContent: "center",
    minBlockSize: "8rem",
    padding: `calc(${tokens["--spacing"]} * 4)`,
    textAlign: "center",
  },
  target: { minBlockSize: 44, minInlineSize: 44 },
  link: {
    color: tokens["--foreground"],
    minBlockSize: 44,
    textDecorationLine: "underline",
    textUnderlineOffset: "4px",
  },
})

export function MediaEmbedContent({
  media,
  policy,
  disabled = false,
}: {
  media: MediaData
  policy?: MediaEmbedPolicy
  disabled?: boolean
}) {
  const source = resolveMediaEmbed(media, policy)

  const sourceUrl =
    media.embedType === "tweet" ? parseTweetUrl(media.url).sourceUrl : media.url

  const host = new URL(source?.url ?? sourceUrl).hostname

  const identity = JSON.stringify([
    media.embedType ?? "video",
    media.url,
    source?.url ?? null,
    source?.origin ?? null,
    policy?.providers ?? [],
    policy?.iframeOrigins ?? [],
    disabled,
  ])

  return (
    <MediaEmbedConsent
      key={identity}
      disabled={disabled}
      host={host}
      media={media}
      source={source}
      sourceUrl={sourceUrl}
    />
  )
}

function MediaEmbedConsent({
  disabled,
  host,
  media,
  source,
  sourceUrl,
}: {
  disabled: boolean
  host: string
  media: MediaData
  source: ReturnType<typeof resolveMediaEmbed>
  sourceUrl: string
}) {
  const [consented, setConsented] = useState(false)

  const handleLoad = useStableCallback(function handleLoad(
    event: Parameters<NonNullable<ComponentProps<typeof Button>["onClick"]>>[0],
  ) {
    if (event.defaultPrevented || disabled) return
    setConsented(true)
  })

  if (source && consented)
    return (
      <iframe
        {...stylex.props(styles.frame)}
        src={source.url}
        title={media.alt || `Embedded content from ${host}`}
        sandbox="allow-scripts allow-presentation"
        referrerPolicy="no-referrer"
        loading="lazy"
      />
    )

  return (
    <Fieldset
      data-slot="editor-media-embed-notice"
      aria-label={`External content from ${host}`}
      xstyle={styles.notice}
    >
      <Text>
        {source
          ? `Content from ${host} stays blocked until you choose to load it.`
          : `Content from ${host} is not configured for this editor.`}
      </Text>
      {source ? (
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          xstyle={styles.target}
          onClick={handleLoad}
        >
          Load content from {host}
        </Button>
      ) : null}
      <a
        {...stylex.props(styles.link)}
        href={sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
      >
        Open external content from {host}
      </a>
    </Fieldset>
  )
}
