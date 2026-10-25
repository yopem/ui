import { $isHeadingNode } from "@lexical/rich-text"
import { $findMatchingParent } from "@lexical/utils"
import {
  $createParagraphNode,
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_LOW,
  defineExtension,
  INSERT_PARAGRAPH_COMMAND,
} from "lexical"

export const EditorBlockBehaviorExtension = defineExtension({
  name: "@yopem-ui/editor/block-behavior",
  register(editor) {
    return editor.registerCommand(
      INSERT_PARAGRAPH_COMMAND,
      () => {
        const selection = $getSelection()

        if (
          !editor.isEditable() ||
          editor.isComposing() ||
          !$isRangeSelection(selection) ||
          !selection.isCollapsed()
        )
          return false

        const heading = $findMatchingParent(
          selection.anchor.getNode(),
          $isHeadingNode,
        )

        if (!heading) return false
        const previous = heading.exportJSON()
        const next = selection.insertParagraph()

        if ($isHeadingNode(next)) {
          const paragraph = $createParagraphNode().updateFromJSON({
            ...next.exportJSON(),
            $: { ...previous.$, ...next.exportJSON().$ },
            textFormat: next.getTextFormat(),
            textStyle: next.getTextStyle(),
          })

          next.replace(paragraph, true)
        }

        return true
      },
      COMMAND_PRIORITY_LOW,
    )
  },
})
