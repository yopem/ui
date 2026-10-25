"use client"

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

  return (
    <ToolbarButton
      render={<Button variant="ghost" size="sm" />}
      disabled={!editable}
      onMouseDown={(event) => event.preventDefault()}
      onClick={() => {
        if (!editor.isEditable()) return
        editor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined)
        editor.focus()
      }}
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
              <EditorHistoryButton action="undo" />
              <EditorHistoryButton action="redo" />
              <EditorBlockButton block="paragraph" />
              <EditorBlockButton block="h1" />
              <EditorBlockButton block="h2" />
              <EditorBlockButton block="h3" />
              <EditorBlockButton block="h4" />
              <EditorBlockButton block="h5" />
              <EditorBlockButton block="h6" />
              <EditorBlockButton block="quote" />
              <EditorBlockButton block="code" />
              <NativeHorizontalRuleButton />
              <EditorAlignmentButton alignment="center" />
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
              <EditorListButton listType="bullet" />
              <EditorListButton listType="number" />
              <EditorIndentButton direction="indent" />
              <EditorIndentButton direction="outdent" />
              <EditorHistoryButton action="undo" />
              <EditorHistoryButton action="redo" />
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
              <EditorListButton listType="check" />
              <EditorHistoryButton action="undo" />
              <EditorHistoryButton action="redo" />
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
              <EditorHistoryButton action="undo" />
              <EditorHistoryButton action="redo" />
            </EditorToolbar>
            <EditorContent />
          </EditorRoot>
        </Stack>
      </Box>
    </Stack>
  )
}
