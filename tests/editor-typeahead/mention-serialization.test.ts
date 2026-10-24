import { $createMentionNode, MentionNode } from "@editor/mention-node"
import { expect, test } from "bun:test"
import {
  $createParagraphNode,
  $getRoot,
  $getState,
  $setState,
  createEditor,
  createState,
} from "lexical"

const state = createState("hostMentionMetadata", { parse: String })

test("mention JSON preserves native formatting and unrelated host NodeState", () => {
  const editor = createEditor({
    nodes: [MentionNode],
    onError(error) {
      throw error
    },
  })

  editor.update(
    () => {
      const node = $createMentionNode({ id: "ada", label: "Ada" }).setFormat(
        "bold",
      )

      $setState(node, state, "host-value")
      $getRoot().append($createParagraphNode().append(node))
    },
    { discrete: true },
  )
  const json = editor.getEditorState().toJSON()
  const restored = editor.parseEditorState(JSON.stringify(json))
  expect(restored.toJSON()).toEqual(json)
  restored.read(() => {
    const node = $getRoot().getFirstDescendant()
    expect(node).toBeInstanceOf(MentionNode)

    if (node instanceof MentionNode) {
      expect(node.hasFormat("bold")).toBe(true)
      expect($getState(node, state)).toBe("host-value")
    }
  })
})
