import { EditorContent, EditorRoot } from "@yopem-ui/editor"
import { EditorDocxControls } from "@yopem-ui/editor/docx/client"
import { createRoot } from "react-dom/client"

const target = document.getElementById("root")

if (!target) throw new Error("Missing DOCX fixture root")

const initialState = JSON.stringify({
  root: {
    children: [
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: "normal",
            style: "",
            text: "Original content",
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

createRoot(target).render(
  <EditorRoot ariaLabel="DOCX test editor" initialState={initialState}>
    <EditorContent aria-label="DOCX editor" />
    <EditorDocxControls />
  </EditorRoot>,
)
