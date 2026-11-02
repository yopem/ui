"use client"

import type { MouseEvent } from "react"

import { useStableCallback } from "@base-ui/utils/useStableCallback"
import {
  HorizontalRuleExtension,
  INSERT_HORIZONTAL_RULE_COMMAND,
} from "@lexical/extension"
import { Box } from "@registry/components/ui/box"
import { Button } from "@registry/components/ui/button"
import { Heading } from "@registry/components/ui/heading"
import { Stack } from "@registry/components/ui/stack"
import { ToolbarButton } from "@registry/components/ui/toolbar"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"
import {
  EditorAlignmentButton,
  EditorBlockButton,
  EditorBlockPresentationExtension,
  EditorContent,
  EditorFontColorControl,
  EditorHistoryButton,
  EditorIndentButton,
  EditorLineHeightControl,
  EditorListButton,
  EditorRoot,
  EditorToolbar,
  useEditor,
  useEditorState,
} from "@yopem-ui/editor"
import { defineExtension } from "lexical"
import {
  AlignCenterIcon,
  FileCode2Icon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  Heading4Icon,
  Heading5Icon,
  Heading6Icon,
  IndentDecreaseIcon,
  IndentIncreaseIcon,
  ListChecksIcon,
  ListIcon,
  ListOrderedIcon,
  PilcrowIcon,
  QuoteIcon,
  Redo2Icon,
  Undo2Icon,
} from "lucide-react"

const styles = stylex.create({
  root: { gap: `calc(${tokens["--spacing"]} * 8)` },
  section: {
    gap: `calc(${tokens["--spacing"]} * 3)`,
    minInlineSize: 0,
  },
  rule: {
    borderBlockStartWidth: 1,
    borderBlockStartStyle: "solid",
    borderBlockStartColor: tokens["--border"],
    marginBlock: `calc(${tokens["--spacing"]} * 4)`,
  },
  selectedRule: {
    outlineWidth: 2,
    outlineStyle: "solid",
    outlineColor: tokens["--ring"],
    outlineOffset: 2,
  },
})

function preventToolbarMouseDown(event: MouseEvent<HTMLButtonElement>) {
  event.preventDefault()
}

const blockExtensions = [
  defineExtension({
    name: "editor-examples/public-native-editing",
    dependencies: [HorizontalRuleExtension],
    theme: {
      hr: stylex.props(styles.rule).className,
      hrSelected: stylex.props(styles.selectedRule).className,
    },
  }),
  EditorBlockPresentationExtension,
]

function NativeHorizontalRuleButton() {
  const editor = useEditor()
  const { editable } = useEditorState()

  const handleInsert = useStableCallback(function handleInsert() {
    if (!editor.isEditable()) return
    editor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined)
    editor.focus()
  })

  return (
    <ToolbarButton
      render={<Button variant="ghost" size="sm" />}
      disabled={!editable}
      onMouseDown={preventToolbarMouseDown}
      onClick={handleInsert}
    >
      Insert horizontal rule
    </ToolbarButton>
  )
}

export function PublicNativeEditingExample() {
  return (
    <Stack xstyle={styles.root}>
      <Box render={<section aria-label="Block editing" />}>
        <Stack xstyle={styles.section}>
          <Heading>Native blocks and presentation</Heading>
          <EditorRoot
            ariaLabel="Native block editor"
            extensions={blockExtensions}
          >
            <EditorToolbar aria-label="Native block tools">
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
              <EditorBlockButton
                block="paragraph"
                aria-label="Paragraph"
                title="Paragraph"
                render={<Button variant="ghost" size="icon-sm" />}
              >
                <PilcrowIcon aria-hidden="true" size={16} />
              </EditorBlockButton>
              <EditorBlockButton
                block="h1"
                aria-label="Heading 1"
                title="Heading 1"
                render={<Button variant="ghost" size="icon-sm" />}
              >
                <Heading1Icon aria-hidden="true" size={16} />
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
                block="h3"
                aria-label="Heading 3"
                title="Heading 3"
                render={<Button variant="ghost" size="icon-sm" />}
              >
                <Heading3Icon aria-hidden="true" size={16} />
              </EditorBlockButton>
              <EditorBlockButton
                block="h4"
                aria-label="Heading 4"
                title="Heading 4"
                render={<Button variant="ghost" size="icon-sm" />}
              >
                <Heading4Icon aria-hidden="true" size={16} />
              </EditorBlockButton>
              <EditorBlockButton
                block="h5"
                aria-label="Heading 5"
                title="Heading 5"
                render={<Button variant="ghost" size="icon-sm" />}
              >
                <Heading5Icon aria-hidden="true" size={16} />
              </EditorBlockButton>
              <EditorBlockButton
                block="h6"
                aria-label="Heading 6"
                title="Heading 6"
                render={<Button variant="ghost" size="icon-sm" />}
              >
                <Heading6Icon aria-hidden="true" size={16} />
              </EditorBlockButton>
              <EditorBlockButton
                block="quote"
                aria-label="Quote"
                title="Quote"
                render={<Button variant="ghost" size="icon-sm" />}
              >
                <QuoteIcon aria-hidden="true" size={16} />
              </EditorBlockButton>
              <EditorBlockButton
                block="code"
                aria-label="Code block"
                title="Code block"
                render={<Button variant="ghost" size="icon-sm" />}
              >
                <FileCode2Icon aria-hidden="true" size={16} />
              </EditorBlockButton>
              <NativeHorizontalRuleButton />
              <EditorAlignmentButton
                alignment="center"
                aria-label="Align center"
                title="Align center"
                render={<Button variant="ghost" size="icon-sm" />}
              >
                <AlignCenterIcon aria-hidden="true" size={16} />
              </EditorAlignmentButton>
              <EditorFontColorControl />
              <EditorLineHeightControl />
            </EditorToolbar>
            <EditorContent />
          </EditorRoot>
        </Stack>
      </Box>
      <Box render={<section aria-label="Native lists" />}>
        <Stack xstyle={styles.section}>
          <Heading>Native nested lists</Heading>
          <EditorRoot ariaLabel="Native list editor">
            <EditorToolbar aria-label="Native list tools">
              <EditorListButton
                listType="bullet"
                aria-label="Bullet list"
                title="Bullet list"
                render={<Button variant="ghost" size="icon-sm" />}
              >
                <ListIcon aria-hidden="true" size={16} />
              </EditorListButton>
              <EditorListButton
                listType="number"
                aria-label="Numbered list"
                title="Numbered list"
                render={<Button variant="ghost" size="icon-sm" />}
              >
                <ListOrderedIcon aria-hidden="true" size={16} />
              </EditorListButton>
              <EditorIndentButton
                direction="indent"
                aria-label="Indent"
                title="Indent"
                render={<Button variant="ghost" size="icon-sm" />}
              >
                <IndentIncreaseIcon aria-hidden="true" size={16} />
              </EditorIndentButton>
              <EditorIndentButton
                direction="outdent"
                aria-label="Outdent"
                title="Outdent"
                render={<Button variant="ghost" size="icon-sm" />}
              >
                <IndentDecreaseIcon aria-hidden="true" size={16} />
              </EditorIndentButton>
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
      </Box>
      <Box render={<section aria-label="Native checklist" />}>
        <Stack xstyle={styles.section}>
          <Heading>Native checklist</Heading>
          <EditorRoot ariaLabel="Native checklist editor">
            <EditorToolbar aria-label="Native checklist tools">
              <EditorListButton
                listType="check"
                aria-label="Checklist"
                title="Checklist"
                render={<Button variant="ghost" size="icon-sm" />}
              >
                <ListChecksIcon aria-hidden="true" size={16} />
              </EditorListButton>
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
      </Box>
      <Box render={<section aria-label="Markdown shortcuts" />}>
        <Stack xstyle={styles.section}>
          <Heading>Native Markdown shortcuts</Heading>
          <EditorRoot ariaLabel="Markdown shortcut editor">
            <EditorToolbar aria-label="Markdown shortcut history">
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
      </Box>
    </Stack>
  )
}
