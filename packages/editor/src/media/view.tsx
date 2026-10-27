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
  useRef,
  useState,
  useSyncExternalStore,
  type ChangeEvent,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
} from "react"

import type { createMediaStore } from "./extension"
import type { MediaData, MediaEmbedPolicy } from "./schema"

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
  resize: {
    minInlineSize: 44,
    minBlockSize: 44,
    touchAction: "none",
    cursor: "ew-resize",
  },
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

  const [preview, setPreview] = useState<number | null>(null)

  const drag = useRef<{ start: number; width: number; value: number } | null>(
    null,
  )

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
    if (["Delete", "Backspace"].includes(event.key)) {
      event.preventDefault()
      remove()
    }
  })

  const changeAlignment = useStableCallback(function changeAlignment(
    event: MouseEvent<HTMLElement>,
  ) {
    const alignment = event.currentTarget.dataset.alignment

    if (alignment === "start" || alignment === "center" || alignment === "end")
      change({ alignment })
  })

  const handleAltChange = useStableCallback(function handleAltChange(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    change({ alt: event.currentTarget.value })
  })

  const handleCaptionChange = useStableCallback(function handleCaptionChange(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    change({ caption: event.currentTarget.value })
  })

  const handleWidthChange = useStableCallback(function handleWidthChange(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    change({ width: Number(event.currentTarget.value) })
  })

  const handleWidthKeyDown = useStableCallback(function handleWidthKeyDown(
    event: KeyboardEvent<HTMLInputElement>,
  ) {
    const media = data?.media

    if (media?.kind !== "image") return

    const delta = ["ArrowRight", "ArrowUp"].includes(event.key)
      ? 16
      : ["ArrowLeft", "ArrowDown"].includes(event.key)
        ? -16
        : 0

    if (delta || ["Home", "End"].includes(event.key)) {
      event.preventDefault()
      change({
        width:
          event.key === "Home"
            ? 64
            : event.key === "End"
              ? 4096
              : Math.max(64, Math.min(4096, media.width + delta)),
      })
    }
  })

  const handlePointerDown = useStableCallback(function handlePointerDown(
    event: PointerEvent<HTMLInputElement>,
  ) {
    const media = data?.media

    if (!editor.isEditable() || media?.kind !== "image") return
    event.preventDefault()
    event.currentTarget.focus()
    drag.current = {
      start: event.clientX,
      width: media.width,
      value: media.width,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
  })

  const handlePointerMove = useStableCallback(function handlePointerMove(
    event: PointerEvent<HTMLInputElement>,
  ) {
    const active = drag.current

    if (!active) return
    active.value = Math.max(
      64,
      Math.min(4096, Math.round(active.width + event.clientX - active.start)),
    )
    setPreview(active.value)
  })

  const handlePointerUp = useStableCallback(function handlePointerUp() {
    if (drag.current) change({ width: drag.current.value })
    drag.current = null
    setPreview(null)
  })

  const cancelPointer = useStableCallback(function cancelPointer() {
    drag.current = null
    setPreview(null)
  })

  if (!data) return null
  const { media, selected, images, imageRevision } = data

  return (
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
            <MediaContent media={media} width={preview ?? media.width} />
          </MediaPreviewTrigger>
        </MediaPreviewGallery>
      ) : (
        <MediaContent media={media} embedPolicy={embedPolicy} />
      )}
      {media.caption ? <Figcaption>{media.caption}</Figcaption> : null}
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
            {(["start", "center", "end"] as const).map((alignment) => (
              <ToolbarButton
                key={alignment}
                render={<Button xstyle={styles.target} />}
                aria-label={`Align ${alignment}`}
                aria-pressed={media.alignment === alignment}
                data-alignment={alignment}
                onClick={changeAlignment}
              >
                {alignment}
              </ToolbarButton>
            ))}
            <ToolbarButton
              render={<Button xstyle={styles.target} />}
              onClick={remove}
            >
              Delete media
            </ToolbarButton>
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
              <Input
                xstyle={styles.target}
                value={media.caption}
                maxLength={10000}
                onChange={handleCaptionChange}
              />
            </Field>
          </Wrap>
          {media.kind === "image" ? (
            <input
              type="range"
              min={64}
              max={4096}
              step={1}
              value={preview ?? media.width}
              onChange={handleWidthChange}
              aria-label="Image width"
              aria-valuemin={64}
              aria-valuemax={4096}
              aria-valuenow={preview ?? media.width}
              aria-valuetext={`${preview ?? media.width} pixels`}
              {...stylex.props(styles.resize)}
              onKeyDown={handleWidthKeyDown}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={cancelPointer}
              onLostPointerCapture={cancelPointer}
            />
          ) : null}
        </Stack>
      ) : null}
    </Box>
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
