"use client"

import type { EditorState } from "lexical"

import { useStableCallback } from "@base-ui/utils/useStableCallback"
import { Box } from "@registry/components/ui/box"
import { Button } from "@registry/components/ui/button"
import { Stack } from "@registry/components/ui/stack"
import { Text } from "@registry/components/ui/text"
import * as stylex from "@stylexjs/stylex"
import {
  EditorBlockButton,
  EditorBlockPresentationExtension,
  EditorContent,
  EditorFormatButton,
  EditorHistoryButton,
  EditorLinkControl,
  EditorRoot,
  EditorTableButton,
  EditorTableMenu,
  EditorTablePresentationExtension,
  EditorToolbar,
} from "@yopem-ui/editor"
import {
  EditorDocxControls,
  EditorDocxImportControl,
  EditorDocxExportControl,
} from "@yopem-ui/editor/docx/client"
import {
  BoldIcon,
  Heading2Icon,
  ItalicIcon,
  LinkIcon,
  PilcrowIcon,
  QuoteIcon,
  Redo2Icon,
  TableIcon,
  TablePropertiesIcon,
  Undo2Icon,
} from "lucide-react"
import { useReducer, useState, type ReactNode } from "react"

const extensions = [
  EditorBlockPresentationExtension,
  EditorTablePresentationExtension,
]

const initialState = JSON.stringify({
  root: {
    type: "root",
    version: 1,
    direction: null,
    format: "",
    indent: 0,
    children: [
      {
        type: "paragraph",
        version: 1,
        direction: null,
        format: "",
        indent: 0,
        children: [
          {
            type: "text",
            version: 1,
            detail: 0,
            format: 0,
            mode: "normal",
            style: "",
            text: "Edit this document, download it, and import the file into the same native editor.",
          },
        ],
      },
    ],
  },
})

const styles = stylex.create({
  snapshot: {
    whiteSpace: "pre-wrap",
    overflowWrap: "anywhere",
  },
})

export function PublicDocxImportExample() {
  return (
    <PublicDocxExample>
      <EditorDocxImportControl />
    </PublicDocxExample>
  )
}

export function PublicDocxExportExample() {
  return (
    <PublicDocxExample>
      <EditorDocxExportControl />
    </PublicDocxExample>
  )
}

export function PublicDocxExample({ children }: { children?: ReactNode }) {
  const [readOnly, toggleReadOnly] = useReducer(
    (current: boolean) => !current,
    false,
  )

  const [snapshot, setSnapshot] = useState(initialState)

  const change = useStableCallback(function change(state: EditorState) {
    setSnapshot(JSON.stringify(state.toJSON()))
  })

  return (
    <Stack data-testid="public-docx-example">
      <Text>
        Native Word files use a bounded semantic subset. This example does not
        preserve page layout, images, macros, headers, or footers. Unsupported
        content is rejected before document replacement.
      </Text>
      <Text>
        Files have a 1 MiB archive and decoded-data limit. Import uses local
        browser APIs. Cancellation cannot stop synchronous parsing already in
        progress. Runtime and file fidelity checks remain pending.
      </Text>
      <Button onClick={toggleReadOnly}>
        {readOnly ? "Disable Word read-only" : "Enable Word read-only"}
      </Button>
      <EditorRoot
        ariaLabel="Native Word document"
        initialState={initialState}
        editable={!readOnly}
        extensions={extensions}
        onChange={change}
      >
        <EditorToolbar aria-label="Native Word tools">
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
          <EditorFormatButton
            format="bold"
            title="Bold"
            render={<Button variant="ghost" size="icon-sm" />}
          >
            <BoldIcon aria-hidden="true" size={16} />
          </EditorFormatButton>
          <EditorFormatButton
            format="italic"
            title="Italic"
            render={<Button variant="ghost" size="icon-sm" />}
          >
            <ItalicIcon aria-hidden="true" size={16} />
          </EditorFormatButton>
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
          <EditorLinkControl
            aria-label="Link"
            title="Link"
            render={<Button variant="ghost" size="icon-sm" />}
          >
            <LinkIcon aria-hidden="true" size={16} />
          </EditorLinkControl>
          <EditorTableButton
            aria-label="Insert table"
            title="Insert table"
            render={<Button variant="ghost" size="icon-sm" />}
          >
            <TableIcon aria-hidden="true" size={16} />
          </EditorTableButton>
          <EditorTableMenu
            aria-label="Table actions"
            title="Table actions"
            render={<Button variant="ghost" size="icon-sm" />}
          >
            <TablePropertiesIcon aria-hidden="true" size={16} />
          </EditorTableMenu>
        </EditorToolbar>
        <EditorContent />
        {children ?? <EditorDocxControls />}
      </EditorRoot>
      <Box render={<section />} aria-label="Word document JSON">
        <Box render={<pre />} xstyle={styles.snapshot}>
          {snapshot}
        </Box>
      </Box>
    </Stack>
  )
}
