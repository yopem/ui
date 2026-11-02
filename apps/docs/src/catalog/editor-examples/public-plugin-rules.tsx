"use client"

import { useStableCallback } from "@base-ui/utils/useStableCallback"
import { Button } from "@registry/components/ui/button"
import { Stack } from "@registry/components/ui/stack"
import { Text } from "@registry/components/ui/text"
import {
  EditorBlockButton,
  EditorContent,
  EditorFormatButton,
  EditorHistoryButton,
  EditorRoot,
  EditorToolbar,
} from "@yopem-ui/editor"
import { EditorAutoformatExtension } from "@yopem-ui/editor/autoformat"
import { EditorBlockBehaviorExtension } from "@yopem-ui/editor/block-behavior"
import {
  CodeIcon,
  Heading2Icon,
  PilcrowIcon,
  QuoteIcon,
  Redo2Icon,
  SuperscriptIcon,
  Undo2Icon,
} from "lucide-react"
import { useState } from "react"

const element = { version: 1, direction: null, format: "", indent: 0 }

const extensions = [EditorAutoformatExtension, EditorBlockBehaviorExtension]

function text(value: string, format = 0) {
  return {
    type: "text",
    version: 1,
    detail: 0,
    format,
    mode: "normal",
    style: "",
    text: value,
  }
}

const initialState = JSON.stringify({
  root: {
    ...element,
    type: "root",
    children: [
      {
        ...element,
        type: "heading",
        tag: "h2",
        children: [text("Split this heading")],
      },
      {
        ...element,
        type: "quote",
        children: [
          {
            ...element,
            type: "quote",
            children: [text("Nested native quote")],
          },
        ],
      },
      {
        ...element,
        type: "list",
        listType: "bullet",
        tag: "ul",
        start: 1,
        children: [
          {
            ...element,
            type: "listitem",
            value: 1,
            children: [text("Native list boundary")],
          },
        ],
      },
      { ...element, type: "code", language: "javascript", children: [] },
      {
        ...element,
        type: "paragraph",
        children: [
          text("Inline "),
          text("code", 16),
          text(" then "),
          text("superscript", 64),
          text(" and "),
          {
            ...element,
            type: "link",
            url: "https://example.com/reference",
            target: null,
            rel: null,
            title: null,
            children: [text("Reference")],
          },
          text(" after"),
        ],
      },
      { ...element, type: "paragraph", children: [] },
      { type: "horizontalrule", version: 1 },
      { ...element, type: "paragraph", children: [text("After native rule")] },
    ],
  },
})

export function PublicPluginRulesExample() {
  const [editable, setEditable] = useState(true)

  const toggleEditable = useStableCallback(function toggleEditable() {
    setEditable((value) => !value)
  })

  return (
    <Stack>
      <Text>
        Split the heading in the middle. The optional block rule makes the new
        half a paragraph. Higher-priority host handlers remain available.
      </Text>
      <Text>
        Try nested quote Enter, list-start Backspace, empty-code Backspace,
        inline arrow boundaries, empty link removal, and Backspace near the
        horizontal rule.
      </Text>
      <Text>
        Only heading splitting is overridden here. The remaining behavior uses
        native Lexical handlers and is not yet runtime-verified against upstream
        rules.
      </Text>
      <Button onClick={toggleEditable} aria-pressed={!editable}>
        {editable
          ? "Make behavior editor read-only"
          : "Enable behavior editing"}
      </Button>
      <EditorRoot
        initialState={initialState}
        extensions={extensions}
        editable={editable}
        ariaLabel="Native block behavior"
      >
        <EditorToolbar aria-label="Native block behavior tools">
          <EditorBlockButton
            block="paragraph"
            aria-label="Paragraph"
            title="Paragraph"
            render={<Button variant="ghost" size="icon-sm" />}
          >
            <PilcrowIcon aria-hidden="true" size={16} />
          </EditorBlockButton>
          <EditorBlockButton
            block="h2"
            aria-label="Heading 2"
            title="Heading 2"
            render={<Button variant="ghost" size="icon-sm" />}
          >
            <Heading2Icon aria-hidden="true" size={16} />
          </EditorBlockButton>
          <EditorBlockButton
            block="quote"
            aria-label="Quote"
            title="Quote"
            render={<Button variant="ghost" size="icon-sm" />}
          >
            <QuoteIcon aria-hidden="true" size={16} />
          </EditorBlockButton>
          <EditorFormatButton
            format="code"
            title="Inline code"
            render={<Button variant="ghost" size="icon-sm" />}
          >
            <CodeIcon aria-hidden="true" size={16} />
          </EditorFormatButton>
          <EditorFormatButton
            format="superscript"
            title="Superscript"
            render={<Button variant="ghost" size="icon-sm" />}
          >
            <SuperscriptIcon aria-hidden="true" size={16} />
          </EditorFormatButton>
          <EditorHistoryButton
            action="undo"
            aria-label="Undo"
            title="Undo"
            render={<Button variant="ghost" size="icon-sm" />}
          >
            <Undo2Icon aria-hidden="true" size={16} />
          </EditorHistoryButton>
          <EditorHistoryButton
            action="redo"
            aria-label="Redo"
            title="Redo"
            render={<Button variant="ghost" size="icon-sm" />}
          >
            <Redo2Icon aria-hidden="true" size={16} />
          </EditorHistoryButton>
        </EditorToolbar>
        <EditorContent />
      </EditorRoot>
    </Stack>
  )
}
