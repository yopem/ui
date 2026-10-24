"use client"

import { $generateHtmlFromNodes, $generateNodesFromDOM } from "@lexical/html"
import { Box } from "@registry/components/ui/box"
import { Button } from "@registry/components/ui/button"
import { Codeblock } from "@registry/components/ui/codeblock"
import { Stack } from "@registry/components/ui/stack"
import { Text } from "@registry/components/ui/text"
import { Wrap } from "@registry/components/ui/wrap"
import {
  EditorContent,
  EditorRoot,
  EditorToolbar,
  useEditor,
} from "@yopem-ui/editor"
import {
  EditorBlocksControls,
  EditorBlocksExtension,
  validateEditorBlocksHTML,
  validateEditorBlocksJSON,
} from "@yopem-ui/editor/blocks"
import { $createParagraphNode, $createTextNode, $getRoot } from "lexical"
import { useState } from "react"

const extensions = [EditorBlocksExtension]

export function EditorBlocksExample() {
  const [editable, setEditable] = useState(true)
  const [json, setJSON] = useState("")

  return (
    <Stack data-testid="blocks-example">
      <Button
        onClick={() => {
          setEditable(!editable)
        }}
      >
        {editable ? "Read only blocks" : "Edit blocks"}
      </Button>
      <EditorRoot
        extensions={extensions}
        ariaLabel="Blocks editor"
        editable={editable}
        onChange={(state) => {
          setJSON(JSON.stringify(state.toJSON()))
        }}
      >
        <EditorToolbar aria-label="Blocks">
          <EditorBlocksControls />
        </EditorToolbar>
        <EditorContent placeholder="Enter block content" />
        <EditorBlocksInterop />
      </EditorRoot>
      <Box render={<section />} aria-label="Blocks JSON">
        <Codeblock>{json}</Codeblock>
      </Box>
    </Stack>
  )
}

function EditorBlocksInterop() {
  const editor = useEditor()
  const [error, setError] = useState("")

  return (
    <Stack>
      <Wrap>
        <Button
          onClick={() => {
            const json = editor.getEditorState().toJSON()

            try {
              validateEditorBlocksJSON(json)
              editor.setEditorState(
                editor.parseEditorState(JSON.stringify(json)),
              )
              setError("")
            } catch {
              setError("Cannot load block JSON.")
            }
          }}
        >
          Roundtrip blocks JSON
        </Button>
        <Button
          onClick={() => {
            try {
              const html = editor
                .getEditorState()
                .read(() => $generateHtmlFromNodes(editor))

              const view = editor.getRootElement()?.ownerDocument.defaultView

              if (!view) return

              const document = new view.DOMParser().parseFromString(
                html,
                "text/html",
              )

              validateEditorBlocksHTML(document)
              editor.update(() => {
                const nodes = $generateNodesFromDOM(editor, document)
                $getRoot()
                  .clear()
                  .append(...nodes)
              })
              setError("")
            } catch {
              setError("Cannot load block HTML.")
            }
          }}
        >
          Roundtrip blocks HTML
        </Button>
        <Button
          onClick={() => {
            editor.update(() => {
              $getRoot()
                .clear()
                .append(
                  $createParagraphNode().append(
                    $createTextNode("Host replacement"),
                  ),
                )
            })
          }}
        >
          Replace blocks document
        </Button>
      </Wrap>
      {error ? <Text role="alert">{error}</Text> : null}
    </Stack>
  )
}
