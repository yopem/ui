"use client"

import type { LexicalEditor, RangeSelection } from "lexical"
import type { FormEvent, KeyboardEvent, MouseEvent, Ref } from "react"

import { useStableCallback } from "@base-ui/utils/useStableCallback"
import { Box } from "@registry/components/ui/box"
import { Button } from "@registry/components/ui/button"
import { Text } from "@registry/components/ui/text"
import { Wrap } from "@registry/components/ui/wrap"
import { EditorRoot, useEditor } from "@yopem-ui/editor"
import { createMediaExtension } from "@yopem-ui/editor/media"
import {
  $getRoot,
  $getSelection,
  $isRangeSelection,
  HISTORY_PUSH_TAG,
  SKIP_DOM_SELECTION_TAG,
} from "lexical"
import { useImperativeHandle, useReducer, useRef, useState } from "react"
import { createPortal, flushSync } from "react-dom"

import { EditorMediaHost } from "@/catalog/editor-preview-compositions/media"

const extensions = [
  createMediaExtension({ embedPolicy: { providers: ["vimeo"] } }),
]

const replacementState = JSON.stringify({
  root: {
    type: "root",
    version: 1,
    direction: null,
    format: "",
    indent: 0,
    children: [
      {
        type: "paragraph",
        version: 1,
        direction: null,
        format: "",
        indent: 0,
        textFormat: 0,
        textStyle: "",
        children: [
          {
            type: "text",
            version: 1,
            detail: 0,
            format: 0,
            mode: "normal",
            style: "",
            text: "Replacement alpha beta",
          },
        ],
      },
    ],
  },
})

interface ExpectedSelection {
  key: string
  start: number
  end: number
  word: string
}

function selectionMatches(
  editor: LexicalEditor,
  target: ExpectedSelection | null,
  original?: RangeSelection | null,
) {
  if (!target || original === null) return false

  return editor.getEditorState().read(() => {
    const selection = $getSelection()
    const node = $getRoot().getAllTextNodes().at(-1)
    const match = node?.getTextContent().match(/\S+\s*$/u)

    return (
      $isRangeSelection(selection) &&
      (original === undefined || !selection.is(original)) &&
      node?.getKey() === target.key &&
      match?.index === target.start &&
      match[0].trimEnd() === target.word &&
      selection.anchor.type === "text" &&
      selection.anchor.key === target.key &&
      selection.anchor.offset === target.start &&
      selection.focus.type === "text" &&
      selection.focus.key === target.key &&
      selection.focus.offset === target.end &&
      selection.getTextContent() === target.word
    )
  })
}

function SelectionStatus({
  actionSucceeded,
  selectionConfirmed,
  checkValid,
  showCheck,
}: {
  actionSucceeded: boolean | null
  selectionConfirmed: boolean | null
  checkValid: boolean | null
  showCheck: boolean
}) {
  return (
    <>
      <Box render={<output />} aria-label="Selection action">
        {actionSucceeded === null
          ? ""
          : actionSucceeded
            ? "Selection action succeeded"
            : "Selection action failed"}
      </Box>
      <Box render={<output />} aria-label="New selection">
        {selectionConfirmed === null
          ? ""
          : selectionConfirmed
            ? "New selection confirmed"
            : "New selection failed"}
      </Box>
      {showCheck && (
        <Box render={<output />} aria-label="Current selection check">
          {checkValid === null
            ? ""
            : checkValid
              ? "Selection confirmed"
              : "Selection changed"}
        </Box>
      )}
    </>
  )
}

interface HostActions {
  run: (code: string, target: Element | null) => boolean
  captureOriginal: () => void
  checkSelection: (
    kind: "manual" | "submit",
    form: HTMLFormElement | null,
    trusted: boolean,
    prevented: boolean,
  ) => void
}

function MediaHostActions({ ref }: { ref: Ref<HostActions> }) {
  const editor = useEditor()
  const [statusTarget, setStatusTarget] = useState<Element | null>(null)
  const [actionSucceeded, setActionSucceeded] = useState<boolean | null>(null)

  const [selectionConfirmed, setSelectionConfirmed] = useState<boolean | null>(
    null,
  )

  const [originalCaptured, setOriginalCaptured] = useState(false)
  const [originalSelected, setOriginalSelected] = useState(false)

  const [check, setCheck] = useState<{
    id: number
    kind: "manual" | "submit"
    valid: boolean
    disabled: boolean | null
    trusted: boolean
    prevented: boolean
  } | null>(null)

  const checkId = useRef(0)
  const original = useRef<RangeSelection | null>(null)
  const originalWasSelected = useRef(false)
  const expected = useRef<ExpectedSelection | null>(null)
  const observationRequested = useRef(false)

  function replaceDocument() {
    if (!editor.isEditable()) return false
    editor.setEditorState(editor.parseEditorState(replacementState), {
      tag: HISTORY_PUSH_TAG,
    })

    return true
  }

  function selectFinalWord() {
    observationRequested.current = true
    expected.current = null
    setOriginalCaptured(original.current !== null)
    setOriginalSelected(originalWasSelected.current)

    if (!editor.isEditable()) {
      setActionSucceeded(false)
      setSelectionConfirmed(false)

      return false
    }

    let selected = false
    editor.update(
      () => {
        const node = $getRoot().getAllTextNodes().at(-1)
        const match = node?.getTextContent().match(/\S+\s*$/u)

        if (!node || match?.index === undefined) return
        const word = match[0].trimEnd()
        node.select(match.index, match.index + word.length)
        expected.current = {
          key: node.getKey(),
          start: match.index,
          end: match.index + word.length,
          word,
        }
        selected = true
      },
      { discrete: true, tag: SKIP_DOM_SELECTION_TAG },
    )

    setActionSucceeded(selected)
    setSelectionConfirmed(
      selected && selectionMatches(editor, expected.current),
    )

    return selected
  }

  function captureOriginal() {
    observationRequested.current = false
    expected.current = null

    const captured = editor.getEditorState().read(() => {
      const selection = $getSelection()
      const range = $isRangeSelection(selection) && !selection.isCollapsed()

      return {
        selection: range ? selection.clone() : null,
        selected: range && selection.getTextContent() === "selected",
      }
    })

    original.current = captured.selection
    originalWasSelected.current = captured.selected
  }

  function checkSelection(
    kind: "manual" | "submit",
    form: HTMLFormElement | null,
    trusted: boolean,
    prevented: boolean,
  ) {
    if (!observationRequested.current) return

    const button = form?.querySelector('button[type="submit"]')

    const disabled =
      button instanceof HTMLButtonElement ? button.disabled : null

    const valid = selectionMatches(editor, expected.current, original.current)
    const id = ++checkId.current

    setCheck({ id, kind, valid, disabled, trusted, prevented })
  }

  function replaceSelection() {
    if (!editor.isEditable()) return false
    let replaced = false
    editor.update(
      () => {
        const selection = $getSelection()

        if (!$isRangeSelection(selection) || selection.isCollapsed()) return
        selection.insertText("DEMO")
        replaced = true
      },
      { discrete: true, tag: [HISTORY_PUSH_TAG, SKIP_DOM_SELECTION_TAG] },
    )

    return replaced
  }

  function run(code: string, target: Element | null) {
    if (code === "KeyR") return replaceDocument()

    if (code === "KeyS") {
      setStatusTarget(target)

      return selectFinalWord()
    }

    if (code === "KeyP") return replaceSelection()

    return false
  }

  useImperativeHandle(ref, () => ({ run, captureOriginal, checkSelection }))

  function selectFinalWordFromButton() {
    setStatusTarget(null)
    selectFinalWord()
  }

  const handleReplaceDocument = useStableCallback(replaceDocument)
  const handleSelectFinalWord = useStableCallback(selectFinalWordFromButton)
  const handleReplaceSelection = useStableCallback(replaceSelection)

  const selectionStatus = (
    <SelectionStatus
      actionSucceeded={actionSucceeded}
      selectionConfirmed={selectionConfirmed}
      checkValid={check?.valid ?? null}
      showCheck={statusTarget !== null}
    />
  )

  return (
    <Wrap>
      <Button aria-keyshortcuts="Control+Alt+R" onClick={handleReplaceDocument}>
        Replace demo document
      </Button>
      <Button aria-keyshortcuts="Control+Alt+S" onClick={handleSelectFinalWord}>
        Select final word
      </Button>
      <Button
        aria-keyshortcuts="Control+Alt+P"
        onClick={handleReplaceSelection}
      >
        Replace current selection with demo text
      </Button>
      <Box
        render={<output />}
        aria-label="Selection check"
        data-original-selection={String(originalCaptured)}
        data-original-selected={String(originalSelected)}
        data-check-id={check?.id ?? 0}
        data-check-kind={check?.kind}
        data-check-valid={check ? String(check.valid) : undefined}
        data-check-disabled={check ? String(check.disabled) : undefined}
        data-check-trusted={check ? String(check.trusted) : undefined}
        data-check-prevented={check ? String(check.prevented) : undefined}
      >
        {check
          ? check.valid
            ? "Selection confirmed"
            : "Selection changed"
          : ""}
      </Box>
      {statusTarget
        ? createPortal(selectionStatus, statusTarget)
        : selectionStatus}
    </Wrap>
  )
}

export function Preview() {
  const [editable, toggleEditable] = useReducer(
    (current: boolean) => !current,
    true,
  )

  const [mounted, setMounted] = useState(true)
  const actions = useRef<HostActions>(null)
  const mountButton = useRef<HTMLButtonElement>(null)

  function removeEditor() {
    flushSync(() => setMounted(false))
    mountButton.current?.focus()
  }

  function mountClick() {
    if (mounted) removeEditor()
    else setMounted(true)
  }

  function keyDown(event: KeyboardEvent<HTMLElement>) {
    if (
      event.defaultPrevented ||
      event.nativeEvent.defaultPrevented ||
      ("baseUIHandlerPrevented" in event &&
        event.baseUIHandlerPrevented === true) ||
      ("baseUIHandlerPrevented" in event.nativeEvent &&
        event.nativeEvent.baseUIHandlerPrevented === true) ||
      !event.nativeEvent.isTrusted ||
      event.nativeEvent.isComposing ||
      event.nativeEvent.keyCode === 229 ||
      event.getModifierState("AltGraph") ||
      !event.ctrlKey ||
      !event.altKey ||
      event.metaKey ||
      event.shiftKey
    )
      return

    if (event.code === "KeyC") {
      const target = event.target
      actions.current?.checkSelection(
        "manual",
        target instanceof Element ? target.closest("form") : null,
        event.nativeEvent.isTrusted,
        event.defaultPrevented,
      )
      event.preventDefault()
    } else if (event.code === "KeyE") {
      event.preventDefault()
      toggleEditable()
    } else if (event.code === "KeyU" && mounted) {
      event.preventDefault()
      removeEditor()
    } else if (
      actions.current?.run(
        event.code,
        event.target instanceof Element
          ? event.target.closest('[role="dialog"]')
          : null,
      )
    ) {
      event.preventDefault()
    }
  }

  function captureClick(event: MouseEvent<HTMLElement>) {
    const button =
      event.target instanceof Element ? event.target.closest("button") : null

    if (
      event.nativeEvent.isTrusted &&
      button?.textContent?.trim() === "Insert file"
    )
      actions.current?.captureOriginal()
  }

  function observeSubmit(event: FormEvent<HTMLElement>) {
    if (event.target instanceof HTMLFormElement)
      actions.current?.checkSelection(
        "submit",
        event.target,
        event.nativeEvent.isTrusted,
        event.defaultPrevented,
      )
  }

  const handleMountClick = useStableCallback(mountClick)
  const handleKeyDown = useStableCallback(keyDown)
  const handleClickCapture = useStableCallback(captureClick)
  const handleSubmitCapture = useStableCallback(observeSubmit)

  return (
    <Box
      render={<section />}
      aria-label="Media editor"
      onKeyDown={handleKeyDown}
      onClickCapture={handleClickCapture}
      onSubmitCapture={handleSubmitCapture}
    >
      <Button onClick={toggleEditable} aria-keyshortcuts="Control+Alt+E">
        {editable ? "Read only" : "Edit media"}
      </Button>
      <Text>
        Press Control+Alt+E to change editability, including inside the media
        dialog.
      </Text>
      <Text>
        Use Control+Alt+R to replace the document, Control+Alt+S to select the
        final word, Control+Alt+P to replace the selection, Control+Alt+C to
        check the selection, or Control+Alt+U to remove the editor.
      </Text>
      <Button
        ref={mountButton}
        aria-keyshortcuts={mounted ? "Control+Alt+U" : undefined}
        onClick={handleMountClick}
      >
        {mounted ? "Remove demo editor" : "Restore demo editor"}
      </Button>
      {mounted && (
        <EditorRoot
          ariaLabel="Media content"
          editable={editable}
          extensions={extensions}
        >
          <MediaHostActions ref={actions} />
          <EditorMediaHost />
        </EditorRoot>
      )}
    </Box>
  )
}
