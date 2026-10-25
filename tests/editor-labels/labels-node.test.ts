import type { SerializedEditorLabelNode } from "@editor/labels-node"

import { EditorLabelNode } from "@editor/labels-node"
import { describe, expect, test } from "bun:test"
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  createEditor,
} from "lexical"

function labelJSON(text = "Editor"): SerializedEditorLabelNode {
  return {
    type: "editor-label",
    version: 1,
    label: text,
    text,
    format: 0,
    detail: 0,
    mode: "token",
    style: "",
  }
}

describe("native label JSON admission", () => {
  for (const value of [
    labelJSON(""),
    labelJSON("x".repeat(129)),
    { ...labelJSON(), label: "Different" },
  ]) {
    test("rejects malformed token metadata without creating an empty replacement", () => {
      const editor = createEditor({
        nodes: [EditorLabelNode],
        onError(cause) {
          throw cause
        },
      })

      editor.update(
        () => {
          $getRoot().append(
            $createParagraphNode().append(
              $createTextNode("Keep selected content"),
            ),
          )
          expect(() => EditorLabelNode.importJSON(value)).toThrow()
          expect($getRoot().getTextContent()).toBe("Keep selected content")
        },
        { discrete: true },
      )
    })
  }

  test("a pure headless reader retains native valid token fields without a UI theme", () => {
    const editor = createEditor({
      nodes: [EditorLabelNode],
      onError(cause) {
        throw cause
      },
    })

    editor.update(
      () => {
        const node = EditorLabelNode.importJSON(labelJSON())
        $getRoot().append($createParagraphNode().append(node))
        expect(node.exportJSON()).toEqual(labelJSON())
      },
      { discrete: true },
    )
  })
})
