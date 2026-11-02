"use client"

import { useStableCallback } from "@base-ui/utils/useStableCallback"
import { Box } from "@registry/components/ui/box"
import { Button } from "@registry/components/ui/button"
import { Field, FieldLabel } from "@registry/components/ui/field"
import { NativeSelect } from "@registry/components/ui/native-select"
import { Stack } from "@registry/components/ui/stack"
import { Text } from "@registry/components/ui/text"
import { ToolbarButton } from "@registry/components/ui/toolbar"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"
import {
  Editor,
  EditorContent,
  EditorHistoryButton,
  EditorRoot,
  EditorToolbar,
  useEditor,
} from "@yopem-ui/editor"
import {
  deriveReviewTextDiff,
  reviewTextDiffSegments,
} from "@yopem-ui/editor/review-diff"
import { $getRoot, type LexicalEditor } from "lexical"
import { Redo2Icon, Undo2Icon } from "lucide-react"
import { type ChangeEvent, type ComponentProps, useId, useState } from "react"

export interface LocalRevisionBlock {
  key: string
  position: number
  text: string
  serialized: string
}

export interface LocalRevisionSnapshot {
  serialized: string
  blocks: readonly LocalRevisionBlock[]
}

interface SavedRevision extends LocalRevisionSnapshot {
  id: string
}

interface RevisionHistory {
  revisions: readonly SavedRevision[]
  selected: string
  error: string
}

const initialState = JSON.stringify({
  root: {
    type: "root",
    version: 1,
    direction: null,
    format: "",
    indent: 0,
    children: ["Draft A", "Second paragraph"].map((text) => ({
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
          text,
        },
      ],
    })),
  },
})

const encoder = new TextEncoder()

const styles = stylex.create({
  inserted: {
    color: tokens["--success-foreground"],
    textDecoration: "underline",
  },
  removed: {
    color: tokens["--destructive-foreground"],
    textDecoration: "line-through",
  },
})

function captureSnapshot(editor: LexicalEditor) {
  const state = editor.getEditorState()
  const json = state.toJSON()
  const serialized = JSON.stringify(json)

  if (encoder.encode(serialized).byteLength > 1048576) return null

  const blocks = state.read(() =>
    $getRoot()
      .getChildren()
      .map((node, position) => ({
        key: node.getKey(),
        position,
        text: node.getTextContent(),
        serialized: JSON.stringify(json.root.children[position]),
      })),
  )

  return blocks.length > 200 ? null : { serialized, blocks }
}

export function RevisionSaveButton({
  onSave,
  disabled,
}: {
  onSave: (snapshot: LocalRevisionSnapshot | null) => void
  disabled: boolean
}) {
  const editor = useEditor()

  const save = useStableCallback(function save() {
    onSave(captureSnapshot(editor))
  })

  return (
    <ToolbarButton disabled={disabled} onClick={save}>
      Save revision
    </ToolbarButton>
  )
}

export function RevisionTextChanges({
  before,
  after,
}: {
  before: string
  after: string
}) {
  if (!reviewTextDiffSegments(before) || !reviewTextDiffSegments(after))
    return (
      <Stack>
        <Text>Removed text</Text>
        <Box render={<del />} data-change="delete" xstyle={styles.removed}>
          {before}
        </Box>
        <Text>Inserted text</Text>
        <Box render={<ins />} data-change="insert" xstyle={styles.inserted}>
          {after}
        </Box>
      </Stack>
    )
  const changes = deriveReviewTextDiff(before, after)

  return (
    <Box render={<p />}>
      {changes.map((change) =>
        change.kind === "insert" ? (
          <Box
            key={`${change.kind}:${change.offset}`}
            render={<ins />}
            data-change="insert"
            xstyle={styles.inserted}
          >
            {change.text}
          </Box>
        ) : change.kind === "delete" ? (
          <Box
            key={`${change.kind}:${change.offset}`}
            render={<del />}
            data-change="delete"
            xstyle={styles.removed}
          >
            {change.text}
          </Box>
        ) : (
          <Box key={`${change.kind}:${change.offset}`} render={<span />}>
            {change.text}
          </Box>
        ),
      )}
    </Box>
  )
}

export function RevisionBlockChanges({
  before,
  after,
}: {
  before: LocalRevisionSnapshot
  after: LocalRevisionSnapshot
}) {
  const oldKeys = new Set(before.blocks.map((block) => block.key))
  const current = new Map(after.blocks.map((block) => [block.key, block]))

  const changed =
    before.blocks.some((block) => {
      const next = current.get(block.key)

      return (
        !next ||
        next.serialized !== block.serialized ||
        next.position !== block.position
      )
    }) || after.blocks.some((block) => !oldKeys.has(block.key))

  return (
    <Stack data-testid="revision-changes">
      {!changed ? <Text>No changes</Text> : null}
      {before.blocks.map((block) => {
        const next = current.get(block.key)

        if (!next)
          return (
            <Stack key={block.key}>
              <Text>Removed block</Text>
              <Box
                render={<del />}
                data-change="delete"
                xstyle={styles.removed}
              >
                {block.text}
              </Box>
            </Stack>
          )

        if (
          next.serialized === block.serialized &&
          next.position === block.position
        )
          return null

        return (
          <Stack key={block.key}>
            <Text>Updated block</Text>
            <RevisionTextChanges before={block.text} after={next.text} />
          </Stack>
        )
      })}
      {after.blocks
        .filter((block) => !oldKeys.has(block.key))
        .map((block) => (
          <Stack key={block.key}>
            <Text>Inserted block</Text>
            <Box render={<ins />} data-change="insert" xstyle={styles.inserted}>
              {block.text}
            </Box>
          </Stack>
        ))}
    </Stack>
  )
}

export function VersionHistoryExample() {
  const [history, setHistory] = useState<RevisionHistory>({
    revisions: [],
    selected: "",
    error: "",
  })

  const [current, setCurrent] = useState<LocalRevisionSnapshot | null>(null)
  const selectId = useId()

  const selected = history.revisions.find(
    (revision) => revision.id === history.selected,
  )

  const save = useStableCallback(function save(
    snapshot: LocalRevisionSnapshot | null,
  ) {
    setHistory((previous) => {
      if (!snapshot)
        return {
          ...previous,
          error: "Snapshots support at most 1 MiB and 200 top-level blocks.",
        }

      if (previous.revisions.length >= 20)
        return { ...previous, error: "The local history has 20 revisions." }

      const revision = {
        ...snapshot,
        id: `revision-${previous.revisions.length + 1}`,
      }

      return {
        revisions: [...previous.revisions, revision],
        selected: revision.id,
        error: "",
      }
    })
    setCurrent(snapshot)
  })

  const selectRevision = useStableCallback(function selectRevision(
    event: ChangeEvent<HTMLSelectElement>,
  ) {
    const selected = event.currentTarget.value
    setHistory((previous) => ({ ...previous, selected }))
  })

  const handleEditorChange = useStableCallback(function handleEditorChange(
    _state: Parameters<
      NonNullable<ComponentProps<typeof EditorRoot>["onChange"]>
    >[0],
    editor: LexicalEditor,
  ) {
    setCurrent(captureSnapshot(editor))
  })

  return (
    <Stack>
      <Text>
        Save up to 20 immutable local snapshots. Closing this preview discards
        them. No server revision service is configured.
      </Text>
      <EditorRoot
        ariaLabel="Current revision editor"
        initialState={initialState}
        onChange={handleEditorChange}
      >
        <EditorToolbar aria-label="Revision actions">
          <RevisionSaveButton
            onSave={save}
            disabled={history.revisions.length >= 20}
          />
          <EditorHistoryButton
            action="undo"
            aria-label="Undo"
            title="Undo"
            render={<Button variant="ghost" size="icon-sm" />}
          >
            <Undo2Icon aria-hidden="true" size={16} />
          </EditorHistoryButton>
          <EditorHistoryButton
            action="redo"
            aria-label="Redo"
            title="Redo"
            render={<Button variant="ghost" size="icon-sm" />}
          >
            <Redo2Icon aria-hidden="true" size={16} />
          </EditorHistoryButton>
        </EditorToolbar>
        <EditorContent />
      </EditorRoot>
      {history.error ? <Text role="alert">{history.error}</Text> : null}
      <Field>
        <FieldLabel htmlFor={selectId}>Saved revision</FieldLabel>
        <NativeSelect
          id={selectId}
          value={history.selected}
          onChange={selectRevision}
          disabled={history.revisions.length === 0}
        >
          {history.revisions.length === 0 ? (
            <option value="">No revisions</option>
          ) : null}
          {history.revisions.map((revision, index) => (
            <option key={revision.id} value={revision.id}>
              Revision {index + 1}
            </option>
          ))}
        </NativeSelect>
      </Field>
      {selected ? (
        <>
          <Editor
            key={selected.id}
            ariaLabel="Revision document"
            initialState={selected.serialized}
            editable={false}
          />
          {current ? (
            <RevisionBlockChanges before={selected} after={current} />
          ) : (
            <Text>
              Current content exceeds the snapshot limits. The saved revision
              remains unchanged.
            </Text>
          )}
        </>
      ) : null}
      <Text>
        Node keys identify changes within this mounted document. Document
        replacement appears as removed and inserted blocks. Long or multiline
        blocks use whole-block text differences.
      </Text>
    </Stack>
  )
}
