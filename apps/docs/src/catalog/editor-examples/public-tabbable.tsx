"use client"

import { Box } from "@registry/components/ui/box"
import { Button } from "@registry/components/ui/button"
import { Stack } from "@registry/components/ui/stack"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"
import {
  EditorBlockButton,
  EditorContent,
  EditorListButton,
  EditorRoot,
  EditorToolbar,
} from "@yopem-ui/editor"
import {
  EditorEditableCardExtension,
  EditorEditableCardInsertButton,
} from "@yopem-ui/editor/editable-card"

const extensions = [EditorEditableCardExtension]

const styles = stylex.create({
  root: { gap: `calc(${tokens["--spacing"]} * 8)` },
  section: {
    gap: `calc(${tokens["--spacing"]} * 3)`,
    minInlineSize: 0,
  },
})

function TabbableEditor() {
  return (
    <Box render={<section aria-label="Tab through editable card controls" />}>
      <Stack xstyle={styles.section}>
        <Button>Focus before editor</Button>
        <EditorRoot ariaLabel="Tabbable editor" extensions={extensions}>
          <EditorToolbar aria-label="Tabbable card tools">
            <EditorEditableCardInsertButton />
          </EditorToolbar>
          <EditorContent placeholder="Write outer editor text…" />
        </EditorRoot>
        <Button>Focus after editor</Button>
      </Stack>
    </Box>
  )
}

function NativeListEditor() {
  return (
    <Box render={<section aria-label="Native list keyboard editing" />}>
      <Stack xstyle={styles.section}>
        <EditorRoot ariaLabel="Native list editor">
          <EditorToolbar aria-label="Native list tools">
            <EditorListButton listType="bullet" />
          </EditorToolbar>
          <EditorContent placeholder="Write list items…" />
        </EditorRoot>
      </Stack>
    </Box>
  )
}

function NativeCodeEditor() {
  return (
    <Box render={<section aria-label="Native code keyboard editing" />}>
      <Stack xstyle={styles.section}>
        <EditorRoot ariaLabel="Native code editor">
          <EditorToolbar aria-label="Native code tools">
            <EditorBlockButton block="code" />
          </EditorToolbar>
          <EditorContent placeholder="Write code…" />
        </EditorRoot>
      </Stack>
    </Box>
  )
}

export function PublicTabbableExample() {
  return (
    <Stack xstyle={styles.root}>
      <TabbableEditor />
      <NativeListEditor />
      <NativeCodeEditor />
    </Stack>
  )
}
