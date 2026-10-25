"use client"

import type { EditorState } from "lexical"
import type { FormEvent } from "react"

import { Box } from "@registry/components/ui/box"
import { Button } from "@registry/components/ui/button"
import { CheckboxGroup } from "@registry/components/ui/checkbox-group"
import { Fieldset, FieldsetLegend } from "@registry/components/ui/fieldset"
import { Form } from "@registry/components/ui/form"
import { HStack } from "@registry/components/ui/hstack"
import { Stack } from "@registry/components/ui/stack"
import { Text } from "@registry/components/ui/text"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"
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
  decodeEditorLabels,
  EDITOR_LABEL_MAX_COUNT,
  EditorLabelsPicker,
  EditorLabelsOption,
} from "@yopem-ui/editor/labels"
import { useId, useState } from "react"

const labelOptions = [
  "Editor",
  "Select Editor",
  "Block Selection",
  "Button",
  "Command",
  "Dialog",
  "Form",
  "Input",
  "Label",
  "Popover",
  "Tag Node",
] as const

const labelExtensions = [createEditorLabelsExtension(labelOptions)]

const styles = stylex.create({
  root: {
    gap: `calc(${tokens["--spacing"]} * 4)`,
    minInlineSize: 0,
  },
})

export function PublicLabelsExample() {
  const [labels, setLabels] = useState<readonly string[]>([])
  const [readOnly, setReadOnly] = useState(false)

  function syncLabels(state: EditorState) {
    setLabels(state.read(() => $getEditorLabels()))
  }

  return (
    <Box
      data-testid="public-labels-example"
      render={<section aria-label="Public label editor" />}
    >
      <EditorRoot
        ariaLabel="Public labels editor"
        editable={!readOnly}
        extensions={labelExtensions}
        onChange={syncLabels}
        xstyle={styles.root}
      >
        <EditorToolbar aria-label="Public labels history">
          <EditorHistoryButton action="undo" />
          <EditorHistoryButton action="redo" />
        </EditorToolbar>
        <EditorContent placeholder="Choose labels in the form" />
        <PublicLabelsForm
          labels={labels}
          onLabelsChange={setLabels}
          onReadOnlyChange={setReadOnly}
          readOnly={readOnly}
        />
      </EditorRoot>
    </Box>
  )
}

function PublicLabelsForm({
  labels,
  onLabelsChange,
  onReadOnlyChange,
  readOnly,
}: {
  labels: readonly string[]
  onLabelsChange: (labels: readonly string[]) => void
  onReadOnlyChange: (readOnly: boolean) => void
  readOnly: boolean
}) {
  const editor = useEditor()
  const errorId = useId()
  const [error, setError] = useState("")

  function toggleReadOnly() {
    onReadOnlyChange(!readOnly)
  }

  function makeEditable() {
    onReadOnlyChange(false)
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (readOnly || !editor.isEditable()) return

    const selected = decodeEditorLabels(labels, labelOptions)

    if (!selected) {
      setError(
        labels.length > EDITOR_LABEL_MAX_COUNT
          ? "Select up to 10 labels"
          : "Select valid labels",
      )

      return
    }

    if (selected.length === 0) {
      setError("Select at least one label")

      return
    }

    let applied = false

    editor.update(() => {
      applied = $replaceEditorLabels(selected, labelOptions)
    })

    setError(applied ? "" : "Labels could not be applied")
  }

  return (
    <Stack>
      <HStack>
        <Button
          aria-pressed={readOnly}
          onClick={toggleReadOnly}
          type="button"
          variant="outline"
        >
          {readOnly ? "Make editable" : "Make read-only"}
        </Button>
        <Box render={<output aria-live="polite" />}>
          {labels.length} of 10 labels selected
        </Box>
      </HStack>
      {readOnly && labels.length === 0 ? (
        <Button onClick={makeEditable} type="button">
          Add labels
        </Button>
      ) : (
        <Form onSubmit={submit}>
          <Stack>
            <Fieldset
              aria-describedby={error ? errorId : undefined}
              aria-invalid={Boolean(error)}
              disabled={readOnly}
            >
              <FieldsetLegend>Label options</FieldsetLegend>
              <EditorLabelsPicker
                aria-label="Available labels"
                disabled={readOnly}
                onValueChange={onLabelsChange}
                options={labelOptions}
                value={labels}
              />
            </Fieldset>
            {error ? (
              <Text id={errorId} role="alert">
                {error}
              </Text>
            ) : null}
            <Button disabled={readOnly} type="submit">
              Apply labels
            </Button>
          </Stack>
        </Form>
      )}
    </Stack>
  )
}

export function LabelOptionsExample() {
  return (
    <CheckboxGroup aria-label="Custom label options" defaultValue={["Editor"]}>
      <EditorLabelsOption value="Editor" />
      <EditorLabelsOption value="Dialog">Dialog label</EditorLabelsOption>
      <EditorLabelsOption value="Form" disabled>
        Disabled form label
      </EditorLabelsOption>
    </CheckboxGroup>
  )
}
