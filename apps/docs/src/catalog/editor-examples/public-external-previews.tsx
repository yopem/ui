"use client"

import { useStableCallback } from "@base-ui/utils/useStableCallback"
import { Box } from "@registry/components/ui/box"
import { Button } from "@registry/components/ui/button"
import { Heading } from "@registry/components/ui/heading"
import { Input } from "@registry/components/ui/input"
import { Stack } from "@registry/components/ui/stack"
import { Text } from "@registry/components/ui/text"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"
import { useId, useState, type ChangeEvent } from "react"

const styles = stylex.create({
  root: {
    maxInlineSize: "100%",
    minInlineSize: 0,
  },
  cards: {
    maxInlineSize: "100%",
    minInlineSize: 0,
  },
  card: {
    backgroundColor: tokens["--card"],
    borderColor: tokens["--border"],
    borderRadius: tokens["--radius-md"],
    borderStyle: "solid",
    borderWidth: 1,
    minInlineSize: 0,
    padding: `calc(${tokens["--spacing"]} * 4)`,
  },
  frameViewport: {
    inlineSize: "100%",
    maxInlineSize: "100%",
    minInlineSize: 0,
  },
  frame: {
    backgroundColor: tokens["--background"],
    borderColor: tokens["--border"],
    borderRadius: tokens["--radius-md"],
    borderStyle: "solid",
    borderWidth: 1,
    display: "block",
    inlineSize: "100%",
    maxInlineSize: "100%",
    minInlineSize: 0,
  },
  potionFrame: {
    blockSize: "min(80vh, 50rem)",
  },
  proFrame: {
    blockSize: "min(80vh, 32.5rem)",
  },
  imageProFrame: {
    blockSize: "min(80vh, 21.875rem)",
  },
})

const previewCases = [
  {
    id: "potion-iframe",
    name: "Potion",
    title: "potion",
    url: "https://potion.platejs.org/?iframe=true",
    description: "External Potion iframe reference.",
    frameStyle: styles.potionFrame,
  },
  {
    id: "pro-iframe",
    name: "Plate Pro example",
    title: "media-controller",
    url: "https://pro.platejs.org/iframe/media-controller",
    description:
      "Public Plate Pro iframe wrapper with a configurable example ID.",
    frameStyle: styles.proFrame,
  },
  {
    id: "image-pro",
    name: "Plate Pro media controller",
    title: "media-controller",
    url: "https://pro.platejs.org/iframe/media-controller",
    description: "Plate Pro media-controller reference.",
    frameStyle: styles.imageProFrame,
  },
] as const

function ExternalPreviewCard({
  preview,
}: {
  preview: (typeof previewCases)[number]
}) {
  const [loaded, setLoaded] = useState(false)
  const [exampleId, setExampleId] = useState("media-controller")
  const headingId = useId()
  const configurable = preview.id === "pro-iframe"

  const invalidId =
    configurable &&
    (exampleId.length < 1 ||
      exampleId.length > 128 ||
      /[^A-Za-z0-9_-]/u.test(exampleId))

  const url = configurable
    ? `https://pro.platejs.org/iframe/${encodeURIComponent(exampleId)}`
    : preview.url

  const title = configurable ? exampleId : preview.title

  const changeExampleId = useStableCallback(function changeExampleId(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    if (!loaded) setExampleId(event.target.value)
  })

  const togglePreview = useStableCallback(function togglePreview() {
    if (!loaded && invalidId) return
    setLoaded((current) => !current)
  })

  return (
    <Box
      render={<section aria-labelledby={headingId} />}
      data-testid={`public-external-preview-${preview.id}`}
      xstyle={styles.card}
    >
      <Stack>
        <Heading id={headingId} render={<h3>{preview.name}</h3>} />
        <Text>{preview.description}</Text>
        <Text>
          This shell does not include the embedded application or implement it
          with our Lexical editor.
        </Text>
        <Input
          aria-label={`${preview.name} external URL`}
          type="url"
          readOnly
          value={url}
        />
        {configurable && (
          <Stack>
            <Input
              aria-label="Plate Pro example ID"
              value={exampleId}
              disabled={loaded}
              onChange={changeExampleId}
            />
            <Text>
              Use one through 128 ASCII letters, digits, hyphens, or
              underscores. Do not enter credentials.
            </Text>
            {invalidId && (
              <Text role="alert">
                Enter a valid example ID before loading the frame.
              </Text>
            )}
          </Stack>
        )}
        <Button
          type="button"
          variant="outline"
          disabled={!loaded && invalidId}
          onClick={togglePreview}
        >
          {loaded
            ? `Remove ${preview.name} preview`
            : `Load ${preview.name} preview`}
        </Button>
        {loaded ? (
          <Box
            render={
              <section aria-label={`${preview.name} external frame viewport`} />
            }
            xstyle={styles.frameViewport}
          >
            <iframe
              data-testid={`external-preview-frame-${preview.id}`}
              src={url}
              title={title}
              loading="eager"
              sandbox="allow-scripts allow-forms"
              referrerPolicy="no-referrer"
              {...stylex.props(styles.frame, preview.frameStyle)}
            />
          </Box>
        ) : null}
      </Stack>
    </Box>
  )
}

export function PublicExternalPreviewsExample() {
  const headingId = useId()

  return (
    <Box
      render={<section aria-labelledby={headingId} />}
      data-testid="public-external-previews-example"
      xstyle={styles.root}
    >
      <Stack>
        <Heading id={headingId}>Public external previews</Heading>
        <Text>
          Loading a preview contacts its third-party service. The service may
          receive your IP address and browser request data. These examples
          contain only the public iframe wrappers, not the embedded application
          source. Your site must allow these hosts in its frame-src policy, and
          each service must permit framing.
        </Text>
        <Text>
          The wrapper adds no credentials or tokens to these URLs. Browser
          cookie policy may still affect external requests.
        </Text>
        <Text>
          The frame allows scripts and forms only. This sandbox may limit
          service behavior.
        </Text>
        <Stack xstyle={styles.cards}>
          {previewCases.map((preview) => (
            <ExternalPreviewCard key={preview.id} preview={preview} />
          ))}
        </Stack>
      </Stack>
    </Box>
  )
}
