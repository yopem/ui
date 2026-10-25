"use client"

import { $generateHtmlFromNodes, $generateNodesFromDOM } from "@lexical/html"
import { Button } from "@registry/components/ui/button"
import { Wrap } from "@registry/components/ui/wrap"
import {
  EditorAlignmentButton,
  EditorBackgroundColorControl,
  EditorBlockPresentationExtension,
  EditorContent,
  EditorFontColorControl,
  EditorFormatButton,
  EditorHistoryButton,
  EditorIndentButton,
  EditorLineHeightControl,
  EditorRoot,
  EditorToolbar,
  useEditor,
} from "@yopem-ui/editor"
import { $getRoot, HISTORY_PUSH_TAG } from "lexical"
import { useState } from "react"

const extensions = [EditorBlockPresentationExtension]

function PublicStylesRoundtrip() {
  const editor = useEditor()
  const [savedJSON, setSavedJSON] = useState("")
  const [savedHTML, setSavedHTML] = useState("")

  function saveJSON() {
    setSavedJSON(JSON.stringify(editor.getEditorState().toJSON()))
  }

  function loadJSON() {
    if (!savedJSON) return
    editor.setEditorState(editor.parseEditorState(savedJSON), {
      tag: HISTORY_PUSH_TAG,
    })
    editor.focus()
  }

  function saveHTML() {
    setSavedHTML(
      editor.getEditorState().read(() => $generateHtmlFromNodes(editor)),
    )
  }

  function loadHTML() {
    if (!savedHTML) return
    const view = editor.getRootElement()?.ownerDocument.defaultView

    if (!view) return

    const document = new view.DOMParser().parseFromString(
      savedHTML,
      "text/html",
    )

    editor.update(
      () => {
        const nodes = $generateNodesFromDOM(editor, document)
        $getRoot()
          .clear()
          .append(...nodes)
      },
      { tag: HISTORY_PUSH_TAG },
    )
    editor.focus()
  }

  return (
    <Wrap>
      <Button
        onMouseDown={(event) => event.preventDefault()}
        onClick={saveJSON}
      >
        Save styled JSON
      </Button>
      <Button
        disabled={!savedJSON}
        onMouseDown={(event) => event.preventDefault()}
        onClick={loadJSON}
      >
        Load styled JSON
      </Button>
      <Button
        onMouseDown={(event) => event.preventDefault()}
        onClick={saveHTML}
      >
        Save styled HTML
      </Button>
      <Button
        disabled={!savedHTML}
        onMouseDown={(event) => event.preventDefault()}
        onClick={loadHTML}
      >
        Load styled HTML
      </Button>
    </Wrap>
  )
}

export function PublicStylesExample() {
  return (
    <EditorRoot ariaLabel="Public styles editor" extensions={extensions}>
      <EditorToolbar aria-label="Public styles">
        <EditorAlignmentButton alignment="left" />
        <EditorAlignmentButton alignment="center" />
        <EditorAlignmentButton alignment="right" />
        <EditorAlignmentButton alignment="justify" />
        <EditorIndentButton direction="indent" />
        <EditorIndentButton direction="outdent" />
        <EditorFontColorControl />
        <EditorBackgroundColorControl />
        <EditorLineHeightControl />
        <EditorFormatButton format="bold" />
        <EditorHistoryButton action="undo" />
        <EditorHistoryButton action="redo" />
      </EditorToolbar>
      <EditorContent placeholder="Write text and select a block or range…" />
      <PublicStylesRoundtrip />
    </EditorRoot>
  )
}
