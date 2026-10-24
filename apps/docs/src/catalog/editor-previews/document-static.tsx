import { DocumentStatic } from "@yopem-ui/editor/document/static"

const html =
  '<section data-editor-toggle><div data-editor-toggle-summary><strong>Document <a href="https://example.com/">Reference</a></strong></div><details data-editor-toggle-body><summary data-editor-toggle-control contenteditable="false" aria-label="Document Reference"></summary><div data-editor-toggle-content><p>Document body</p></div></details></section>'

export function Preview() {
  return <DocumentStatic html={html} />
}
