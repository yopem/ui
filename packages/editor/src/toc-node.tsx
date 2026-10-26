"use client"

import type {
  DOMConversionMap,
  DOMExportOutput,
  LexicalEditor,
  NodeKey,
  SerializedLexicalNode,
  Spread,
} from "lexical"
import type { MouseEvent, ReactNode } from "react"

import { Box } from "@registry/components/ui/box"
import { Button } from "@registry/components/ui/button"
import { List, ListItem } from "@registry/components/ui/list"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"
import { $applyNodeReplacement, DecoratorNode } from "lexical"
import { useSyncExternalStore } from "react"

import {
  EDITOR_TOC_HTML_ATTRIBUTE,
  EDITOR_TOC_TYPE,
  editorTocHTMLAttributes,
  parseEditorTocNode,
  validateEditorTocHTML,
} from "./toc-model"
import { getEditorTocHeadingId } from "./toc-runtime"
import {
  $getEditorTocSnapshot,
  focusEditorTocHeading,
  type EditorTocHeading,
} from "./toc-state"

export type SerializedEditorTocNode = Spread<
  { type: typeof EDITOR_TOC_TYPE; version: 1 },
  SerializedLexicalNode
>

const styles = stylex.create({
  list: {
    listStyle: "none",
    marginBlock: 0,
    paddingInlineStart: 0,
  },
  item: {
    blockSize: "auto",
    justifyContent: "flex-start",
    minBlockSize: {
      default: null,
      "@media (pointer: coarse)": `calc(${tokens["--spacing"]} * 11)`,
    },
    overflow: "hidden",
    textAlign: "start",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    inlineSize: "100%",
  },
  depthOne: { paddingInlineStart: `calc(${tokens["--spacing"]} * 1)` },
  depthTwo: { paddingInlineStart: `calc(${tokens["--spacing"]} * 5)` },
  depthThree: { paddingInlineStart: `calc(${tokens["--spacing"]} * 9)` },
  depthFour: { paddingInlineStart: `calc(${tokens["--spacing"]} * 13)` },
  depthFive: { paddingInlineStart: `calc(${tokens["--spacing"]} * 17)` },
  depthSix: { paddingInlineStart: `calc(${tokens["--spacing"]} * 21)` },
  active: {
    backgroundColor: tokens["--accent"],
    color: tokens["--foreground"],
  },
})

const depthStyles = [
  styles.depthOne,
  styles.depthTwo,
  styles.depthThree,
  styles.depthFour,
  styles.depthFive,
  styles.depthSix,
] as const

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

export class EditorTocNode extends DecoratorNode<ReactNode> {
  static getType() {
    return EDITOR_TOC_TYPE
  }

  static clone(node: EditorTocNode) {
    return new EditorTocNode(node.__key)
  }

  constructor(key?: NodeKey) {
    super(key)
  }

  isInline() {
    return false
  }

  isKeyboardSelectable() {
    return true
  }

  createDOM() {
    const element = document.createElement("nav")

    for (const [name, value] of Object.entries(editorTocHTMLAttributes()))
      element.setAttribute(name, value)
    element.setAttribute("aria-label", "Table of contents")
    element.contentEditable = "false"

    return element
  }

  updateDOM() {
    return false
  }

  exportJSON(): SerializedEditorTocNode {
    return {
      ...super.exportJSON(),
      type: EDITOR_TOC_TYPE,
      version: 1,
    }
  }

  static importJSON(value: SerializedEditorTocNode) {
    parseEditorTocNode(value)

    return $createEditorTocNode()
  }

  static importDOM(): DOMConversionMap {
    function convert(element: HTMLElement) {
      if (!element.hasAttribute(EDITOR_TOC_HTML_ATTRIBUTE)) return null
      validateEditorTocHTML(element.outerHTML)

      if (element.tagName !== "NAV")
        throw new Error("Invalid table of contents HTML")

      return {
        conversion: () => ({
          node: $createEditorTocNode(),
          forChild: () => null,
        }),
        priority: 4 as const,
      }
    }

    return { nav: convert }
  }

  exportDOM(editor: LexicalEditor): DOMExportOutput {
    const element = document.createElement("nav")

    for (const [name, value] of Object.entries(editorTocHTMLAttributes()))
      element.setAttribute(name, value)
    element.setAttribute("aria-label", "Table of contents")
    const list = document.createElement("ol")
    const snapshot = editor.getEditorState().read($getEditorTocSnapshot)

    for (const heading of snapshot.headings) {
      const item = document.createElement("li")
      const link = document.createElement("a")
      link.href = `#${getEditorTocHeadingId(editor, heading.key)}`
      link.textContent = heading.title
      item.append(link)
      list.append(item)
    }

    element.append(list)

    return { element }
  }

  decorate(editor: LexicalEditor) {
    return <EditorTocView editor={editor} />
  }
}

function EditorTocView({ editor }: { editor: LexicalEditor }) {
  const store = editorStateStore(editor)

  const state = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot,
  )

  const snapshot = state.read($getEditorTocSnapshot)

  return snapshot.headings.length > 0 ? (
    <List xstyle={styles.list} aria-label="Document headings">
      {snapshot.headings.map((heading) => (
        <EditorTocItem
          key={heading.key}
          editor={editor}
          heading={heading}
          active={snapshot.activeKey === heading.key}
        />
      ))}
    </List>
  ) : (
    <Box render={<output />}>
      Add a heading to build this table of contents.
    </Box>
  )
}

function EditorTocItem({
  editor,
  heading,
  active,
}: {
  editor: LexicalEditor
  heading: EditorTocHeading
  active: boolean
}) {
  const targetId = getEditorTocHeadingId(editor, heading.key)
  const depthStyle = depthStyles[heading.depth - 1] ?? styles.depthSix

  function navigate(event: MouseEvent<HTMLElement>) {
    event.preventDefault()
    focusEditorTocHeading(editor, heading.key)
  }

  return (
    <ListItem>
      <Button
        render={<a href={`#${targetId}`} aria-label={heading.title} />}
        variant="ghost"
        size="sm"
        xstyle={[styles.item, depthStyle, active && styles.active]}
        aria-current={active ? "location" : undefined}
        onMouseDown={(event) => event.preventDefault()}
        onClick={navigate}
      >
        {heading.title}
      </Button>
    </ListItem>
  )
}

export function $createEditorTocNode() {
  return $applyNodeReplacement(new EditorTocNode())
}
