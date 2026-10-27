"use client"

import type { EditorState, LexicalEditor } from "lexical"

import { useStableCallback } from "@base-ui/utils/useStableCallback"
import { Box } from "@registry/components/ui/box"
import { Button } from "@registry/components/ui/button"
import { Field, FieldLabel } from "@registry/components/ui/field"
import { Heading } from "@registry/components/ui/heading"
import { Input } from "@registry/components/ui/input"
import { Stack } from "@registry/components/ui/stack"
import { Text } from "@registry/components/ui/text"
import {
  EditorBlockButton,
  EditorContent,
  EditorFormatButton,
  EditorHistoryButton,
  EditorRoot,
  EditorToolbar,
  useEditor,
} from "@yopem-ui/editor"
import {
  exportDocument,
  importDocument,
  parseDocument,
} from "@yopem-ui/editor/document"
import { useId, useState, type ChangeEvent } from "react"
import * as z from "zod"

const initialDocument = JSON.stringify({
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
        children: [
          {
            type: "text",
            version: 1,
            detail: 0,
            format: 0,
            mode: "normal",
            style: "",
            text: "Daily draft starter",
          },
        ],
      },
    ],
  },
})

interface Feedback {
  kind: "error" | "status"
  text: string
}

interface PreparedDraft {
  source: string
  automatic: boolean
  feedback: Feedback | null
}

function createDraftPersistence(initialSource: string, enabled: boolean) {
  let automatic = enabled
  let paused = false
  let lastSaved = initialSource
  let skipSource = initialSource

  return {
    shouldSave() {
      return automatic && !paused
    },
    changed(source: string) {
      return source !== lastSaved && source !== skipSource
    },
    saved(source: string) {
      lastSaved = source
      skipSource = source
      automatic = true
    },
    pauseAutomatic() {
      automatic = false
    },
    beginReplacement() {
      paused = true
    },
    finishReplacement() {
      paused = false
    },
    skip(source: string) {
      skipSource = source
    },
  }
}

type DraftPersistence = ReturnType<typeof createDraftPersistence>

const dailyNodeSchema = z.object({
  type: z.enum([
    "root",
    "paragraph",
    "text",
    "linebreak",
    "tab",
    "heading",
    "quote",
    "link",
    "list",
    "listitem",
    "code",
    "code-highlight",
    "table",
    "tablerow",
    "tablecell",
  ]),
  children: z.array(z.unknown()).optional(),
})

function dailyDocument(source: string) {
  const document = parseDocument(source, "json")
  const pending: unknown[] = [document.root]

  while (pending.length) {
    const node = dailyNodeSchema.parse(pending.pop())

    if (node.children) pending.push(...node.children)
  }

  return JSON.stringify(document)
}

function storageKey(date: string) {
  return `yopem-ui:public-persisted:${date}`
}

function prepareDraft(date: string): PreparedDraft {
  const starter = dailyDocument(initialDocument)

  if (!date)
    return {
      source: starter,
      automatic: false,
      feedback: { kind: "error", text: "Choose a date before saving." },
    }

  try {
    const saved = window.localStorage.getItem(storageKey(date))

    return {
      source: saved === null ? starter : dailyDocument(saved),
      automatic: true,
      feedback: null,
    }
  } catch {
    return {
      source: starter,
      automatic: false,
      feedback: {
        kind: "error",
        text: "Could not open a valid saved draft. Automatic saving is paused. Existing storage was not changed.",
      },
    }
  }
}

function PersistedDraftControls({
  date,
  persistence,
  onFeedback,
}: {
  date: string
  persistence: DraftPersistence
  onFeedback: (value: Feedback) => void
}) {
  const editor = useEditor()

  const saveDraft = useStableCallback(function saveDraft() {
    if (!date) {
      onFeedback({ kind: "error", text: "Choose a date before saving." })

      return
    }

    try {
      const source = exportDocument(editor, "json")
      window.localStorage.setItem(storageKey(date), source)
      persistence.saved(source)
      onFeedback({ kind: "status", text: `Saved draft for ${date}.` })
    } catch {
      persistence.pauseAutomatic()
      onFeedback({
        kind: "error",
        text: "Could not save the draft. The current document remains open.",
      })
    }
  })

  const loadDraft = useStableCallback(function loadDraft() {
    if (!date) {
      onFeedback({ kind: "error", text: "Choose a date before loading." })

      return
    }

    persistence.beginReplacement()

    try {
      const source = window.localStorage.getItem(storageKey(date))

      if (source === null) {
        onFeedback({ kind: "status", text: `No draft exists for ${date}.` })

        return
      }

      importDocument(editor, source, "json")
      const canonical = exportDocument(editor, "json")
      persistence.saved(canonical)
      onFeedback({ kind: "status", text: `Loaded draft for ${date}.` })
    } catch {
      persistence.pauseAutomatic()
      onFeedback({
        kind: "error",
        text: "Could not load a valid draft. The current document was kept. Automatic saving is paused.",
      })
    } finally {
      persistence.finishReplacement()
    }
  })

  const resetEditor = useStableCallback(function resetEditor() {
    persistence.beginReplacement()

    try {
      importDocument(editor, initialDocument, "json")
      persistence.skip(exportDocument(editor, "json"))
      onFeedback({
        kind: "status",
        text: "Restored the starter document. Saved drafts were not changed.",
      })
    } catch {
      onFeedback({
        kind: "error",
        text: "Could not restore the starter document.",
      })
    } finally {
      persistence.finishReplacement()
    }
  })

  return (
    <Stack>
      <Button type="button" onClick={saveDraft}>
        Save draft
      </Button>
      <Button type="button" variant="outline" onClick={loadDraft}>
        Load draft
      </Button>
      <Button type="button" variant="secondary" onClick={resetEditor}>
        Reset editor
      </Button>
    </Stack>
  )
}

function DailyDraftSession({
  date,
  prepared,
  onFeedback,
}: {
  date: string
  prepared: PreparedDraft
  onFeedback: (value: Feedback | null) => void
}) {
  const [persistence] = useState(() =>
    createDraftPersistence(prepared.source, prepared.automatic),
  )

  const saveChangedDocument = useStableCallback(function saveChangedDocument(
    _state: EditorState,
    editor: LexicalEditor,
  ) {
    if (!persistence.shouldSave() || !date) return

    try {
      const source = exportDocument(editor, "json")

      if (!persistence.changed(source)) return
      window.localStorage.setItem(storageKey(date), source)
      persistence.saved(source)
      onFeedback({ kind: "status", text: `Saved draft for ${date}.` })
    } catch {
      persistence.pauseAutomatic()
      onFeedback({
        kind: "error",
        text: "Automatic save failed. The current document remains open. Use Save draft to retry.",
      })
    }
  })

  return (
    <Stack>
      <EditorRoot
        ariaLabel="Daily editor"
        initialState={prepared.source}
        onChange={saveChangedDocument}
      >
        <EditorToolbar aria-label="Daily editor controls">
          <EditorBlockButton block="paragraph" />
          <EditorBlockButton block="h2" />
          <EditorBlockButton block="quote" />
          <EditorFormatButton format="bold" />
          <EditorFormatButton format="italic" />
          <EditorHistoryButton action="undo" />
          <EditorHistoryButton action="redo" />
        </EditorToolbar>
        <EditorContent placeholder="Write this date's note…" />
        <PersistedDraftControls
          date={date}
          persistence={persistence}
          onFeedback={onFeedback}
        />
      </EditorRoot>
      {prepared.feedback ? (
        <Box
          render={
            prepared.feedback.kind === "error" ? (
              <div role="alert" />
            ) : (
              <output aria-live="polite" />
            )
          }
        >
          {prepared.feedback.text}
        </Box>
      ) : null}
    </Stack>
  )
}

function PreparedDailyEditor({ date }: { date: string }) {
  const [prepared, setPrepared] = useState<PreparedDraft | null>(null)

  function updateFeedback(feedback: Feedback | null) {
    setPrepared((current) => (current ? { ...current, feedback } : current))
  }

  const [attach] = useState(() => {
    let initialized = false

    return function prepareAfterMount(element: HTMLDivElement | null) {
      if (!element || initialized) return
      initialized = true
      setPrepared(prepareDraft(date))
    }
  })

  return (
    <Box ref={attach}>
      {prepared ? (
        <DailyDraftSession
          date={date}
          prepared={prepared}
          onFeedback={updateFeedback}
        />
      ) : (
        <Box render={<output aria-live="polite" />}>
          Opening this date's draft…
        </Box>
      )}
    </Box>
  )
}

export function PublicPersistedExample() {
  const dateId = useId()
  const [date, setDate] = useState("2025-03-08")

  const changeDate = useStableCallback(function changeDate(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    setDate(event.currentTarget.value)
  })

  return (
    <Stack>
      <Heading>Date-scoped local drafts</Heading>
      <Text>
        Open a validated saved draft for the selected date. Document edits save
        automatically in this browser. Reset changes the editor without
        overwriting the saved draft.
      </Text>
      <Text>
        This root accepts only its registered base node types. Storage is
        origin-local and unencrypted. Changing the date opens a fresh root.
        Invalid or unavailable storage pauses automatic saving until an explicit
        Save draft or valid Load draft.
      </Text>
      <Text>
        Other tabs can overwrite this draft. This example has no conflict
        resolution, encryption, or server synchronization.
      </Text>
      <Field>
        <FieldLabel htmlFor={dateId}>Draft date</FieldLabel>
        <Input
          id={dateId}
          type="date"
          value={date}
          onChange={changeDate}
          required
          min="0001-01-01"
          max="9999-12-31"
        />
      </Field>
      <PreparedDailyEditor key={date} date={date} />
    </Stack>
  )
}
