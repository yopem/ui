import {
  EditorDiagramViewModeSelect,
  EditorDiagramToolbar,
} from "@yopem-ui/editor/diagram"

import { DiagramExample } from "@/catalog/editor-preview-compositions/diagram"

export function Preview() {
  return (
    <DiagramExample ariaLabel="EditorDiagramViewModeSelect">
      <EditorDiagramToolbar>
        <EditorDiagramViewModeSelect />
      </EditorDiagramToolbar>
    </DiagramExample>
  )
}
