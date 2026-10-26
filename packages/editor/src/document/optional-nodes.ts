import type {
  EditorConfig,
  LexicalEditor,
  NodeKey,
  SerializedElementNode,
  SerializedLexicalNode,
  SerializedTextNode,
} from "lexical"

import {
  parseEditorColumnsLayout,
  validateEditorColumnsJSON,
  validateEditorColumnsColumnJSON,
  type EditorColumnsLayout,
} from "@yopem-ui/editor/columns-model"
import {
  editorDateNodeSchema,
  parseEditorDate,
  type EditorDateValue,
} from "@yopem-ui/editor/date-model"
import {
  parseEditorDrawingNode,
  parseEditorDrawingScene,
  type EditorDrawingScene,
} from "@yopem-ui/editor/drawing/model"
import { editorEditableCardNodeSchema } from "@yopem-ui/editor/editable-card/model"
import {
  EDITOR_FOOTNOTE_DEFINITION_TYPE,
  EDITOR_FOOTNOTE_REFERENCE_TYPE,
  parseEditorFootnoteDefinitionNode,
  parseEditorFootnoteId,
  parseEditorFootnoteReferenceNode,
} from "@yopem-ui/editor/footnote-model"
import {
  decodeEditorLabelNode,
  editorLabelSchema,
} from "@yopem-ui/editor/labels/model"
import {
  editorTocNodeSchema,
  EDITOR_TOC_TYPE,
} from "@yopem-ui/editor/toc-model"
import {
  $applyNodeReplacement,
  DecoratorNode,
  ElementNode,
  TextNode,
} from "lexical"

export type SerializedDocumentFootnoteReference = SerializedLexicalNode & {
  type: typeof EDITOR_FOOTNOTE_REFERENCE_TYPE
  version: 1
  identifier: string
}

export type SerializedDocumentFootnoteDefinition = SerializedElementNode & {
  type: typeof EDITOR_FOOTNOTE_DEFINITION_TYPE
  version: 1
  identifier: string
}

export type SerializedDocumentToc = SerializedLexicalNode & {
  type: typeof EDITOR_TOC_TYPE
  version: 1
}

export type SerializedDocumentColumnsGroup = SerializedElementNode & {
  type: "editor-columns-group"
  version: 1
  layout: EditorColumnsLayout
}

export type SerializedDocumentColumn = SerializedElementNode & {
  type: "editor-column"
  version: 1
}

export type SerializedDocumentDate = SerializedLexicalNode & {
  type: "editor-date"
  version: 1
  date: EditorDateValue
}

export type SerializedDocumentLabel = SerializedTextNode & {
  type: "editor-label"
  version: 1
  label: string
}

export type SerializedDocumentDrawing = SerializedLexicalNode & {
  type: "editor-drawing"
  version: 1
  elements: EditorDrawingScene["elements"]
}

export type SerializedDocumentEditableCard = SerializedLexicalNode & {
  type: "editor-editable-card"
  version: 1
}

export class DocumentFootnoteReferenceNode extends DecoratorNode<null> {
  __identifier: string

  static getType() {
    return EDITOR_FOOTNOTE_REFERENCE_TYPE
  }

  static clone(node: DocumentFootnoteReferenceNode) {
    return new DocumentFootnoteReferenceNode(node.__identifier, node.__key)
  }

  constructor(identifier: string, key?: NodeKey) {
    super(key)
    this.__identifier = parseEditorFootnoteId(identifier)
  }

  static importJSON(value: SerializedDocumentFootnoteReference) {
    const parsed = parseEditorFootnoteReferenceNode(value)

    return $applyNodeReplacement(
      new DocumentFootnoteReferenceNode(parsed.identifier),
    )
  }

  exportJSON(): SerializedDocumentFootnoteReference {
    return {
      ...super.exportJSON(),
      type: EDITOR_FOOTNOTE_REFERENCE_TYPE,
      version: 1,
      identifier: this.getIdentifier(),
    }
  }

  getIdentifier() {
    return this.getLatest().__identifier
  }

  getTextContent() {
    return `[^${this.getIdentifier()}]`
  }

  isInline() {
    return true
  }

  isKeyboardSelectable() {
    return true
  }

  createDOM(_config: EditorConfig, editor: LexicalEditor) {
    const element = editor.getRootElement()?.ownerDocument.createElement("sup")

    if (!element) throw new Error("Document footnote reference needs a DOM")

    return element
  }

  updateDOM() {
    return false
  }

  decorate() {
    return null
  }
}

export class DocumentFootnoteDefinitionNode extends ElementNode {
  __identifier: string

  static getType() {
    return EDITOR_FOOTNOTE_DEFINITION_TYPE
  }

  static clone(node: DocumentFootnoteDefinitionNode) {
    return new DocumentFootnoteDefinitionNode(node.__identifier, node.__key)
  }

  constructor(identifier: string, key?: NodeKey) {
    super(key)
    this.__identifier = parseEditorFootnoteId(identifier)
  }

  static importJSON(value: SerializedDocumentFootnoteDefinition) {
    const parsed = parseEditorFootnoteDefinitionNode(value)

    return $applyNodeReplacement(
      new DocumentFootnoteDefinitionNode(parsed.identifier),
    ).updateFromJSON(value)
  }

  exportJSON(): SerializedDocumentFootnoteDefinition {
    return {
      ...super.exportJSON(),
      type: EDITOR_FOOTNOTE_DEFINITION_TYPE,
      version: 1,
      identifier: this.getIdentifier(),
    }
  }

  getIdentifier() {
    return this.getLatest().__identifier
  }

  isShadowRoot() {
    return true
  }

  createDOM(_config: EditorConfig, editor: LexicalEditor) {
    const element = editor.getRootElement()?.ownerDocument.createElement("div")

    if (!element) throw new Error("Document footnote definition needs a DOM")

    return element
  }

  updateDOM() {
    return false
  }
}

export class DocumentTocNode extends DecoratorNode<null> {
  static getType() {
    return EDITOR_TOC_TYPE
  }

  static clone(node: DocumentTocNode) {
    return new DocumentTocNode(node.__key)
  }

  static importJSON(value: SerializedDocumentToc) {
    editorTocNodeSchema.parse(value)

    return $applyNodeReplacement(new DocumentTocNode())
  }

  exportJSON(): SerializedDocumentToc {
    return { ...super.exportJSON(), type: EDITOR_TOC_TYPE, version: 1 }
  }

  isKeyboardSelectable() {
    return true
  }

  createDOM(_config: EditorConfig, editor: LexicalEditor) {
    const element = editor.getRootElement()?.ownerDocument.createElement("nav")

    if (!element) throw new Error("Document table of contents needs a DOM")

    return element
  }

  updateDOM() {
    return false
  }

  decorate() {
    return null
  }
}

export class DocumentColumnsGroupNode extends ElementNode {
  __layout: EditorColumnsLayout

  static getType() {
    return "editor-columns-group"
  }

  static clone(node: DocumentColumnsGroupNode) {
    return new DocumentColumnsGroupNode(node.__layout, node.__key)
  }

  constructor(layout: readonly number[] = [50, 50], key?: NodeKey) {
    super(key)
    this.__layout = parseEditorColumnsLayout(layout)
  }

  static importJSON(value: SerializedDocumentColumnsGroup) {
    validateEditorColumnsJSON({ root: { type: "root", children: [value] } })

    return $applyNodeReplacement(
      new DocumentColumnsGroupNode(value.layout),
    ).updateFromJSON(value)
  }

  exportJSON(): SerializedDocumentColumnsGroup {
    return {
      ...super.exportJSON(),
      type: "editor-columns-group",
      version: 1,
      layout: [...this.getLatest().__layout],
    }
  }

  getLayout() {
    return [...this.getLatest().__layout]
  }

  setLayout(value: readonly number[]) {
    this.getWritable().__layout = parseEditorColumnsLayout(value)

    return this
  }

  createDOM(_config: EditorConfig, editor: LexicalEditor) {
    const element = editor.getRootElement()?.ownerDocument.createElement("div")

    if (!element) throw new Error("Document columns need a DOM")

    return element
  }

  updateDOM() {
    return false
  }
}

export class DocumentColumnNode extends ElementNode {
  static getType() {
    return "editor-column"
  }

  static clone(node: DocumentColumnNode) {
    return new DocumentColumnNode(node.__key)
  }

  constructor(key?: NodeKey) {
    super(key)
  }

  static importJSON(value: SerializedDocumentColumn) {
    validateEditorColumnsColumnJSON(value)

    return $applyNodeReplacement(new DocumentColumnNode()).updateFromJSON(value)
  }

  exportJSON(): SerializedDocumentColumn {
    return { ...super.exportJSON(), type: "editor-column", version: 1 }
  }

  createDOM(_config: EditorConfig, editor: LexicalEditor) {
    const element = editor.getRootElement()?.ownerDocument.createElement("div")

    if (!element) throw new Error("Document column needs a DOM")

    return element
  }

  updateDOM() {
    return false
  }
}

export class DocumentDateNode extends DecoratorNode<null> {
  __date: EditorDateValue

  static getType() {
    return "editor-date"
  }

  static clone(node: DocumentDateNode) {
    return new DocumentDateNode(node.__date, node.__key)
  }

  constructor(date: EditorDateValue, key?: NodeKey) {
    super(key)
    this.__date = parseEditorDate(date)
  }

  static importJSON(value: SerializedDocumentDate) {
    const parsed = editorDateNodeSchema.parse(value)

    return $applyNodeReplacement(new DocumentDateNode(parsed.date))
  }

  exportJSON(): SerializedDocumentDate {
    return {
      ...super.exportJSON(),
      type: "editor-date",
      version: 1,
      date: this.getDate(),
    }
  }

  getDate() {
    return this.getLatest().__date
  }

  getTextContent() {
    return this.getDate()
  }

  isInline() {
    return true
  }

  isKeyboardSelectable() {
    return true
  }

  createDOM(_config: EditorConfig, editor: LexicalEditor) {
    const element = editor.getRootElement()?.ownerDocument.createElement("time")

    if (!element) throw new Error("Document date needs a DOM")

    return element
  }

  updateDOM(previous: DocumentDateNode) {
    return previous.__date !== this.__date
  }

  decorate() {
    return null
  }
}

export class DocumentLabelNode extends TextNode {
  static getType() {
    return "editor-label"
  }

  static clone(node: DocumentLabelNode) {
    return new DocumentLabelNode(node.getLabel(), node.__key)
  }

  constructor(label: string, key?: NodeKey) {
    super(editorLabelSchema.parse(label), key)
    this.setMode("token")
  }

  static importJSON(value: SerializedDocumentLabel) {
    const parsed = decodeEditorLabelNode({
      type: value.type,
      version: value.version,
      label: value.label,
      text: value.text,
      format: value.format,
      detail: value.detail,
      mode: value.mode,
      style: value.style,
    })

    if (!parsed) throw new TypeError("Invalid editor label metadata")

    return $applyNodeReplacement(new DocumentLabelNode(parsed.label))
      .updateFromJSON(value)
      .setMode("token")
  }

  exportJSON(): SerializedDocumentLabel {
    return {
      ...super.exportJSON(),
      type: "editor-label",
      version: 1,
      label: this.getLabel(),
    }
  }

  getLabel() {
    return this.getLatest().getTextContent()
  }

  createDOM(config: EditorConfig, editor?: LexicalEditor) {
    const element = super.createDOM(config, editor)
    element.setAttribute("data-editor-label", this.getLabel())

    return element
  }

  updateDOM(previous: this, element: HTMLElement, config: EditorConfig) {
    const replace = super.updateDOM(previous, element, config)

    if (replace) return true

    element.setAttribute("data-editor-label", this.getLabel())

    return false
  }

  isTextEntity() {
    return true
  }

  canInsertTextBefore() {
    return false
  }

  canInsertTextAfter() {
    return false
  }
}

export class DocumentDrawingNode extends DecoratorNode<null> {
  __elements: EditorDrawingScene["elements"]

  static getType() {
    return "editor-drawing"
  }

  static clone(node: DocumentDrawingNode) {
    return new DocumentDrawingNode({ elements: node.__elements }, node.__key)
  }

  constructor(scene: EditorDrawingScene, key?: NodeKey) {
    super(key)
    this.__elements = parseEditorDrawingScene(scene).elements
  }

  static importJSON(value: SerializedDocumentDrawing) {
    const parsed = parseEditorDrawingNode(value)

    return $applyNodeReplacement(
      new DocumentDrawingNode({ elements: parsed.elements }),
    )
  }

  exportJSON(): SerializedDocumentDrawing {
    return {
      ...super.exportJSON(),
      type: "editor-drawing",
      version: 1,
      elements: parseEditorDrawingScene({
        elements: this.getLatest().__elements,
      }).elements,
    }
  }

  getTextContent() {
    return `Drawing with ${this.getLatest().__elements.length} elements`
  }

  createDOM(_config: EditorConfig, editor: LexicalEditor) {
    const element = editor
      .getRootElement()
      ?.ownerDocument.createElement("figure")

    if (!element) throw new Error("Document drawing needs a DOM")

    return element
  }

  updateDOM() {
    return false
  }

  decorate() {
    return null
  }
}

export class DocumentEditableCardNode extends DecoratorNode<null> {
  static getType() {
    return "editor-editable-card"
  }

  static clone(node: DocumentEditableCardNode) {
    return new DocumentEditableCardNode(node.__key)
  }

  constructor(key?: NodeKey) {
    super(key)
  }

  static importJSON(value: SerializedDocumentEditableCard) {
    editorEditableCardNodeSchema.parse(value)

    return $applyNodeReplacement(new DocumentEditableCardNode())
  }

  exportJSON(): SerializedDocumentEditableCard {
    return { ...super.exportJSON(), type: "editor-editable-card", version: 1 }
  }

  getTextContent() {
    return "Editable card"
  }

  createDOM(_config: EditorConfig, editor: LexicalEditor) {
    const element = editor
      .getRootElement()
      ?.ownerDocument.createElement("figure")

    if (!element) throw new Error("Document editable card needs a DOM")

    return element
  }

  updateDOM() {
    return false
  }

  decorate() {
    return null
  }
}

export const documentOptionalNodes = [
  DocumentFootnoteReferenceNode,
  DocumentFootnoteDefinitionNode,
  DocumentTocNode,
  DocumentColumnsGroupNode,
  DocumentColumnNode,
  DocumentDateNode,
  DocumentLabelNode,
  DocumentDrawingNode,
  DocumentEditableCardNode,
]
