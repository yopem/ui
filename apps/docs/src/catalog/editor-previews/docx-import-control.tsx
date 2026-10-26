import { EditorDocxImportControl } from "@yopem-ui/editor/docx/client"

import { PublicDocxExample } from "@/catalog/editor-examples/public-docx"

export function Preview() {
  return (
    <PublicDocxExample>
      <EditorDocxImportControl />
    </PublicDocxExample>
  )
}
