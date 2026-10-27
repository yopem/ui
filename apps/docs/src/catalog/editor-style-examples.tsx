"use client"

import { useStableCallback } from "@base-ui/utils/useStableCallback"
import { $generateHtmlFromNodes, $generateNodesFromDOM } from "@lexical/html"
import { Box } from "@registry/components/ui/box"
import { Button } from "@registry/components/ui/button"
import { Input } from "@registry/components/ui/input"
import { Stack } from "@registry/components/ui/stack"
import { Text } from "@registry/components/ui/text"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"
import {
  EditorTableButton,
  EditorListButton,
  EditorLinkControl,
  EditorFormatButton,
  EditorHistoryButton,
  EditorIndentButton,
  EditorRoot,
  EditorToolbar,
} from "@yopem-ui/editor"
import {
  EditorContent,
  EditorTablePresentationExtension,
  parseTablePresentationJSON,
  validateTablePresentationHTML,
} from "@yopem-ui/editor"
import {
  EditorAlignmentButton,
  EditorBackgroundColorControl,
  EditorBlockPresentationExtension,
  useEditor,
  useEditorState,
  EditorClearFormattingButton,
  EditorFirstLineIndentControl,
  EditorFontColorControl,
  EditorFontFamilyControl,
  EditorFontSizeControl,
  EditorFontWeightControl,
  EditorLineHeightControl,
} from "@yopem-ui/editor"
import { $getRoot } from "lexical"
import { useState, type ComponentProps } from "react"

const extensions = [
  EditorBlockPresentationExtension,
  EditorTablePresentationExtension,
]

export function EditorStyleExample() {
  const [editable, setEditable] = useState(true)
  const [serialized, setSerialized] = useState("")

  const handleToggleEditable = useStableCallback(
    function handleToggleEditable() {
      setEditable((current) => !current)
    },
  )

  const handleEditorChange = useStableCallback(function handleEditorChange(
    state: Parameters<
      NonNullable<ComponentProps<typeof EditorRoot>["onChange"]>
    >[0],
  ) {
    setSerialized(JSON.stringify(state.toJSON()))
  })

  return (
    <Box render={<section />} aria-label="Text style examples">
      <Stack>
        <Button onClick={handleToggleEditable}>
          {editable
            ? "Make styled editor readonly"
            : "Make styled editor editable"}
        </Button>
        <EditorRoot
          extensions={extensions}
          ariaLabel="Styled editor"
          editable={editable}
          onChange={handleEditorChange}
        >
          <EditorToolbar aria-label="Text styles">
            <EditorFormatButton format="bold" />
            <EditorLinkControl />
            <EditorListButton listType="bullet" />
            <EditorTableButton />
            <EditorFontColorControl />
            <EditorBackgroundColorControl />
            <EditorFontFamilyControl />
            <EditorFontSizeControl />
            <EditorFontWeightControl />
            <EditorLineHeightControl />
            <EditorFirstLineIndentControl />
            <EditorAlignmentButton alignment="start" />
            <EditorAlignmentButton alignment="center" />
            <EditorAlignmentButton alignment="end" />
            <EditorAlignmentButton alignment="justify" />
            <EditorIndentButton direction="indent" />
            <EditorIndentButton direction="outdent" />
            <EditorClearFormattingButton />
            <EditorHistoryButton action="undo" />
            <EditorHistoryButton action="redo" />
          </EditorToolbar>
          <EditorContent />
          <EditorStyleInterop />
        </EditorRoot>
        <Box render={<section />} aria-label="Styled editor JSON">
          <Box render={<pre />} tabIndex={0} xstyle={styles.output}>
            {serialized}
          </Box>
        </Box>
      </Stack>
    </Box>
  )
}

function EditorStyleInterop() {
  const editor = useEditor()
  const { editable } = useEditorState()
  const [json, setJSON] = useState("")
  const [html, setHTML] = useState("")
  const [error, setError] = useState("")

  const loadJSON = useStableCallback(function loadJSON() {
    try {
      parseTablePresentationJSON(json)
      editor.setEditorState(editor.parseEditorState(json))
      setError("")
    } catch {
      setError("Cannot load this JSON document.")
    }
  })

  const loadHTML = useStableCallback(function loadHTML() {
    const view = editor.getRootElement()?.ownerDocument.defaultView

    if (!view) return

    try {
      const document = new view.DOMParser().parseFromString(html, "text/html")
      validateTablePresentationHTML(document)
      editor.update(() => {
        const nodes = $generateNodesFromDOM(editor, document)
        $getRoot()
          .clear()
          .append(...nodes)
      })
      setError("")
    } catch {
      setError("Cannot load this HTML document.")
    }
  })

  const handleSaveJson = useStableCallback(function handleSaveJson() {
    setJSON(JSON.stringify(editor.getEditorState().toJSON()))
  })

  const handleSaveHtml = useStableCallback(function handleSaveHtml() {
    editor
      .getEditorState()
      .read(() => setHTML($generateHtmlFromNodes(editor, null)))
  })

  const handleHtmlChange = useStableCallback(function handleHtmlChange(
    event: Parameters<NonNullable<ComponentProps<typeof Input>["onChange"]>>[0],
  ) {
    setHTML(event.target.value)
  })

  return (
    <Stack>
      <Button onClick={handleSaveJson}>Save styled JSON</Button>
      <Button disabled={!editable || !json} onClick={loadJSON}>
        Load styled JSON
      </Button>
      <Button onClick={handleSaveHtml}>Save styled HTML</Button>
      <Input
        aria-label="Styled HTML"
        value={html}
        onChange={handleHtmlChange}
      />
      <Button disabled={!editable || !html} onClick={loadHTML}>
        Load styled HTML
      </Button>
      {error ? <Text role="alert">{error}</Text> : null}
    </Stack>
  )
}

const styles = stylex.create({
  output: {
    backgroundColor: tokens["--code"],
    color: tokens["--code-foreground"],
    borderColor: tokens["--border"],
    borderStyle: "solid",
    borderWidth: 1,
    borderRadius: tokens["--radius-md"],
    fontFamily: tokens["--font-mono"],
    fontSize: "0.8125rem",
    lineHeight: 1.75,
    marginBlock: 0,
    maxBlockSize: "24rem",
    overflow: "auto",
    padding: `calc(${tokens["--spacing"]} * 4)`,
  },
})
