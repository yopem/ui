import { createEditorCursorOverlay } from "@editor/cursor-overlay-store"
import { createEditor, type RootListener } from "lexical"
import assert from "node:assert/strict"

const editor = createEditor({
  namespace: "cursor-overlay-native",
  onError(error) {
    throw error
  },
})

const overlay = createEditorCursorOverlay(editor)

const events: ("caret" | "selection" | "clear")[] = []

overlay.subscribe(() => {
  const state = overlay.getSnapshot()
  events.push(
    state.dragCaret
      ? "caret"
      : state.selectionRects.length
        ? "selection"
        : "clear",
  )
})

assert.equal(overlay.getServerSnapshot(), overlay.getServerSnapshot())

assert.equal(overlay.getSnapshot().dragCaret, null)

assert.deepEqual(overlay.getSnapshot().selectionRects, [])

assert.equal(overlay.getSnapshot().editable, true)

assert.deepEqual(events, [])

overlay.dispose()

assert.equal(overlay.getSnapshot().dragCaret, null)

const idleEditor = createEditor({ namespace: "cursor-overlay-idle" })

const nativeRootRegistration = idleEditor.registerRootListener.bind(idleEditor)

const nativeUpdateRegistration =
  idleEditor.registerUpdateListener.bind(idleEditor)

const nativeEditableRegistration =
  idleEditor.registerEditableListener.bind(idleEditor)

let rootRegistrations = 0

let updateRegistrations = 0

let editableRegistrations = 0

let cleanups = 0

idleEditor.registerRootListener = function registerTrackedRoot(
  listener: RootListener,
) {
  rootRegistrations += 1
  const unregister = nativeRootRegistration(listener)

  return function cleanupTrackedRoot() {
    cleanups += 1
    unregister()
  }
}

idleEditor.registerUpdateListener = function registerTrackedUpdate(listener) {
  updateRegistrations += 1
  const unregister = nativeUpdateRegistration(listener)

  return function cleanupTrackedUpdate() {
    cleanups += 1
    unregister()
  }
}

idleEditor.registerEditableListener = function registerTrackedEditable(
  listener,
) {
  editableRegistrations += 1
  const unregister = nativeEditableRegistration(listener)

  return function cleanupTrackedEditable() {
    cleanups += 1
    unregister()
  }
}

const idle = createEditorCursorOverlay(idleEditor)

assert.equal(rootRegistrations, 0)

assert.equal(updateRegistrations, 0)

assert.equal(editableRegistrations, 0)

idleEditor.setEditable(false)

const unsubscribe = idle.subscribe(() => undefined)

assert.equal(rootRegistrations, 1)

assert.equal(updateRegistrations, 1)

assert.equal(editableRegistrations, 1)

assert.equal(idle.getSnapshot().editable, false)

idleEditor.setEditable(true)

assert.equal(idle.getSnapshot().editable, true)

unsubscribe()

await Promise.resolve()

assert.equal(cleanups, 3)

idle.dispose()

assert.equal(cleanups, 3)

const failedEditor = createEditor({ namespace: "cursor-overlay-failed" })

const nativeFailedRootRegistration =
  failedEditor.registerRootListener.bind(failedEditor)

let failedCleanups = 0

failedEditor.registerRootListener = function registerTrackedFailedRoot(
  listener: RootListener,
) {
  const unregister = nativeFailedRootRegistration(listener)

  return function cleanupFailedRoot() {
    failedCleanups += 1
    unregister()
  }
}

failedEditor.registerUpdateListener = function registerFailingUpdate() {
  throw new Error("update registration failed")
}

const failed = createEditorCursorOverlay(failedEditor)

assert.throws(
  () => failed.subscribe(() => undefined),
  /update registration failed/,
)

assert.equal(failedCleanups, 1)

failed.dispose()

assert.equal(failedCleanups, 1)

console.info(
  "Cursor overlay native registration, failure cleanup, and disposal verified",
)
