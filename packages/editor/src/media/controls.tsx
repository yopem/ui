"use client"

import type { ChangeEvent, ComponentProps, FormEvent, MouseEvent } from "react"

import { useStableCallback } from "@base-ui/utils/useStableCallback"
import { Button } from "@registry/components/ui/button"
import {
  Dialog,
  DialogTrigger,
  DialogPopup,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@registry/components/ui/dialog"
import { Field, FieldLabel } from "@registry/components/ui/field"
import { Form } from "@registry/components/ui/form"
import { Input } from "@registry/components/ui/input"
import { Progress } from "@registry/components/ui/progress"
import { Stack } from "@registry/components/ui/stack"
import { Text } from "@registry/components/ui/text"
import { ToolbarButton } from "@registry/components/ui/toolbar"
import * as stylex from "@stylexjs/stylex"
import { useEditor, useEditorState } from "@yopem-ui/editor"
import {
  $isValidBookmarkPoint,
  createEditorSelectionBookmark,
} from "@yopem-ui/editor/selection-bookmark"
import {
  $createNodeSelection,
  $createParagraphNode,
  $getRoot,
  $getSelection,
  $isRangeSelection,
  $setSelection,
  HISTORY_PUSH_TAG,
  type LexicalEditor,
  type RangeSelection,
} from "lexical"
import { useLayoutEffect, useState, useSyncExternalStore } from "react"

import type { MediaEmbedType, MediaKind, MediaInput } from "./schema"
import type { MediaUpload } from "./upload"

import { $createMediaNode, MediaNode } from "./model"
import { parseMedia } from "./schema"
import { createMediaUpload } from "./upload"

function preventTriggerFocus(
  event: Parameters<
    NonNullable<ComponentProps<typeof DialogTrigger>["onMouseDown"]>
  >[0],
) {
  event.preventDefault()
}

const styles = stylex.create({
  target: { minBlockSize: 44, minInlineSize: 44 },
})

function $rootGap(point: RangeSelection["anchor"]) {
  if (!$isValidBookmarkPoint(point)) return null
  const root = $getRoot()
  let node = point.getNode()

  if (node.is(root)) return point.offset

  while (node.getParent() && !node.getParent()?.is(root)) {
    const parent = node.getParent()

    if (!parent) return null
    node = parent
  }

  if (!node.getParent()?.is(root)) return null
  const index = node.getIndexWithinParent()

  return index >= 0 && root.getChildAtIndex(index)?.is(node) ? index + 1 : null
}

function createMediaInsertSession(
  editor: LexicalEditor,
  bookmark: ReturnType<typeof createEditorSelectionBookmark>,
  task: ReturnType<typeof createMediaUpload>,
) {
  interface Target {
    selection: RangeSelection
    revision: number
    root: HTMLElement
    verifiedState: ReturnType<LexicalEditor["getEditorState"]>
  }

  interface Configuration {
    upload: MediaUpload | undefined
  }

  interface Lease {
    configuration: Configuration
    target: Target
    active: boolean
  }

  let current: Target | null = null
  let subscribed = false
  let configuration: Configuration | null = null
  let pending: Lease | null = null
  let verifiedState: ReturnType<LexicalEditor["getEditorState"]> | null = null

  const listeners = new Set<() => void>()
  const uploadListeners = new Set<() => void>()

  function clear() {
    const hadSession = current !== null
    current = null
    task.cancel()

    if (!current) bookmark.clear()

    if (hadSession) for (const listener of listeners) listener()
  }

  function checkSelection() {
    if (!current) return false
    const selection = $getSelection()

    if (
      selection &&
      (!$isRangeSelection(selection) || !selection.is(current.selection))
    ) {
      clear()

      return false
    }

    return true
  }

  function valid(target: typeof current) {
    if (
      !target ||
      current !== target ||
      !subscribed ||
      !editor.isEditable() ||
      editor.getRootElement() !== target.root ||
      !target.root.isConnected ||
      bookmark.getRevision() !== target.revision ||
      !bookmark.getSnapshot()
    ) {
      if (current === target) clear()

      return false
    }

    return true
  }

  function check(target: typeof current) {
    if (!valid(target)) return false

    function checkTarget() {
      return (
        checkSelection() &&
        target !== null &&
        $rootGap(target.selection.anchor) !== null &&
        $rootGap(target.selection.focus) !== null
      )
    }

    if (
      !editor.read("latest", checkTarget) ||
      !editor.read("pending", checkTarget)
    ) {
      if (current === target) clear()

      return false
    }

    return valid(target)
  }

  return {
    subscribe(this: void, listener: () => void) {
      listeners.add(listener)
      subscribed = true
      verifiedState = editor.getEditorState()

      const stopUpdate = editor.registerUpdateListener(
        ({ editorState, prevEditorState, dirtyElements, dirtyLeaves }) => {
          const target = current

          if (dirtyElements.size > 0 || dirtyLeaves.size > 0) {
            if (target?.verifiedState === prevEditorState) clear()

            if (subscribed && editor.getEditorState() === editorState)
              verifiedState = editorState

            return
          }

          if (
            editor.getEditorState() !== editorState ||
            verifiedState !== prevEditorState
          )
            return

          if (target) {
            if (target.verifiedState !== prevEditorState || !valid(target))
              return

            if (!editorState.read(checkSelection)) {
              if (
                subscribed &&
                current === null &&
                verifiedState === prevEditorState &&
                editor.getEditorState() === editorState
              )
                verifiedState = editorState

              return
            }

            if (current !== target) return

            if (!valid(target) || editor.getEditorState() !== editorState)
              return

            target.verifiedState = editorState
          }

          verifiedState = editorState
        },
      )

      const stopEditable = editor.registerEditableListener((editable) => {
        if (!editable) clear()
      })

      const stopRoot = editor.registerRootListener((root) => {
        if (current && (root !== current.root || !root?.isConnected)) clear()
      })

      return () => {
        subscribed = false
        verifiedState = null
        stopUpdate()
        stopEditable()
        stopRoot()
        listeners.delete(listener)
        clear()
      }
    },
    getSnapshot(this: void) {
      return current !== null
    },
    getServerSnapshot(this: void) {
      return false
    },
    capture() {
      clear()
      const root = editor.getRootElement()

      if (
        !subscribed ||
        !editor.isEditable() ||
        !root?.isConnected ||
        verifiedState !== editor.getEditorState()
      )
        return
      editor.read("latest", () => {
        const selection = $getSelection()

        if (!$isRangeSelection(selection)) return
        bookmark.capture()

        if (!bookmark.getSnapshot()) return
        current = {
          selection: selection.clone(),
          revision: bookmark.getRevision(),
          root,
          verifiedState: editor.getEditorState(),
        }
      })

      if (current && check(current))
        for (const listener of listeners) listener()
    },
    configure(upload: MediaUpload | undefined) {
      const next = { upload }
      configuration = next

      return () => {
        if (configuration !== next) return
        configuration = null

        if (pending?.configuration === next && current === pending.target)
          clear()
      }
    },
    beginUpload(upload: MediaUpload, target: typeof current) {
      if (
        !configuration ||
        configuration.upload !== upload ||
        pending ||
        !target
      )
        return null
      const lease = { configuration, target, active: true }
      pending = lease

      for (const listener of uploadListeners) listener()

      return lease
    },
    validUpload(lease: typeof pending) {
      return (
        lease !== null &&
        pending === lease &&
        lease.active &&
        configuration === lease.configuration &&
        current === lease.target
      )
    },
    endUpload(lease: typeof pending) {
      if (pending !== lease) return
      pending = null

      for (const listener of uploadListeners) listener()
    },
    cancelUpload() {
      if (pending) pending.active = false
      task.cancel()
    },
    subscribeUpload(this: void, listener: () => void) {
      uploadListeners.add(listener)

      return () => {
        uploadListeners.delete(listener)
      }
    },
    getUploadSnapshot(this: void) {
      return pending !== null
    },
    currentConfiguration(lease: typeof pending) {
      return (
        lease !== null &&
        pending === lease &&
        lease.active &&
        configuration === lease.configuration
      )
    },
    current() {
      return current
    },
    committed(target: typeof current) {
      return (
        target !== null &&
        current === target &&
        target.verifiedState === verifiedState &&
        editor.getEditorState() === verifiedState
      )
    },
    mounted() {
      return subscribed
    },
    consume(target: typeof current) {
      if (!target || current !== target) return false
      current = null

      return true
    },
    finish() {
      if (current) return
      clear()

      for (const listener of listeners) listener()
    },
    valid,
    check,
    checkSelection,
    clear,
  }
}

export function MediaInsertControl({
  kind,
  embedType,
  upload,
}: {
  kind: MediaKind
  embedType?: MediaEmbedType
  upload?: MediaUpload
}) {
  const editor = useEditor()
  const { editable } = useEditorState()
  const [bookmark] = useState(() => createEditorSelectionBookmark(editor))

  const hasBookmark = useSyncExternalStore(
    bookmark.subscribe,
    bookmark.getSnapshot,
    bookmark.getServerSnapshot,
  )

  const [task] = useState(createMediaUpload)

  const [session] = useState(() =>
    createMediaInsertSession(editor, bookmark, task),
  )

  const hasSession = useSyncExternalStore(
    session.subscribe,
    session.getSnapshot,
    session.getServerSnapshot,
  )

  useLayoutEffect(() => session.configure(upload), [session, upload])

  const uploadPending = useSyncExternalStore(
    session.subscribeUpload,
    session.getUploadSnapshot,
    session.getServerSnapshot,
  )

  const state = useSyncExternalStore(
    task.subscribe,
    task.getSnapshot,
    task.getSnapshot,
  )

  const [open, setOpen] = useState(false)
  const [error, setError] = useState(false)

  const sessionValid = hasSession && hasBookmark

  const label = embedType ?? kind

  const insert = useStableCallback(function insert(
    value: MediaInput,
    target: ReturnType<typeof session.current>,
    lease?: ReturnType<typeof session.beginUpload>,
  ) {
    const media = parseMedia(value)
    const source = new URL(value.url)

    if (/[?#]/u.test(source.href))
      throw new Error("Media URLs cannot contain queries or fragments.")

    let inserted = false
    let consumed = false

    try {
      if (
        editor.isEditable() &&
        !editor._updating &&
        editor._dirtyElements.size === 0 &&
        editor._dirtyLeaves.size === 0 &&
        (lease === undefined || session.validUpload(lease)) &&
        session.committed(target) &&
        session.check(target) &&
        session.committed(target)
      ) {
        editor.update(
          () => {
            if (
              !editor.isEditable() ||
              editor._dirtyElements.size > 0 ||
              editor._dirtyLeaves.size > 0 ||
              !session.valid(target) ||
              !session.checkSelection() ||
              !target ||
              !session.committed(target) ||
              !editor.hasNodes([MediaNode]) ||
              (lease !== undefined && !session.validUpload(lease))
            )
              return

            const selection = target.selection
            const anchor = $rootGap(selection.anchor)
            const focus = $rootGap(selection.focus)

            if (anchor === null || focus === null) return
            const index = selection.isBackward() ? anchor : focus
            const root = $getRoot()

            if (
              index < 0 ||
              index > root.getChildrenSize() ||
              !bookmark.restore()
            )
              return
            consumed = session.consume(target)

            if (!consumed) return
            const node = $createMediaNode(media)
            const paragraph = $createParagraphNode()
            root.splice(index, 0, [node, paragraph])
            const selected = $createNodeSelection()
            selected.add(node.getKey())
            $setSelection(selected)
            inserted = true
          },
          { discrete: true, tag: HISTORY_PUSH_TAG },
        )
      }
    } finally {
      if (consumed) session.finish()
    }

    if (!inserted) {
      if (session.current() === target) session.clear()
      throw new Error("Selection changed. Select an insertion point.")
    }

    if (
      session.mounted() &&
      !session.current() &&
      (lease === undefined || session.currentConfiguration(lease))
    ) {
      setOpen(false)
      editor.focus()
    }
  })

  const changeOpen = useStableCallback(function changeOpen(next: boolean) {
    if (next) {
      task.reset()
      session.capture()
      setError(false)
    } else {
      session.clear()
    }

    setOpen(next)
  })

  const submitURL = useStableCallback(function submitURL(
    event: FormEvent<HTMLFormElement>,
  ) {
    if (event.defaultPrevented) return
    event.preventDefault()
    const url = new FormData(event.currentTarget).get("url")

    if (url === null || url instanceof File) return
    const target = session.current()

    try {
      insert(
        kind === "embed" && embedType
          ? { kind, url, embedType }
          : { kind, url },
        target,
      )

      if (session.mounted() && !session.current()) setError(false)
    } catch {
      if (
        session.mounted() &&
        (!session.current() || session.current() === target)
      )
        setError(true)
    }
  })

  function uploadTargetReady(target: ReturnType<typeof session.current>) {
    return (
      !editor._updating &&
      editor._dirtyElements.size === 0 &&
      editor._dirtyLeaves.size === 0 &&
      editor.hasNodes([MediaNode]) &&
      session.committed(target) &&
      session.check(target) &&
      !editor._updating &&
      editor._dirtyElements.size === 0 &&
      editor._dirtyLeaves.size === 0 &&
      editor.hasNodes([MediaNode]) &&
      session.valid(target) &&
      session.committed(target)
    )
  }

  const uploadFile = useStableCallback(async function uploadFile(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.currentTarget.files?.[0]
    event.currentTarget.value = ""

    if (!file) return

    const target = session.current()

    if (!uploadTargetReady(target)) {
      if (session.mounted() && !session.current()) setError(true)

      return
    }

    if (!upload || kind === "embed") return
    const lease = session.beginUpload(upload, target)

    if (!lease) return

    try {
      if (
        !session.validUpload(lease) ||
        !uploadTargetReady(target) ||
        !session.validUpload(lease)
      )
        return

      const result = await task.start(
        file,
        kind,
        function invokeUpload(nextFile, context) {
          if (
            context.signal.aborted ||
            !session.validUpload(lease) ||
            !uploadTargetReady(target) ||
            context.signal.aborted ||
            !session.validUpload(lease)
          )
            return Promise.reject(new Error("Upload is no longer active."))

          return upload(nextFile, context)
        },
      )

      if (!result || !session.validUpload(lease) || !session.valid(target))
        return

      try {
        insert(result, target, lease)
      } catch {
        if (session.mounted() && session.validUpload(lease)) setError(true)
      }
    } finally {
      session.endUpload(lease)
    }
  })

  const [cancelUpload] = useState(() => {
    return function cancelUpload(event: MouseEvent<HTMLButtonElement>) {
      if (event.defaultPrevented) return
      session.cancelUpload()
    }
  })

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogTrigger
        render={
          <ToolbarButton
            render={<Button xstyle={styles.target} />}
            disabled={!editable}
          />
        }
        disabled={!editable}
        onMouseDown={preventTriggerFocus}
      >
        Insert {label}
      </DialogTrigger>
      <DialogPopup finalFocus={() => editor.getRootElement()}>
        <DialogHeader>
          <DialogTitle>Insert {label}</DialogTitle>
          <DialogDescription>
            Use an HTTPS media URL without credentials, queries, or fragments.
          </DialogDescription>
        </DialogHeader>
        <Stack>
          <Form onSubmit={submitURL}>
            <Stack>
              <Field>
                <FieldLabel>Media URL</FieldLabel>
                <Input
                  xstyle={styles.target}
                  name="url"
                  type="url"
                  required
                  aria-invalid={error}
                />
              </Field>
              {error && (
                <Text role="alert">Check the URL and insertion point.</Text>
              )}
              {!sessionValid && (
                <Text role="alert">Select an insertion point again.</Text>
              )}
              <Button
                type="submit"
                disabled={
                  !editable || !sessionValid || state.status === "uploading"
                }
                xstyle={styles.target}
              >
                Insert
              </Button>
            </Stack>
          </Form>
          {upload && kind !== "embed" && (
            <>
              <Field>
                <FieldLabel>Upload media</FieldLabel>
                <Input
                  xstyle={styles.target}
                  type="file"
                  disabled={!editable || !sessionValid || uploadPending}
                  onChange={uploadFile}
                />
              </Field>
              {state.status === "uploading" && (
                <>
                  <Progress value={state.progress} aria-label="Media upload" />
                  <Button
                    type="button"
                    xstyle={styles.target}
                    onClick={cancelUpload}
                  >
                    Cancel upload
                  </Button>
                </>
              )}
              {state.status === "error" && (
                <Text role="alert">Upload failed. Try again.</Text>
              )}
              {state.status === "cancelled" && (
                <output>Upload cancelled.</output>
              )}
            </>
          )}
        </Stack>
      </DialogPopup>
    </Dialog>
  )
}
