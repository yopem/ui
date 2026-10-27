import { useStableCallback } from "@base-ui/utils/useStableCallback"
import { $generateHtmlFromNodes, $generateNodesFromDOM } from "@lexical/html"
import { Button } from "@registry/components/ui/button"
import {
  EditorContent,
  EditorRoot,
  EditorToolbar,
  useEditor,
} from "@yopem-ui/editor"
import {
  EditorListPresentationControls,
  EditorListPresentationExtension,
} from "@yopem-ui/editor/list-presentation"
import { $getRoot, HISTORY_PUSH_TAG } from "lexical"
import { useReducer, useState } from "react"
import { createRoot } from "react-dom/client"

const extensions = [EditorListPresentationExtension]

const initialState = JSON.stringify({
  root: {
    children: [
      {
        children: [
          {
            children: [
              {
                detail: 0,
                format: 0,
                mode: "normal",
                style: "",
                text: "Bullet one",
                type: "text",
                version: 1,
              },
            ],
            direction: null,
            format: "",
            indent: 0,
            type: "listitem",
            value: 1,
            version: 1,
          },
          {
            children: [
              {
                detail: 0,
                format: 0,
                mode: "normal",
                style: "",
                text: "Parent item",
                type: "text",
                version: 1,
              },
              {
                children: [
                  {
                    children: [
                      {
                        detail: 0,
                        format: 0,
                        mode: "normal",
                        style: "",
                        text: "Nested item",
                        type: "text",
                        version: 1,
                      },
                    ],
                    direction: null,
                    format: "",
                    indent: 0,
                    type: "listitem",
                    value: -2,
                    version: 1,
                  },
                ],
                direction: null,
                format: "",
                indent: 0,
                listType: "number",
                start: -2,
                tag: "ol",
                type: "list",
                version: 1,
              },
            ],
            direction: null,
            format: "",
            indent: 0,
            type: "listitem",
            value: 2,
            version: 1,
          },
        ],
        direction: null,
        format: "",
        indent: 0,
        listType: "bullet",
        start: 1,
        tag: "ul",
        type: "list",
        version: 1,
      },
      {
        children: [
          {
            checked: false,
            children: [
              {
                detail: 0,
                format: 0,
                mode: "normal",
                style: "",
                text: "Checklist item",
                type: "text",
                version: 1,
              },
            ],
            direction: null,
            format: "",
            indent: 0,
            type: "listitem",
            value: 1,
            version: 1,
          },
        ],
        direction: null,
        format: "",
        indent: 0,
        listType: "check",
        start: 1,
        tag: "ul",
        type: "list",
        version: 1,
      },
      {
        children: [
          {
            children: [
              {
                detail: 0,
                format: 0,
                mode: "normal",
                style: "",
                text: "Ordered item",
                type: "text",
                version: 1,
              },
            ],
            direction: null,
            format: "",
            indent: 0,
            type: "listitem",
            value: 3,
            version: 1,
          },
        ],
        direction: null,
        format: "",
        indent: 0,
        listType: "number",
        start: 3,
        tag: "ol",
        type: "list",
        version: 1,
      },
    ],
    direction: null,
    format: "",
    indent: 0,
    type: "root",
    version: 1,
  },
})

const replacementState = JSON.stringify({
  root: {
    children: [
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: "normal",
            style: "",
            text: "Replacement paragraph",
            type: "text",
            version: 1,
          },
        ],
        direction: null,
        format: "",
        indent: 0,
        type: "paragraph",
        version: 1,
      },
    ],
    direction: null,
    format: "",
    indent: 0,
    type: "root",
    version: 1,
  },
})

function EditorActions({ onToggleEditable }: { onToggleEditable: () => void }) {
  const editor = useEditor()
  const [json, setJson] = useState("")
  const [html, setHtml] = useState("")

  const roundtripJSON = useStableCallback(function roundtripJSON() {
    const value = JSON.stringify(editor.getEditorState().toJSON())
    setJson(value)
    editor.setEditorState(editor.parseEditorState(value))
  })

  const roundtripHTML = useStableCallback(function roundtripHTML() {
    const value = editor
      .getEditorState()
      .read(() => $generateHtmlFromNodes(editor), { editor })

    const document = new DOMParser().parseFromString(value, "text/html")
    setHtml(value)
    editor.update(
      () => {
        $getRoot()
          .clear()
          .append(...$generateNodesFromDOM(editor, document))
      },
      { tag: HISTORY_PUSH_TAG },
    )
  })

  const replaceDocument = useStableCallback(function replaceDocument() {
    editor.setEditorState(editor.parseEditorState(replacementState))
  })

  return (
    <div>
      <Button onClick={roundtripJSON}>Roundtrip JSON</Button>
      <Button onClick={roundtripHTML}>Roundtrip HTML</Button>
      <Button onClick={replaceDocument}>Replace document</Button>
      <Button onClick={onToggleEditable}>Toggle read-only</Button>
      <output data-testid="json-output">{json}</output>
      <output data-testid="html-output">{html}</output>
    </div>
  )
}

function Fixture() {
  const [editable, toggleEditable] = useReducer(
    (current: boolean) => !current,
    true,
  )

  return (
    <EditorRoot
      ariaLabel="List presentation editor"
      editable={editable}
      extensions={extensions}
      initialState={initialState}
    >
      <EditorContent aria-label="List presentation editor" />
      <EditorToolbar aria-label="List presentation controls">
        <EditorListPresentationControls />
      </EditorToolbar>
      <EditorActions onToggleEditable={toggleEditable} />
    </EditorRoot>
  )
}

const target = document.getElementById("root")

if (!target) throw new Error("Missing list presentation fixture root")

createRoot(target).render(<Fixture />)
