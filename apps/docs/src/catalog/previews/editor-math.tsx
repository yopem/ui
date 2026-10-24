import { EditorContent, EditorRoot, EditorToolbar } from "@yopem-ui/editor"
import { EditorMathControls, EditorMathExtension } from "@yopem-ui/editor/math"

const extensions = [EditorMathExtension]

const initialState = JSON.stringify({
  root: {
    type: "root",
    version: 1,
    direction: null,
    format: "",
    indent: 0,
    children: [
      {
        type: "paragraph",
        version: 1,
        direction: null,
        format: "",
        indent: 0,
        children: [
          {
            type: "text",
            version: 1,
            text: "Energy: ",
            detail: 0,
            format: 0,
            mode: "normal",
            style: "",
          },
          { type: "editor-math", version: 1, kind: "inline", tex: "E=mc^2" },
        ],
      },
      {
        type: "editor-math",
        version: 1,
        kind: "block",
        tex: "\\int_0^1 x^2\\,dx = \\frac{1}{3}",
      },
      {
        type: "paragraph",
        version: 1,
        direction: null,
        format: "",
        indent: 0,
        children: [],
      },
    ],
  },
})

export function Preview() {
  return (
    <EditorRoot
      extensions={extensions}
      initialState={initialState}
      ariaLabel="Math editor"
    >
      <EditorToolbar aria-label="Equation controls">
        <EditorMathControls />
      </EditorToolbar>
      <EditorContent placeholder="Enter text, then insert an equation" />
    </EditorRoot>
  )
}
