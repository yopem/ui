"use client"

import type { ReactNode } from "react"

import { Stack } from "@registry/components/ui/stack"
import { Text } from "@registry/components/ui/text"
import { EditorContent, EditorRoot } from "@yopem-ui/editor"
import {
  EditorDiagramDeleteButton,
  EditorDiagramDownloadButton,
  EditorDiagramExtension,
  EditorDiagramInsertButton,
  EditorDiagramKindSelect,
  EditorDiagramPreview,
  EditorDiagramRenderButton,
  EditorDiagramRoot,
  EditorDiagramStatus,
  EditorDiagramToolbar,
  EditorDiagramViewModeSelect,
} from "@yopem-ui/editor/diagram"

const extensions = [EditorDiagramExtension]

const initialState = JSON.stringify({
  root: {
    type: "root",
    version: 1,
    direction: null,
    format: "",
    indent: 0,
    children: [
      {
        type: "code",
        version: 1,
        direction: null,
        format: "",
        indent: 0,
        language: "mermaid",
        $: { editorDiagram: { version: 1, kind: "mermaid", viewMode: "both" } },
        children: [
          {
            type: "text",
            version: 1,
            detail: 0,
            format: 0,
            mode: "normal",
            style: "",
            text: "flowchart LR\nStart --> Finish",
          },
        ],
      },
    ],
  },
})

export function DiagramExample({
  ariaLabel = "Diagram editor",
  children,
}: {
  ariaLabel?: string
  children?: ReactNode
}) {
  return (
    <Stack>
      <Text>
        Select the code to use diagram controls. Configure a host renderer
        before rendering or downloading SVG.
      </Text>
      <EditorRoot
        ariaLabel={ariaLabel}
        extensions={extensions}
        initialState={initialState}
      >
        <EditorDiagramRoot autoRender={false}>
          <Stack>
            {children ?? (
              <EditorDiagramToolbar>
                <EditorDiagramInsertButton />
                <EditorDiagramKindSelect />
                <EditorDiagramViewModeSelect />
                <EditorDiagramRenderButton />
                <EditorDiagramDownloadButton />
                <EditorDiagramDownloadButton format="png" />
                <EditorDiagramDeleteButton />
              </EditorDiagramToolbar>
            )}
            <EditorContent />
            <EditorDiagramStatus />
            <EditorDiagramPreview />
          </Stack>
        </EditorDiagramRoot>
      </EditorRoot>
    </Stack>
  )
}
