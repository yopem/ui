"use client"

import { $generateHtmlFromNodes, $generateNodesFromDOM } from "@lexical/html"
import { Box } from "@registry/components/ui/box"
import { Button } from "@registry/components/ui/button"
import { Stack } from "@registry/components/ui/stack"
import { Text } from "@registry/components/ui/text"
import { Textarea } from "@registry/components/ui/textarea"
import { Wrap } from "@registry/components/ui/wrap"
import * as stylex from "@stylexjs/stylex"
import {
  EditorHistoryButton,
  EditorToolbar,
  EditorContent,
  EditorRoot,
  useEditor,
  useEditorState,
} from "@yopem-ui/editor"
import { EditorTableMenu } from "@yopem-ui/editor/table-controls"
import {
  EditorTablePresentationExtension,
  TABLE_PRESENTATION_ERROR_COMMAND,
} from "@yopem-ui/editor/table-presentation"
import {
  EditorTableBackgroundControls,
  EditorTableBorderControls,
  EditorTableDimensions,
} from "@yopem-ui/editor/table-presentation-controls"
import {
  parseTablePresentationJSON,
  validateTablePresentationHTML,
  TABLE_MAX_INPUT_BYTES,
} from "@yopem-ui/editor/table-presentation-schema"
import { EditorTableResizeControls } from "@yopem-ui/editor/table-resize"
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  COMMAND_PRIORITY_HIGH,
  type LexicalEditor,
} from "lexical"
import { useRef, useState } from "react"

const tableExtensions = [EditorTablePresentationExtension]

function parseTableExampleHTML(editor: LexicalEditor, html: string) {
  if (new TextEncoder().encode(html).byteLength > TABLE_MAX_INPUT_BYTES) {
    throw new Error("HTML exceeds size limit.")
  }

  const Parser = editor.getRootElement()?.ownerDocument.defaultView?.DOMParser

  if (!Parser) throw new Error("HTML import is unavailable.")

  const document = new Parser().parseFromString(html, "text/html")
  validateTablePresentationHTML(document)

  return document
}

function TableRoundTripControls() {
  const editor = useEditor()
  const { editable } = useEditorState()
  const [json, setJson] = useState("")
  const [htmlInput, setHtmlInput] = useState("")
  const [error, setError] = useState("")

  return (
    <Wrap
      ref={(element) => {
        if (!element) return

        return editor.registerCommand(
          TABLE_PRESENTATION_ERROR_COMMAND,
          (failure) => {
            setError(failure.message)

            return true
          },
          COMMAND_PRIORITY_HIGH,
        )
      }}
    >
      <Button
        disabled={!editable}
        onClick={() => {
          if (!editor.isEditable()) return
          const serialized = JSON.stringify(editor.getEditorState().toJSON())
          editor.setEditorState(
            editor.parseEditorState(parseTablePresentationJSON(serialized)),
          )
        }}
      >
        Reload table JSON
      </Button>
      <Button
        disabled={!editable}
        onClick={() => {
          if (!editor.isEditable()) return

          const html = editor
            .getEditorState()
            .read(() => $generateHtmlFromNodes(editor))

          const Parser =
            editor.getRootElement()?.ownerDocument.defaultView?.DOMParser

          if (!Parser) return
          const document = new Parser().parseFromString(html, "text/html")
          validateTablePresentationHTML(document)
          editor.update(() => {
            const nodes = $generateNodesFromDOM(editor, document)
            $getRoot()
              .clear()
              .append(...nodes)
          })
        }}
      >
        Reload table HTML
      </Button>
      <Textarea
        aria-label="Table JSON input"
        value={json}
        disabled={!editable}
        onChange={(event) => setJson(event.target.value)}
      />
      <Button
        disabled={!editable}
        onClick={() => {
          if (!editor.isEditable()) return

          try {
            const input = parseTablePresentationJSON(json)
            editor.setEditorState(editor.parseEditorState(input))
            setError("")
          } catch {
            setError("Invalid table document.")
          }
        }}
      >
        Import table JSON
      </Button>
      <Textarea
        aria-label="Table HTML input"
        value={htmlInput}
        disabled={!editable}
        onChange={(event) => setHtmlInput(event.target.value)}
      />
      <Button
        disabled={!editable}
        onClick={() => {
          if (!editor.isEditable()) return

          try {
            const document = parseTableExampleHTML(editor, htmlInput)
            editor.update(() => {
              const nodes = $generateNodesFromDOM(editor, document)
              $getRoot()
                .clear()
                .append(...nodes)
            })
            setError("")
          } catch {
            setError("Invalid table document.")
          }
        }}
      >
        Import table HTML
      </Button>
      {error ? <Text role="alert">{error}</Text> : null}
    </Wrap>
  )
}

export function EditorTableExamples() {
  const [editable, setEditable] = useState(true)
  const [rtl, setRtl] = useState(false)
  const [serialized, setSerialized] = useState("")
  const editor = useRef<LexicalEditor | null>(null)

  return (
    <Stack
      data-testid="table-example"
      dir={rtl ? "rtl" : "ltr"}
      xstyle={styles.root}
      onKeyDownCapture={(event) => {
        if (!event.altKey || !event.shiftKey) return

        if (event.code === "KeyR") {
          event.preventDefault()
          setEditable((value) => !value)
        }

        if (event.code === "KeyN" && editor.current) {
          event.preventDefault()
          const instance = editor.current
          instance.setEditorState(
            instance.parseEditorState(
              '{"root":{"type":"root","version":1,"children":[],"direction":null,"format":"","indent":0}}',
              () => {
                $getRoot().append(
                  $createParagraphNode().append(
                    $createTextNode("Replacement content"),
                  ),
                )
              },
            ),
          )
        }
      }}
    >
      <Wrap>
        <Button onClick={() => setEditable((value) => !value)}>
          {editable ? "Disable table editing" : "Enable table editing"}
        </Button>
        <Button onClick={() => setRtl((value) => !value)}>
          {rtl ? "Use LTR" : "Use RTL"}
        </Button>
      </Wrap>
      <EditorRoot
        ariaLabel="Table editor"
        extensions={tableExtensions}
        editable={editable}
        onChange={(state, instance) => {
          editor.current = instance
          setSerialized(JSON.stringify(state.toJSON(), null, 2))
        }}
      >
        <EditorToolbar aria-label="Table formatting">
          <EditorHistoryButton action="undo" />
          <EditorHistoryButton action="redo" />
          <EditorTableMenu />
          <EditorTableDimensions />
        </EditorToolbar>
        <EditorTableBackgroundControls />
        <EditorTableBorderControls />
        <EditorContent />
        <EditorTableResizeControls />
        <TableRoundTripControls />
      </EditorRoot>
      <Box render={<section />} aria-label="Serialized table state">
        <Box render={<pre />} tabIndex={0} xstyle={styles.output}>
          {serialized}
        </Box>
      </Box>
    </Stack>
  )
}

const styles = stylex.create({
  root: { maxInlineSize: "100%", minInlineSize: 0 },
  output: { maxInlineSize: "100%", overflow: "auto", maxBlockSize: "20rem" },
})
