"use client"

import { $generateHtmlFromNodes, $generateNodesFromDOM } from "@lexical/html"
import { Box } from "@registry/components/ui/box"
import { Button } from "@registry/components/ui/button"
import { Fieldset } from "@registry/components/ui/fieldset"
import { Stack } from "@registry/components/ui/stack"
import { Text } from "@registry/components/ui/text"
import { Wrap } from "@registry/components/ui/wrap"
import {
  EditorContent,
  EditorHistoryButton,
  EditorRoot,
  EditorTableButton,
  EditorTableCellPresentation,
  EditorTableDimensions,
  EditorTableMenu,
  EditorTablePresentationExtension,
  EditorTableResizeControls,
  EditorToolbar,
  useEditor,
  useEditorState,
  parseTablePresentationJSON,
  validateTablePresentationHTML,
} from "@yopem-ui/editor"
import {
  $getRoot,
  configExtension,
  HISTORY_PUSH_TAG,
  type LexicalEditor,
} from "lexical"
import { useState } from "react"

const extensions = [EditorTablePresentationExtension]

const noMergeExtensions = [
  configExtension(EditorTablePresentationExtension, { disableMerge: true }),
]

function restoreGeneratedHTML(editor: LexicalEditor, html: string) {
  const document = new DOMParser().parseFromString(html, "text/html")
  validateTablePresentationHTML(document)
  editor.update(
    () => {
      const nodes = $generateNodesFromDOM(editor, document)

      if (!nodes.length)
        throw new Error("Generated table HTML contains no nodes")
      $getRoot()
        .clear()
        .append(...nodes)
    },
    { discrete: true, tag: HISTORY_PUSH_TAG },
  )
}

function snapshotError(cause: unknown) {
  return cause instanceof Error ? cause.message : "Table snapshot failed"
}

function TableSnapshots() {
  const editor = useEditor()
  const { editable } = useEditorState()
  const [json, setJSON] = useState<string | null>(null)
  const [html, setHTML] = useState<string | null>(null)
  const [error, setError] = useState("")

  function saveJSON() {
    try {
      const next = JSON.stringify(editor.getEditorState().toJSON())
      setJSON(next)
      setError("")
    } catch (cause) {
      setError(snapshotError(cause))
    }
  }

  function loadJSON() {
    if (json === null || !editor.isEditable()) return

    try {
      const next = editor.parseEditorState(parseTablePresentationJSON(json))
      editor.setEditorState(next, { tag: HISTORY_PUSH_TAG })
      setError("")
    } catch (cause) {
      setError(snapshotError(cause))
    }
  }

  function saveHTML() {
    try {
      const next = editor
        .getEditorState()
        .read(() => $generateHtmlFromNodes(editor))

      setHTML(next)
      setError("")
    } catch (cause) {
      setError(snapshotError(cause))
    }
  }

  function loadHTML() {
    if (html === null || !editor.isEditable()) return

    try {
      restoreGeneratedHTML(editor, html)
      setError("")
    } catch (cause) {
      setError(snapshotError(cause))
    }
  }

  return (
    <Stack>
      <Fieldset aria-label="Trusted local table snapshots">
        <Wrap>
          <Button variant="outline" onClick={saveJSON}>
            Save table JSON
          </Button>
          <Button
            variant="outline"
            disabled={!editable || json === null}
            onClick={loadJSON}
          >
            Load table JSON
          </Button>
          <Button variant="outline" onClick={saveHTML}>
            Save table HTML
          </Button>
          <Button
            variant="outline"
            disabled={!editable || html === null}
            onClick={loadHTML}
          >
            Load table HTML
          </Button>
        </Wrap>
      </Fieldset>
      <Text>
        Snapshots stay in this preview. Reload only generated local content. Use
        complete host validation for external documents.
      </Text>
      {error ? <Box role="alert">{error}</Box> : null}
    </Stack>
  )
}

export function PublicTablesExample() {
  return (
    <Stack>
      <EditorRoot
        ariaLabel="Public table editor"
        data-testid="public-table-editor"
        extensions={extensions}
      >
        <EditorToolbar aria-label="Public table formatting">
          <EditorTableButton />
          <EditorTableMenu />
          <EditorHistoryButton action="undo" />
          <EditorHistoryButton action="redo" />
        </EditorToolbar>
        <EditorTableResizeControls />
        <EditorTableCellPresentation />
        <EditorContent placeholder="Insert and edit a table…" />
        <TableSnapshots />
      </EditorRoot>
      <EditorRoot
        ariaLabel="No-merge table editor"
        data-testid="public-table-nomerge-editor"
        extensions={noMergeExtensions}
      >
        <EditorToolbar aria-label="No-merge table formatting">
          <EditorTableMenu />
          <EditorHistoryButton action="undo" />
          <EditorHistoryButton action="redo" />
        </EditorToolbar>
        <EditorTableDimensions />
        <EditorTableResizeControls />
        <EditorTableCellPresentation />
        <EditorContent placeholder="Paste or insert an existing table…" />
        <TableSnapshots />
      </EditorRoot>
    </Stack>
  )
}
