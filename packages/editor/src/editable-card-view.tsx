"use client"

import type { LexicalEditor } from "lexical"

import { $insertNodeToNearestRoot } from "@lexical/utils"
import { Box } from "@registry/components/ui/box"
import { Button } from "@registry/components/ui/button"
import { Field, FieldLabel } from "@registry/components/ui/field"
import { Fieldset, FieldsetLegend } from "@registry/components/ui/fieldset"
import { Figcaption } from "@registry/components/ui/figcaption"
import { Input } from "@registry/components/ui/input"
import { Label } from "@registry/components/ui/label"
import { Radio, RadioGroup } from "@registry/components/ui/radio-group"
import { Stack } from "@registry/components/ui/stack"
import { Text } from "@registry/components/ui/text"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"
import {
  $createParagraphNode,
  $getRoot,
  $getSelection,
  $isRangeSelection,
  HISTORY_PUSH_TAG,
} from "lexical"
import { useState, useSyncExternalStore, type ChangeEvent } from "react"

import { EditorCommandButton, type EditorControlProps } from "./controls"
import { $createEditorEditableCardNode } from "./editable-card-node"
import { EditorContent, EditorRoot, useEditor } from "./root"

const styles = stylex.create({
  card: {
    backgroundColor: tokens["--card"],
    borderColor: tokens["--border"],
    borderRadius: tokens["--radius-md"],
    borderStyle: "solid",
    borderWidth: 1,
    boxSizing: "border-box",
    marginBlock: 0,
    maxInlineSize: "100%",
    minInlineSize: 0,
    padding: `calc(${tokens["--spacing"]} * 4)`,
  },
  content: {
    gap: `calc(${tokens["--spacing"]} * 3)`,
    minInlineSize: 0,
  },
  fieldset: {
    borderWidth: 0,
    margin: 0,
    minInlineSize: 0,
    padding: 0,
  },
  radio: {
    alignItems: "center",
    display: "flex",
    gap: `calc(${tokens["--spacing"]} * 2)`,
    minBlockSize: 44,
  },
  note: {
    borderColor: tokens["--border"],
    borderRadius: tokens["--radius-md"],
    borderStyle: "solid",
    borderWidth: 1,
    minInlineSize: 0,
  },
  noteContent: { minBlockSize: "5rem" },
  control: { minBlockSize: 44, minInlineSize: 44 },
  saved: { overflowWrap: "anywhere", whiteSpace: "pre-wrap" },
})

function createEditableCardEditableStore(editor: LexicalEditor) {
  return {
    subscribe: (listener: () => void) =>
      editor.registerEditableListener(listener),
    getSnapshot: () => editor.isEditable(),
  }
}

export type EditorEditableCardInsertButtonProps = EditorControlProps

export function EditorEditableCardInsertButton({
  children = "Insert editable card",
  ...props
}: EditorEditableCardInsertButtonProps) {
  const editor = useEditor()

  function insertCard() {
    if (!editor.isEditable()) return
    editor.update(
      () => {
        const selection = $getSelection()
        const node = $createEditorEditableCardNode()

        if ($isRangeSelection(selection)) $insertNodeToNearestRoot(node)
        else $getRoot().append(node)

        const paragraph = $createParagraphNode()
        node.insertAfter(paragraph)
        paragraph.selectStart()
      },
      { tag: HISTORY_PUSH_TAG },
    )
  }

  return (
    <EditorCommandButton {...props} command={insertCard}>
      {children}
    </EditorCommandButton>
  )
}

export function EditorEditableCardView({ editor }: { editor: LexicalEditor }) {
  const [store] = useState(() => createEditableCardEditableStore(editor))

  const editable = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getSnapshot,
  )

  const [title, setTitle] = useState("New card")
  const [visibility, setVisibility] = useState("public")

  const [saved, setSaved] = useState<{
    title: string
    visibility: string
  } | null>(null)

  function updateTitle(event: ChangeEvent<HTMLInputElement>) {
    if (editable) setTitle(event.currentTarget.value)
  }

  function updateVisibility(value: string | null) {
    if (editable) setVisibility(value ?? "public")
  }

  function saveCard() {
    if (editor.isEditable()) setSaved({ title, visibility })
  }

  return (
    <Box
      render={<figure />}
      contentEditable={false}
      data-slot="editor-editable-card"
      data-testid="editable-card"
      xstyle={styles.card}
    >
      <Stack xstyle={styles.content}>
        <Field>
          <FieldLabel>Card title</FieldLabel>
          <Input
            aria-label="Card title"
            disabled={!editable}
            maxLength={120}
            onChange={updateTitle}
            value={title}
            xstyle={styles.control}
          />
        </Field>
        <Fieldset xstyle={styles.fieldset}>
          <FieldsetLegend>Card visibility</FieldsetLegend>
          <RadioGroup
            aria-label="Card visibility"
            disabled={!editable}
            onValueChange={updateVisibility}
            value={visibility}
          >
            <Label xstyle={styles.radio}>
              <Radio aria-label="Public" disabled={!editable} value="public" />
              Public
            </Label>
            <Label xstyle={styles.radio}>
              <Radio
                aria-label="Private"
                disabled={!editable}
                value="private"
              />
              Private
            </Label>
          </RadioGroup>
        </Fieldset>
        <Stack xstyle={styles.content}>
          <Text>Card fields and nested text stay local to this preview.</Text>
          <Text>They are not saved in the outer document.</Text>
          <Box xstyle={styles.note}>
            <EditorRoot ariaLabel="Card note editor" editable={editable}>
              <EditorContent
                placeholder="Write a card note…"
                xstyle={styles.noteContent}
              />
            </EditorRoot>
          </Box>
        </Stack>
        <Button disabled={!editable} onClick={saveCard} xstyle={styles.control}>
          Save card locally
        </Button>
        {saved ? (
          <Box
            render={<output aria-label="Saved card values" />}
            xstyle={styles.saved}
          >
            {JSON.stringify(saved, null, 2)}
          </Box>
        ) : null}
      </Stack>
      <Figcaption>
        Controls and nested text reset when this card leaves the document.
      </Figcaption>
    </Box>
  )
}
