import { $isCodeNode, CodeNode } from "@lexical/code"
import {
  $getNodeByKey,
  $getSelection,
  $getState,
  $getRoot,
  $isElementNode,
  $isRangeSelection,
  HISTORY_PUSH_TAG,
  mergeRegister,
  SKIP_DOM_SELECTION_TAG,
  type LexicalEditor,
  type LexicalNode,
} from "lexical"

import {
  createEditorDiagramAutoRenderQueue,
  type EditorDiagramAutoRenderJob,
  type EditorDiagramAutoRenderSnapshot,
} from "./diagram-auto-render"
import {
  EDITOR_DIAGRAM_KINDS,
  type EditorDiagramKind,
  type EditorDiagramMetadata,
  type EditorDiagramViewMode,
} from "./diagram-model"
import {
  getEditorDiagramRenderedSvg,
  setEditorDiagramRenderedSvg,
} from "./diagram-presentation"
import {
  renderEditorDiagram,
  type EditorDiagramRenderer,
} from "./diagram-render"
import {
  $createEditorDiagramCodeNode,
  $getSelectedEditorDiagram,
  $setEditorDiagramMetadata,
  editorDiagramState,
} from "./diagram-state"

export type EditorDiagramRenderers = Partial<
  Record<EditorDiagramKind, EditorDiagramRenderer>
>

export interface EditorDiagramStoreOptions {
  renderers?: EditorDiagramRenderers
  timeoutMs?: number
  autoRender?: boolean
}

export interface EditorDiagramSnapshot {
  readonly key: string
  readonly source: string
  readonly metadata: EditorDiagramMetadata
  readonly editable: boolean
}

export type EditorDiagramRenderSnapshot =
  | { readonly status: "idle" }
  | { readonly status: "loading" }
  | { readonly status: "error"; readonly message: string }
  | { readonly status: "ready"; readonly svg: string }

const idleRenderSnapshot: EditorDiagramRenderSnapshot = { status: "idle" }

const idleAutoRenderSnapshot: EditorDiagramAutoRenderSnapshot = {
  busy: false,
  queued: 0,
  rendering: 0,
}

const maximumTimeoutMs = 120_000

const autoRenderDebounceMs = 500

const maximumDebouncedNodes = 16

export function createEditorDiagramStore(
  editor: LexicalEditor,
  options: EditorDiagramStoreOptions = {},
) {
  const timeoutMs = options.timeoutMs ?? 15_000

  if (
    !Number.isSafeInteger(timeoutMs) ||
    timeoutMs < 1 ||
    timeoutMs > maximumTimeoutMs
  )
    throw new Error("Diagram renderer timeout is invalid.")

  const listeners = new Set<() => void>()
  let target: CodeNode | null = null
  let snapshot: EditorDiagramSnapshot | null = null
  let renderSnapshot: EditorDiagramRenderSnapshot = idleRenderSnapshot
  let unregister: (() => void) | undefined
  let generation = 0
  let requestId = 0
  let activeRequest: { id: number; controller: AbortController } | undefined
  let controlsFocused = false
  let autoRenderSnapshot = idleAutoRenderSnapshot
  let autoKeys: string[] | undefined
  let autoKeyIndex = 0
  let autoRescanRequested = false
  let autoRoot: HTMLElement | null | undefined
  let autoInitialized = false
  const autoDirtyKeys = new Set<string>()
  let autoDirtyOverflow = false
  let autoDebounceTimer: ReturnType<typeof setTimeout> | undefined

  const autoQueue =
    options.autoRender === true && !editor._headless
      ? createEditorDiagramAutoRenderQueue({
          timeoutMs,
          nextJob: nextAutoRenderJob,
          onStart: autoRenderStarted,
          onRendered: autoRenderCompleted,
          onError: autoRenderFailed,
          onSnapshot: publishAutoRenderSnapshot,
        })
      : undefined

  function notify() {
    for (const listener of listeners) listener()
  }

  function stopRender() {
    requestId += 1
    activeRequest?.controller.abort("stale")
    activeRequest = undefined

    if (renderSnapshot.status !== "idle") renderSnapshot = idleRenderSnapshot
  }

  function publish(code: CodeNode | null, contentChanged = false) {
    const metadata = code ? $getState(code, editorDiagramState) : null

    const next =
      code && metadata
        ? {
            key: code.getKey(),
            source: code.getTextContent(),
            metadata,
            editable: editor.isEditable(),
          }
        : null

    const targetChanged = code !== target

    const snapshotChanged =
      snapshot?.key !== next?.key ||
      snapshot?.source !== next?.source ||
      snapshot?.editable !== next?.editable ||
      snapshot?.metadata.version !== next?.metadata.version ||
      snapshot?.metadata.kind !== next?.metadata.kind ||
      snapshot?.metadata.viewMode !== next?.metadata.viewMode

    target = next ? code : null

    if (!contentChanged && !targetChanged && !snapshotChanged) return

    generation += 1
    stopRender()
    snapshot = next

    const cached = snapshot
      ? getEditorDiagramRenderedSvg(
          editor,
          snapshot.key,
          snapshot.source,
          snapshot.metadata.kind,
        )
      : undefined

    if (cached !== undefined) renderSnapshot = { status: "ready", svg: cached }

    notify()
  }

  function collectAutoRenderKeys() {
    return editor.getEditorState().read(() => {
      const keys: string[] = []

      function collect(node: LexicalNode) {
        if ($isCodeNode(node) && $getState(node, editorDiagramState))
          keys.push(node.getKey())

        if ($isElementNode(node))
          for (const child of node.getChildren()) collect(child)
      }

      for (const child of $getRoot().getChildren()) collect(child)

      return keys
    })
  }

  function readAutoRenderJob(key: string) {
    let job: EditorDiagramAutoRenderJob | undefined

    editor.getEditorState().read(() => {
      const code = $getNodeByKey(key)

      if (!$isCodeNode(code) || !code.isAttached()) return
      const metadata = $getState(code, editorDiagramState)
      const renderer = metadata && options.renderers?.[metadata.kind]

      if (!metadata || !renderer) return
      const source = code.getTextContent()

      if (
        getEditorDiagramRenderedSvg(editor, key, source, metadata.kind) !==
        undefined
      )
        return

      job = { key, source, metadata, renderer }
    })

    return job
  }

  function nextAutoRenderJob() {
    if (
      !autoQueue ||
      listeners.size === 0 ||
      !autoRoot ||
      editor._headless ||
      (autoDebounceTimer !== undefined && autoDirtyOverflow)
    )
      return undefined

    while (true) {
      if (
        (!autoKeys || autoKeyIndex >= autoKeys.length) &&
        autoRescanRequested
      ) {
        autoRescanRequested = false
        autoKeys = collectAutoRenderKeys()
        autoKeyIndex = 0
      }

      const key = autoKeys?.[autoKeyIndex]

      if (key === undefined) {
        autoKeys = undefined
        autoKeyIndex = 0

        return undefined
      }

      autoKeyIndex += 1

      if (autoDirtyKeys.has(key)) continue
      const job = readAutoRenderJob(key)

      if (job) return job
    }
  }

  function publishAutoRenderSnapshot(
    queueSnapshot: EditorDiagramAutoRenderSnapshot,
  ) {
    const scanning =
      (autoKeys !== undefined && autoKeyIndex < autoKeys.length) ||
      autoRescanRequested ||
      autoDirtyKeys.size > 0 ||
      autoDirtyOverflow ||
      autoDebounceTimer !== undefined

    const next = {
      busy: queueSnapshot.busy || scanning,
      queued: queueSnapshot.queued,
      rendering: queueSnapshot.rendering,
    }

    if (
      next.busy === autoRenderSnapshot.busy &&
      next.queued === autoRenderSnapshot.queued &&
      next.rendering === autoRenderSnapshot.rendering
    )
      return

    autoRenderSnapshot = next
    notify()
  }

  function matchesAutoRenderTarget(job: EditorDiagramAutoRenderJob) {
    return (
      snapshot?.key === job.key &&
      snapshot.source === job.source &&
      snapshot.metadata.kind === job.metadata.kind
    )
  }

  function isCurrentAutoRenderJob(job: EditorDiagramAutoRenderJob) {
    if (!listeners.size || !autoRoot || editor._headless) return false

    return editor.getEditorState().read(() => {
      const code = $getNodeByKey(job.key)

      if (!$isCodeNode(code) || !code.isAttached()) return false
      const metadata = $getState(code, editorDiagramState)

      return (
        !!metadata &&
        code.getTextContent() === job.source &&
        metadata.kind === job.metadata.kind
      )
    })
  }

  function autoRenderStarted(job: EditorDiagramAutoRenderJob) {
    if (!matchesAutoRenderTarget(job)) return
    renderSnapshot = { status: "loading" }
    notify()
  }

  function autoRenderCompleted(job: EditorDiagramAutoRenderJob, svg: string) {
    if (!isCurrentAutoRenderJob(job)) return

    const stored = setEditorDiagramRenderedSvg(
      editor,
      job.key,
      job.source,
      job.metadata.kind,
      svg,
    )

    if (!stored || !matchesAutoRenderTarget(job)) return
    renderSnapshot = { status: "ready", svg }
    notify()
  }

  function autoRenderFailed(job: EditorDiagramAutoRenderJob) {
    if (!isCurrentAutoRenderJob(job) || !matchesAutoRenderTarget(job)) return
    renderSnapshot = {
      status: "error",
      message: "Diagram rendering failed.",
    }
    notify()
  }

  function setAutoRoot(root: HTMLElement | null) {
    if (root === autoRoot) return
    autoKeys = undefined
    autoKeyIndex = 0
    autoRescanRequested = false
    clearTimeout(autoDebounceTimer)
    autoDebounceTimer = undefined
    autoDirtyKeys.clear()
    autoDirtyOverflow = false
    autoQueue?.cancelAll()
    autoRoot = root

    if (root && !editor._headless && listeners.size > 0) {
      autoKeys = collectAutoRenderKeys()
      autoQueue?.wake()
    }

    publishAutoRenderSnapshot(
      autoQueue?.getSnapshot() ?? idleAutoRenderSnapshot,
    )
  }

  function handleCodeMutations(
    mutations: Map<string, "created" | "updated" | "destroyed">,
  ) {
    if (!autoQueue || !autoInitialized || !autoRoot) return
    const jobs: EditorDiagramAutoRenderJob[] = []
    const cancelled: string[] = []

    editor.getEditorState().read(() => {
      for (const [key, mutation] of mutations) {
        if (mutation === "destroyed") {
          cancelled.push(key)
          continue
        }

        const code = $getNodeByKey(key)

        if (!$isCodeNode(code) || !code.isAttached()) {
          cancelled.push(key)
          continue
        }

        const metadata = $getState(code, editorDiagramState)
        const renderer = metadata && options.renderers?.[metadata.kind]

        if (!metadata || !renderer) {
          cancelled.push(key)
          continue
        }

        const source = code.getTextContent()

        if (
          getEditorDiagramRenderedSvg(editor, key, source, metadata.kind) !==
          undefined
        ) {
          cancelled.push(key)
          continue
        }

        jobs.push({ key, source, metadata, renderer })
      }
    })

    for (const key of cancelled) {
      autoDirtyKeys.delete(key)
      autoQueue.cancel(key)
    }

    for (const job of jobs) {
      if (autoQueue.has(job)) continue

      if (
        !autoDirtyKeys.has(job.key) &&
        autoDirtyKeys.size >= maximumDebouncedNodes
      )
        autoDirtyOverflow = true
      else autoDirtyKeys.add(job.key)

      autoQueue.cancel(job.key)
    }

    clearTimeout(autoDebounceTimer)

    if (autoDirtyKeys.size > 0 || autoDirtyOverflow)
      autoDebounceTimer = setTimeout(() => {
        autoDebounceTimer = undefined
        const keys = [...autoDirtyKeys]
        autoDirtyKeys.clear()
        const overflow = autoDirtyOverflow
        autoDirtyOverflow = false

        for (const key of keys) {
          const job = readAutoRenderJob(key)

          if (job && !autoQueue.enqueue(job)) autoRescanRequested = true
        }

        if (overflow) autoRescanRequested = true
        autoQueue.wake()
        publishAutoRenderSnapshot(autoQueue.getSnapshot())
      }, autoRenderDebounceMs)
    else autoDebounceTimer = undefined

    autoQueue.wake()
    publishAutoRenderSnapshot(autoQueue.getSnapshot())
  }

  function resolve(revision = generation) {
    if (revision !== generation || !unregister || !target) return null
    const code = $getNodeByKey(target.getKey())
    const selection = $getSelection()

    if (!$isCodeNode(code) || code !== target || !code.isAttached()) return null

    if (!$getState(code, editorDiagramState)) return null

    if (selection !== null && $getSelectedEditorDiagram() !== code) return null

    return code
  }

  function mutate(
    change: (code: CodeNode, metadata: EditorDiagramMetadata) => void,
    revision: number,
  ) {
    if (revision !== generation || !editor.isEditable()) return false
    let changed = false

    editor.update(
      () => {
        if (
          revision !== generation ||
          !editor.isEditable() ||
          $getRoot().isDirty()
        )
          return
        const code = resolve(revision)

        if (!code) return
        const metadata = $getState(code, editorDiagramState)

        if (!metadata) return
        change(code, metadata)
        changed = true
      },
      {
        discrete: true,
        tag: [
          HISTORY_PUSH_TAG,
          SKIP_DOM_SELECTION_TAG,
          "yopem-diagram-control",
        ],
      },
    )

    return changed
  }

  function isCurrent(
    id: number,
    revision: number,
    captured: EditorDiagramSnapshot,
  ) {
    if (id !== requestId || revision !== generation || !unregister) return false

    return editor.getEditorState().read(() => {
      const code = resolve(revision)

      if (!code) return false
      const metadata = $getState(code, editorDiagramState)

      if (!metadata) return false

      return (
        code.getKey() === captured.key &&
        code.getTextContent() === captured.source &&
        metadata.kind === captured.metadata.kind &&
        metadata.viewMode === captured.metadata.viewMode
      )
    })
  }

  async function render(revision = generation) {
    if (revision !== generation || !snapshot || !unregister) return false
    const renderer = options.renderers?.[snapshot.metadata.kind]

    if (!renderer) {
      renderSnapshot = {
        status: "error",
        message: `No ${snapshot.metadata.kind} renderer is configured.`,
      }
      notify()

      return false
    }

    stopRender()
    const id = ++requestId
    const controller = new AbortController()
    const captured = snapshot
    const deadlineAt = Date.now() + timeoutMs
    activeRequest = { id, controller }
    renderSnapshot = { status: "loading" }
    notify()

    try {
      const svg = await renderEditorDiagram(
        {
          diagram: captured.metadata,
          source: captured.source,
          signal: controller.signal,
          deadlineAt,
        },
        renderer,
      )

      if (!isCurrent(id, revision, captured)) return false
      setEditorDiagramRenderedSvg(
        editor,
        captured.key,
        captured.source,
        captured.metadata.kind,
        svg,
      )
      renderSnapshot = { status: "ready", svg }
      notify()

      return true
    } catch {
      if (!isCurrent(id, revision, captured)) return false
      renderSnapshot = {
        status: "error",
        message: "Diagram rendering failed.",
      }
      notify()

      return false
    } finally {
      if (activeRequest?.id === id) activeRequest = undefined
    }
  }

  return {
    getRevision(this: void) {
      return generation
    },
    getSnapshot(this: void) {
      return snapshot
    },
    getServerSnapshot(this: void) {
      return null
    },
    getRenderSnapshot(this: void) {
      return renderSnapshot
    },
    getRenderServerSnapshot(this: void) {
      return idleRenderSnapshot
    },
    getAutoRenderSnapshot(this: void) {
      return autoRenderSnapshot
    },
    getAutoRenderServerSnapshot(this: void) {
      return idleAutoRenderSnapshot
    },
    canRender(this: void) {
      return Boolean(snapshot && options.renderers?.[snapshot.metadata.kind])
    },
    subscribe(this: void, listener: () => void) {
      listeners.add(listener)

      if (!unregister) {
        const cleanups = [
          editor.registerUpdateListener(
            ({ editorState, dirtyElements, dirtyLeaves }) => {
              const dirty = dirtyElements.size > 0 || dirtyLeaves.size > 0

              editorState.read(() => {
                const selection = $getSelection()

                if (selection !== null)
                  publish($getSelectedEditorDiagram(), dirty)
                else if (controlsFocused && target) {
                  const code = $getNodeByKey(target.getKey())

                  publish($isCodeNode(code) ? code : null, dirty)
                } else if (dirty) publish(null, true)
              })
            },
          ),
          editor.registerEditableListener(() => {
            editor.getEditorState().read(() => publish(resolve()))
          }),
        ]

        if (autoQueue)
          cleanups.push(
            editor.registerMutationListener(CodeNode, handleCodeMutations, {
              skipInitialization: true,
            }),
          )

        editor.getEditorState().read(() => publish($getSelectedEditorDiagram()))
        autoInitialized = true

        if (autoQueue) {
          cleanups.push(
            editor.registerRootListener((root) => setAutoRoot(root)),
          )
          setAutoRoot(editor.getRootElement())
        }

        unregister = mergeRegister(...cleanups)
      }

      return () => {
        listeners.delete(listener)

        if (listeners.size === 0) {
          stopRender()
          autoQueue?.cancelAll()
          autoKeys = undefined
          autoKeyIndex = 0
          autoRescanRequested = false
          clearTimeout(autoDebounceTimer)
          autoDebounceTimer = undefined
          autoDirtyKeys.clear()
          autoDirtyOverflow = false
          autoRoot = undefined
          autoInitialized = false
          autoRenderSnapshot = idleAutoRenderSnapshot
          unregister?.()
          unregister = undefined
          generation += 1
          target = null
          snapshot = null
          renderSnapshot = idleRenderSnapshot
          controlsFocused = false
        }
      }
    },
    enterControls() {
      controlsFocused = true
    },
    leaveControls() {
      controlsFocused = false
    },
    blur() {
      controlsFocused = false
      generation += 1
      target = null
      snapshot = null
      stopRender()
      renderSnapshot = idleRenderSnapshot
      notify()
    },
    insert(
      kind: EditorDiagramKind,
      source: string,
      viewMode: EditorDiagramViewMode = "both",
    ) {
      if (!editor.isEditable()) return false
      let changed = false
      const targetKey = controlsFocused ? target?.getKey() : undefined

      editor.update(
        () => {
          if (!editor.isEditable() || $getRoot().isDirty()) return
          const code = $createEditorDiagramCodeNode(kind, source, viewMode)
          const selectedTarget = targetKey ? $getNodeByKey(targetKey) : null

          if ($isCodeNode(selectedTarget) && selectedTarget.isAttached()) {
            selectedTarget.insertAfter(code)
          } else {
            const selection = $getSelection()

            if (
              $isRangeSelection(selection) &&
              $getNodeByKey(selection.anchor.key)?.isAttached() &&
              $getNodeByKey(selection.focus.key)?.isAttached()
            )
              selection.insertNodes([code])
            else $getRoot().append(code)
          }

          code.selectStart()
          changed = true
        },
        { discrete: true, tag: HISTORY_PUSH_TAG },
      )

      return changed
    },
    setKind(kind: EditorDiagramKind, revision = generation) {
      if (!EDITOR_DIAGRAM_KINDS.includes(kind)) return false

      return mutate((code, metadata) => {
        if (metadata.kind !== kind)
          $setEditorDiagramMetadata(code, { ...metadata, kind })
      }, revision)
    },
    setViewMode(viewMode: EditorDiagramViewMode, revision = generation) {
      if (!["code", "image", "both"].includes(viewMode)) return false

      return mutate((code, metadata) => {
        if (metadata.viewMode !== viewMode)
          $setEditorDiagramMetadata(code, { ...metadata, viewMode })
      }, revision)
    },
    getDownload(
      revision = generation,
    ): { svg: string; kind: EditorDiagramKind } | null {
      if (revision !== generation || renderSnapshot.status !== "ready")
        return null
      let download: { svg: string; kind: EditorDiagramKind } | null = null
      const rendered = renderSnapshot

      editor.update(
        () => {
          if (revision !== generation || $getRoot().isDirty()) return
          const code = resolve(revision)
          const metadata = code ? $getState(code, editorDiagramState) : null

          if (!code || !metadata || rendered !== renderSnapshot) return
          download = { svg: rendered.svg, kind: metadata.kind }
        },
        { discrete: true },
      )

      return download
    },
    render(revision = generation) {
      return render(revision)
    },
    cancelRender() {
      if (!activeRequest && renderSnapshot.status !== "loading") return false
      stopRender()
      notify()

      return true
    },
    delete(revision = generation) {
      if (revision !== generation || !editor.isEditable()) return false
      let removed = false

      editor.update(
        () => {
          if (
            revision !== generation ||
            !editor.isEditable() ||
            $getRoot().isDirty()
          )
            return
          const code = resolve(revision)

          if (!code) return
          const previous = code.getPreviousSibling()
          const next = code.getNextSibling()

          if (previous) previous.selectEnd()
          else if (next) next.selectStart()
          code.remove()
          removed = true
        },
        { discrete: true, tag: HISTORY_PUSH_TAG },
      )

      if (removed) editor.focus()

      return removed
    },
  }
}
