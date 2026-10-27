"use client"

import { useStableCallback } from "@base-ui/utils/useStableCallback"
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
import { useReducer, useRef, useState, type ComponentProps } from "react"

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

  const registerTableError = useStableCallback(function registerTableError(
    element: HTMLDivElement | null,
  ) {
    if (!element) return

    return editor.registerCommand(
      TABLE_PRESENTATION_ERROR_COMMAND,
      (failure) => {
        setError(failure.message)

        return true
      },
      COMMAND_PRIORITY_HIGH,
    )
  })

  const handleReloadJson = useStableCallback(function handleReloadJson() {
    if (!editor.isEditable()) return
    const serialized = JSON.stringify(editor.getEditorState().toJSON())
    editor.setEditorState(
      editor.parseEditorState(parseTablePresentationJSON(serialized)),
    )
  })

  const handleReloadHtml = useStableCallback(function handleReloadHtml() {
    if (!editor.isEditable()) return

    const html = editor
      .getEditorState()
      .read(() => $generateHtmlFromNodes(editor))

    const Parser = editor.getRootElement()?.ownerDocument.defaultView?.DOMParser

    if (!Parser) return
    const document = new Parser().parseFromString(html, "text/html")
    validateTablePresentationHTML(document)
    editor.update(() => {
      const nodes = $generateNodesFromDOM(editor, document)
      $getRoot()
        .clear()
        .append(...nodes)
    })
  })

  const handleJsonChange = useStableCallback(function handleJsonChange(
    event: Parameters<
      NonNullable<ComponentProps<typeof Textarea>["onChange"]>
    >[0],
  ) {
    setJson(event.target.value)
  })

  const handleImportJson = useStableCallback(function handleImportJson() {
    if (!editor.isEditable()) return

    try {
      const input = parseTablePresentationJSON(json)
      editor.setEditorState(editor.parseEditorState(input))
      setError("")
    } catch {
      setError("Invalid table document.")
    }
  })

  const handleHtmlChange = useStableCallback(function handleHtmlChange(
    event: Parameters<
      NonNullable<ComponentProps<typeof Textarea>["onChange"]>
    >[0],
  ) {
    setHtmlInput(event.target.value)
  })

  const handleImportHtml = useStableCallback(function handleImportHtml() {
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
  })

  return (
    <Wrap ref={registerTableError}>
      <Button disabled={!editable} onClick={handleReloadJson}>
        Reload table JSON
      </Button>
      <Button disabled={!editable} onClick={handleReloadHtml}>
        Reload table HTML
      </Button>
      <Textarea
        aria-label="Table JSON input"
        value={json}
        disabled={!editable}
        onChange={handleJsonChange}
      />
      <Button disabled={!editable} onClick={handleImportJson}>
        Import table JSON
      </Button>
      <Textarea
        aria-label="Table HTML input"
        value={htmlInput}
        disabled={!editable}
        onChange={handleHtmlChange}
      />
      <Button disabled={!editable} onClick={handleImportHtml}>
        Import table HTML
      </Button>
      {error ? <Text role="alert">{error}</Text> : null}
    </Wrap>
  )
}

export function EditorTableExamples() {
  const [editable, toggleEditable] = useReducer(
    (current: boolean) => !current,
    true,
  )

  const [rtl, toggleRtl] = useReducer((current: boolean) => !current, false)
  const [serialized, setSerialized] = useState("")
  const editor = useRef<LexicalEditor | null>(null)

  const handleKeyDownCapture = useStableCallback(function handleKeyDownCapture(
    event: Parameters<
      NonNullable<ComponentProps<typeof Stack>["onKeyDownCapture"]>
    >[0],
  ) {
    if (!event.altKey || !event.shiftKey) return

    if (event.code === "KeyR") {
      event.preventDefault()
      toggleEditable()
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
  })

  const handleEditorChange = useStableCallback(function handleEditorChange(
    state: Parameters<
      NonNullable<ComponentProps<typeof EditorRoot>["onChange"]>
    >[0],
    instance: Parameters<
      NonNullable<ComponentProps<typeof EditorRoot>["onChange"]>
    >[1],
  ) {
    editor.current = instance
    setSerialized(JSON.stringify(state.toJSON(), null, 2))
  })

  return (
    <Stack
      data-testid="table-example"
      dir={rtl ? "rtl" : "ltr"}
      xstyle={styles.root}
      onKeyDownCapture={handleKeyDownCapture}
    >
      <Wrap>
        <Button onClick={toggleEditable}>
          {editable ? "Disable table editing" : "Enable table editing"}
        </Button>
        <Button onClick={toggleRtl}>{rtl ? "Use LTR" : "Use RTL"}</Button>
      </Wrap>
      <EditorRoot
        ariaLabel="Table editor"
        extensions={tableExtensions}
        editable={editable}
        onChange={handleEditorChange}
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
