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
import { FileCode2Icon, ListIcon } from "lucide-react"

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
            <EditorListButton
              listType="bullet"
              aria-label="Bullet list"
              title="Bullet list"
              render={<Button variant="ghost" size="icon-sm" />}
            >
              <ListIcon aria-hidden="true" size={16} />
            </EditorListButton>
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
            <EditorBlockButton
              block="code"
              aria-label="Code block"
              title="Code block"
              render={<Button variant="ghost" size="icon-sm" />}
            >
              <FileCode2Icon aria-hidden="true" size={16} />
            </EditorBlockButton>
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
