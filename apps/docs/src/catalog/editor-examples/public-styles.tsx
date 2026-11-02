"use client"

import type { MouseEvent } from "react"

import { useStableCallback } from "@base-ui/utils/useStableCallback"
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
import {
  AlignCenterIcon,
  AlignJustifyIcon,
  AlignLeftIcon,
  AlignRightIcon,
  BoldIcon,
  IndentDecreaseIcon,
  IndentIncreaseIcon,
  Redo2Icon,
  Undo2Icon,
} from "lucide-react"
import { useState } from "react"

const extensions = [EditorBlockPresentationExtension]

function preventToolbarMouseDown(event: MouseEvent<HTMLButtonElement>) {
  event.preventDefault()
}

function PublicStylesRoundtrip() {
  const editor = useEditor()
  const [savedJSON, setSavedJSON] = useState("")
  const [savedHTML, setSavedHTML] = useState("")

  const saveJSON = useStableCallback(function saveJSON() {
    setSavedJSON(JSON.stringify(editor.getEditorState().toJSON()))
  })

  const loadJSON = useStableCallback(function loadJSON() {
    if (!savedJSON) return
    editor.setEditorState(editor.parseEditorState(savedJSON), {
      tag: HISTORY_PUSH_TAG,
    })
    editor.focus()
  })

  const saveHTML = useStableCallback(function saveHTML() {
    setSavedHTML(
      editor.getEditorState().read(() => $generateHtmlFromNodes(editor)),
    )
  })

  const loadHTML = useStableCallback(function loadHTML() {
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
  })

  return (
    <Wrap>
      <Button onMouseDown={preventToolbarMouseDown} onClick={saveJSON}>
        Save styled JSON
      </Button>
      <Button
        disabled={!savedJSON}
        onMouseDown={preventToolbarMouseDown}
        onClick={loadJSON}
      >
        Load styled JSON
      </Button>
      <Button onMouseDown={preventToolbarMouseDown} onClick={saveHTML}>
        Save styled HTML
      </Button>
      <Button
        disabled={!savedHTML}
        onMouseDown={preventToolbarMouseDown}
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
        <EditorAlignmentButton
          alignment="left"
          aria-label="Align left"
          title="Align left"
          render={<Button variant="ghost" size="icon-sm" />}
        >
          <AlignLeftIcon aria-hidden="true" size={16} />
        </EditorAlignmentButton>
        <EditorAlignmentButton
          alignment="center"
          aria-label="Align center"
          title="Align center"
          render={<Button variant="ghost" size="icon-sm" />}
        >
          <AlignCenterIcon aria-hidden="true" size={16} />
        </EditorAlignmentButton>
        <EditorAlignmentButton
          alignment="right"
          aria-label="Align right"
          title="Align right"
          render={<Button variant="ghost" size="icon-sm" />}
        >
          <AlignRightIcon aria-hidden="true" size={16} />
        </EditorAlignmentButton>
        <EditorAlignmentButton
          alignment="justify"
          aria-label="Align justify"
          title="Align justify"
          render={<Button variant="ghost" size="icon-sm" />}
        >
          <AlignJustifyIcon aria-hidden="true" size={16} />
        </EditorAlignmentButton>
        <EditorIndentButton
          direction="indent"
          aria-label="Indent"
          title="Indent"
          render={<Button variant="ghost" size="icon-sm" />}
        >
          <IndentIncreaseIcon aria-hidden="true" size={16} />
        </EditorIndentButton>
        <EditorIndentButton
          direction="outdent"
          aria-label="Outdent"
          title="Outdent"
          render={<Button variant="ghost" size="icon-sm" />}
        >
          <IndentDecreaseIcon aria-hidden="true" size={16} />
        </EditorIndentButton>
        <EditorFontColorControl />
        <EditorBackgroundColorControl />
        <EditorLineHeightControl />
        <EditorFormatButton
          format="bold"
          title="Bold"
          render={<Button variant="ghost" size="icon-sm" />}
        >
          <BoldIcon aria-hidden="true" size={16} />
        </EditorFormatButton>
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
      <EditorContent placeholder="Write text and select a block or range…" />
      <PublicStylesRoundtrip />
    </EditorRoot>
  )
}
