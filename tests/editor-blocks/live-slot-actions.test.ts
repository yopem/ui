import {
  $createCalloutNode,
  $createToggleNode,
  $unwrapEditorBlock,
  CalloutNode,
  ToggleBodyNode,
  ToggleNode,
  ToggleSummaryNode,
} from "@editor/blocks-model"
import { expect, test } from "bun:test"
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $getSelection,
  $isRangeSelection,
  $setSlot,
  createEditor,
} from "lexical"

function editor() {
  return createEditor({
    nodes: [CalloutNode, ToggleNode, ToggleSummaryNode, ToggleBodyNode],
    onError(error) {
      throw error
    },
  })
}

test("unwrap refuses slot owners and direct slot values without changing content or selection", () => {
  for (const location of ["host", "summary", "body", "direct"] as const) {
    const instance = editor()
    instance.update(
      () => {
        const block =
          location === "host" || location === "direct"
            ? $createCalloutNode().append(
                $createParagraphNode().append($createTextNode("keep")),
              )
            : $createToggleNode()

        if (block instanceof ToggleNode) {
          block.getSummary().append($createTextNode("title"))
          block
            .getBody()
            .append($createParagraphNode().append($createTextNode("body")))
        }

        if (location === "direct") {
          $getRoot().append($createParagraphNode())
          $setSlot($getRoot(), "block", block)
        } else {
          $getRoot().append(block)

          const host =
            block instanceof ToggleNode
              ? location === "summary"
                ? block.getSummary()
                : block.getBody()
              : block

          $setSlot(
            host,
            "note",
            $createParagraphNode().append($createTextNode("slot")),
          )
        }

        block.selectStart()

        const before = JSON.stringify($getRoot().getTextContent())
        const selection = $getSelection()

        const anchor = $isRangeSelection(selection)
          ? [selection.anchor.key, selection.anchor.offset]
          : null

        expect($unwrapEditorBlock(block)).toBe(false)
        expect(JSON.stringify($getRoot().getTextContent())).toBe(before)

        const after = $getSelection()
        expect(
          $isRangeSelection(after)
            ? [after.anchor.key, after.anchor.offset]
            : null,
        ).toEqual(anchor)
      },
      { discrete: true },
    )
  }
})
