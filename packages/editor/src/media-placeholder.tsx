"use client"

import type { NodeKey } from "lexical"
import type { ComponentProps, ReactNode } from "react"

import { $findMatchingParent } from "@lexical/utils"
import { Box } from "@registry/components/ui/box"
import { Button } from "@registry/components/ui/button"
import { Fieldset } from "@registry/components/ui/fieldset"
import { Input } from "@registry/components/ui/input"
import { Progress } from "@registry/components/ui/progress"
import { Stack } from "@registry/components/ui/stack"
import { Text } from "@registry/components/ui/text"
import { Wrap } from "@registry/components/ui/wrap"
import {
  $getRoot,
  $getSlot,
  $getSlotNames,
  $isElementNode,
  $isNodeSelection,
  $isRangeSelection,
  $nodesOfType,
  COMMAND_PRIORITY_HIGH,
  COMMAND_PRIORITY_NORMAL,
  KEY_DOWN_COMMAND,
  SELECTION_INSERT_CLIPBOARD_NODES_COMMAND,
  defineExtension,
  isHTMLElement,
  mergeRegister,
} from "lexical"
import { useSyncExternalStore } from "react"

import type {
  EditorMediaPlaceholderController,
  MediaPlaceholderFailure,
} from "./media-placeholder-controller"
import type { MediaPlaceholderKind } from "./media-placeholder-model"

import { MEDIA_PLACEHOLDER_LIMIT } from "./media-placeholder-model"
import {
  MediaPlaceholderNode,
  registerMediaPlaceholderRenderer,
} from "./media-placeholder-node"

export { createEditorMediaPlaceholder } from "./media-placeholder-controller"

export type {
  EditorMediaPlaceholderController,
  MediaPlaceholderFailure,
  MediaPlaceholderSnapshot,
} from "./media-placeholder-controller"

export {
  MediaPlaceholderNode,
  $createMediaPlaceholderNode,
} from "./media-placeholder-node"

export {
  mediaPlaceholderNodeSchema,
  MEDIA_PLACEHOLDER_FILE_LIMIT,
  MEDIA_PLACEHOLDER_LIMIT,
} from "./media-placeholder-model"

export type {
  MediaPlaceholderKind,
  SerializedMediaPlaceholder,
} from "./media-placeholder-model"

export interface MediaPlaceholderTargetProps {
  controller: EditorMediaPlaceholderController
  nodeKey: NodeKey
}

const errors: Record<MediaPlaceholderFailure, string> = {
  upload:
    "Host upload failed. Retry only after you check the previous attempt.",
  "invalid-result":
    "Host returned an invalid media URL. Check the host before retry.",
  "file-limit":
    "Select a nonempty file up to 16 MiB with a name up to 512 characters.",
  "kind-mismatch": "Select a file that matches the placeholder media kind.",
  stale: "Upload target changed. Select a file again.",
  unconfigured: "Host upload is not configured.",
}

export function useMediaPlaceholder(
  controller: EditorMediaPlaceholderController,
) {
  return useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
    controller.getSnapshot,
  )
}

export function MediaPlaceholderStatus({
  controller,
  nodeKey,
  ...props
}: MediaPlaceholderTargetProps & ComponentProps<typeof Stack>) {
  const state = useMediaPlaceholder(controller)
  const current = state.key === nodeKey

  return (
    <Stack {...props} data-slot="media-placeholder-status">
      {current && state.status === "uploading" ? (
        <Progress
          value={state.progress}
          aria-label="Media placeholder upload"
        />
      ) : null}
      {current && state.error ? (
        <Text role="alert" data-upload-error={state.error}>
          {errors[state.error]}
        </Text>
      ) : (
        <Box render={<output />}>
          {current && state.status === "uploading"
            ? "Upload in progress."
            : current && state.status === "cancelled"
              ? "Upload cancelled. Select a file again."
              : "Upload unavailable. Select a file."}
        </Box>
      )}
    </Stack>
  )
}

export function MediaUploadNotification({
  controller,
  ...props
}: { controller: EditorMediaPlaceholderController } & ComponentProps<
  typeof Box
>) {
  const state = useMediaPlaceholder(controller)

  if (
    !state.key ||
    (!state.error && state.status !== "success" && state.status !== "cancelled")
  )
    return null

  return (
    <Box
      {...props}
      data-slot="media-upload-notification"
      role={state.error ? "alert" : "status"}
      data-upload-error={state.error ?? undefined}
    >
      {state.error
        ? errors[state.error]
        : state.status === "success"
          ? "Media upload complete."
          : "Media upload cancelled."}
    </Box>
  )
}

export function MediaPlaceholderFileInput({
  controller,
  nodeKey,
  disabled,
  onChange,
  ...props
}: MediaPlaceholderTargetProps &
  Omit<
    ComponentProps<typeof Input>,
    "type" | "multiple" | "value" | "defaultValue"
  >) {
  const state = useMediaPlaceholder(controller)

  return (
    <Input
      {...props}
      type="file"
      aria-label={props["aria-label"] ?? "Select upload file"}
      disabled={disabled === true || !state.editable || state.busy}
      onChange={(event) => {
        onChange?.(event)

        if (event.defaultPrevented) return
        const files = event.currentTarget.files
        const file = files?.length === 1 ? files[0] : undefined
        event.currentTarget.value = ""

        if (file) void controller.start(nodeKey, file)
      }}
    />
  )
}

export function MediaPlaceholderRetryButton({
  controller,
  nodeKey,
  disabled,
  onClick,
  children = "Retry upload",
  ...props
}: MediaPlaceholderTargetProps & ComponentProps<typeof Button>) {
  const state = useMediaPlaceholder(controller)

  return (
    <Button
      {...props}
      disabled={
        disabled === true ||
        !state.editable ||
        state.busy ||
        state.key !== nodeKey ||
        !state.canRetry
      }
      onClick={(event) => {
        onClick?.(event)

        if (!event.defaultPrevented) void controller.retry(nodeKey)
      }}
    >
      {children}
    </Button>
  )
}

export function MediaPlaceholderCancelButton({
  controller,
  nodeKey,
  disabled,
  onClick,
  children = "Cancel upload",
  ...props
}: MediaPlaceholderTargetProps & ComponentProps<typeof Button>) {
  const state = useMediaPlaceholder(controller)

  return (
    <Button
      {...props}
      disabled={
        disabled === true ||
        state.key !== nodeKey ||
        state.status !== "uploading"
      }
      onClick={(event) => {
        onClick?.(event)

        if (!event.defaultPrevented) controller.cancel(nodeKey)
      }}
    >
      {children}
    </Button>
  )
}

export function MediaPlaceholderRemoveButton({
  controller,
  nodeKey,
  disabled,
  onClick,
  children = "Remove placeholder",
  ...props
}: MediaPlaceholderTargetProps & ComponentProps<typeof Button>) {
  const state = useMediaPlaceholder(controller)

  return (
    <Button
      {...props}
      disabled={disabled === true || !state.editable}
      onClick={(event) => {
        onClick?.(event)

        if (!event.defaultPrevented) controller.remove(nodeKey)
      }}
    >
      {children}
    </Button>
  )
}

export function MediaPlaceholderInsertButton({
  controller,
  kind = "file",
  disabled,
  onClick,
  onMouseDown,
  children = "Insert upload placeholder",
  ...props
}: {
  controller: EditorMediaPlaceholderController
  kind?: MediaPlaceholderKind
} & ComponentProps<typeof Button>) {
  const state = useMediaPlaceholder(controller)

  return (
    <Button
      {...props}
      disabled={disabled === true || !state.editable || state.busy}
      onMouseDown={(event) => {
        onMouseDown?.(event)

        if (!event.defaultPrevented) event.preventDefault()
      }}
      onClick={(event) => {
        onClick?.(event)

        if (!event.defaultPrevented) controller.insert(kind)
      }}
    >
      {children}
    </Button>
  )
}

export function MediaPlaceholderElement({
  controller,
  nodeKey,
  children,
  ...props
}: MediaPlaceholderTargetProps & ComponentProps<typeof Fieldset>) {
  return (
    <Fieldset
      {...props}
      contentEditable={false}
      data-slot="editor-media-placeholder"
      aria-label={props["aria-label"] ?? "Media upload placeholder"}
    >
      {children ?? (
        <>
          <MediaPlaceholderStatus controller={controller} nodeKey={nodeKey} />
          <MediaPlaceholderFileInput
            controller={controller}
            nodeKey={nodeKey}
          />
          <Wrap>
            <MediaPlaceholderRetryButton
              controller={controller}
              nodeKey={nodeKey}
            />
            <MediaPlaceholderCancelButton
              controller={controller}
              nodeKey={nodeKey}
            />
            <MediaPlaceholderRemoveButton
              controller={controller}
              nodeKey={nodeKey}
            />
          </Wrap>
        </>
      )}
    </Fieldset>
  )
}

export function createMediaPlaceholderExtension(
  controller: EditorMediaPlaceholderController,
  render?: (props: MediaPlaceholderTargetProps) => ReactNode,
) {
  return defineExtension({
    name: "@yopem-ui/editor/media-placeholder",
    nodes: [MediaPlaceholderNode],
    register(editor) {
      return mergeRegister(
        controller.register(editor),
        registerMediaPlaceholderRenderer(editor, (node) =>
          render ? (
            render({ controller, nodeKey: node.getKey() })
          ) : (
            <MediaPlaceholderElement
              controller={controller}
              nodeKey={node.getKey()}
            />
          ),
        ),
        editor.registerCommand(
          SELECTION_INSERT_CLIPBOARD_NODES_COMMAND,
          ({ nodes, selection }) => {
            const roots = new Set(nodes)
            const pending = [...nodes]
            let incoming = 0

            while (pending.length > 0) {
              const node = pending.pop()

              if (!node) continue

              if (node instanceof MediaPlaceholderNode) {
                if (!roots.has(node)) return true
                incoming++

                if (incoming > MEDIA_PLACEHOLDER_LIMIT) return true
              }

              if ($isElementNode(node)) pending.push(...node.getChildren())

              for (const name of $getSlotNames(node)) {
                const slot = $getSlot(node, name)

                if (slot) pending.push(slot)
              }
            }

            if (incoming === 0) return false

            if (!editor.isEditable()) return true
            const root = $getRoot()

            if ($isRangeSelection(selection)) {
              if (
                [selection.anchor, selection.focus].some((point) => {
                  const node = point.getNode()

                  if (node === root) return false

                  const block = $findMatchingParent(
                    node,
                    (parent) => $isElementNode(parent) && !parent.isInline(),
                  )

                  return block !== root && block?.getParent() !== root
                })
              )
                return true
            } else if (
              !$isNodeSelection(selection) ||
              selection.getNodes().some((node) => node.getParent() !== root)
            )
              return true

            const replaced = new Set(
              selection.isCollapsed() ? [] : selection.getNodes(),
            )

            const remaining = $nodesOfType(MediaPlaceholderNode).filter(
              (node) => !replaced.has(node),
            ).length

            return remaining + incoming > MEDIA_PLACEHOLDER_LIMIT
          },
          COMMAND_PRIORITY_NORMAL,
        ),
        editor.registerCommand(
          KEY_DOWN_COMMAND,
          (event) => {
            const target = event.target

            return (
              isHTMLElement(target) &&
              Boolean(
                target.closest('[data-slot="editor-media-placeholder"]'),
              ) &&
              Boolean(
                target.closest("input, button, select, textarea, a[href]"),
              )
            )
          },
          COMMAND_PRIORITY_HIGH,
        ),
      )
    },
  })
}
