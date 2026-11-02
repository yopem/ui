import type { BaseSelection, LexicalEditor, NodeKey } from "lexical"

import { $insertNodeToNearestRoot } from "@lexical/utils"
import {
  $createNodeSelection,
  $createParagraphNode,
  $getNodeByKey,
  $getRoot,
  $getSelection,
  $isRangeSelection,
  $nodesOfType,
  $setSelection,
  HISTORY_PUSH_TAG,
  mergeRegister,
} from "lexical"

import type { MediaPlaceholderKind } from "./media-placeholder-model"
import type { MediaUpload } from "./media/upload"

import {
  MEDIA_PLACEHOLDER_FILE_LIMIT,
  MEDIA_PLACEHOLDER_LIMIT,
  mediaPlaceholderKindSchema,
} from "./media-placeholder-model"
import {
  $createMediaPlaceholderNode,
  MediaPlaceholderNode,
} from "./media-placeholder-node"
import { $createMediaNode, MediaNode } from "./media/model"
import { parseMedia } from "./media/schema"
import { createMediaUpload } from "./media/upload"

export type MediaPlaceholderFailure =
  | "upload"
  | "invalid-result"
  | "file-limit"
  | "kind-mismatch"
  | "stale"
  | "unconfigured"

export interface MediaPlaceholderSnapshot {
  key: NodeKey | null
  status: "unavailable" | "uploading" | "error" | "cancelled" | "success"
  error: MediaPlaceholderFailure | null
  progress: number
  busy: boolean
  editable: boolean
  canRetry: boolean
}

const ownTag = "yopem-media-placeholder"

const owners = new WeakMap<LexicalEditor, object>()

export function createEditorMediaPlaceholder(
  options: { upload?: MediaUpload } = {},
) {
  const task = createMediaUpload()
  const owner = {}
  const listeners = new Set<() => void>()
  let editor: LexicalEditor | null = null
  let upload = options.upload
  let retained: { key: NodeKey; file: File } | null = null

  let active: {
    key: NodeKey
    valid: boolean
    selection: BaseSelection | null
  } | null = null

  let snapshot: MediaPlaceholderSnapshot = {
    key: null,
    status: "unavailable",
    error: null,
    progress: 0,
    busy: false,
    editable: false,
    canRetry: false,
  }

  function publish(patch: Partial<MediaPlaceholderSnapshot>) {
    snapshot = { ...snapshot, ...patch }

    for (const listener of listeners) listener()
  }

  function invalidate(error: MediaPlaceholderFailure | null = "stale") {
    const nextError =
      error === "stale" && !active?.valid && !retained ? null : error

    if (active) active.valid = false
    retained = null
    task.cancel()
    publish({
      status: "unavailable",
      error: nextError,
      progress: 0,
      canRetry: false,
    })
  }

  function cancel(key: NodeKey) {
    if (snapshot.key !== key) return false
    invalidate(null)
    publish({ status: "cancelled" })

    return true
  }

  function register(next: LexicalEditor) {
    if (editor)
      throw new Error("Media placeholder controller needs one EditorRoot.")

    if (owners.has(next) && owners.get(next) !== owner)
      throw new Error("EditorRoot already has a media placeholder controller.")

    if (!next.hasNodes([MediaPlaceholderNode, MediaNode]))
      throw new Error(
        "Register media and placeholder nodes before the controller.",
      )
    owners.set(next, owner)
    editor = next
    publish({ editable: next.isEditable() })
    let connected = true

    const unregister = mergeRegister(
      next.registerUpdateListener(
        ({ editorState, dirtyElements, dirtyLeaves, tags }) => {
          if (tags.has(ownTag)) return
          const changed = dirtyElements.size > 0 || dirtyLeaves.size > 0

          const selection = editorState.read(
            () => $getSelection()?.clone() ?? null,
          )

          if (
            changed ||
            (active && selection !== null && !selection.is(active.selection))
          )
            invalidate()
        },
      ),
      next.registerEditableListener((editable) => {
        if (!editable) invalidate()
        publish({ editable })
      }),
      next.registerRootListener((root, previous) => {
        if (root !== previous) invalidate()
      }),
    )

    return () => {
      if (!connected) return
      connected = false
      unregister()
      invalidate(null)
      editor = null

      if (!snapshot.busy) owners.delete(next)
      publish({ editable: false })
    }
  }

  function insert(kind: MediaPlaceholderKind = "file") {
    const current = editor

    if (
      !current?.isEditable() ||
      !mediaPlaceholderKindSchema.safeParse(kind).success ||
      snapshot.busy
    )
      return null
    let key: NodeKey | null = null
    current.update(
      () => {
        const selection = $getSelection()

        if (
          !$isRangeSelection(selection) ||
          [selection.anchor, selection.focus].some((point) => {
            const node = point.getNode()

            return (
              node !== $getRoot() &&
              node.getTopLevelElement()?.getParent() !== $getRoot()
            )
          }) ||
          $nodesOfType(MediaPlaceholderNode).length >= MEDIA_PLACEHOLDER_LIMIT
        )
          return
        const node = $createMediaPlaceholderNode(kind)
        $insertNodeToNearestRoot(node)
        node.insertAfter($createParagraphNode())
        const selected = $createNodeSelection()
        selected.add(node.getKey())
        $setSelection(selected)
        key = node.getKey()
      },
      { discrete: true, tag: [HISTORY_PUSH_TAG, ownTag] },
    )

    if (key) {
      retained = null
      publish({
        key,
        status: "unavailable",
        error: null,
        progress: 0,
        canRetry: false,
      })
    }

    return key
  }

  async function start(key: NodeKey, file: File) {
    const current = editor
    const host = upload

    if (!current?.isEditable() || snapshot.busy) return false

    const kind = current.getEditorState().read(() => {
      const node = $getNodeByKey(key)

      return node instanceof MediaPlaceholderNode &&
        node.isAttached() &&
        node.getParent() === $getRoot() &&
        $nodesOfType(MediaPlaceholderNode).length <= MEDIA_PLACEHOLDER_LIMIT
        ? node.getUploadKind()
        : null
    })

    if (!kind) return false
    retained = null

    if (!host) {
      publish({ key, status: "error", error: "unconfigured", canRetry: false })

      return false
    }

    if (
      file.size <= 0 ||
      file.size > MEDIA_PLACEHOLDER_FILE_LIMIT ||
      file.name.length > 512
    ) {
      publish({ key, status: "error", error: "file-limit", canRetry: false })

      return false
    }

    if (kind !== "file" && !file.type.toLowerCase().startsWith(`${kind}/`)) {
      publish({ key, status: "error", error: "kind-mismatch", canRetry: false })

      return false
    }

    const root = current.getRootElement()

    const operation = {
      key,
      valid: true,
      selection: current
        .getEditorState()
        .read(() => $getSelection()?.clone() ?? null),
    }

    active = operation
    retained = { key, file }
    publish({
      key,
      status: "uploading",
      error: null,
      busy: true,
      progress: 0,
      canRetry: false,
    })
    let failure: MediaPlaceholderFailure = "upload"

    const unsubscribe = task.subscribe(() => {
      if (
        operation.valid &&
        active === operation &&
        task.getSnapshot().status === "uploading"
      )
        publish({ progress: task.getSnapshot().progress })
    })

    function isCurrent() {
      if (
        !current ||
        !operation.valid ||
        active !== operation ||
        editor !== current ||
        upload !== host ||
        current.getRootElement() !== root ||
        !current.isEditable() ||
        current._dirtyElements.size > 0 ||
        current._dirtyLeaves.size > 0
      )
        return false

      const state = current._pendingEditorState ?? current.getEditorState()

      return state.read(() => {
        const node = $getNodeByKey(key)
        const selection = $getSelection()

        return (
          node instanceof MediaPlaceholderNode &&
          node.isAttached() &&
          node.getParent() === $getRoot() &&
          node.getUploadKind() === kind &&
          (selection === null || selection.is(operation.selection))
        )
      })
    }

    let inserted = false

    try {
      if (!isCurrent()) {
        if (operation.valid) invalidate()

        return false
      }

      const result = await task.start(file, kind, async (input, context) => {
        if (!isCurrent() || context.signal.aborted) {
          if (operation.valid) invalidate()
          throw new Error("Upload target changed before host invocation.")
        }

        const url = await host(input, context)

        try {
          const parsed = parseMedia({ kind, url, name: file.name })

          for (const source of [parsed.url, parsed.trackUrl])
            if (source !== undefined) {
              const value = new URL(source)

              if (/[?#]/u.test(value.href)) throw new Error("Unsafe media URL")
            }

          return parsed.url
        } catch (error) {
          failure = "invalid-result"
          throw error
        }
      })

      if (
        !operation.valid ||
        active !== operation ||
        editor !== current ||
        !current.isEditable()
      )
        return false

      if (!result) {
        publish({ status: "error", error: failure, canRetry: true })

        return false
      }

      if (current._dirtyElements.size || current._dirtyLeaves.size) {
        invalidate()

        return false
      }

      current.update(
        () => {
          const node = $getNodeByKey(key)
          const selection = $getSelection()

          if (
            !operation.valid ||
            !current.isEditable() ||
            !(node instanceof MediaPlaceholderNode) ||
            !node.isAttached() ||
            node.getUploadKind() !== kind ||
            (selection !== null && !selection.is(operation.selection))
          )
            return
          node.replace($createMediaNode(result))
          inserted = true
        },
        { discrete: true, tag: [HISTORY_PUSH_TAG, ownTag] },
      )

      if (inserted) {
        retained = null
        operation.valid = false
        publish({
          status: "success",
          progress: 100,
          error: null,
          canRetry: false,
        })
      } else invalidate()

      return inserted
    } catch {
      if (operation.valid && active === operation) {
        retained = null
        publish({ status: "error", error: "stale", canRetry: false })
      }

      return false
    } finally {
      unsubscribe()

      if (active === operation) {
        active = null

        if (editor !== current) owners.delete(current)
        publish({ busy: false })
      }
    }
  }

  function retry(key: NodeKey) {
    return retained?.key === key && snapshot.canRetry
      ? start(key, retained.file)
      : Promise.resolve(false)
  }

  function remove(key: NodeKey) {
    const current = editor

    if (!current?.isEditable()) return false

    if (!cancel(key)) invalidate(null)
    let removed = false
    current.update(
      () => {
        const node = $getNodeByKey(key)

        if (node instanceof MediaPlaceholderNode && node.isAttached()) {
          node.remove()
          removed = true
        }
      },
      { discrete: true, tag: [HISTORY_PUSH_TAG, ownTag] },
    )

    return removed
  }

  function configure(next: MediaUpload | undefined) {
    invalidate()
    upload = next
  }

  return {
    register,
    insert,
    start,
    retry,
    cancel,
    remove,
    configure,
    getSnapshot(this: void) {
      return snapshot
    },
    subscribe(this: void, listener: () => void) {
      listeners.add(listener)

      return () => {
        listeners.delete(listener)
      }
    },
  }
}

export type EditorMediaPlaceholderController = ReturnType<
  typeof createEditorMediaPlaceholder
>
