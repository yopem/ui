"use client"

import type { MediaUpload } from "@yopem-ui/editor/media"
import type { LexicalEditor, RangeSelection } from "lexical"
import type {
  ChangeEvent,
  FormEvent,
  KeyboardEvent,
  MouseEvent,
  Ref,
} from "react"

import { useStableCallback } from "@base-ui/utils/useStableCallback"
import { Box } from "@registry/components/ui/box"
import { Button } from "@registry/components/ui/button"
import { Text } from "@registry/components/ui/text"
import { Wrap } from "@registry/components/ui/wrap"
import { EditorRoot, EditorToolbar, useEditor } from "@yopem-ui/editor"
import {
  createMediaExtension,
  MediaInsertControl,
} from "@yopem-ui/editor/media"
import {
  $getRoot,
  $getSelection,
  $isNodeSelection,
  $isRangeSelection,
  $setSelection,
  HISTORY_PUSH_TAG,
  SKIP_DOM_SELECTION_TAG,
  TextNode,
} from "lexical"
import { useImperativeHandle, useReducer, useRef, useState } from "react"
import { createPortal, flushSync } from "react-dom"
import { createRoot } from "react-dom/client"

import { EditorMediaHost } from "@/catalog/editor-preview-compositions/media"

const nativeCancelEvents = new WeakMap<Event, number>()

const nativeCancelIds: number[] = []

let nativeShortcutId = 0

document.addEventListener(
  "keydown",
  function observeNativeShortcut(event) {
    if (!event.ctrlKey || !event.altKey || !event.code.startsWith("Key")) return
    document.documentElement.setAttribute(
      "data-native-shortcut",
      JSON.stringify({
        id: ++nativeShortcutId,
        code: event.code,
        trusted: event.isTrusted,
        focused: event.target === document.activeElement,
      }),
    )
  },
  true,
)

document.addEventListener(
  "click",
  function observeNativeCancel(event) {
    const button =
      event.target instanceof Element ? event.target.closest("button") : null

    if (!event.isTrusted || button?.textContent?.trim() !== "Cancel upload")
      return
    const id = nativeCancelIds.length + 1
    nativeCancelEvents.set(event, id)
    nativeCancelIds.push(id)
    document.documentElement.setAttribute(
      "data-native-cancel-ids",
      JSON.stringify(nativeCancelIds),
    )
  },
  true,
)

const extensions = [
  createMediaExtension({
    embedPolicy: {
      providers: ["vimeo", "x"],
      iframeOrigins: ["https://example.com"],
    },
  }),
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

const structuredState = JSON.stringify({
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
            format: 1,
            mode: "normal",
            style: "",
            text: "Formatted heading",
          },
        ],
      },
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
            text: "Before selected after",
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

function selectionSnapshot(selection: RangeSelection) {
  return {
    anchor: {
      key: selection.anchor.key,
      offset: selection.anchor.offset,
      type: selection.anchor.type,
    },
    focus: {
      key: selection.focus.key,
      offset: selection.focus.offset,
      type: selection.focus.type,
    },
    text: selection.getTextContent(),
  }
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
  captureTrigger: (kind: string) => void
  queueCaptureUpdate: (mode: "edit" | "noop") => boolean
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
  const [originalState, setOriginalState] = useState("")
  const [triggerCapture, setTriggerCapture] = useState("")
  const triggerCaptureId = useRef(0)

  const [check, setCheck] = useState<{
    id: number
    kind: "manual" | "submit"
    valid: boolean
    disabled: boolean | null
    trusted: boolean
    prevented: boolean
  } | null>(null)

  const [state, setState] = useState("")
  const [documentInput, setDocumentInput] = useState("")
  const [stateId, setStateId] = useState(0)
  const [selectionInEditor, setSelectionInEditor] = useState(false)
  const [selectedMedia, setSelectedMedia] = useState(false)
  const checkId = useRef(0)
  const original = useRef<RangeSelection | null>(null)
  const originalWasSelected = useRef(false)
  const expected = useRef<ExpectedSelection | null>(null)
  const observationRequested = useRef(false)
  const cleanCommitId = useRef(0)

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

    const before = editor.getEditorState()
    const updates: { previous: boolean; current: boolean; dirty: number }[] = []

    const stop = editor.registerUpdateListener(
      ({ editorState, prevEditorState, dirtyElements, dirtyLeaves }) => {
        updates.push({
          previous: prevEditorState === before,
          current: editor.getEditorState() === editorState,
          dirty: dirtyElements.size + dirtyLeaves.size,
        })
      },
    )

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
    stop()
    document.documentElement.dataset.selectionCommit = JSON.stringify({
      changed: before !== editor.getEditorState(),
      updates,
    })

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
        snapshot: range ? selectionSnapshot(selection) : null,
        selected: range && selection.getTextContent() === "selected",
      }
    })

    original.current = captured.selection
    originalWasSelected.current = captured.selected
    setOriginalState(JSON.stringify(captured.snapshot))
  }

  function captureTrigger(kind: string) {
    const selection = editor.getEditorState().read(() => {
      const current = $getSelection()

      return $isRangeSelection(current) ? selectionSnapshot(current) : null
    })

    setTriggerCapture(
      JSON.stringify({ id: ++triggerCaptureId.current, kind, selection }),
    )
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

  function changeFirstParagraph() {
    if (!editor.isEditable()) return false
    let changed = false
    editor.update(
      () => {
        const node = $getRoot().getAllTextNodes()[0]

        if (!node || !original.current) return
        node.setTextContent("Changed heading")
        $setSelection(original.current.clone())
        changed = true
      },
      { discrete: true, tag: [HISTORY_PUSH_TAG, SKIP_DOM_SELECTION_TAG] },
    )

    return changed
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

  function captureState() {
    const editorState = editor.getEditorState()

    const { selection, media } = editorState.read(() => {
      const current = $getSelection()
      const nodes = $isNodeSelection(current) ? current.getNodes() : []

      return {
        selection: $isRangeSelection(current)
          ? selectionSnapshot(current)
          : null,
        media: nodes.length === 1 && nodes[0]?.getType() === "yopem-media",
      }
    })

    setSelectedMedia(media)

    const root = editor.getRootElement()
    const anchor = selection && editor.getElementByKey(selection.anchor.key)
    const focus = selection && editor.getElementByKey(selection.focus.key)

    setSelectionInEditor(
      Boolean(
        root &&
        anchor &&
        focus &&
        root.contains(anchor) &&
        root.contains(focus),
      ),
    )
    setState(JSON.stringify({ document: editorState.toJSON(), selection }))
    setStateId((current) => current + 1)
  }

  function loadStructuredDocument() {
    editor.setEditorState(editor.parseEditorState(structuredState), {
      tag: HISTORY_PUSH_TAG,
    })
  }

  function dispatchConstructedChange(input: HTMLInputElement) {
    const transfer = new DataTransfer()
    transfer.items.add(new File(["fixture"], "reentry.txt"))
    input.files = transfer.files
    const filesBefore = input.files?.length ?? -1
    document.documentElement.removeAttribute("data-constructed-change-captured")
    const event = new Event("change", { bubbles: true })
    input.dispatchEvent(event)

    return {
      trusted: event.isTrusted,
      captured:
        document.documentElement.dataset.constructedChangeCaptured === "true",
      filesBefore,
      filesAfter: input.files?.length ?? -1,
      calls: Number(document.documentElement.dataset.uploadEntries ?? 0),
    }
  }

  function positiveChange() {
    const input = document.querySelector('input[type="file"]')

    if (!(input instanceof HTMLInputElement)) return false
    document.documentElement.dataset.positiveChange = JSON.stringify(
      dispatchConstructedChange(input),
    )

    return true
  }

  function mutationReentry() {
    const input = document.querySelector('input[type="file"]')

    if (!(input instanceof HTMLInputElement)) return false

    let delivered = false

    const stop = editor.registerMutationListener(
      TextNode,
      (mutations) => {
        if (delivered || !Array.from(mutations.values()).includes("updated"))
          return

        delivered = true

        const selection = editor.getEditorState().read(() => {
          const current = $getSelection()

          return $isRangeSelection(current) ? selectionSnapshot(current) : null
        })

        const evidence = dispatchConstructedChange(input)
        document.documentElement.setAttribute(
          "data-mutation-reentry",
          JSON.stringify({ delivered, ...evidence, selection }),
        )
      },
      { skipInitialization: true },
    )

    try {
      return changeFirstParagraph()
    } finally {
      stop()
    }
  }

  function urlMutationReentry() {
    const form = document.querySelector('[role="dialog"] form')

    if (!(form instanceof HTMLFormElement)) return false

    const before = editor.getEditorState()
    const order: string[] = []
    let delivered = false
    const submitted: Event[] = []
    let selection: ReturnType<typeof selectionSnapshot> | null = null
    let committedChanged = false

    function captureSubmit(event: Event) {
      order.push("submit:capture")
      submitted.push(event)
    }

    form.addEventListener("submit", captureSubmit, true)

    const stopUpdate = editor.registerUpdateListener(
      ({ editorState, prevEditorState }) => {
        if (prevEditorState === before) {
          order.push("update:listener")
          committedChanged =
            editorState !== before && editor.getEditorState() === editorState
        }
      },
    )

    const stopMutation = editor.registerMutationListener(
      TextNode,
      (mutations) => {
        if (delivered || !Array.from(mutations.values()).includes("updated"))
          return
        delivered = true
        order.push("mutation:start")
        selection = editor.getEditorState().read(() => {
          const current = $getSelection()

          return $isRangeSelection(current) ? selectionSnapshot(current) : null
        })
        form.requestSubmit()
        order.push("submit:return", "mutation:end")
      },
      { skipInitialization: true },
    )

    try {
      order.push("update:start")
      const changed = changeFirstParagraph()
      order.push("update:return")
      const event = submitted[0]
      document.documentElement.setAttribute(
        "data-url-mutation-reentry",
        JSON.stringify({
          order,
          submitCount: submitted.length,
          submitTrusted: event?.isTrusted ?? null,
          submitPrevented: event?.defaultPrevented ?? false,
          selection,
          committedChanged,
        }),
      )

      return changed
    } finally {
      stopMutation()
      stopUpdate()
      form.removeEventListener("submit", captureSubmit, true)
    }
  }

  function cleanCommit(mode: "selection" | "noop") {
    const id = ++cleanCommitId.current
    const before = editor.getEditorState()
    editor.update(
      () => {
        if (mode !== "selection") return
        const selection = $getSelection()

        if ($isRangeSelection(selection)) $setSelection(selection.clone())
      },
      {
        discrete: true,
        tag: SKIP_DOM_SELECTION_TAG,
        onUpdate() {
          document.documentElement.setAttribute(
            "data-clean-commit-finished",
            String(id),
          )
        },
      },
    )
    document.documentElement.dataset.cleanCommitChanged = String(
      before !== editor.getEditorState(),
    )
  }

  function run(code: string, target: Element | null) {
    if (code === "KeyW") return urlMutationReentry()

    if (code === "KeyM") return mutationReentry()

    if (code === "KeyG") return positiveChange()

    if (code === "KeyL" || code === "KeyY") {
      cleanCommit(code === "KeyL" ? "selection" : "noop")

      return true
    }

    if (code === "KeyJ") {
      captureState()

      return true
    }

    if (code === "KeyK") {
      loadStructuredDocument()

      return true
    }

    if (code === "KeyR") return replaceDocument()

    if (code === "KeyS") {
      setStatusTarget(target)

      return selectFinalWord()
    }

    if (code === "KeyP") return replaceSelection()

    if (code === "KeyT") return changeFirstParagraph()

    return false
  }

  function queueCaptureUpdate(mode: "edit" | "noop") {
    let sameSelection = false
    editor.update(
      () => {
        const selection = $getSelection()
        const before = selection?.clone() ?? null

        if (mode === "edit")
          $getRoot().getAllTextNodes()[0]?.setTextContent("Changed heading")
        const after = $getSelection()
        sameSelection = before === null ? after === null : before.is(after)
      },
      { tag: [HISTORY_PUSH_TAG, SKIP_DOM_SELECTION_TAG] },
    )

    return sameSelection
  }

  useImperativeHandle(ref, () => ({
    run,
    captureOriginal,
    captureTrigger,
    queueCaptureUpdate,
    checkSelection,
  }))

  function selectFinalWordFromButton() {
    setStatusTarget(null)
    selectFinalWord()
  }

  const handleLoadStructuredDocument = useStableCallback(loadStructuredDocument)

  const handleDocumentInput = useStableCallback(function handleDocumentInput(
    event: ChangeEvent<HTMLTextAreaElement>,
  ) {
    setDocumentInput(event.currentTarget.value)
  })

  const handleLoadDocument = useStableCallback(function handleLoadDocument() {
    editor.setEditorState(editor.parseEditorState(documentInput), {
      tag: HISTORY_PUSH_TAG,
    })
  })

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
      <textarea
        aria-label="Fixture document"
        value={documentInput}
        onChange={handleDocumentInput}
      />
      <Button onClick={handleLoadDocument}>Load fixture document</Button>
      <Button onClick={handleLoadStructuredDocument}>
        Load structured document
      </Button>
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
        data-state={state}
        data-state-id={stateId}
        data-selection-in-editor={String(selectionInEditor)}
        data-selected-media={String(selectedMedia)}
        data-original-selection={String(originalCaptured)}
        data-original-selected={String(originalSelected)}
        data-original-state={originalState}
        data-trigger-capture={triggerCapture}
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

interface UploadEvidence {
  calls: number
  resultId: number
  pending: boolean
  aborted: boolean
  cancelTrusted: boolean
  cancelPrevented: boolean
  shortcutTrusted: boolean
  changeTrusted: boolean
  changeCancelable: boolean
  inputTrusted: boolean
  inputCancelable: boolean
  cancelCancelable: boolean
  cancelCount: number
  cancelEventIds: number[]
  cancelRecords: {
    id: number
    trusted: boolean
    cancelable: boolean
    prevented: boolean
  }[]
  sameFile: boolean
  fileNameMatch: boolean
  fileUnchanged: boolean
  fileBytesMatch: boolean
  fileOwnName: boolean
  invoked: "A" | "B" | "none"
}

export function Preview() {
  const [editable, toggleEditable] = useReducer(
    (current: boolean) => !current,
    true,
  )

  const [mounted, setMounted] = useState(true)
  const [uploadConfig, setUploadConfig] = useState<"A" | "B" | "none">("A")
  const [resultUrl, setResultUrl] = useState("")
  const [uploadTarget, setUploadTarget] = useState<Element | null>(null)
  const [vetoCancel, setVetoCancel] = useState(false)

  const [captureMode, setCaptureMode] = useState<"none" | "edit" | "noop">(
    "none",
  )

  const [captureResult, setCaptureResult] = useState<boolean | null>(null)

  const [uploadEvidence, setUploadEvidence] = useState<UploadEvidence>({
    calls: 0,
    resultId: 0,
    pending: false,
    aborted: false,
    cancelTrusted: false,
    cancelPrevented: false,
    shortcutTrusted: false,
    changeTrusted: false,
    changeCancelable: false,
    inputTrusted: false,
    inputCancelable: false,
    cancelCancelable: false,
    cancelCount: 0,
    cancelEventIds: [],
    cancelRecords: [],
    sameFile: false,
    fileNameMatch: false,
    fileUnchanged: false,
    fileBytesMatch: false,
    fileOwnName: false,
    invoked: "none",
  })

  const pendingUpload = useRef<{
    resolve: (url: string) => void
    reject: (reason: Error) => void
    config: "A" | "B"
    file: File
    id: number
    input: File | null
  } | null>(null)

  const inputFile = useRef<File | null>(null)
  const uploadId = useRef(0)
  const cancelRecords = useRef<UploadEvidence["cancelRecords"]>([])
  const actions = useRef<HostActions>(null)
  const mountButton = useRef<HTMLButtonElement>(null)

  function startUpload(config: "A" | "B", signal: AbortSignal, file: File) {
    const entries =
      Number(document.documentElement.dataset.uploadEntries ?? 0) + 1

    document.documentElement.setAttribute(
      "data-upload-entries",
      String(entries),
    )

    if (pendingUpload.current)
      return Promise.reject(new Error("Upload pending"))

    const id = ++uploadId.current
    setUploadEvidence((current) => ({
      ...current,
      calls: id,
      invoked: config,
      pending: true,
      aborted: signal.aborted,
      sameFile: false,
      fileNameMatch: false,
      fileUnchanged: false,
      fileBytesMatch: false,
      fileOwnName: false,
    }))
    observeFile(file, id)
    signal.addEventListener(
      "abort",
      () => {
        setUploadEvidence((current) => ({ ...current, aborted: true }))
      },
      { once: true },
    )

    return new Promise<string>((resolve, reject) => {
      pendingUpload.current = {
        resolve,
        reject,
        config,
        file,
        id,
        input: inputFile.current,
      }
    })
  }

  function observeFile(file: File, id: number) {
    const sameFile = file === inputFile.current
    const fileNameMatch = file.name === "upload-fixture.txt"
    const fileOwnName = Object.hasOwn(file, "name")
    void file.arrayBuffer().then((buffer) => {
      const fileBytesMatch =
        Array.from(new Uint8Array(buffer)).join(",") ===
        Array.from(
          new TextEncoder().encode("\uFEFFbounded upload fixture\n"),
        ).join(",")

      setUploadEvidence((current) =>
        current.calls === id
          ? {
              ...current,
              sameFile,
              fileNameMatch,
              fileBytesMatch,
              fileOwnName,
            }
          : current,
      )
    })
  }

  const uploadA: MediaUpload = useStableCallback(
    function uploadA(file, context) {
      return startUpload("A", context.signal, file)
    },
  )

  const uploadB: MediaUpload = useStableCallback(
    function uploadB(file, context) {
      return startUpload("B", context.signal, file)
    },
  )

  function finishUpload(result: "success" | "failure" | "invalid") {
    const pending = pendingUpload.current

    if (!pending) return
    pendingUpload.current = null
    void pending.file.arrayBuffer().then((buffer) => {
      const fileUnchanged =
        pending.file === pending.input &&
        pending.file.name === "upload-fixture.txt" &&
        !Object.hasOwn(pending.file, "name") &&
        Array.from(new Uint8Array(buffer)).join(",") ===
          Array.from(
            new TextEncoder().encode("\uFEFFbounded upload fixture\n"),
          ).join(",")

      setUploadEvidence((current) =>
        current.calls === pending.id ? { ...current, fileUnchanged } : current,
      )
    })
    setUploadEvidence((current) => ({
      ...current,
      pending: false,
      resultId: pending.id,
    }))

    if (result === "failure") pending.reject(new Error("Upload failed"))
    else
      pending.resolve(
        result === "invalid"
          ? `https://user:password@media.test/invalid-${pending.id}.txt`
          : resultUrl ||
              `https://media.test/upload/${pending.config}-${pending.id}.txt`,
      )
  }

  function removeEditor() {
    setUploadTarget(null)
    flushSync(() => setMounted(false))
    mountButton.current?.focus()
  }

  function mountClick() {
    if (mounted) removeEditor()
    else setMounted(true)
  }

  function keyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.nativeEvent.isTrusted && event.key === "Escape")
      setUploadTarget(null)

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

    const dialog =
      event.target instanceof Element
        ? event.target.closest('[role="dialog"]')
        : null

    if (
      dialog &&
      [
        "KeyH",
        "KeyA",
        "KeyB",
        "KeyD",
        "KeyO",
        "KeyF",
        "KeyI",
        "KeyV",
        "KeyQ",
        "KeyN",
      ].includes(event.code)
    ) {
      event.preventDefault()
      setUploadEvidence((current) => ({
        ...current,
        shortcutTrusted: event.nativeEvent.isTrusted,
      }))

      if (event.code === "KeyH") setUploadTarget(dialog)
      else if (event.code === "KeyA") setUploadConfig("A")
      else if (event.code === "KeyB") setUploadConfig("B")
      else if (event.code === "KeyD") setUploadConfig("none")
      else if (event.code === "KeyV") setVetoCancel((current) => !current)
      else if (event.code === "KeyQ") setCaptureMode("edit")
      else if (event.code === "KeyN") setCaptureMode("noop")
      else if (event.code === "KeyO") finishUpload("success")
      else if (event.code === "KeyF") finishUpload("failure")
      else if (event.code === "KeyI") finishUpload("invalid")

      return
    }

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

  function captureChange(event: ChangeEvent<HTMLElement>) {
    const input = event.target

    if (!(input instanceof HTMLInputElement) || input.type !== "file") return
    const trusted = event.nativeEvent.isTrusted
    const cancelable = event.nativeEvent.cancelable

    if (!trusted)
      document.documentElement.setAttribute(
        "data-constructed-change-captured",
        "true",
      )

    if (trusted && captureMode !== "none")
      setCaptureResult(
        actions.current?.queueCaptureUpdate(captureMode) ?? false,
      )

    setUploadEvidence((current) => ({
      ...current,
      changeTrusted: trusted,
      changeCancelable: cancelable,
    }))
  }

  function captureInput(event: FormEvent<HTMLElement>) {
    const input = event.target

    if (!(input instanceof HTMLInputElement) || input.type !== "file") return
    inputFile.current = input.files?.[0] ?? null
    setUploadEvidence((current) => ({
      ...current,
      inputTrusted: event.nativeEvent.isTrusted,
      inputCancelable: event.nativeEvent.cancelable,
    }))
  }

  function captureClick(event: MouseEvent<HTMLElement>) {
    const button =
      event.target instanceof Element ? event.target.closest("button") : null

    if (
      event.nativeEvent.isTrusted &&
      button?.textContent?.trim() === "Cancel upload"
    ) {
      if (vetoCancel) event.preventDefault()
      const nativeEvent = event.nativeEvent
      const eventId = nativeCancelEvents.get(nativeEvent) ?? 0
      const trusted = nativeEvent.isTrusted
      const cancelable = nativeEvent.cancelable
      const prevented = event.defaultPrevented
      cancelRecords.current.push({
        id: eventId,
        trusted,
        cancelable,
        prevented,
      })
      const records = [...cancelRecords.current]
      setUploadEvidence((current) => ({
        ...current,
        cancelTrusted: trusted,
        cancelCancelable: cancelable,
        cancelCount: records.length,
        cancelEventIds: records.map((record) => record.id),
        cancelRecords: records,
        cancelPrevented: prevented,
      }))
    }

    const label = button?.textContent?.trim()

    if (
      event.nativeEvent.isTrusted &&
      (label === "Insert file" ||
        label === "Insert tweet" ||
        label === "Insert iframe")
    ) {
      actions.current?.captureTrigger(label)

      if (label === "Insert file") actions.current?.captureOriginal()
    }
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

  const [handleResultUrl] = useState(
    () =>
      function handleResultUrl(event: ChangeEvent<HTMLInputElement>) {
        setResultUrl(event.currentTarget.value)
      },
  )

  const handleMountClick = useStableCallback(mountClick)
  const handleKeyDown = useStableCallback(keyDown)
  const handleClickCapture = useStableCallback(captureClick)
  const handleChangeCapture = useStableCallback(captureChange)
  const handleInputCapture = useStableCallback(captureInput)
  const handleSubmitCapture = useStableCallback(observeSubmit)

  const [handleResolveUpload] = useState(
    () =>
      function handleResolveUpload() {
        finishUpload("success")
      },
  )

  const [selectUploadA] = useState(
    () =>
      function selectUploadA() {
        setUploadConfig("A")
      },
  )

  const [selectUploadB] = useState(
    () =>
      function selectUploadB() {
        setUploadConfig("B")
      },
  )

  const [removeUpload] = useState(
    () =>
      function removeUpload() {
        setUploadConfig("none")
      },
  )

  const [failUpload] = useState(
    () =>
      function failUpload() {
        finishUpload("failure")
      },
  )

  const [invalidateUpload] = useState(
    () =>
      function invalidateUpload() {
        finishUpload("invalid")
      },
  )

  const [toggleCancelVeto] = useState(
    () =>
      function toggleCancelVeto() {
        setVetoCancel((current) => !current)
      },
  )

  const uploadControls = (
    <Wrap>
      <Text>
        This simulated upload reads file bytes and inserts a synthetic URL. It
        does not upload or store files. Select a non-sensitive test file.
        Control+Alt+H shows controls in the dialog. Use A or B to select a
        callback, D to remove it, O to resolve, F to fail, I for an invalid URL,
        and V to change the cancel veto.
      </Text>
      <input
        aria-label="Upload result URL"
        value={resultUrl}
        onChange={handleResultUrl}
      />
      <Button onClick={selectUploadA}>Use upload A</Button>
      <Button onClick={selectUploadB}>Use upload B</Button>
      <Button onClick={removeUpload}>Remove upload callback</Button>
      <Button onClick={handleResolveUpload}>Resolve upload</Button>
      <Button onClick={failUpload}>Fail upload</Button>
      <Button onClick={invalidateUpload}>Return invalid upload URL</Button>
      <Button onClick={toggleCancelVeto}>
        {vetoCancel ? "Allow cancel" : "Prevent cancel"}
      </Button>
      <Box
        render={<output />}
        aria-label="Upload host evidence"
        data-config={uploadConfig}
        data-capture-mode={captureMode}
        data-capture-ran={String(captureResult !== null)}
        data-capture-same-selection={String(captureResult === true)}
        data-calls={uploadEvidence.calls}
        data-result-id={uploadEvidence.resultId}
        data-pending={String(uploadEvidence.pending)}
        data-aborted={String(uploadEvidence.aborted)}
        data-cancel-trusted={String(uploadEvidence.cancelTrusted)}
        data-cancel-prevented={String(uploadEvidence.cancelPrevented)}
        data-shortcut-trusted={String(uploadEvidence.shortcutTrusted)}
        data-change-trusted={String(uploadEvidence.changeTrusted)}
        data-change-cancelable={String(uploadEvidence.changeCancelable)}
        data-input-trusted={String(uploadEvidence.inputTrusted)}
        data-input-cancelable={String(uploadEvidence.inputCancelable)}
        data-cancel-cancelable={String(uploadEvidence.cancelCancelable)}
        data-cancel-count={uploadEvidence.cancelCount}
        data-cancel-event-ids={JSON.stringify(uploadEvidence.cancelEventIds)}
        data-cancel-records={JSON.stringify(uploadEvidence.cancelRecords)}
        data-cancel-deliveries={uploadEvidence.cancelEventIds.length}
        data-same-file={String(uploadEvidence.sameFile)}
        data-file-name-match={String(uploadEvidence.fileNameMatch)}
        data-file-unchanged={String(uploadEvidence.fileUnchanged)}
        data-file-bytes-match={String(uploadEvidence.fileBytesMatch)}
        data-file-own-name={String(uploadEvidence.fileOwnName)}
        data-invoked={uploadEvidence.invoked}
      >
        {`Callback ${uploadConfig}; ${uploadEvidence.calls} calls; ${uploadEvidence.pending ? "pending" : "settled"}; ${uploadEvidence.aborted ? "aborted" : "not aborted"}.`}
      </Box>
    </Wrap>
  )

  return (
    <Box
      render={<section />}
      aria-label="Media editor"
      onKeyDown={handleKeyDown}
      onClickCapture={handleClickCapture}
      onChangeCapture={handleChangeCapture}
      onInputCapture={handleInputCapture}
      onSubmitCapture={handleSubmitCapture}
    >
      {uploadControls}
      {uploadTarget && createPortal(uploadControls, uploadTarget)}
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
          <DocumentSnapshot />
          <EditorToolbar>
            <MediaInsertControl kind="embed" embedType="tweet" />
            <MediaInsertControl kind="embed" embedType="iframe" />
          </EditorToolbar>
          <EditorMediaHost
            upload={
              uploadConfig === "A"
                ? uploadA
                : uploadConfig === "B"
                  ? uploadB
                  : undefined
            }
          />
        </EditorRoot>
      )}
    </Box>
  )
}

function DocumentSnapshot() {
  const editor = useEditor()
  const [json, setJson] = useState("")

  const [handleCapture] = useState(
    () =>
      function handleCapture() {
        setJson(JSON.stringify(editor.getEditorState().toJSON()))
      },
  )

  return (
    <>
      <Button onClick={handleCapture}>Capture document JSON</Button>
      <Box render={<output />} aria-label="Document JSON" hidden>
        {json}
      </Box>
    </>
  )
}

const root = document.getElementById("root")

if (!root) throw new Error("Missing media fixture root")

createRoot(root).render(<Preview />)
