"use client"

import type {
  DOMConversionMap,
  DOMExportOutput,
  BaseSelection,
  LexicalEditor,
  LexicalNode,
  NodeKey,
  SerializedElementNode,
  SerializedLexicalNode,
  Spread,
} from "lexical"
import type { MouseEvent, ReactNode } from "react"

import { useStableCallback } from "@base-ui/utils/useStableCallback"
import { Button } from "@registry/components/ui/button"
import {
  PreviewCard,
  PreviewCardPopup,
  PreviewCardTrigger,
} from "@registry/components/ui/preview-card"
import { Stack } from "@registry/components/ui/stack"
import { Text } from "@registry/components/ui/text"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"
import {
  $applyNodeReplacement,
  $createParagraphNode,
  $getNodeByKey,
  $getRoot,
  $isRangeSelection,
  $addUpdateTag,
  HISTORY_PUSH_TAG,
  DecoratorNode,
  ElementNode,
  isHTMLElement,
  setDOMUnmanaged,
} from "lexical"
import { useSyncExternalStore } from "react"

import {
  EDITOR_FOOTNOTE_DEFINITION_ATTRIBUTE,
  EDITOR_FOOTNOTE_DEFINITION_TYPE,
  EDITOR_FOOTNOTE_REFERENCE_ATTRIBUTE,
  EDITOR_FOOTNOTE_REFERENCE_TYPE,
  editorFootnoteDefinitionHTMLAttributes,
  editorFootnoteReferenceHTMLAttributes,
  parseEditorFootnoteDefinitionNode,
  parseEditorFootnoteId,
  parseEditorFootnoteReferenceNode,
} from "./footnote-model"
import { getEditorFootnoteDOMId } from "./footnote-runtime"
import { $getEditorFootnoteSnapshot } from "./footnote-state"

export type SerializedEditorFootnoteReferenceNode = Spread<
  {
    type: typeof EDITOR_FOOTNOTE_REFERENCE_TYPE
    version: 1
    identifier: string
  },
  SerializedLexicalNode
>

export type SerializedEditorFootnoteDefinitionNode = Spread<
  {
    type: typeof EDITOR_FOOTNOTE_DEFINITION_TYPE
    version: 1
    identifier: string
  },
  SerializedElementNode
>

function preventFootnoteBlur(event: MouseEvent<HTMLElement>) {
  event.preventDefault()
}

const styles = stylex.create({
  definition: {
    borderBlockStartColor: tokens["--border"],
    borderBlockStartStyle: "solid",
    borderBlockStartWidth: 1,
    display: "grid",
    gap: `calc(${tokens["--spacing"]} * 3)`,
    gridTemplateColumns: "2.75rem minmax(0, 1fr)",
    marginBlock: `calc(${tokens["--spacing"]} * 3)`,
    paddingBlockStart: `calc(${tokens["--spacing"]} * 3)`,
  },
  label: {
    color: tokens["--muted-foreground"],
    fontFamily: tokens["--font-mono"],
    fontSize: "0.875rem",
    fontVariantNumeric: "tabular-nums",
    minInlineSize: 0,
  },
  body: { minInlineSize: 0 },
  reference: {
    borderRadius: tokens["--radius-sm"],
    fontVariantNumeric: "tabular-nums",
    minBlockSize: "1.5rem",
    minInlineSize: "1.5rem",
    paddingInline: `calc(${tokens["--spacing"]} * 1)`,
    verticalAlign: "super",
  },
})

function footnoteSnapshot(editor: LexicalEditor) {
  const state = editor.getEditorState()

  return state.read($getEditorFootnoteSnapshot)
}

function editorStateStore(editor: LexicalEditor) {
  return {
    subscribe(this: void, listener: () => void) {
      return editor.registerUpdateListener(listener)
    },
    getSnapshot(this: void) {
      return editor.getEditorState()
    },
    getServerSnapshot(this: void) {
      return editor.getEditorState()
    },
  }
}

export class EditorFootnoteReferenceNode extends DecoratorNode<ReactNode> {
  __identifier: string

  static getType() {
    return EDITOR_FOOTNOTE_REFERENCE_TYPE
  }

  static clone(node: EditorFootnoteReferenceNode) {
    return new EditorFootnoteReferenceNode(node.__identifier, node.__key)
  }

  constructor(identifier: string, key?: NodeKey) {
    super(key)
    this.__identifier = parseEditorFootnoteId(identifier)
  }

  getIdentifier() {
    return this.getLatest().__identifier
  }

  setIdentifier(identifier: string) {
    this.getWritable().__identifier = parseEditorFootnoteId(identifier)

    return this
  }

  isInline() {
    return true
  }

  isKeyboardSelectable() {
    return true
  }

  getTextContent() {
    return `[^${this.getIdentifier()}]`
  }

  createDOM() {
    const element = document.createElement("sup")
    element.setAttribute(
      EDITOR_FOOTNOTE_REFERENCE_ATTRIBUTE,
      this.getIdentifier(),
    )
    element.contentEditable = "false"

    return element
  }

  updateDOM(previous: EditorFootnoteReferenceNode, element: HTMLElement) {
    if (previous.__identifier !== this.__identifier)
      element.setAttribute(
        EDITOR_FOOTNOTE_REFERENCE_ATTRIBUTE,
        this.__identifier,
      )

    return false
  }

  exportJSON(): SerializedEditorFootnoteReferenceNode {
    return {
      ...super.exportJSON(),
      type: EDITOR_FOOTNOTE_REFERENCE_TYPE,
      version: 1,
      identifier: this.getIdentifier(),
    }
  }

  static importJSON(value: SerializedEditorFootnoteReferenceNode) {
    const parsed = parseEditorFootnoteReferenceNode(value)

    return $createEditorFootnoteReferenceNode(parsed.identifier)
  }

  static importDOM(): DOMConversionMap {
    function convert(element: HTMLElement) {
      if (!element.hasAttribute(EDITOR_FOOTNOTE_REFERENCE_ATTRIBUTE))
        return null

      const identifier = parseEditorFootnoteId(
        element.getAttribute(EDITOR_FOOTNOTE_REFERENCE_ATTRIBUTE),
      )

      if (element.tagName !== "SUP")
        throw new Error("Invalid footnote reference HTML")

      return {
        conversion: () => ({
          node: $createEditorFootnoteReferenceNode(identifier),
        }),
        priority: 4 as const,
      }
    }

    return { sup: convert }
  }

  exportDOM(editor: LexicalEditor): DOMExportOutput {
    const element = document.createElement("sup")
    const identifier = this.getIdentifier()

    const entry = footnoteSnapshot(editor).references.find(
      (reference) => reference.key === this.getKey(),
    )

    const label = entry?.number ? String(entry.number) : identifier

    for (const [name, value] of Object.entries(
      editorFootnoteReferenceHTMLAttributes(identifier),
    ))
      element.setAttribute(name, value)
    element.textContent = label

    return { element }
  }

  decorate(editor: LexicalEditor) {
    return (
      <EditorFootnoteReferenceView
        editor={editor}
        nodeKey={this.getKey()}
        identifier={this.getIdentifier()}
      />
    )
  }
}

export class EditorFootnoteDefinitionNode extends ElementNode {
  __identifier: string

  static getType() {
    return EDITOR_FOOTNOTE_DEFINITION_TYPE
  }

  static clone(node: EditorFootnoteDefinitionNode) {
    return new EditorFootnoteDefinitionNode(node.__identifier, node.__key)
  }

  constructor(identifier: string, key?: NodeKey) {
    super(key)
    this.__identifier = parseEditorFootnoteId(identifier)
  }

  getIdentifier() {
    return this.getLatest().__identifier
  }

  setIdentifier(identifier: string) {
    this.getWritable().__identifier = parseEditorFootnoteId(identifier)

    return this
  }

  isShadowRoot() {
    return true
  }

  extractWithChild(_child: LexicalNode, selection: BaseSelection | null) {
    return $isRangeSelection(selection) && !selection.isCollapsed()
  }

  createDOM() {
    const element = document.createElement("div")
    const label = document.createElement("span")
    const body = document.createElement("div")

    for (const [name, value] of Object.entries(
      editorFootnoteDefinitionHTMLAttributes(this.getIdentifier()),
    ))
      element.setAttribute(name, value)
    element.setAttribute("role", "note")
    element.className = stylex.props(styles.definition).className ?? ""
    label.setAttribute("data-editor-footnote-label", "")
    label.setAttribute("aria-hidden", "true")
    label.contentEditable = "false"
    label.className = stylex.props(styles.label).className ?? ""
    label.textContent = this.getIdentifier()
    setDOMUnmanaged(label)
    body.setAttribute("data-editor-footnote-body", "")
    body.className = stylex.props(styles.body).className ?? ""
    element.append(label, body)

    return element
  }

  getDOMSlot(element: HTMLElement) {
    const body = element.querySelector("[data-editor-footnote-body]")

    if (!isHTMLElement(body)) throw new Error("Missing footnote body slot")

    return super.getDOMSlot(element).withElement(body)
  }

  updateDOM(previous: EditorFootnoteDefinitionNode, element: HTMLElement) {
    if (previous.__identifier !== this.__identifier)
      element.setAttribute(
        EDITOR_FOOTNOTE_DEFINITION_ATTRIBUTE,
        this.__identifier,
      )

    return false
  }

  exportJSON(): SerializedEditorFootnoteDefinitionNode {
    return {
      ...super.exportJSON(),
      type: EDITOR_FOOTNOTE_DEFINITION_TYPE,
      version: 1,
      identifier: this.getIdentifier(),
    }
  }

  static importJSON(value: SerializedEditorFootnoteDefinitionNode) {
    const parsed = parseEditorFootnoteDefinitionNode(value)

    return $applyNodeReplacement(
      new EditorFootnoteDefinitionNode(parsed.identifier),
    ).updateFromJSON(value)
  }

  static importDOM(): DOMConversionMap {
    function convertDefinition(element: HTMLElement) {
      if (!element.hasAttribute(EDITOR_FOOTNOTE_DEFINITION_ATTRIBUTE))
        return null

      const identifier = parseEditorFootnoteId(
        element.getAttribute(EDITOR_FOOTNOTE_DEFINITION_ATTRIBUTE),
      )

      if (element.tagName !== "DIV")
        throw new Error("Invalid footnote definition HTML")

      return {
        conversion: () => ({
          node: $createEditorFootnoteDefinitionNode(identifier),
        }),
        priority: 4 as const,
      }
    }

    function convertBody(element: HTMLElement) {
      if (!element.hasAttribute("data-editor-footnote-body")) return null

      return {
        conversion: () => ({ node: null }),
        priority: 4 as const,
      }
    }

    function convertLabel(element: HTMLElement) {
      if (!element.hasAttribute("data-editor-footnote-label")) return null

      return {
        conversion: () => ({ node: null, forChild: () => null }),
        priority: 4 as const,
      }
    }

    return {
      div(element) {
        return convertDefinition(element) ?? convertBody(element)
      },
      span: convertLabel,
    }
  }

  exportDOM(editor: LexicalEditor): DOMExportOutput {
    const output = super.exportDOM(editor)
    const element = document.createElement("div")

    for (const [name, value] of Object.entries(
      editorFootnoteDefinitionHTMLAttributes(this.getIdentifier()),
    ))
      element.setAttribute(name, value)
    element.setAttribute("role", "doc-footnote")
    const liveElement = output.element

    const body = isHTMLElement(liveElement)
      ? liveElement.querySelector("[data-editor-footnote-body]")
      : null

    if (isHTMLElement(body)) element.append(...Array.from(body.childNodes))
    else if (isHTMLElement(liveElement))
      element.append(...Array.from(liveElement.childNodes))

    return { ...output, element }
  }
}

function EditorFootnoteReferenceView({
  editor,
  nodeKey,
  identifier,
}: {
  editor: LexicalEditor
  nodeKey: NodeKey
  identifier: string
}) {
  const store = editorStateStore(editor)

  const state = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot,
  )

  const snapshot = state.read($getEditorFootnoteSnapshot)
  const reference = snapshot.references.find((entry) => entry.key === nodeKey)

  const definition = snapshot.definitions.find(
    (entry) => entry.identifier === identifier,
  )

  const targetKey = reference?.definitionKey ?? null

  const targetId = targetKey
    ? getEditorFootnoteDOMId(editor, "definition", targetKey)
    : null

  const label = reference?.number ? String(reference.number) : identifier

  const accessibleName = reference?.number
    ? `Footnote ${reference.number} reference`
    : `Unresolved footnote reference ${identifier}`

  const navigate = useStableCallback(function navigate(
    event: MouseEvent<HTMLElement>,
  ) {
    event.preventDefault()

    if (!targetKey) return
    const element = editor.getElementByKey(targetKey)

    if (!editor.isEditable()) {
      element?.focus()
      element?.scrollIntoView({ block: "nearest" })

      return
    }

    editor.update(() => {
      const node = $getNodeByKey(targetKey)

      if (node instanceof EditorFootnoteDefinitionNode) node.selectStart()
    })
    element?.scrollIntoView({ block: "nearest" })
    editor.focus()
  })

  const createDefinition = useStableCallback(function createDefinition() {
    if (!editor.isEditable() || definition) return
    editor.update(
      () => {
        const node = $createEditorFootnoteDefinitionNode(identifier)
        const paragraph = $createParagraphNode()
        node.append(paragraph)
        $getRoot().append(node)
        $addUpdateTag(HISTORY_PUSH_TAG)
        paragraph.selectStart()
      },
      { discrete: true },
    )
    editor.focus()
  })

  const trigger = targetId ? (
    <Button
      render={
        <a
          href={`#${targetId}`}
          aria-label={accessibleName}
          role="doc-noteref"
        />
      }
      variant="link"
      size="xs"
      xstyle={styles.reference}
      aria-label={accessibleName}
      onMouseDown={preventFootnoteBlur}
      onClick={navigate}
    >
      {label}
    </Button>
  ) : (
    <Button
      variant="link"
      size="xs"
      xstyle={styles.reference}
      aria-label={accessibleName}
      disabled={!editor.isEditable()}
      onMouseDown={preventFootnoteBlur}
      onClick={createDefinition}
    >
      {label}
    </Button>
  )

  return (
    <PreviewCard>
      <PreviewCardTrigger render={trigger} />
      <PreviewCardPopup>
        <Stack>
          <Text>
            {definition && definition.preview.length > 0
              ? definition.preview
              : definition
                ? "Empty footnote"
                : "No definition for this footnote"}
          </Text>
          {!definition && editor.isEditable() ? (
            <Button
              variant="outline"
              size="sm"
              onMouseDown={preventFootnoteBlur}
              onClick={createDefinition}
            >
              Create definition for [^{identifier}]
            </Button>
          ) : null}
        </Stack>
      </PreviewCardPopup>
    </PreviewCard>
  )
}

export function $createEditorFootnoteReferenceNode(identifier: string) {
  return $applyNodeReplacement(new EditorFootnoteReferenceNode(identifier))
}

export function $createEditorFootnoteDefinitionNode(identifier: string) {
  return $applyNodeReplacement(new EditorFootnoteDefinitionNode(identifier))
}
