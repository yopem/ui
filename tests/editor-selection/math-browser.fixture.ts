import { EditorMathExtension } from "@editor/math-extension"
import { $createEditorMathNode } from "@editor/math-node"
import { buildEditorFromExtensions } from "@lexical/extension"
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  defineExtension,
} from "lexical"

const editor = buildEditorFromExtensions(
  defineExtension({
    name: "math-browser",
    namespace: "math-browser",
    dependencies: [EditorMathExtension],
    onError(error) {
      throw error
    },
  }),
)

const root = document.getElementById("editor")

if (!root) throw new Error("Missing editor root")

editor.setRootElement(root)

document
  .getElementById("readonly")
  ?.addEventListener("click", () => editor.setEditable(false))

document
  .getElementById("editable")
  ?.addEventListener("click", () => editor.setEditable(true))

editor.update(
  () => {
    $getRoot().append(
      $createParagraphNode().append(
        $createTextNode("Before "),
        $createEditorMathNode({ kind: "inline", tex: "x^2" }),
        $createTextNode(" after"),
      ),
      $createEditorMathNode({ kind: "block", tex: "\\frac{1}{2}" }),
      $createEditorMathNode({ kind: "block", tex: "\\frac{" }),
    )
  },
  { discrete: true },
)
