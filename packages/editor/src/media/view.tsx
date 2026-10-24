"use client"

import type { LexicalEditor, NodeKey } from "lexical"

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
import {
  $createNodeSelection,
  $getNodeByKey,
  $getSelection,
  $isNodeSelection,
  $setSelection,
  HISTORY_PUSH_TAG,
} from "lexical"
import { useRef, useState, useSyncExternalStore } from "react"

import type { createMediaStore } from "./extension"
import type { MediaData } from "./schema"

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
  frame: { inlineSize: "100%", blockSize: "100%", borderWidth: 0 },
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
}: {
  editor: LexicalEditor
  nodeKey: NodeKey
  store: ReturnType<typeof createMediaStore>
}) {
  const snapshot = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getSnapshot,
  )

  const data = snapshot.state.read(() => {
    const node = $getNodeByKey(nodeKey)
    const selection = $getSelection()

    return node instanceof MediaNode
      ? {
          media: node.getMedia(),
          selected: $isNodeSelection(selection) && selection.has(nodeKey),
        }
      : null
  })

  const [preview, setPreview] = useState<number | null>(null)

  const drag = useRef<{ start: number; width: number; value: number } | null>(
    null,
  )

  if (!data) return null
  const { media, selected } = data

  function change(patch: Partial<MediaData>) {
    if (!editor.isEditable()) return
    editor.update(() => {
      const node = $getNodeByKey(nodeKey)

      if (editor.isEditable() && node instanceof MediaNode) node.setMedia(patch)
    })
  }

  function select() {
    if (!editor.isEditable()) return
    editor.update(() => {
      const selection = $createNodeSelection()
      selection.add(nodeKey)
      $setSelection(selection)
    })
  }

  function remove() {
    if (!editor.isEditable()) return
    editor.update(
      () => {
        if (editor.isEditable()) $getNodeByKey(nodeKey)?.remove()
      },
      { tag: HISTORY_PUSH_TAG },
    )
    editor.focus()
  }

  function clamp(value: number) {
    return Math.max(64, Math.min(4096, Math.round(value)))
  }

  return (
    <Box
      render={<figure />}
      data-slot="editor-media"
      data-alignment={media.alignment}
      contentEditable={false}
      onKeyDown={(event) => event.stopPropagation()}
      xstyle={[
        styles.figure,
        styles[media.alignment],
        selected && styles.selected,
      ]}
    >
      <MediaContent media={media} width={preview ?? media.width} />
      {media.caption ? <Figcaption>{media.caption}</Figcaption> : null}
      {snapshot.editable ? (
        <Stack>
          <Toolbar aria-label="Media actions" xstyle={styles.toolbar}>
            <ToolbarButton
              render={<Button xstyle={styles.target} />}
              aria-label="Select media"
              aria-pressed={selected}
              onClick={select}
              onKeyDown={(event) => {
                if (["Delete", "Backspace"].includes(event.key)) {
                  event.preventDefault()
                  remove()
                }
              }}
            >
              Select media
            </ToolbarButton>
            {(["start", "center", "end"] as const).map((alignment) => (
              <ToolbarButton
                key={alignment}
                render={<Button xstyle={styles.target} />}
                aria-label={`Align ${alignment}`}
                aria-pressed={media.alignment === alignment}
                onClick={() => change({ alignment })}
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
                onChange={(event) => change({ alt: event.target.value })}
              />
            </Field>
            <Field>
              <FieldLabel>Caption</FieldLabel>
              <Input
                xstyle={styles.target}
                value={media.caption}
                maxLength={10000}
                onChange={(event) => change({ caption: event.target.value })}
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
              onChange={(event) =>
                change({ width: Number(event.target.value) })
              }
              aria-label="Image width"
              aria-valuemin={64}
              aria-valuemax={4096}
              aria-valuenow={preview ?? media.width}
              aria-valuetext={`${preview ?? media.width} pixels`}
              {...stylex.props(styles.resize)}
              onKeyDown={(event) => {
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
                          : clamp(media.width + delta),
                  })
                }
              }}
              onPointerDown={(event) => {
                if (!editor.isEditable()) return
                event.preventDefault()
                event.currentTarget.focus()
                drag.current = {
                  start: event.clientX,
                  width: media.width,
                  value: media.width,
                }
                event.currentTarget.setPointerCapture(event.pointerId)
              }}
              onPointerMove={(event) => {
                const active = drag.current

                if (!active) return
                active.value = clamp(
                  active.width + event.clientX - active.start,
                )
                setPreview(active.value)
              }}
              onPointerUp={() => {
                if (drag.current) change({ width: drag.current.value })
                drag.current = null
                setPreview(null)
              }}
              onPointerCancel={() => {
                drag.current = null
                setPreview(null)
              }}
              onLostPointerCapture={() => {
                drag.current = null
                setPreview(null)
              }}
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
}: {
  media: MediaData
  width?: number
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
          <iframe
            {...stylex.props(styles.frame)}
            src={data.url}
            title={data.alt || "Embedded media"}
            sandbox="allow-scripts allow-presentation"
            referrerPolicy="no-referrer"
            loading="lazy"
          />
        </AspectRatio>
      ) : null}
    </>
  )
}
