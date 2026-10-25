import { $isCodeNode, type CodeNode } from "@lexical/code"
import { getCodeLanguages, getLanguageFriendlyName } from "@lexical/code-prism"
import {
  $createTextNode,
  $getNodeByKey,
  $getSelection,
  $getState,
  $isRangeSelection,
  $setState,
  createState,
  mergeRegister,
  HISTORY_PUSH_TAG,
  SKIP_DOM_SELECTION_TAG,
  type LexicalEditor,
  type RangeSelection,
} from "lexical"

import "./code-languages"
import { $getSelectedCode } from "./code-selection"

export { $getSelectedCode } from "./code-selection"

export interface EditorCodeFormatter {
  supports(language: string): boolean
  format(text: string, language: string): string | Promise<string>
}

export const codeWrapState = createState("codeWrap", {
  parse: (value) => value !== false,
})

export const codeLineNumbersState = createState("codeLineNumbers", {
  parse: (value) => value === true,
})

export const editorCodeLanguages = getCodeLanguages()
  .filter((value) => value !== "markup-templating")
  .map((value) => ({ value, label: getLanguageFriendlyName(value) }))

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
  let savedSelection: RangeSelection | null = null
  let controlsFocused = false
  let formatStatus = ""
  let formatRequest = 0
  let formatting = false

  function notify() {
    for (const listener of listeners) listener()
  }

  function publish(code: CodeNode | null) {
    target = code
    const selection = $getSelection()

    if (!code) savedSelection = null
    else if ($isRangeSelection(selection) && $getSelectedCode() === code)
      savedSelection = selection.clone()

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

    if (!formatting) formatStatus = ""
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
    getFormatSnapshot(this: void) {
      return formatStatus
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

                const previousSelection = prevEditorState.read($getSelection)

                if (
                  formatting &&
                  selection !== null &&
                  !selection.is(previousSelection)
                ) {
                  generation += 1
                }

                if (dirty) {
                  savedSelection = null
                  copyStatus = ""

                  if (!formatting) formatStatus = ""
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
            savedSelection = null
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
          savedSelection = null
          controlsFocused = false
          snapshot = null
          copyStatus = ""
          formatting = false
          formatRequest += 1
          formatStatus = ""
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
    cancelFormat() {
      if (!formatting) return
      formatting = false
      formatRequest += 1
      formatStatus = "Formatting canceled"
      notify()
    },
    async format(formatter?: EditorCodeFormatter, revision = generation) {
      if (formatting || revision !== generation || !snapshot?.editable)
        return false
      const language = snapshot.language

      if (!formatter?.supports(language)) return false

      const captured = editor.getEditorState().read(() => {
        const code = resolve()
        const selection = $getSelection() ?? savedSelection

        if (!code || !$isRangeSelection(selection)) return null
        const children = code.getChildren()
        const key = code.getKey()

        function offset(point: { key: string; offset: number }) {
          if (point.key === key)
            return children
              .slice(0, point.offset)
              .reduce((count, child) => count + child.getTextContentSize(), 0)
          let count = 0

          for (const child of children) {
            if (child.getKey() === point.key) return count + point.offset
            count += child.getTextContentSize()
          }

          return point.offset === 0 ? 0 : count
        }

        return {
          text: code.getTextContent(),
          anchor: offset(selection.anchor),
          focus: offset(selection.focus),
        }
      })

      if (!captured) return false
      const request = ++formatRequest
      formatting = true
      formatStatus = "Formatting code"
      notify()

      try {
        const text = await formatter.format(captured.text, language)

        if (request !== formatRequest || !unregister) return false

        if (
          revision !== generation ||
          !editor.isEditable() ||
          readText(revision) !== captured.text
        ) {
          formatStatus = "Formatting discarded: code or selection changed"

          return false
        }

        if (text === captured.text) {
          formatStatus = "Code unchanged"

          return false
        }

        let changed = false
        editor.update(
          () => {
            const code = resolve()

            if (revision !== generation || !editor.isEditable() || !code) return
            const node = $createTextNode(text)
            code.clear().append(node)
            node.select(
              Math.min(captured.anchor, text.length),
              Math.min(captured.focus, text.length),
            )
            changed = true
          },
          { discrete: true, tag: ["yopem-code-control", HISTORY_PUSH_TAG] },
        )

        if (changed) editor.focus()
        formatStatus = changed
          ? "Code formatted"
          : "Formatting discarded: target changed"

        return changed
      } catch (error) {
        if (request === formatRequest)
          formatStatus =
            revision !== generation || !editor.isEditable()
              ? "Formatting discarded: code or selection changed"
              : `Formatting failed: ${error instanceof Error ? error.message : "Invalid code"}`

        return false
      } finally {
        if (request === formatRequest) {
          formatting = false
          notify()
        }
      }
    },
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
