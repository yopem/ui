"use client"

import type { EditorState } from "lexical"

import { DirectionProvider } from "@base-ui/react/direction-provider"
import { useStableCallback } from "@base-ui/utils/useStableCallback"
import { Box } from "@registry/components/ui/box"
import { Button } from "@registry/components/ui/button"
import {
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger,
} from "@registry/components/ui/collapsible"
import {
  ComboboxChips,
  ComboboxChipsInput,
  type ComboboxPrimitive,
} from "@registry/components/ui/combobox"
import { Form } from "@registry/components/ui/form"
import { Stack } from "@registry/components/ui/stack"
import { Wrap } from "@registry/components/ui/wrap"
import {
  EditorContent,
  EditorHistoryButton,
  EditorRoot,
  EditorToolbar,
  useEditor,
} from "@yopem-ui/editor"
import {
  $getEditorLabels,
  $replaceEditorLabels,
  createEditorLabelsExtension,
  EditorLabelsContent,
  EditorLabelsInput,
  EditorLabelsSelect,
  EditorLabelsTag,
  type EditorLabelsChangeEventDetails,
  type EditorLabelsSelectProps,
} from "@yopem-ui/editor/labels"
import { SKIP_DOM_SELECTION_TAG } from "lexical"
import { type RefObject, useRef, useState } from "react"
import { flushSync } from "react-dom"

const hostActions = [
  "Queue host labels",
  "Commit host labels",
  "Set host read-only",
  "Disable select on change",
  "Unmount select on change",
  "Replace editor surface on change",
  "Leave host document unchanged",
] as const

const closeActions = [
  "Read-only on popup close",
  "Disable on popup close",
  "Unmount on popup close",
  "Focus submit on popup close",
] as const

const options = [
  "Editor",
  "Button",
  "Command",
  "Dialog",
  "Form",
  "Input",
  "Label",
  "Popover",
  "Tag",
  "Table",
  "Tree",
]

const extensions = [createEditorLabelsExtension(options)]

export function Preview() {
  const [labels, setLabels] = useState<readonly string[]>([])
  const [readOnly, setReadOnly] = useState(false)

  const sync = useStableCallback(function sync(state: EditorState) {
    setLabels(state.read($getEditorLabels))
  })

  return (
    <Box data-testid="labels-select-example">
      <EditorRoot
        extensions={extensions}
        editable={!readOnly}
        ariaLabel="Label document"
        onChange={sync}
      >
        <LabelsSelectForm
          labels={labels}
          readOnly={readOnly}
          onReadOnlyChange={setReadOnly}
        />
      </EditorRoot>
    </Box>
  )
}

export function LabelsSelectForm({
  labels,
  readOnly,
  onReadOnlyChange,
}: {
  labels: readonly string[]
  readOnly: boolean
  onReadOnlyChange: (readOnly: boolean) => void
}) {
  const editor = useEditor()
  const [controlled, setControlled] = useState(false)
  const [disabled, setDisabled] = useState(false)
  const [blocked, setBlocked] = useState(false)
  const [blockNative, setBlockNative] = useState(false)

  const [hostAction, setHostAction] = useState<
    (typeof hostActions)[number] | null
  >(null)

  const [hostResult, setHostResult] = useState("")
  const [selectMounted, setSelectMounted] = useState(true)
  const [surfaceVersion, setSurfaceVersion] = useState(0)
  const [rtl, setRtl] = useState(false)
  const [blockPopupClose, setBlockPopupClose] = useState(false)

  const [closeAction, setCloseAction] = useState<
    (typeof closeActions)[number] | null
  >(null)

  const submitRef = useRef<HTMLButtonElement | null>(null)
  const consumerChipsRef = useRef<HTMLDivElement | null>(null)
  const [customField, setCustomField] = useState(false)
  const [customRefReady, setCustomRefReady] = useState(false)

  const [chipNavigationVeto, setChipNavigationVeto] = useState<
    "default" | "base-ui" | null
  >(null)

  const change = useStableCallback(function change(
    next: readonly string[],
    details: EditorLabelsChangeEventDetails,
  ) {
    if (blocked) {
      details.cancel()

      return
    }

    if (hostAction) {
      queueMicrotask(() => {
        setHostResult(details.isCanceled ? "cancelled" : "accepted")
      })
    }

    if (
      hostAction === "Queue host labels" ||
      hostAction === "Commit host labels"
    ) {
      editor.update(
        () => {
          $replaceEditorLabels(controlled ? next : ["Editor"], options)
        },
        {
          discrete: hostAction === "Commit host labels" ? true : undefined,
          tag: SKIP_DOM_SELECTION_TAG,
        },
      )

      return
    }

    if (hostAction === "Set host read-only") {
      flushSync(() => onReadOnlyChange(true))
    } else if (hostAction === "Disable select on change") {
      flushSync(() => setDisabled(true))
    } else if (hostAction === "Unmount select on change") {
      flushSync(() => setSelectMounted(false))
    } else if (hostAction === "Replace editor surface on change") {
      flushSync(() => setSurfaceVersion((version) => version + 1))
    }

    if (!controlled) return
    let applied = false
    editor.update(
      () => {
        applied = $replaceEditorLabels(next, options)
      },
      { discrete: true, tag: SKIP_DOM_SELECTION_TAG },
    )

    if (!applied) details.cancel()
  })

  function handleChipNavigation(
    event: Parameters<
      NonNullable<ComboboxPrimitive.Input.Props["onKeyDown"]>
    >[0],
  ) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return

    if (chipNavigationVeto === "default") event.preventDefault()
    else if (chipNavigationVeto === "base-ui") event.preventBaseUIHandler()
  }

  function replace(next: readonly string[]) {
    editor.update(
      () => {
        $replaceEditorLabels(next, options)
      },
      { discrete: true, tag: SKIP_DOM_SELECTION_TAG },
    )
  }

  return (
    <Stack>
      <LabelsSelectField
        labels={labels}
        direction={rtl ? "rtl" : "ltr"}
        selectMounted={selectMounted}
        customField={customField}
        chipsRef={consumerChipsRef}
        submitRef={submitRef}
        onKeyDown={handleChipNavigation}
        selectProps={{
          value: controlled ? labels : undefined,
          onValueChange: change,
          onOpenChange(next, details) {
            if (next)
              setCustomRefReady(consumerChipsRef.current?.isConnected === true)

            if (next || details.reason !== "imperative-action") return

            if (blockPopupClose) {
              details.cancel()

              return
            }

            if (closeAction === "Read-only on popup close")
              onReadOnlyChange(true)
            else if (closeAction === "Disable on popup close") setDisabled(true)
            else if (closeAction === "Unmount on popup close")
              setSelectMounted(false)
            else if (closeAction === "Focus submit on popup close")
              submitRef.current?.focus()
          },
          disabled,
          name: "labels",
        }}
      />
      <EditorToolbar aria-label="Label history">
        <EditorHistoryButton action="undo" />
        <EditorHistoryButton action="redo" />
      </EditorToolbar>
      <EditorContent
        key={surfaceVersion}
        onKeyDownCapture={(event) => {
          if (blockNative && event.key.length === 1) event.preventDefault()
        }}
      />
      <Wrap>
        <Button variant="outline" onClick={() => setControlled(!controlled)}>
          {controlled ? "Use editor control" : "Use host control"}
        </Button>
        <Button variant="outline" onClick={() => setBlocked(!blocked)}>
          {blocked ? "Allow changes" : "Block changes"}
        </Button>
        <Button variant="outline" onClick={() => setDisabled(!disabled)}>
          {disabled ? "Enable select" : "Disable select"}
        </Button>
        <Button variant="outline" onClick={() => onReadOnlyChange(!readOnly)}>
          {readOnly ? "Make editable" : "Make read-only"}
        </Button>
        <Button variant="outline" onClick={() => setBlockNative(!blockNative)}>
          {blockNative ? "Allow native input" : "Block native input"}
        </Button>
        <Button variant="outline" onClick={() => replace(["Form"])}>
          Set host labels
        </Button>
        <Button
          variant="outline"
          onClick={() => replace(["Unknown", "Editor", "Editor"])}
        >
          Try invalid labels
        </Button>
        <Button variant="outline" onClick={() => replace([])}>
          Clear labels
        </Button>
      </Wrap>
      <Collapsible>
        <CollapsibleTrigger render={<Button variant="outline" />}>
          Advanced host checks
        </CollapsibleTrigger>
        <CollapsiblePanel
          render={<Box render={<section />} />}
          aria-label="Advanced host checks"
        >
          <Stack>
            <Wrap>
              <Button
                variant="outline"
                aria-pressed={customField}
                onClick={() => setCustomField(!customField)}
              >
                Use custom label field
              </Button>
              <Box render={<output aria-label="Custom field ref on open" />}>
                {customRefReady ? "connected" : "missing"}
              </Box>
              <Button
                variant="outline"
                aria-pressed={rtl}
                onClick={() => setRtl(!rtl)}
              >
                Right-to-left labels
              </Button>
              <Button
                variant="outline"
                aria-pressed={blockPopupClose}
                onClick={() => setBlockPopupClose(!blockPopupClose)}
              >
                Prevent popup close
              </Button>
              <Button
                variant="outline"
                aria-pressed={chipNavigationVeto === "default"}
                onClick={() =>
                  setChipNavigationVeto(
                    chipNavigationVeto === "default" ? null : "default",
                  )
                }
              >
                Prevent chip navigation
              </Button>
              <Button
                variant="outline"
                aria-pressed={chipNavigationVeto === "base-ui"}
                onClick={() =>
                  setChipNavigationVeto(
                    chipNavigationVeto === "base-ui" ? null : "base-ui",
                  )
                }
              >
                Prevent Base UI chip navigation
              </Button>
            </Wrap>
            <Wrap>
              {closeActions.map((action) => (
                <Button
                  key={action}
                  variant="outline"
                  aria-pressed={closeAction === action}
                  onClick={() =>
                    setCloseAction(closeAction === action ? null : action)
                  }
                >
                  {action}
                </Button>
              ))}
            </Wrap>
            <Wrap>
              {hostActions.map((action) => (
                <Button
                  key={action}
                  variant="outline"
                  aria-pressed={hostAction === action}
                  onClick={() => {
                    setHostAction(action)
                    setHostResult("")
                  }}
                >
                  {action}
                </Button>
              ))}
            </Wrap>
            <Box
              render={
                <output aria-label="Host change result" aria-live="polite" />
              }
            >
              {hostResult}
            </Box>
          </Stack>
        </CollapsiblePanel>
      </Collapsible>
    </Stack>
  )
}

export function LabelsSelectField({
  labels,
  direction,
  selectMounted,
  customField,
  chipsRef,
  submitRef,
  onKeyDown,
  selectProps,
}: {
  labels: readonly string[]
  direction: "ltr" | "rtl"
  selectMounted: boolean
  customField: boolean
  chipsRef: RefObject<HTMLDivElement | null>
  submitRef: RefObject<HTMLButtonElement | null>
  onKeyDown: ComboboxPrimitive.Input.Props["onKeyDown"]
  selectProps: Omit<EditorLabelsSelectProps, "children" | "options">
}) {
  const [submitted, setSubmitted] = useState("")
  const [formElement, setFormElement] = useState<HTMLFormElement | null>(null)

  return (
    <DirectionProvider direction={direction}>
      <Form
        ref={setFormElement}
        dir={direction}
        onSubmit={(event) => {
          event.preventDefault()
          setSubmitted(
            JSON.stringify(new FormData(event.currentTarget).getAll("labels")),
          )
        }}
      >
        <Stack>
          {selectMounted && (
            <EditorLabelsSelect {...selectProps} options={options}>
              {customField ? (
                <ComboboxChips ref={chipsRef}>
                  {labels.map((label) => (
                    <EditorLabelsTag key={label} value={label} />
                  ))}
                  <ComboboxChipsInput
                    aria-label="Choose labels"
                    onKeyDown={onKeyDown}
                    placeholder="Search labels"
                  />
                </ComboboxChips>
              ) : (
                <EditorLabelsInput onKeyDown={onKeyDown}>
                  {labels.map((label) => (
                    <EditorLabelsTag key={label} value={label} />
                  ))}
                </EditorLabelsInput>
              )}
              <EditorLabelsContent
                portalProps={{
                  container: formElement?.closest("main") ?? undefined,
                }}
              />
            </EditorLabelsSelect>
          )}
          <Button ref={submitRef} type="submit">
            Submit labels
          </Button>
          <Box
            render={<output aria-label="Submitted labels" aria-live="polite" />}
          >
            {submitted}
          </Box>
        </Stack>
      </Form>
    </DirectionProvider>
  )
}
