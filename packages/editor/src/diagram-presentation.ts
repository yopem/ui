import type { DOMSlotForNode, LexicalEditor } from "lexical"

import { $isCodeNode, CodeNode } from "@lexical/code"
import { DOMRenderExtension, domOverride } from "@lexical/html"
import {
  $getNodeByKey,
  $getRoot,
  $getState,
  configExtension,
  defineExtension,
  mergeRegister,
  setDOMUnmanaged,
  SKIP_DOM_SELECTION_TAG,
  SKIP_SELECTION_FOCUS_TAG,
} from "lexical"

import {
  EDITOR_DIAGRAM_MAX_SVG_BYTES,
  type EditorDiagramKind,
} from "./diagram-model"
import { $getSelectedEditorDiagram, editorDiagramState } from "./diagram-state"

const maximumCacheBytes = 8 * 1024 * 1024

const maximumCacheEntries = 32

export interface EditorDiagramPresentationClasses {
  source: string
  preview: string
  button: string
  selectedButton: string
  image: string
  imageOnly: readonly string[]
}

interface PreviewResult {
  source: string
  kind: EditorDiagramKind
  svg: string
  bytes: number
}

interface PreviewHost {
  classes: EditorDiagramPresentationClasses
  root: HTMLElement
  source: HTMLSpanElement
  preview: HTMLSpanElement
  button: HTMLButtonElement
  image: HTMLImageElement
  error: HTMLSpanElement
  requestedSvg: string | null
  loadedSvg: string | null
  decodeError: boolean
  lastSource: string
  lastKind: EditorDiagramKind | null
  clearListeners(): void
}

interface PresentationState {
  hosts: Map<string, PreviewHost>
  results: Map<string, PreviewResult>
  bytes: number
}

const presentations = new WeakMap<LexicalEditor, PresentationState>()

function getPresentation(editor: LexicalEditor) {
  let state = presentations.get(editor)

  if (!state) {
    state = { hosts: new Map(), results: new Map(), bytes: 0 }
    presentations.set(editor, state)
  }

  return state
}

function setHidden(element: HTMLElement, hidden: boolean) {
  element.hidden = hidden
  element.style.display = hidden ? "none" : ""
}

function clearResult(state: PresentationState, key: string) {
  const previous = state.results.get(key)

  if (!previous) return
  state.bytes -= previous.bytes
  state.results.delete(key)
  const host = state.hosts.get(key)

  if (host) {
    host.requestedSvg = null
    host.loadedSvg = null
  }
}

function paintSelection(state: PresentationState) {
  const key = $getSelectedEditorDiagram()?.getKey()

  for (const [nodeKey, host] of state.hosts) {
    const selected = nodeKey === key
    host.button.className = selected
      ? host.classes.selectedButton
      : host.classes.button

    if (selected) host.button.setAttribute("aria-current", "true")
    else host.button.removeAttribute("aria-current")
  }
}

function clearHost(state: PresentationState, key: string) {
  const host = state.hosts.get(key)

  if (!host) return
  host.clearListeners()
  host.image.removeAttribute("src")
  host.root.classList.remove(...host.classes.imageOnly)
  host.root.removeAttribute("data-editor-diagram-live")

  if (host.source.parentNode)
    while (host.source.firstChild) host.source.before(host.source.firstChild)
  host.source.remove()
  host.preview.remove()
  state.hosts.delete(key)
}

function syncPreview(editor: LexicalEditor, node: CodeNode) {
  const state = getPresentation(editor)
  const key = node.getKey()
  const host = state.hosts.get(key)

  if (!host) return
  const metadata = $getState(node, editorDiagramState)
  const source = node.getTextContent()

  if (host.lastSource !== source || host.lastKind !== (metadata?.kind ?? null))
    host.decodeError = false
  host.lastSource = source
  host.lastKind = metadata?.kind ?? null
  let result = state.results.get(key)

  if (
    result &&
    (!metadata || result.kind !== metadata.kind || result.source !== source)
  ) {
    clearResult(state, key)
    result = undefined
  }

  if (metadata && result) {
    const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(result.svg)}`

    if (host.image.getAttribute("src") !== url) {
      host.loadedSvg = null
      host.requestedSvg = result.svg
      host.decodeError = false
      host.image.src = url
    }

    host.image.alt = `${metadata.kind} diagram`
    host.button.setAttribute("aria-label", `Select ${metadata.kind} diagram`)
  } else {
    host.requestedSvg = null
    host.loadedSvg = null
    host.image.removeAttribute("src")
  }

  const ready = !!result && host.loadedSvg === result.svg
  const visible = !!metadata && metadata.viewMode !== "code" && ready
  const imageOnly = visible && metadata?.viewMode === "image"
  setHidden(host.source, imageOnly)
  setHidden(host.preview, !visible && !host.decodeError)
  setHidden(host.button, !visible)
  setHidden(host.error, !host.decodeError)
  host.root.classList.remove(...host.classes.imageOnly)

  if (imageOnly) host.root.classList.add(...host.classes.imageOnly)
}

function ensureHost(
  editor: LexicalEditor,
  node: CodeNode,
  root: HTMLElement,
  slot: DOMSlotForNode<CodeNode>,
  classes: EditorDiagramPresentationClasses,
) {
  const state = getPresentation(editor)
  const key = node.getKey()
  const previous = state.hosts.get(key)

  if (previous?.root === root) return previous
  clearHost(state, key)
  const document = root.ownerDocument
  const source = document.createElement("span")
  const preview = document.createElement("span")
  const button = document.createElement("button")
  const image = document.createElement("img")
  const error = document.createElement("span")
  error.role = "alert"
  error.hidden = true
  error.textContent =
    "Diagram image could not be decoded. Source remains visible."
  source.className = classes.source
  preview.className = classes.preview
  button.className = classes.button
  image.className = classes.image
  source.setAttribute("data-slot", "editor-diagram-source")
  preview.setAttribute("data-slot", "editor-diagram-preview")
  preview.contentEditable = "false"
  setDOMUnmanaged(preview, { captureSelection: true })
  preview.hidden = true
  button.type = "button"
  button.append(image)
  preview.append(button, error)
  slot.insertChild(source)
  slot.insertChild(preview)
  root.setAttribute("data-editor-diagram-live", "true")

  function selectDiagram(event: MouseEvent) {
    if (event.defaultPrevented) return
    editor.update(
      () => {
        if ($getRoot().isDirty()) return
        const current = $getNodeByKey(key)

        if (
          $isCodeNode(current) &&
          current.isAttached() &&
          $getState(current, editorDiagramState)
        )
          current.selectStart()
      },
      {
        discrete: true,
        tag: [SKIP_DOM_SELECTION_TAG, SKIP_SELECTION_FOCUS_TAG],
      },
    )
  }

  function preserveNativeControl(event: KeyboardEvent) {
    if (event.defaultPrevented) return
    event.stopPropagation()
  }

  function syncCurrent() {
    editor.getEditorState().read(() => {
      const node = $getNodeByKey(key)

      if ($isCodeNode(node)) syncPreview(editor, node)
    })
  }

  function handleImageLoad() {
    const result = state.results.get(key)

    if (
      !result ||
      result.svg !== host.requestedSvg ||
      !image.complete ||
      image.currentSrc !== image.src ||
      image.naturalWidth <= 0 ||
      image.naturalHeight <= 0
    )
      return
    host.loadedSvg = result.svg
    host.decodeError = false
    syncCurrent()
  }

  function handleImageError() {
    const result = state.results.get(key)

    if (
      !image.hasAttribute("src") ||
      !result ||
      result.svg !== host.requestedSvg ||
      !image.complete ||
      image.naturalWidth > 0
    )
      return
    clearResult(state, key)
    host.decodeError = true
    syncCurrent()
  }

  button.addEventListener("click", selectDiagram)
  button.addEventListener("keydown", preserveNativeControl)
  image.addEventListener("load", handleImageLoad)
  image.addEventListener("error", handleImageError)

  const host: PreviewHost = {
    classes,
    root,
    source,
    preview,
    button,
    image,
    error,
    requestedSvg: null,
    loadedSvg: null,
    decodeError: false,
    lastSource: node.getTextContent(),
    lastKind: $getState(node, editorDiagramState)?.kind ?? null,
    clearListeners() {
      button.removeEventListener("click", selectDiagram)
      button.removeEventListener("keydown", preserveNativeControl)
      image.removeEventListener("load", handleImageLoad)
      image.removeEventListener("error", handleImageError)
    },
  }

  state.hosts.set(key, host)

  return host
}

export function getEditorDiagramRenderedSvg(
  editor: LexicalEditor,
  key: string,
  source: string,
  kind: EditorDiagramKind,
) {
  const result = presentations.get(editor)?.results.get(key)

  return result?.source === source && result.kind === kind
    ? result.svg
    : undefined
}

export function setEditorDiagramRenderedSvg(
  editor: LexicalEditor,
  key: string,
  source: string,
  kind: EditorDiagramKind,
  svg: string,
) {
  if (editor._headless || !editor.getRootElement()) return false
  const bytes = new TextEncoder().encode(svg).length

  if (bytes > EDITOR_DIAGRAM_MAX_SVG_BYTES) return false

  return editor.getEditorState().read(() => {
    const node = $getNodeByKey(key)

    if (!$isCodeNode(node) || !node.isAttached()) return false
    const metadata = $getState(node, editorDiagramState)

    if (!metadata || metadata.kind !== kind || node.getTextContent() !== source)
      return false
    const state = getPresentation(editor)
    clearResult(state, key)

    while (
      state.results.size >= maximumCacheEntries ||
      state.bytes + bytes > maximumCacheBytes
    ) {
      const oldest = state.results.keys().next().value

      if (oldest === undefined) break
      clearResult(state, oldest)
      const previous = $getNodeByKey(oldest)

      if ($isCodeNode(previous)) syncPreview(editor, previous)
    }

    state.results.set(key, { source, kind, svg, bytes })
    state.bytes += bytes
    syncPreview(editor, node)

    return true
  })
}

export function createEditorDiagramPresentationExtension(
  classes: EditorDiagramPresentationClasses,
) {
  const diagramDomOverride = domOverride(
    [CodeNode],
    {
      $getDOMSlot(node, root, next, editor) {
        const slot = next()

        if (!$getState(node, editorDiagramState)) return slot
        const host = ensureHost(editor, node, root, slot, classes)

        return slot
          .withElement(host.source)
          .withBefore(undefined)
          .withAfter(undefined)
      },
      $updateDOM(node, previous, _root, next) {
        if (
          !!$getState(node, editorDiagramState) !==
          !!$getState(previous, editorDiagramState)
        )
          return true

        return next()
      },
      $decorateDOM(node, _previous, _root, editor) {
        if (!$getState(node, editorDiagramState)) {
          const state = getPresentation(editor)
          clearResult(state, node.getKey())
          clearHost(state, node.getKey())

          return
        }

        syncPreview(editor, node)
      },
    },
    { disabledForSession: () => true },
  )

  return defineExtension({
    name: "@yopem-ui/editor/diagram-presentation",
    dependencies: [
      configExtension(DOMRenderExtension, { overrides: [diagramDomOverride] }),
    ],
    register(editor) {
      if (editor._headless) return () => presentations.delete(editor)
      const state = getPresentation(editor)

      function clear() {
        for (const key of state.hosts.keys()) clearHost(state, key)
        state.results.clear()
        state.bytes = 0
      }

      return mergeRegister(
        editor.registerMutationListener(CodeNode, (mutations) => {
          editor.getEditorState().read(() => {
            for (const [key, mutation] of mutations) {
              if (mutation === "destroyed") {
                clearHost(state, key)
                clearResult(state, key)
              } else {
                const node = $getNodeByKey(key)

                if ($isCodeNode(node)) syncPreview(editor, node)
              }
            }

            paintSelection(state)
          })
        }),
        editor.registerUpdateListener(({ editorState }) => {
          editorState.read(() => paintSelection(state))
        }),
        editor.registerRootListener((root, previous) => {
          if (previous && root !== previous) clear()
        }),
        clear,
      )
    },
  })
}
