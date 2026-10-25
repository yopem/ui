import { CodeExtension, CodeNode } from "@lexical/code"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"
import { $getState, $setState, defineExtension } from "lexical"

import { createEditorDiagramHTMLConfig } from "./diagram-html"
import { isEditorDiagramKind } from "./diagram-model"
import { createEditorDiagramPresentationExtension } from "./diagram-presentation"
import {
  editorDiagramState,
  getEditorDiagramCodeLanguage,
} from "./diagram-state"

const styles = stylex.create({
  source: { display: "block" },
  preview: { display: "block", whiteSpace: "normal", maxInlineSize: "100%" },
  button: {
    appearance: "none",
    display: "block",
    backgroundColor: tokens["--card"],
    color: tokens["--card-foreground"],
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: tokens["--border"],
    borderRadius: tokens["--radius-md"],
    padding: `calc(${tokens["--spacing"]} * 2)`,
    margin: 0,
    cursor: "pointer",
    minBlockSize: "2.75rem",
    minInlineSize: "2.75rem",
    maxInlineSize: "100%",
    outlineWidth: { default: 0, ":focus-visible": 2 },
    outlineStyle: "solid",
    outlineColor: tokens["--ring"],
    outlineOffset: 2,
  },
  selectedButton: {
    borderColor: tokens["--primary"],
    outlineWidth: 2,
  },
  image: {
    display: "block",
    inlineSize: "auto",
    blockSize: "auto",
    maxInlineSize: "100%",
    maxBlockSize: "min(40rem, 70dvh)",
    objectFit: "contain",
  },
  imageOnly: { "::before": { display: "none" } },
})

const EditorDiagramPresentationExtension =
  createEditorDiagramPresentationExtension({
    source: stylex.props(styles.source).className ?? "",
    preview: stylex.props(styles.preview).className ?? "",
    button: stylex.props(styles.button).className ?? "",
    selectedButton:
      stylex.props(styles.button, styles.selectedButton).className ?? "",
    image: stylex.props(styles.image).className ?? "",
    imageOnly: stylex.props(styles.imageOnly).className?.split(" ") ?? [],
  })

export const EditorDiagramExtension = defineExtension({
  name: "@yopem-ui/editor/diagram",
  dependencies: [CodeExtension, EditorDiagramPresentationExtension],
  init(editorConfig) {
    editorConfig.html = createEditorDiagramHTMLConfig(editorConfig.html)
  },
  register(editor) {
    return editor.registerNodeTransform(CodeNode, (node) => {
      const metadata = $getState(node, editorDiagramState)

      if (!metadata) return
      const language = node.getLanguage() ?? ""

      if (
        language === metadata.kind ||
        language === getEditorDiagramCodeLanguage(metadata.kind)
      )
        return

      const kind =
        language === "dot" || language === "gv"
          ? "graphviz"
          : language === "plant-uml" || language === "puml"
            ? "plantuml"
            : isEditorDiagramKind(language)
              ? language
              : null

      if (kind) $setState(node, editorDiagramState, { ...metadata, kind })
      else $setState(node, editorDiagramState, null)
    })
  },
})
