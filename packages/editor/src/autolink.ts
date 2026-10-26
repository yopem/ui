import { $isCodeNode, CodeExtension } from "@lexical/code"
import {
  AutoLinkExtension,
  AutoLinkNode,
  autoLinkEmailMatcher,
  autoLinkUrlMatcher,
  $isAutoLinkNode,
} from "@lexical/link"
import {
  $isTextNode,
  configExtension,
  defineExtension,
  mergeRegister,
  TextNode,
} from "lexical"

export const EditorAutoLinkExtension = defineExtension({
  name: "@yopem-ui/editor/AutoLink",
  dependencies: [
    CodeExtension,
    configExtension(AutoLinkExtension, {
      matchers: [autoLinkUrlMatcher, autoLinkEmailMatcher],
      excludeParents: [$isCodeNode],
    }),
  ],
  register(editor) {
    return mergeRegister(
      editor.registerNodeTransform(AutoLinkNode, (node) => {
        if (
          !node.getIsUnlinked() &&
          node
            .getChildren()
            .some((child) => $isTextNode(child) && child.hasFormat("code"))
        )
          node.setIsUnlinked(true)
      }),
      editor.registerNodeTransform(TextNode, (node) => {
        const parent = node.getParent()

        if (
          $isAutoLinkNode(parent) &&
          !parent.getIsUnlinked() &&
          node.hasFormat("code")
        )
          parent.setIsUnlinked(true)
      }),
    )
  },
})
