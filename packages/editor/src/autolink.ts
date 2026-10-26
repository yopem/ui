import { $isCodeNode, CodeExtension } from "@lexical/code"
import {
  AutoLinkExtension,
  AutoLinkNode,
  autoLinkEmailMatcher,
  autoLinkUrlMatcher,
} from "@lexical/link"
import { $isTextNode, configExtension, defineExtension } from "lexical"

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
    return editor.registerNodeTransform(AutoLinkNode, (node) => {
      if (
        !node.getIsUnlinked() &&
        node
          .getChildren()
          .some((child) => $isTextNode(child) && child.hasFormat("code"))
      )
        node.setIsUnlinked(true)
    })
  },
})
