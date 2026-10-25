import { EditorDocxExportControl } from "@yopem-ui/editor/docx/client"

import { PublicDocxExample } from "@/catalog/editor-examples/public-docx"

export function EditorPartPreview() {
  return (
    <PublicDocxExample>
      <EditorDocxExportControl />
    </PublicDocxExample>
  )
}
