"use client"

import type { LexicalEditor, NodeKey } from "lexical"

import { useStableCallback } from "@base-ui/utils/useStableCallback"
import { AspectRatio } from "@registry/components/ui/aspect-ratio"
import { Box } from "@registry/components/ui/box"
import { Button } from "@registry/components/ui/button"
import { Field, FieldLabel } from "@registry/components/ui/field"
import { Figcaption } from "@registry/components/ui/figcaption"
import { Input } from "@registry/components/ui/input"
import { Stack } from "@registry/components/ui/stack"
import { Toolbar, ToolbarButton } from "@registry/components/ui/toolbar"
import { Wrap } from "@registry/components/ui/wrap"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"
import { MediaEmbedContent } from "@yopem-ui/editor/media-embed"
import {
  MediaPreviewGallery,
  MediaPreviewTrigger,
} from "@yopem-ui/editor/media-preview"
import {
  $createNodeSelection,
  $getNodeByKey,
  $getSelection,
  $nodesOfType,
  $isNodeSelection,
  $setSelection,
  HISTORY_PUSH_TAG,
} from "lexical"
import {
  useState,
  useSyncExternalStore,
  type ComponentProps,
  type ChangeEvent,
  type KeyboardEvent,
} from "react"

import type { createMediaStore } from "./extension"
import type { MediaData, MediaEmbedPolicy } from "./schema"

import {
  MediaActions,
  MediaAlignButton,
  MediaCaptionTextarea,
  MediaDeleteButton,
  MediaEditControl,
  MediaImageResize,
} from "./actions"
import { MediaNode } from "./model"
import { parseMedia } from "./schema"

const styles = stylex.create({
  figure: {
    boxSizing: "border-box",
    margin: 0,
    inlineSize: "fit-content",
    overflowWrap: "anywhere",
    maxInlineSize: "100%",
    minInlineSize: 0,
    padding: `calc(${tokens["--spacing"]} * 2)`,
    borderRadius: tokens["--radius-md"],
    borderColor: tokens["--border"],
    borderWidth: 1,
    borderStyle: "solid",
  },
  selected: { outline: `2px solid ${tokens["--ring"]}` },
  media: { display: "block", maxInlineSize: "100%", blockSize: "auto" },
  file: { display: "flex", alignItems: "center", minBlockSize: 44 },
  start: { marginInlineEnd: "auto" },
  center: { marginInline: "auto" },
  end: { marginInlineStart: "auto" },
  toolbar: { flexWrap: "wrap" },
  target: { minInlineSize: 44, minBlockSize: 44 },
  caption: { whiteSpace: "pre-wrap" },
})

export function MediaView({
  editor,
  nodeKey,
  store,
  embedPolicy,
}: {
  editor: LexicalEditor
  nodeKey: NodeKey
  store: ReturnType<typeof createMediaStore>
  embedPolicy?: MediaEmbedPolicy
}) {
  const snapshot = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getSnapshot,
  )

  const data = snapshot.state.read(() => {
    const node = $getNodeByKey(nodeKey)
    const selection = $getSelection()

    if (!(node instanceof MediaNode)) return null

    const mediaNodes = $nodesOfType(MediaNode)

    const images = mediaNodes.flatMap((imageNode) => {
      const image = imageNode.getMedia()

      return image.kind === "image"
        ? [
            {
              id: imageNode.getKey(),
              src: image.url,
              alt: image.alt,
              caption: image.caption,
            },
          ]
        : []
    })

    return {
      media: node.getMedia(),
      selected: $isNodeSelection(selection) && selection.has(nodeKey),
      images,
      imageRevision: JSON.stringify(
        mediaNodes.map((mediaNode) => [
          mediaNode.getKey(),
          mediaNode.getMedia(),
        ]),
      ),
    }
  })

  const [preview, setPreview] = useState<{
    width: number
    revision: string
  } | null>(null)

  const change = useStableCallback(function change(patch: Partial<MediaData>) {
    if (!editor.isEditable()) return
    editor.update(() => {
      const node = $getNodeByKey(nodeKey)

      if (editor.isEditable() && node instanceof MediaNode) node.setMedia(patch)
    })
  })

  const select = useStableCallback(function select() {
    if (!editor.isEditable()) return
    editor.update(() => {
      const selection = $createNodeSelection()
      selection.add(nodeKey)
      $setSelection(selection)
    })
  })

  const remove = useStableCallback(function remove() {
    if (!editor.isEditable()) return
    editor.update(
      () => {
        if (editor.isEditable()) $getNodeByKey(nodeKey)?.remove()
      },
      { tag: HISTORY_PUSH_TAG },
    )
    editor.focus()
  })

  const stopKeyDown = useStableCallback(function stopKeyDown(
    event: KeyboardEvent<HTMLElement>,
  ) {
    event.stopPropagation()
  })

  const handleSelectKeyDown = useStableCallback(function handleSelectKeyDown(
    event: KeyboardEvent<HTMLElement>,
  ) {
    if (
      !event.defaultPrevented &&
      ["Delete", "Backspace"].includes(event.key)
    ) {
      event.preventDefault()
      remove()
    }
  })

  const handleAltChange = useStableCallback(function handleAltChange(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    if (!event.defaultPrevented) change({ alt: event.currentTarget.value })
  })

  const handlePreviewWidthChange = useStableCallback(
    function handlePreviewWidthChange(
      width: Parameters<
        NonNullable<
          ComponentProps<typeof MediaImageResize>["onPreviewWidthChange"]
        >
      >[0],
    ) {
      if (data)
        setPreview(
          width === null ? null : { width, revision: data.imageRevision },
        )
    },
  )

  if (!data) return null
  const { media, selected, images, imageRevision } = data

  return (
    <MediaActions nodeKey={nodeKey}>
      <Box
        render={<figure />}
        data-slot="editor-media"
        data-alignment={media.alignment}
        contentEditable={false}
        onKeyDown={stopKeyDown}
        xstyle={[
          styles.figure,
          styles[media.alignment],
          selected && styles.selected,
        ]}
      >
        {media.kind === "image" ? (
          <MediaPreviewGallery key={imageRevision} images={images}>
            <MediaPreviewTrigger imageId={nodeKey}>
              <MediaContent
                media={media}
                width={
                  snapshot.editable && preview?.revision === imageRevision
                    ? preview.width
                    : media.width
                }
              />
            </MediaPreviewTrigger>
          </MediaPreviewGallery>
        ) : (
          <MediaContent media={media} embedPolicy={embedPolicy} />
        )}
        {media.caption ? (
          <Figcaption xstyle={styles.caption}>{media.caption}</Figcaption>
        ) : null}
        {snapshot.editable ? (
          <Stack>
            <Toolbar aria-label="Media actions" xstyle={styles.toolbar}>
              <ToolbarButton
                render={<Button xstyle={styles.target} />}
                aria-label="Select media"
                aria-pressed={selected}
                onClick={select}
                onKeyDown={handleSelectKeyDown}
              >
                Select media
              </ToolbarButton>
              <MediaEditControl
                render={<ToolbarButton />}
                xstyle={styles.target}
              />
              {(["start", "center", "end"] as const).map((alignment) => (
                <MediaAlignButton
                  key={alignment}
                  alignment={alignment}
                  render={<ToolbarButton />}
                  xstyle={styles.target}
                />
              ))}
              <MediaDeleteButton
                render={<ToolbarButton />}
                xstyle={styles.target}
              />
            </Toolbar>
            <Wrap>
              <Field>
                <FieldLabel>Alternative text</FieldLabel>
                <Input
                  xstyle={styles.target}
                  value={media.alt}
                  maxLength={2000}
                  onChange={handleAltChange}
                />
              </Field>
              <Field>
                <FieldLabel>Caption</FieldLabel>
                <MediaCaptionTextarea />
              </Field>
            </Wrap>
            <MediaImageResize onPreviewWidthChange={handlePreviewWidthChange} />
          </Stack>
        ) : null}
      </Box>
    </MediaActions>
  )
}

export function MediaContent({
  media,
  width = media.width,
  embedPolicy,
}: {
  media: MediaData
  width?: number
  embedPolicy?: MediaEmbedPolicy
}) {
  const data = parseMedia({ ...media, width })

  return (
    <>
      {data.kind === "image" ? (
        <img
          {...stylex.props(styles.media, styles[data.alignment])}
          src={data.url}
          alt={data.alt}
          width={width}
          draggable={false}
        />
      ) : null}
      {data.kind === "video" ? (
        <video
          {...stylex.props(styles.media, styles[data.alignment])}
          src={data.url}
          controls
          preload="none"
          aria-label={data.alt || "Video"}
        >
          <track
            kind="captions"
            src={data.trackUrl}
            srcLang="en"
            label="Captions"
          />
        </video>
      ) : null}
      {data.kind === "audio" ? (
        <audio
          {...stylex.props(styles.media, styles[data.alignment])}
          src={data.url}
          controls
          preload="none"
          aria-label={data.alt || "Audio"}
        >
          <track
            kind="captions"
            src={data.trackUrl}
            srcLang="en"
            label="Captions"
          />
        </audio>
      ) : null}
      {data.kind === "file" ? (
        <a
          {...stylex.props(styles.file)}
          href={data.url}
          rel="noopener noreferrer"
        >
          {data.name}
        </a>
      ) : null}
      {data.kind === "embed" ? (
        <AspectRatio>
          <MediaEmbedContent media={data} policy={embedPolicy} />
        </AspectRatio>
      ) : null}
    </>
  )
}
