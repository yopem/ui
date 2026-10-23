import { $isCodeNode, type CodeNode } from "@lexical/code"
import { getCodeLanguages, getLanguageFriendlyName } from "@lexical/code-prism"
import {
  $getNodeByKey,
  $getSelection,
  $getState,
  $isRangeSelection,
  $setState,
  createState,
  mergeRegister,
  SKIP_DOM_SELECTION_TAG,
  type LexicalEditor,
} from "lexical"

export const codeWrapState = createState("codeWrap", {
  parse: (value) => value !== false,
})

export const codeLineNumbersState = createState("codeLineNumbers", {
  parse: (value) => value === true,
})

export const editorCodeLanguages = getCodeLanguages().map((value) => ({
  value,
  label: getLanguageFriendlyName(value),
}))

export function $getSelectedCode() {
  const selection = $getSelection()

  if (!$isRangeSelection(selection)) return null
  const anchor = selection.anchor.getNode()
  const focus = selection.focus.getNode()
  const code = $isCodeNode(anchor) ? anchor : anchor.getParent()
  const end = $isCodeNode(focus) ? focus : focus.getParent()

  return $isCodeNode(code) && code === end ? code : null
}

export interface EditorCodeSnapshot {
  readonly key: string
  readonly language: string
  readonly wrap: boolean
  readonly lineNumbers: boolean
  readonly editable: boolean
}

export function createEditorCodeStore(editor: LexicalEditor) {
  const listeners = new Set<() => void>()
  let target: CodeNode | null = null
  let snapshot: EditorCodeSnapshot | null = null
  let unregister: (() => void) | undefined
  let copyStatus = ""
  let generation = 0
  let controlsFocused = false

  function notify() {
    for (const listener of listeners) listener()
  }

  function publish(code: CodeNode | null) {
    target = code

    const next = code
      ? {
          key: code.getKey(),
          language: code.getLanguage() ?? "",
          wrap: $getState(code, codeWrapState),
          lineNumbers: $getState(code, codeLineNumbersState),
          editable: editor.isEditable(),
        }
      : null

    if (
      snapshot?.key === next?.key &&
      snapshot?.language === next?.language &&
      snapshot?.wrap === next?.wrap &&
      snapshot?.lineNumbers === next?.lineNumbers &&
      snapshot?.editable === next?.editable
    )
      return
    snapshot = next
    copyStatus = ""
    generation += 1
    notify()
  }

  function resolve() {
    if (!unregister || !target) return null
    const code = $getNodeByKey(target.getKey())
    const selection = $getSelection()

    if (!$isCodeNode(code) || code !== target || !code.isAttached()) return null

    if (selection !== null && $getSelectedCode() !== code) return null

    return code
  }

  function mutate(change: (code: CodeNode) => void, revision: number) {
    if (revision !== generation || !editor.isEditable()) return false
    let changed = false
    editor.update(
      () => {
        if (revision !== generation || !editor.isEditable()) return
        const code = resolve()

        if (!code) return
        change(code)
        changed = true
      },
      { discrete: true, tag: ["yopem-code-control", SKIP_DOM_SELECTION_TAG] },
    )

    return changed
  }

  function readText(revision = generation) {
    if (revision !== generation) return null

    return editor
      .getEditorState()
      .read(() => resolve()?.getTextContent() ?? null)
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
    getCopySnapshot(this: void) {
      return copyStatus
    },
    getCopyServerSnapshot(this: void) {
      return ""
    },
    subscribe(this: void, listener: () => void) {
      listeners.add(listener)

      if (!unregister) {
        unregister = mergeRegister(
          editor.registerUpdateListener(
            ({
              editorState,
              prevEditorState,
              dirtyElements,
              dirtyLeaves,
              tags,
            }) => {
              const dirty = dirtyElements.size > 0 || dirtyLeaves.size > 0

              const hadSelection = prevEditorState.read(
                () => $getSelection() !== null,
              )

              editorState.read(() => {
                const selection = $getSelection()

                if (dirty) {
                  copyStatus = ""
                  generation += 1
                  notify()
                }

                if (tags.has("yopem-code-control")) {
                  const code = target && $getNodeByKey(target.getKey())
                  publish($isCodeNode(code) ? code : null)
                } else if (controlsFocused) {
                  if (
                    dirty ||
                    (selection !== null && $getSelectedCode() !== target)
                  )
                    publish(null)
                } else if (dirty && !hadSelection) publish(null)
                else if (selection !== null) publish($getSelectedCode())
                else if (dirty) publish(null)
              })
            },
          ),
          editor.registerEditableListener(() => {
            editor.getEditorState().read(() => publish(resolve()))
          }),
        )
        editor.getEditorState().read(() => publish($getSelectedCode()))
      }

      return () => {
        listeners.delete(listener)

        if (listeners.size === 0) {
          unregister?.()
          unregister = undefined
          generation += 1
          target = null
          controlsFocused = false
          snapshot = null
          copyStatus = ""
        }
      }
    },
    enterControls() {
      controlsFocused = true
    },
    leaveControls() {
      controlsFocused = false
    },
    setLanguage(language: string, revision = generation) {
      if (
        language !== "" &&
        !editorCodeLanguages.some((option) => option.value === language)
      )
        return false

      return mutate((code) => {
        code.setLanguage(language || undefined)
      }, revision)
    },
    toggle(setting: "wrap" | "lineNumbers", revision = generation) {
      return mutate((code) => {
        const state = setting === "wrap" ? codeWrapState : codeLineNumbersState
        const next = !$getState(code, state)
        $setState(code, state, next)

        if (next)
          $setState(
            code,
            setting === "wrap" ? codeLineNumbersState : codeWrapState,
            false,
          )
      }, revision)
    },
    readText,
    async copy(revision = generation) {
      const text = readText(revision)

      if (text === null) return
      const request = ++generation
      copyStatus = "Copying code"
      notify()

      try {
        if (typeof navigator === "undefined" || !navigator.clipboard?.writeText)
          throw new Error("Clipboard is not available")
        await navigator.clipboard.writeText(text)

        if (request !== generation || !unregister) return
        copyStatus = "Code copied"
      } catch (error) {
        if (request !== generation || !unregister) return
        copyStatus = `Copy failed: ${error instanceof Error ? error.message : "Clipboard access denied"}`
      }

      notify()
    },
  }
}
