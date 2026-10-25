import {
  EditorDiagramToolbar,
  EditorDiagramInsertButton,
  EditorDiagramKindSelect,
} from "@yopem-ui/editor/diagram"

import { DiagramExample } from "@/catalog/editor-preview-compositions/diagram"

export function Preview() {
  return (
    <DiagramExample ariaLabel="EditorDiagramToolbar">
      <EditorDiagramToolbar>
        <EditorDiagramInsertButton />
        <EditorDiagramKindSelect />
      </EditorDiagramToolbar>
    </DiagramExample>
  )
}
