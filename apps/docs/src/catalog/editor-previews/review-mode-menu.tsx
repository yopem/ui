"use client"

import type {
  EditorReviewMode,
  EditorReviewHost,
} from "@yopem-ui/editor/review"

import { Checkbox } from "@registry/components/ui/checkbox"
import { Label } from "@registry/components/ui/label"
import { Stack } from "@registry/components/ui/stack"
import { Wrap } from "@registry/components/ui/wrap"
import { EditorContent, EditorRoot, useEditor } from "@yopem-ui/editor"
import {
  createEditorReview,
  EditorReviewModeMenu,
  EditorReviewPanel,
  EditorReviewProvider,
  makeReviewRichContent,
  useEditorReview,
} from "@yopem-ui/editor/review"
import { useState } from "react"

const initialState = JSON.stringify(
  makeReviewRichContent("Select text and choose a document mode."),
)

const viewer = { id: "toolbar-reviewer", name: "Toolbar reviewer" }

export function ModeControl({
  mode,
  locked,
  label,
  host,
  onChange,
}: {
  mode: EditorReviewMode
  locked: boolean
  label: string | undefined
  host: EditorReviewHost
  onChange: (value: EditorReviewMode) => void
}) {
  const editor = useEditor()
  const review = useEditorReview()

  function canChangeMode(next: EditorReviewMode) {
    if (next === "viewing") return true

    if (locked) return false

    return (
      next !== "suggestion" ||
      (host.viewer !== null &&
        host.can("suggest", undefined, host.viewer) === true)
    )
  }

  function changeMode(next: EditorReviewMode) {
    if (!canChangeMode(next)) return
    const wasEditable = editor.isEditable()
    editor.setEditable(next !== "viewing")

    if (!review.run(() => review.setSuggesting(next === "suggestion"))) {
      editor.setEditable(wasEditable)

      return
    }

    onChange(next)
  }

  return (
    <EditorReviewModeMenu
      aria-label={label}
      value={locked ? "viewing" : mode}
      canChangeMode={canChangeMode}
      onModeChange={changeMode}
    />
  )
}

export function Preview() {
  const [controller] = useState(createEditorReview)
  const [extensions] = useState(() => [controller.extension])
  const [mode, setMode] = useState<EditorReviewMode>("editing")
  const [locked, setLocked] = useState(false)
  const [denySuggestions, setDenySuggestions] = useState(false)
  const [customLabel, setCustomLabel] = useState(false)

  const host: EditorReviewHost = {
    viewer,
    visible: true,
    replyWhileReadonly: false,
    can(action) {
      return !locked && (action !== "suggest" || !denySuggestions)
    },
  }

  return (
    <Stack>
      <Wrap>
        <Label>
          <Checkbox checked={locked} onCheckedChange={setLocked} />
          Host read only
        </Label>
        <Label>
          <Checkbox
            checked={denySuggestions}
            onCheckedChange={setDenySuggestions}
          />
          Deny suggestions
        </Label>
        <Label>
          <Checkbox checked={customLabel} onCheckedChange={setCustomLabel} />
          Use custom mode label
        </Label>
      </Wrap>
      <EditorRoot
        ariaLabel="Mode menu document"
        initialState={initialState}
        extensions={extensions}
        editable={!locked && mode !== "viewing"}
      >
        <EditorReviewProvider controller={controller} host={host}>
          <Stack>
            <ModeControl
              mode={mode}
              locked={locked}
              label={customLabel ? "Writing mode" : undefined}
              host={host}
              onChange={setMode}
            />
            <EditorContent />
            <EditorReviewPanel />
          </Stack>
        </EditorReviewProvider>
      </EditorRoot>
    </Stack>
  )
}
