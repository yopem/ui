import {
  $getSelection,
  $isElementNode,
  $isRangeSelection,
  $isTextNode,
  COMMAND_PRIORITY_NORMAL,
  HISTORY_PUSH_TAG,
  KEY_DOWN_COMMAND,
  mergeRegister,
  type ElementNode,
  type LexicalEditor,
} from "lexical"

import { requestEditorAi, type EditorAiConfig } from "./ai-client"
import { createEditorSelectionBookmark } from "./selection-bookmark"

const segmenter = new Intl.Segmenter("en", { granularity: "grapheme" })

const instruction =
  "Continue this paragraph with a relevant continuation. Return only text."

const contextLimit = 16_384

const automaticDelay = 500

type RequestMode = "manual" | "automatic"

type EditorUpdatePayload = Parameters<
  Parameters<LexicalEditor["registerUpdateListener"]>[0]
>[0]

type CopilotStatus =
  | "idle"
  | "waiting"
  | "streaming"
  | "ready"
  | "failed"
  | "cancelled"
  | "stale"
  | "timeout"
  | "truncated"

export interface EditorCopilotConfig extends EditorAiConfig {
  allowAutomatic?: true
}

export interface EditorCopilotSnapshot {
  status: CopilotStatus
  text: string
  automatic: boolean
}

interface CopilotTarget {
  signature: string
  paragraphKey: string
  context: string
}

export function firstEditorCopilotGrapheme(text: string) {
  const grapheme = segmenter.segment(text)[Symbol.iterator]().next()
    .value?.segment

  if (!grapheme) return null

  for (const character of grapheme) {
    const code = character.codePointAt(0) ?? 0

    if (
      code <= 0x1f ||
      (code >= 0x7f && code <= 0x9f) ||
      code === 0x2028 ||
      code === 0x2029 ||
      (code >= 0x202a && code <= 0x202e) ||
      (code >= 0x2066 && code <= 0x2069)
    )
      return null
  }

  return grapheme
}

function selectionSignature() {
  const selection = $getSelection()

  if (!$isRangeSelection(selection)) return null

  return JSON.stringify([
    selection.anchor.key,
    selection.anchor.offset,
    selection.anchor.type,
    selection.focus.key,
    selection.focus.offset,
    selection.focus.type,
    selection.format,
    selection.style,
  ])
}

function $getCopilotTarget(): CopilotTarget | null {
  const selection = $getSelection()

  if (!$isRangeSelection(selection) || !selection.isCollapsed()) return null

  const point = selection.anchor
  const node = point.getNode()
  let paragraph: ElementNode | null = null

  if (point.type === "text" && $isTextNode(node)) {
    const parent = node.getParent()

    if (
      point.offset !== node.getTextContentSize() ||
      !$isElementNode(parent) ||
      parent.getType() !== "paragraph" ||
      parent.getLastChild() !== node
    )
      return null

    paragraph = parent
  } else if (
    point.type === "element" &&
    $isElementNode(node) &&
    node.getType() === "paragraph" &&
    point.offset === node.getChildrenSize()
  )
    paragraph = node
  else return null

  const signature = selectionSignature()

  if (!signature) return null

  return {
    signature,
    paragraphKey: paragraph.getKey(),
    context: paragraph.getTextContent().slice(-contextLimit),
  }
}

export function createEditorCopilotSession(
  editor: LexicalEditor,
  initialConfig: EditorCopilotConfig,
) {
  const bookmark = createEditorSelectionBookmark(editor)

  const serverSnapshot: EditorCopilotSnapshot = {
    status: "idle",
    text: "",
    automatic: false,
  }

  const listeners = new Set<() => void>()
  let snapshot = serverSnapshot
  const config = initialConfig
  let target: CopilotTarget | null = null
  let controller: AbortController | undefined
  let requestMode: RequestMode | undefined
  let automaticEnabled = false
  let composing = false
  let pendingAutomaticInput = false
  let pendingInputTimer: ReturnType<typeof setTimeout> | undefined
  let suppressInvalidation = false
  let automaticTimer: ReturnType<typeof setTimeout> | undefined
  let disconnect: (() => void) | undefined
  let root: HTMLElement | null = null

  function publish(next: EditorCopilotSnapshot) {
    snapshot = next

    for (const listener of listeners) listener()
  }

  function clearTimer() {
    if (automaticTimer !== undefined) clearTimeout(automaticTimer)
    automaticTimer = undefined
  }

  function clearPendingInput() {
    if (pendingInputTimer !== undefined) clearTimeout(pendingInputTimer)
    pendingInputTimer = undefined
    pendingAutomaticInput = false
  }

  function invalidate(status: CopilotStatus) {
    const active =
      target !== null ||
      controller !== undefined ||
      automaticTimer !== undefined ||
      snapshot.status === "waiting" ||
      snapshot.status === "streaming" ||
      snapshot.status === "ready"

    clearTimer()
    controller?.abort()
    controller = undefined
    requestMode = undefined
    target = null
    bookmark.clear()

    if (active && (snapshot.status !== status || snapshot.text))
      publish({ ...snapshot, status, text: "" })
  }

  function captureTarget() {
    let captured: CopilotTarget | null = null

    editor.getEditorState().read(() => {
      captured = $getCopilotTarget()

      if (captured) bookmark.capture()
    })

    return captured && bookmark.getSnapshot() ? captured : null
  }

  function isCurrent(expected: CopilotTarget) {
    if (!editor.isEditable() || composing || !bookmark.getSnapshot())
      return false

    return editor.getEditorState().read(() => {
      const current = $getCopilotTarget()

      return (
        current !== null &&
        current.signature === expected.signature &&
        current.paragraphKey === expected.paragraphKey
      )
    })
  }

  function startRequest(mode: RequestMode, expected: CopilotTarget) {
    if (
      !editor.isEditable() ||
      composing ||
      target !== expected ||
      !isCurrent(expected)
    ) {
      invalidate("stale")

      return false
    }

    const origin = root?.ownerDocument.location.origin

    if (!origin) {
      invalidate("stale")

      return false
    }

    const active = new AbortController()
    controller = active
    requestMode = mode
    publish({ ...snapshot, status: "streaming", text: "" })

    void requestEditorAi(
      config,
      {
        operation: "copilot",
        instruction,
        selectedText: "",
        context: expected.context,
      },
      origin,
      active.signal,
      (text) => {
        if (controller !== active) return

        if (!isCurrent(expected)) {
          invalidate("stale")

          return
        }

        publish({ ...snapshot, text })
      },
    )
      .then((text) => {
        if (controller !== active) return

        if (active.signal.aborted || !isCurrent(expected)) {
          invalidate("stale")

          return
        }

        if (!text) {
          requestMode = undefined
          target = null
          bookmark.clear()
          publish({ ...snapshot, status: "failed", text: "" })

          return
        }

        publish({ ...snapshot, status: "ready", text })
      })
      .catch((error) => {
        if (controller !== active) return

        controller = undefined
        requestMode = undefined
        target = null
        bookmark.clear()
        publish({
          ...snapshot,
          status:
            error instanceof Error && error.message === "deadline"
              ? "timeout"
              : error instanceof Error && error.message === "truncated"
                ? "truncated"
                : "failed",
          text: "",
        })
      })
      .finally(() => {
        if (controller === active) controller = undefined
      })

    return true
  }

  function scheduleAutomatic() {
    clearTimer()

    if (!automaticEnabled || config.allowAutomatic !== true || composing) return

    const captured = captureTarget()

    if (!captured) return

    target = captured
    requestMode = "automatic"
    publish({ ...snapshot, status: "waiting", text: "" })
    automaticTimer = setTimeout(() => {
      automaticTimer = undefined

      if (
        !automaticEnabled ||
        config.allowAutomatic !== true ||
        target !== captured ||
        !isCurrent(captured)
      ) {
        invalidate("stale")

        return
      }

      startRequest("automatic", captured)
    }, automaticDelay)
  }

  function start() {
    if (composing || !editor.isEditable()) return false

    if (target && !isCurrent(target)) invalidate("stale")

    if (snapshot.status === "streaming" || snapshot.status === "ready")
      return false

    clearTimer()
    const captured = captureTarget()

    if (!captured) return false

    target = captured

    return startRequest("manual", captured)
  }

  function cancel() {
    if (!target && !controller && snapshot.status !== "waiting") return

    clearTimer()
    controller?.abort()
    controller = undefined
    requestMode = undefined
    target = null
    bookmark.clear()
    publish({ ...snapshot, status: "cancelled", text: "" })
  }

  function apply(text: string, partial: boolean) {
    const expected = target

    if (
      snapshot.status !== "ready" ||
      !text ||
      !expected ||
      !isCurrent(expected)
    ) {
      invalidate("stale")

      return false
    }

    let applied = false
    suppressInvalidation = true

    try {
      editor.update(
        () => {
          if (!bookmark.restore()) return

          const restored = $getCopilotTarget()
          const selection = $getSelection()

          if (
            !restored ||
            restored.signature !== expected.signature ||
            restored.paragraphKey !== expected.paragraphKey ||
            !$isRangeSelection(selection)
          )
            return

          selection.insertRawText(text)
          applied = true
        },
        { tag: HISTORY_PUSH_TAG, discrete: true },
      )
    } finally {
      suppressInvalidation = false
    }

    if (!applied) {
      invalidate("stale")

      return false
    }

    if (partial) {
      const remaining = snapshot.text.slice(text.length)
      let nextTarget: CopilotTarget | null = null

      editor.getEditorState().read(() => {
        nextTarget = $getCopilotTarget()

        if (nextTarget) bookmark.capture()
      })

      if (remaining && nextTarget && bookmark.getSnapshot()) {
        target = nextTarget
        publish({ ...snapshot, status: "ready", text: remaining })

        return true
      }
    }

    target = null
    requestMode = undefined
    bookmark.clear()
    publish({ ...snapshot, status: "idle", text: "" })

    return true
  }

  function acceptAll() {
    return apply(snapshot.text, false)
  }

  function acceptNext() {
    const grapheme = firstEditorCopilotGrapheme(snapshot.text)

    return grapheme ? apply(grapheme, true) : false
  }

  function setAutomaticEnabled(enabled: boolean) {
    if (config.allowAutomatic !== true) return

    automaticEnabled = enabled

    if (!enabled) {
      clearTimer()

      if (requestMode === "automatic") {
        invalidate("cancelled")
        publish({ ...snapshot, automatic: false })

        return
      }
    }

    publish({ ...snapshot, automatic: enabled })
  }

  function toggleAutomatic() {
    setAutomaticEnabled(!automaticEnabled)
  }

  function beforeInput(event: InputEvent) {
    clearPendingInput()
    pendingAutomaticInput =
      event.inputType === "insertText" &&
      !event.defaultPrevented &&
      !event.isComposing &&
      automaticEnabled &&
      config.allowAutomatic === true &&
      editor.isEditable() &&
      !composing

    if (pendingAutomaticInput)
      pendingInputTimer = setTimeout(clearPendingInput, 0)
  }

  function startComposition() {
    composing = true
    clearPendingInput()
    invalidate("stale")
  }

  function endComposition() {
    composing = false
  }

  function detachRoot() {
    root?.removeEventListener("beforeinput", beforeInput, true)
    root?.removeEventListener("compositionstart", startComposition, true)
    root?.removeEventListener("compositionend", endComposition, true)
    root = null
  }

  function watchRoot(nextRoot: HTMLElement | null) {
    const previousRoot = root
    detachRoot()
    root = nextRoot

    if (previousRoot && previousRoot !== nextRoot) invalidate("stale")

    root?.addEventListener("beforeinput", beforeInput, true)
    root?.addEventListener("compositionstart", startComposition, true)
    root?.addEventListener("compositionend", endComposition, true)
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.isComposing || composing) {
      invalidate("stale")

      return false
    }

    if (event.defaultPrevented) return false

    if (event.key === "Escape" && target) {
      event.preventDefault()
      cancel()

      return true
    }

    if (snapshot.status === "ready" && target) {
      if (event.key === "Tab" && !event.shiftKey && acceptAll()) {
        event.preventDefault()

        return true
      }

      if (
        event.key === "ArrowRight" &&
        (event.metaKey || event.ctrlKey) &&
        !event.altKey &&
        !event.shiftKey &&
        !event.repeat &&
        acceptNext()
      ) {
        event.preventDefault()

        return true
      }
    }

    if (
      event.key === " " &&
      event.ctrlKey &&
      !event.metaKey &&
      !event.altKey &&
      !event.shiftKey &&
      start()
    ) {
      event.preventDefault()

      return true
    }

    return false
  }

  function update({
    editorState,
    dirtyElements,
    dirtyLeaves,
  }: EditorUpdatePayload) {
    const contentChanged = dirtyElements.size > 0 || dirtyLeaves.size > 0
    const startAutomatic = pendingAutomaticInput
    clearPendingInput()

    if (contentChanged) {
      if (suppressInvalidation) return

      if (target) invalidate("stale")

      if (startAutomatic) scheduleAutomatic()

      return
    }

    if (target) {
      const current = editorState.read(selectionSignature)

      if (current !== target.signature) invalidate("stale")
    }
  }

  function subscribe(listener: () => void) {
    listeners.add(listener)

    if (!disconnect) {
      const unbookmark = bookmark.subscribe(() => {
        if (!bookmark.getSnapshot() && target && !suppressInvalidation)
          invalidate("stale")
      })

      const unupdate = editor.registerUpdateListener(update)

      const uneditable = editor.registerEditableListener((editable) => {
        if (!editable) invalidate("stale")
      })

      const unroot = editor.registerRootListener(watchRoot)

      const unkeydown = editor.registerCommand(
        KEY_DOWN_COMMAND,
        handleKeyDown,
        COMMAND_PRIORITY_NORMAL,
      )

      disconnect = mergeRegister(
        unbookmark,
        unupdate,
        uneditable,
        unroot,
        unkeydown,
      )
    }

    return function unsubscribe() {
      listeners.delete(listener)

      if (listeners.size === 0) {
        clearTimer()
        clearPendingInput()
        controller?.abort()
        controller = undefined
        target = null
        requestMode = undefined
        disconnect?.()
        disconnect = undefined
        detachRoot()
        bookmark.clear()
        automaticEnabled = false
        composing = false
        snapshot = serverSnapshot
      }
    }
  }

  function getSnapshot() {
    return snapshot
  }

  function getServerSnapshot() {
    return serverSnapshot
  }

  return {
    acceptAll,
    acceptNext,
    cancel,
    getServerSnapshot,
    getSnapshot,
    setAutomaticEnabled,
    start,
    subscribe,
    toggleAutomatic,
  }
}
