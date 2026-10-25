import {
  EditorDiagramDownloadButton,
  EditorDiagramToolbar,
} from "@yopem-ui/editor/diagram"

import { DiagramExample } from "@/catalog/editor-preview-compositions/diagram"

export function Preview() {
  return (
    <DiagramExample ariaLabel="EditorDiagramDownloadButton">
      <EditorDiagramToolbar>
        <EditorDiagramDownloadButton />
      </EditorDiagramToolbar>
    </DiagramExample>
  )
}
