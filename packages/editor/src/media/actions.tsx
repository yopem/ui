"use client"

import type { LexicalEditor, NodeKey } from "lexical"
import type { ComponentProps, ReactNode } from "react"

import { useStableCallback } from "@base-ui/utils/useStableCallback"
import { Button } from "@registry/components/ui/button"
import {
  Dialog,
  DialogPopup,
  DialogTitle,
  DialogDescription,
} from "@registry/components/ui/dialog"
import { Field, FieldLabel } from "@registry/components/ui/field"
import { Input } from "@registry/components/ui/input"
import { Stack } from "@registry/components/ui/stack"
import { Text } from "@registry/components/ui/text"
import { Textarea } from "@registry/components/ui/textarea"
import * as stylex from "@stylexjs/stylex"
import { useEditor } from "@yopem-ui/editor"
import {
  $createNodeSelection,
  $getNodeByKey,
  $getSelection,
  $isNodeSelection,
  $setSelection,
  HISTORY_PUSH_TAG,
  mergeRegister,
} from "lexical"
import {
  createContext,
  use,
  useRef,
  useState,
  useSyncExternalStore,
} from "react"

import { MediaNode } from "./model"
import { parseMedia, type MediaData } from "./schema"

function $selectedMedia() {
  const selection = $getSelection()

  if (!$isNodeSelection(selection)) return null
  const nodes = selection.getNodes()

  return nodes.length === 1 && nodes[0] instanceof MediaNode ? nodes[0] : null
}

function createMediaTarget(editor: LexicalEditor, nodeKey?: NodeKey) {
  let revision = 0
  let retained: MediaNode | null = null

  function read() {
    return editor.getEditorState().read(() => {
      const selection = $getSelection()

      const node = nodeKey
        ? $getNodeByKey(nodeKey)
        : ($selectedMedia() ??
          (selection === null && retained
            ? $getNodeByKey(retained.getKey())
            : null))

      retained = node instanceof MediaNode && node.isAttached() ? node : null

      return {
        node: retained,
        media: retained?.getMedia() ?? null,
        editable: editor.isEditable(),
        revision,
      }
    })
  }

  let snapshot = read()
  const listeners = new Set<() => void>()
  let unregister: (() => void) | undefined

  function publish() {
    snapshot = read()

    for (const listener of listeners) listener()
  }

  return {
    editor,
    getSnapshot(this: void) {
      return snapshot
    },
    subscribe(this: void, listener: () => void) {
      listeners.add(listener)

      if (!unregister) {
        unregister = mergeRegister(
          editor.registerUpdateListener(({ dirtyElements, dirtyLeaves }) => {
            if (dirtyElements.size || dirtyLeaves.size) revision += 1
            else
              editor.getEditorState().read(() => {
                const selection = $getSelection()

                if (
                  selection !== null &&
                  $selectedMedia()?.getKey() !== snapshot.node?.getKey()
                )
                  revision += 1
              })
            publish()
          }),
          editor.registerEditableListener(() => {
            revision += 1
            publish()
          }),
        )
        publish()
      }

      return () => {
        listeners.delete(listener)

        if (!listeners.size) {
          unregister?.()
          unregister = undefined
          retained = null
          revision += 1
          snapshot = { ...snapshot, node: null, media: null, revision }
        }
      }
    },
    change(patch: Partial<MediaData>, target = snapshot) {
      const savedNode = target.node

      if (
        !savedNode ||
        !target.media ||
        !editor.isEditable() ||
        target.revision !== revision
      )
        return false
      const media = parseMedia({ ...target.media, ...patch })
      let changed = false
      editor.update(
        () => {
          if (!editor.isEditable() || target.revision !== revision) return
          const node = $getNodeByKey(savedNode.getKey())
          const selection = $getSelection()

          if (
            !(node instanceof MediaNode) ||
            node !== target.node ||
            !node.isAttached() ||
            (selection !== null && $selectedMedia() !== node)
          )
            return
          node.setMedia(media)
          changed = true
        },
        { discrete: true, tag: HISTORY_PUSH_TAG },
      )

      return changed
    },
    restore(target = snapshot) {
      const savedNode = target.node

      if (!savedNode || !editor.isEditable() || target.revision !== revision)
        return
      editor.update(
        () => {
          const node = $getNodeByKey(savedNode.getKey())

          if (
            node !== target.node ||
            !node?.isAttached() ||
            ($getSelection() !== null && $selectedMedia() !== node)
          )
            return
          const selection = $createNodeSelection()
          selection.add(node.getKey())
          $setSelection(selection)
        },
        { discrete: true },
      )
    },
    remove(target = snapshot) {
      const savedNode = target.node

      if (!savedNode || !editor.isEditable() || target.revision !== revision)
        return false
      let removed = false
      editor.update(
        () => {
          const node = $getNodeByKey(savedNode.getKey())

          if (
            !editor.isEditable() ||
            target.revision !== revision ||
            node !== target.node ||
            !node?.isAttached() ||
            ($getSelection() !== null && $selectedMedia() !== node)
          )
            return
          node.selectPrevious()
          node.remove()
          removed = true
        },
        { discrete: true, tag: HISTORY_PUSH_TAG },
      )

      return removed
    },
  }
}

const MediaActionsContext = createContext<ReturnType<
  typeof createMediaTarget
> | null>(null)

export function MediaActions({
  nodeKey,
  children,
}: {
  nodeKey?: NodeKey
  children: ReactNode
}) {
  const editor = useEditor()
  const [target] = useState(() => createMediaTarget(editor, nodeKey))

  return <MediaActionsContext value={target}>{children}</MediaActionsContext>
}

function useMediaAction() {
  const target = use(MediaActionsContext)

  if (!target) throw new Error("Media controls must be inside MediaActions.")

  const mounted = useRef(false)

  const subscribe = useStableCallback(function subscribe(listener: () => void) {
    mounted.current = true
    const unregister = target.subscribe(listener)

    return () => {
      mounted.current = false
      unregister()
    }
  })

  const snapshot = useSyncExternalStore(
    subscribe,
    target.getSnapshot,
    target.getSnapshot,
  )

  return { target, snapshot, mounted }
}

export function MediaEditControl({
  onClick,
  onMouseDown,
  disabled,
  children = "Edit media source",
  ...props
}: ComponentProps<typeof Button>) {
  const { target, snapshot, mounted } = useMediaAction()
  const [session, setSession] = useState<typeof snapshot | null>(null)
  const [url, setUrl] = useState("")
  const [error, setError] = useState(false)

  const close = useStableCallback(function close() {
    if (session) target.restore(session)
    setSession(null)
  })

  const apply = useStableCallback(function apply() {
    if (!session) return

    try {
      const source = new URL(url)

      if (/[?#]/u.test(source.href) || !target.change({ url }, session)) {
        setError(true)

        return
      }

      setSession(null)
      target.restore()
      target.editor.focus()
    } catch {
      setError(true)
    }
  })

  const handleMouseDown = useStableCallback(function handleMouseDown(
    event: Parameters<
      NonNullable<ComponentProps<typeof Button>["onMouseDown"]>
    >[0],
  ) {
    onMouseDown?.(event)

    if (!event.defaultPrevented) event.preventDefault()
  })

  const handleClick = useStableCallback(function handleClick(
    event: Parameters<NonNullable<ComponentProps<typeof Button>["onClick"]>>[0],
  ) {
    const saved = target.getSnapshot()
    onClick?.(event)

    if (
      event.defaultPrevented ||
      !mounted.current ||
      !saved.media ||
      !target.editor.isEditable() ||
      saved.revision !== target.getSnapshot().revision
    )
      return
    setUrl(saved.media.url)
    setError(false)
    setSession(saved)
  })

  const handleOpenChange = useStableCallback(function handleOpenChange(
    open: Parameters<
      NonNullable<ComponentProps<typeof Dialog>["onOpenChange"]>
    >[0],
  ) {
    if (!open) close()
  })

  function handleFinalFocus() {
    return target.editor.getRootElement()
  }

  const handleUrlChange = useStableCallback(function handleUrlChange(
    event: Parameters<NonNullable<ComponentProps<typeof Input>["onChange"]>>[0],
  ) {
    if (!event.defaultPrevented) setUrl(event.currentTarget.value)
  })

  const handleUrlKeyDown = useStableCallback(function handleUrlKeyDown(
    event: Parameters<
      NonNullable<ComponentProps<typeof Input>["onKeyDown"]>
    >[0],
  ) {
    if (
      !event.defaultPrevented &&
      event.key === "Enter" &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault()
      apply()
    }
  })

  const handleApply = useStableCallback(function handleApply(
    event: Parameters<NonNullable<ComponentProps<typeof Button>["onClick"]>>[0],
  ) {
    if (!event.defaultPrevented) apply()
  })

  return (
    <>
      <Button
        {...props}
        disabled={disabled === true || !snapshot.editable || !snapshot.media}
        aria-haspopup="dialog"
        aria-expanded={session !== null}
        onMouseDown={handleMouseDown}
        onClick={handleClick}
      >
        {children}
      </Button>
      <Dialog open={session !== null} onOpenChange={handleOpenChange}>
        <DialogPopup finalFocus={handleFinalFocus}>
          <Stack>
            <DialogTitle>Edit media source</DialogTitle>
            <DialogDescription>
              Use an HTTPS media URL without credentials, queries, or fragments.
            </DialogDescription>
            <Field>
              <FieldLabel>Media URL</FieldLabel>
              <Input
                value={url}
                type="url"
                maxLength={4096}
                disabled={!snapshot.editable}
                aria-invalid={error}
                onChange={handleUrlChange}
                onKeyDown={handleUrlKeyDown}
              />
            </Field>
            {error ? (
              <Text role="alert">
                Check the URL and select the media again if its target expired.
              </Text>
            ) : null}
            <Button disabled={!snapshot.editable} onClick={handleApply}>
              Apply source
            </Button>
            <Button variant="outline" onClick={close}>
              Cancel
            </Button>
          </Stack>
        </DialogPopup>
      </Dialog>
    </>
  )
}

export function MediaCaptionTextarea({
  onChange,
  disabled,
  ...props
}: Omit<
  ComponentProps<typeof Textarea>,
  "value" | "defaultValue" | "maxLength"
>) {
  const { target, snapshot, mounted } = useMediaAction()

  const handleChange = useStableCallback(function handleChange(
    event: Parameters<
      NonNullable<ComponentProps<typeof Textarea>["onChange"]>
    >[0],
  ) {
    const saved = target.getSnapshot()
    onChange?.(event)

    if (
      event.defaultPrevented ||
      !mounted.current ||
      event.currentTarget.value.length > 10000
    )
      return
    target.change({ caption: event.currentTarget.value }, saved)
  })

  return (
    <Textarea
      {...props}
      data-slot="media-caption-textarea"
      value={snapshot.media?.caption ?? ""}
      maxLength={10000}
      disabled={disabled === true || !snapshot.editable || !snapshot.media}
      onChange={handleChange}
    />
  )
}

export function MediaAlignButton({
  alignment,
  onClick,
  onMouseDown,
  disabled,
  children = alignment,
  ...props
}: ComponentProps<typeof Button> & { alignment: MediaData["alignment"] }) {
  const { target, snapshot, mounted } = useMediaAction()

  const handleMouseDown = useStableCallback(function handleMouseDown(
    event: Parameters<
      NonNullable<ComponentProps<typeof Button>["onMouseDown"]>
    >[0],
  ) {
    onMouseDown?.(event)

    if (!event.defaultPrevented) event.preventDefault()
  })

  const handleClick = useStableCallback(function handleClick(
    event: Parameters<NonNullable<ComponentProps<typeof Button>["onClick"]>>[0],
  ) {
    const saved = target.getSnapshot()
    onClick?.(event)

    if (!event.defaultPrevented && mounted.current)
      target.change({ alignment }, saved)
  })

  return (
    <Button
      {...props}
      disabled={disabled === true || !snapshot.editable || !snapshot.media}
      aria-label={props["aria-label"] ?? `Align ${alignment}`}
      aria-pressed={snapshot.media?.alignment === alignment}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
    >
      {children}
    </Button>
  )
}

export function MediaDeleteButton({
  onClick,
  onMouseDown,
  disabled,
  children = "Delete media",
  ...props
}: ComponentProps<typeof Button>) {
  const { target, snapshot, mounted } = useMediaAction()

  const handleMouseDown = useStableCallback(function handleMouseDown(
    event: Parameters<
      NonNullable<ComponentProps<typeof Button>["onMouseDown"]>
    >[0],
  ) {
    onMouseDown?.(event)

    if (!event.defaultPrevented) event.preventDefault()
  })

  const handleClick = useStableCallback(function handleClick(
    event: Parameters<NonNullable<ComponentProps<typeof Button>["onClick"]>>[0],
  ) {
    const saved = target.getSnapshot()
    onClick?.(event)

    if (!event.defaultPrevented && mounted.current && target.remove(saved))
      target.editor.focus()
  })

  return (
    <Button
      {...props}
      disabled={disabled === true || !snapshot.editable || !snapshot.media}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
    >
      {children}
    </Button>
  )
}

const styles = stylex.create({
  resize: {
    minInlineSize: 44,
    minBlockSize: 44,
    touchAction: "none",
    cursor: "ew-resize",
  },
})

export function MediaImageResize({
  onPreviewWidthChange,
  onKeyDown,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  onLostPointerCapture,
  onChange,
  disabled,
  ...props
}: Omit<
  ComponentProps<typeof Input>,
  "type" | "value" | "defaultValue" | "min" | "max" | "step"
> & { onPreviewWidthChange?: (width: number | null) => void }) {
  const { target, snapshot, mounted } = useMediaAction()

  const [preview, setPreview] = useState<{
    width: number
    revision: number
  } | null>(null)

  const drag = useRef<{
    start: number
    width: number
    value: number
    snapshot: typeof snapshot
  } | null>(null)

  const cancel = useStableCallback(function cancel() {
    drag.current = null
    setPreview(null)
    onPreviewWidthChange?.(null)
  })

  const media = snapshot.media

  const handleChange = useStableCallback(function handleChange(
    event: Parameters<NonNullable<ComponentProps<typeof Input>["onChange"]>>[0],
  ) {
    const saved = target.getSnapshot()
    onChange?.(event)

    if (!event.defaultPrevented && mounted.current)
      target.change({ width: Number(event.currentTarget.value) }, saved)
  })

  const handleKeyDown = useStableCallback(function handleKeyDown(
    event: Parameters<
      NonNullable<ComponentProps<typeof Input>["onKeyDown"]>
    >[0],
  ) {
    const saved = target.getSnapshot()
    const media = saved.media
    onKeyDown?.(event)

    if (event.defaultPrevented || media?.kind !== "image") return

    if (
      !mounted.current ||
      !target.editor.isEditable() ||
      saved.revision !== target.getSnapshot().revision
    ) {
      event.preventDefault()
      cancel()

      return
    }

    if (event.key === "Escape") {
      event.preventDefault()
      cancel()

      return
    }

    const delta = ["ArrowRight", "ArrowUp"].includes(event.key)
      ? 16
      : ["ArrowLeft", "ArrowDown"].includes(event.key)
        ? -16
        : 0

    if (delta || ["Home", "End"].includes(event.key)) {
      event.preventDefault()
      target.change(
        {
          width:
            event.key === "Home"
              ? 64
              : event.key === "End"
                ? 4096
                : Math.max(64, Math.min(4096, media.width + delta)),
        },
        saved,
      )
    }
  })

  const handlePointerDown = useStableCallback(function handlePointerDown(
    event: Parameters<
      NonNullable<ComponentProps<typeof Input>["onPointerDown"]>
    >[0],
  ) {
    const saved = target.getSnapshot()
    const media = saved.media
    onPointerDown?.(event)

    if (event.defaultPrevented) return
    event.preventDefault()

    if (
      !mounted.current ||
      !target.editor.isEditable() ||
      saved.revision !== target.getSnapshot().revision ||
      media?.kind !== "image"
    )
      return
    event.currentTarget.focus()

    if (
      !mounted.current ||
      !target.editor.isEditable() ||
      saved.revision !== target.getSnapshot().revision
    )
      return
    drag.current = {
      start: event.clientX,
      width: media.width,
      value: media.width,
      snapshot: saved,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
  })

  const handlePointerMove = useStableCallback(function handlePointerMove(
    event: Parameters<
      NonNullable<ComponentProps<typeof Input>["onPointerMove"]>
    >[0],
  ) {
    const active = drag.current
    onPointerMove?.(event)

    if (event.defaultPrevented || !active || drag.current !== active) return

    if (
      !mounted.current ||
      !target.editor.isEditable() ||
      active.snapshot.revision !== target.getSnapshot().revision
    ) {
      cancel()

      return
    }

    active.value = Math.max(
      64,
      Math.min(4096, Math.round(active.width + event.clientX - active.start)),
    )
    setPreview({ width: active.value, revision: active.snapshot.revision })
    onPreviewWidthChange?.(active.value)

    if (
      !mounted.current ||
      !target.editor.isEditable() ||
      active.snapshot.revision !== target.getSnapshot().revision
    )
      cancel()
  })

  const handlePointerUp = useStableCallback(function handlePointerUp(
    event: Parameters<
      NonNullable<ComponentProps<typeof Input>["onPointerUp"]>
    >[0],
  ) {
    const active = drag.current
    onPointerUp?.(event)

    if (
      !event.defaultPrevented &&
      mounted.current &&
      active &&
      drag.current === active
    )
      target.change({ width: active.value }, active.snapshot)
    cancel()
  })

  const handlePointerCancel = useStableCallback(function handlePointerCancel(
    event: Parameters<
      NonNullable<ComponentProps<typeof Input>["onPointerCancel"]>
    >[0],
  ) {
    onPointerCancel?.(event)
    cancel()
  })

  const handleLostPointerCapture = useStableCallback(
    function handleLostPointerCapture(
      event: Parameters<
        NonNullable<ComponentProps<typeof Input>["onLostPointerCapture"]>
      >[0],
    ) {
      onLostPointerCapture?.(event)
      cancel()
    },
  )

  if (media?.kind !== "image") return null

  const width =
    preview?.revision === snapshot.revision && snapshot.editable
      ? preview.width
      : media.width

  return (
    <Input
      {...props}
      type="range"
      xstyle={[styles.resize, props.xstyle]}
      min={64}
      max={4096}
      step={1}
      value={width}
      disabled={disabled === true || !snapshot.editable}
      aria-label={props["aria-label"] ?? "Image width"}
      aria-valuemin={64}
      aria-valuemax={4096}
      aria-valuenow={width}
      aria-valuetext={`${width} pixels`}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onLostPointerCapture={handleLostPointerCapture}
    />
  )
}
