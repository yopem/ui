import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"
import {
  $addUpdateTag,
  $createParagraphNode,
  $createTextNode,
  $getEditor,
  $getRoot,
  $isParagraphNode,
  $isTextNode,
  defineExtension,
  HISTORY_PUSH_TAG,
  isCurrentlyReadOnlyMode,
  RootNode,
} from "lexical"

import type { EditorLabelJSON } from "./labels-model"

import {
  decodeEditorLabels,
  EDITOR_LABEL_MAX_COUNT,
  parseEditorLabelOptions,
} from "./labels-model"
import {
  $createEditorLabelNode,
  $isEditorLabelNode,
  EditorLabelNode,
} from "./labels-node"

const styles = stylex.create({
  token: {
    backgroundColor: tokens["--secondary"],
    borderColor: tokens["--border"],
    borderRadius: tokens["--radius-sm"],
    borderStyle: "solid",
    borderWidth: 1,
    color: tokens["--secondary-foreground"],
    paddingInline: `calc(${tokens["--spacing"]} * 1)`,
  },
})

export function $getEditorLabels() {
  return $getRoot()
    .getAllTextNodes()
    .filter($isEditorLabelNode)
    .map((node) => node.getLabel())
}

export function $replaceEditorLabels(
  value: EditorLabelJSON,
  options: readonly string[],
) {
  const editor = $getEditor()

  if (!editor.isEditable() || isCurrentlyReadOnlyMode()) return false

  const fixedOptions = parseEditorLabelOptions(options)

  if (!fixedOptions) return false

  const labels = decodeEditorLabels(value, fixedOptions)

  if (!labels) return false

  const root = $getRoot()

  if (root.getChildrenSize() > 1) return false

  const firstChild = root.getFirstChild()

  if (firstChild && !$isParagraphNode(firstChild)) return false

  const paragraph = firstChild ?? $createParagraphNode()

  if (!firstChild) root.append(paragraph)

  if (paragraph.getChildrenSize() > EDITOR_LABEL_MAX_COUNT * 2 + 1) return false

  const children = paragraph.getChildren()

  const supportedChildren = children.every((child, index) => {
    if ($isEditorLabelNode(child)) return true

    if (!$isTextNode(child)) return false

    const text = child.getTextContent()

    if (text.length > 1 || (text !== "" && text !== " ")) return false

    if (text === "") return children.length === 1

    return (
      index > 0 &&
      index < children.length - 1 &&
      $isEditorLabelNode(children[index - 1]) &&
      $isEditorLabelNode(children[index + 1])
    )
  })

  if (!supportedChildren) return false

  const current = children
    .filter($isEditorLabelNode)
    .map((node) => node.getLabel())

  if (
    current.length === labels.length &&
    current.every((label, index) => label === labels[index])
  )
    return true

  $addUpdateTag(HISTORY_PUSH_TAG)
  paragraph.clear()

  for (const [index, label] of labels.entries()) {
    if (index > 0) paragraph.append($createTextNode(" "))
    paragraph.append($createEditorLabelNode(label))
  }

  paragraph.selectEnd()

  return true
}

export function createEditorLabelsExtension(options: readonly string[]) {
  const fixedOptions = parseEditorLabelOptions(options)

  if (!fixedOptions)
    throw new TypeError(
      "Editor label options must be unique bounded text values",
    )

  const allowed = new Set(fixedOptions)

  return defineExtension({
    name: "@yopem-ui/editor/labels",
    nodes: [EditorLabelNode],
    theme: {
      text: { editorLabel: stylex.props(styles.token).className ?? "" },
    },
    register(editor) {
      return editor.registerNodeTransform(RootNode, () => {
        const nodes = $getRoot().getAllTextNodes().filter($isEditorLabelNode)
        const seen = new Set<string>()
        let accepted = 0

        for (const node of nodes) {
          const label = node.getLabel()

          if (
            !allowed.has(label) ||
            seen.has(label) ||
            accepted >= EDITOR_LABEL_MAX_COUNT
          ) {
            node.replace($createTextNode(label))
            continue
          }

          seen.add(label)
          accepted += 1
        }
      })
    },
  })
}
