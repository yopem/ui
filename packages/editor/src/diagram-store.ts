import { $isCodeNode, type CodeNode } from "@lexical/code"
import {
  $getNodeByKey,
  $getSelection,
  $getState,
  $getRoot,
  $isRangeSelection,
  HISTORY_PUSH_TAG,
  mergeRegister,
  SKIP_DOM_SELECTION_TAG,
  type LexicalEditor,
} from "lexical"

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

const maximumTimeoutMs = 120_000

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
  let autoRenderTimer: ReturnType<typeof setTimeout> | undefined

  function notify() {
    for (const listener of listeners) listener()
  }

  function stopRender() {
    requestId += 1
    activeRequest?.controller.abort("stale")
    activeRequest = undefined
    clearTimeout(autoRenderTimer)
    autoRenderTimer = undefined

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

    const inputChanged =
      snapshot?.key !== next?.key ||
      snapshot?.source !== next?.source ||
      snapshot?.metadata.kind !== next?.metadata.kind

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

    if (
      options.autoRender === true &&
      snapshot?.editable &&
      inputChanged &&
      cached === undefined
    )
      autoRenderTimer = setTimeout(() => {
        autoRenderTimer = undefined
        void render()
      }, 300)

    notify()
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
    canRender(this: void) {
      return Boolean(snapshot && options.renderers?.[snapshot.metadata.kind])
    },
    subscribe(this: void, listener: () => void) {
      listeners.add(listener)

      if (!unregister) {
        unregister = mergeRegister(
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
        )
        editor.getEditorState().read(() => publish($getSelectedEditorDiagram()))
      }

      return () => {
        listeners.delete(listener)

        if (listeners.size === 0) {
          stopRender()
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

      editor.update(
        () => {
          if (!editor.isEditable() || $getRoot().isDirty()) return
          const code = $createEditorDiagramCodeNode(kind, source, viewMode)
          const selection = $getSelection()

          if ($isRangeSelection(selection)) selection.insertNodes([code])
          else $getRoot().append(code)

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
