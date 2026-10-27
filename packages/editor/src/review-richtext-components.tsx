"use client"

import type { EditorState } from "lexical"
import type { ReactNode } from "react"

import { useStableCallback } from "@base-ui/utils/useStableCallback"
import { Box } from "@registry/components/ui/box"
import { Em } from "@registry/components/ui/em"
import { Fieldset, FieldsetLegend } from "@registry/components/ui/fieldset"
import { Mark } from "@registry/components/ui/mark"
import { Stack } from "@registry/components/ui/stack"
import { Strong } from "@registry/components/ui/strong"
import { Text } from "@registry/components/ui/text"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"
import {
  $getRoot,
  $isElementNode,
  createEditor,
  $getSelection,
  $getState,
  $isRangeSelection,
  $isTextNode,
  configExtension,
} from "lexical"
import { useState } from "react"

import type { EditorRootProps } from "./root"

import { EditorBlockPresentationExtension } from "./block-presentation-extension"
import {
  EditorCommandButton,
  EditorFormatButton,
  EditorToolbar,
} from "./controls"
import {
  makeReviewRichContent,
  parseReviewRichContent,
  type EditorReviewRichContent,
} from "./review-richtext"
import {
  EditorReviewRichTextExtension,
  $toggleEditorReviewKeyboard,
  editorReviewKeyboardState,
} from "./review-richtext-native"
import { EditorRoot, EditorContent, useEditor, useEditorState } from "./root"

const styles = stylex.create({
  toolbar: { flexWrap: "wrap" },
  text: { whiteSpace: "pre-wrap" },
  mono: { fontFamily: tokens["--font-mono"] },
  keyboard: {
    fontFamily: tokens["--font-mono"],
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: tokens["--border"],
    borderRadius: tokens["--radius-sm"],
    paddingInline: `calc(${tokens["--spacing"]} * 1)`,
  },
  nativeKeyboard: {
    outlineWidth: "1px",
    outlineStyle: "solid",
    outlineColor: tokens["--border"],
    outlineOffset: "1px",
  },
})

export function EditorReviewKeyboardControl({
  label = "discussion",
}: {
  label?: string
}) {
  const editor = useEditor()
  const state = useEditorState()

  const selection = editor.getEditorState().read(() => {
    const range = $getSelection()

    if (!$isRangeSelection(range) || range.isCollapsed()) return null
    const nodes = range.getNodes().filter($isTextNode)

    return nodes.length
      ? nodes.every((node) => $getState(node, editorReviewKeyboardState))
      : null
  })

  function toggle() {
    editor.update(() => {
      $toggleEditorReviewKeyboard()
    })
  }

  return (
    <EditorCommandButton
      command={toggle}
      disabled={!state.editable || selection === null}
      aria-label={`Keyboard in ${label}`}
      aria-pressed={selection ?? false}
    >
      Keyboard
    </EditorCommandButton>
  )
}

export function EditorReviewRichComposer({
  label,
  initialContent,
  onChange,
  disabled = false,
  extensions: additionalExtensions,
}: {
  label: string
  initialContent?: EditorReviewRichContent
  onChange: (content: EditorReviewRichContent | null) => void
  disabled?: boolean
  extensions?: EditorRootProps["extensions"]
}) {
  const [initial] = useState(() =>
    JSON.stringify(initialContent ?? makeReviewRichContent("")),
  )

  const [invalid, setInvalid] = useState(false)

  const [extensions] = useState(() => [
    ...(additionalExtensions ?? []),
    EditorBlockPresentationExtension,
    configExtension(EditorReviewRichTextExtension, {
      keyboardClassName: stylex.props(styles.nativeKeyboard).className ?? "",
    }),
  ])

  const change = useStableCallback(function change(state: EditorState) {
    try {
      const content = parseReviewRichContent(state.toJSON())
      setInvalid(false)
      onChange(content)
    } catch {
      setInvalid(true)
      onChange(null)
    }
  })

  return (
    <Fieldset>
      <FieldsetLegend>{label}</FieldsetLegend>
      <Stack>
        <EditorRoot
          initialState={initial}
          extensions={extensions}
          editable={!disabled}
          ariaLabel={label}
          onChange={change}
        >
          <EditorToolbar xstyle={styles.toolbar}>
            <EditorFormatButton format="bold" aria-label={`Bold in ${label}`}>
              Bold
            </EditorFormatButton>
            <EditorFormatButton
              format="italic"
              aria-label={`Italic in ${label}`}
            >
              Italic
            </EditorFormatButton>
            <EditorFormatButton
              format="underline"
              aria-label={`Underline in ${label}`}
            >
              Underline
            </EditorFormatButton>
            <EditorFormatButton
              format="strikethrough"
              aria-label={`Strikethrough in ${label}`}
            >
              Strikethrough
            </EditorFormatButton>
            <EditorFormatButton format="code" aria-label={`Code in ${label}`}>
              Code
            </EditorFormatButton>
            <EditorFormatButton
              format="subscript"
              aria-label={`Subscript in ${label}`}
            >
              Subscript
            </EditorFormatButton>
            <EditorFormatButton
              format="superscript"
              aria-label={`Superscript in ${label}`}
            >
              Superscript
            </EditorFormatButton>
            <EditorFormatButton
              format="highlight"
              aria-label={`Highlight in ${label}`}
            >
              Highlight
            </EditorFormatButton>
            <EditorReviewKeyboardControl label={label} />
          </EditorToolbar>
          <EditorContent />
        </EditorRoot>
        <Text aria-live="polite">
          {invalid
            ? "This draft contains unsupported formatting or exceeds its size limit."
            : ""}
        </Text>
      </Stack>
    </Fieldset>
  )
}

function ReviewRichInline({
  node,
}: {
  node: EditorReviewRichContent["root"]["children"][number]["children"][number]
}) {
  if (node.type === "linebreak") return <br />
  let content: ReactNode = node.text

  if (node.format & 1) content = <Strong>{content}</Strong>

  if (node.format & 2) content = <Em>{content}</Em>

  if (node.format & 4) content = <Box render={<s />}>{content}</Box>

  if (node.format & 8) content = <Box render={<u />}>{content}</Box>

  if (node.format & 16)
    content = (
      <Box render={<code />} xstyle={styles.mono}>
        {content}
      </Box>
    )

  if (node.format & 32) content = <Box render={<sub />}>{content}</Box>

  if (node.format & 64) content = <Box render={<sup />}>{content}</Box>

  if (node.format & 128) content = <Mark>{content}</Mark>

  if (node.$?.yopemReviewKeyboard)
    content = (
      <Box render={<kbd />} xstyle={styles.keyboard}>
        {content}
      </Box>
    )

  return content
}

function createReviewRichView(content: EditorReviewRichContent) {
  const value = parseReviewRichContent(content)
  const source = JSON.stringify(value)
  const editor = createEditor()
  const state = editor.parseEditorState(source)

  const paragraphs = state.read(() => {
    const nodes = $getRoot().getChildren()

    return value.root.children.map((paragraph, index) => {
      const node = nodes[index]

      if (!$isElementNode(node)) throw new Error("Invalid rich paragraph.")
      const children = node.getChildren()

      return {
        id: node.getKey(),
        direction: paragraph.direction,
        children: paragraph.children.map((child, childIndex) => {
          const native = children[childIndex]

          if (!native) throw new Error("Invalid rich child.")

          return { id: native.getKey(), value: child }
        }),
      }
    })
  })

  return { source, direction: value.root.direction, paragraphs }
}

export function EditorReviewRichContent({
  content,
}: {
  content: EditorReviewRichContent
}) {
  const source = JSON.stringify(parseReviewRichContent(content))
  const [view, setView] = useState(() => createReviewRichView(content))

  if (view.source !== source) setView(createReviewRichView(content))

  return (
    <Stack dir={view.direction ?? undefined}>
      {view.paragraphs.map((paragraph) => (
        <Text
          key={paragraph.id}
          dir={paragraph.direction ?? undefined}
          xstyle={styles.text}
        >
          {paragraph.children.map((node) => (
            <ReviewRichInline key={node.id} node={node.value} />
          ))}
        </Text>
      ))}
    </Stack>
  )
}
