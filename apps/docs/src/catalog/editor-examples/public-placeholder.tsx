"use client"

import { Box } from "@registry/components/ui/box"
import { Button } from "@registry/components/ui/button"
import { Stack } from "@registry/components/ui/stack"
import { Text } from "@registry/components/ui/text"
import { Wrap } from "@registry/components/ui/wrap"
import * as stylex from "@stylexjs/stylex"
import {
  EditorRoot,
  EditorContent,
  EditorToolbar,
  EditorBlockButton,
  EditorHistoryButton,
} from "@yopem-ui/editor"
import { EditorBlockPlaceholder } from "@yopem-ui/editor/block-placeholder"
import { type KeyboardEvent, useState } from "react"

const labels = {
  paragraph: "Write a paragraph",
  h2: "Write a section title",
  quote: "Write a quote",
  code: "Write code",
}

const emptyBlock = {
  version: 1,
  direction: null,
  format: "",
  indent: 0,
  children: [],
}

const initialState = JSON.stringify({
  root: {
    ...emptyBlock,
    type: "root",
    children: [
      {
        ...emptyBlock,
        type: "paragraph",
        children: [
          {
            type: "text",
            version: 1,
            text: "Select an empty block below. Placeholder text is not saved.",
            format: 0,
            detail: 0,
            mode: "normal",
            style: "",
          },
        ],
      },
      { ...emptyBlock, type: "heading", tag: "h2" },
      { ...emptyBlock, type: "paragraph" },
      { ...emptyBlock, type: "quote" },
      { ...emptyBlock, type: "code", language: "javascript" },
    ],
  },
})

const styles = stylex.create({
  json: {
    whiteSpace: "pre-wrap",
    overflowWrap: "anywhere",
    fontSize: "0.75rem",
  },
})

export function PublicPlaceholderExample() {
  const [editable, setEditable] = useState(true)
  const [visible, setVisible] = useState(true)
  const [json, setJson] = useState(initialState)

  function toggleEditable() {
    setEditable((value) => !value)
  }

  function toggleVisible() {
    setVisible((value) => !value)
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (
      !event.defaultPrevented &&
      event.altKey &&
      event.shiftKey &&
      event.key.toLowerCase() === "p"
    ) {
      event.preventDefault()
      toggleVisible()
    }
  }

  return (
    <Stack>
      <Text>
        Select an empty heading, paragraph, quote, or code block. Typing removes
        its visual hint. Alt+Shift+P mounts or removes the placeholder layer
        without changing the document.
      </Text>
      <Wrap>
        <Button onClick={toggleEditable} aria-pressed={!editable}>
          {editable
            ? "Make placeholder editor read-only"
            : "Enable placeholder editing"}
        </Button>
        <Button onClick={toggleVisible} aria-pressed={visible}>
          {visible ? "Hide block placeholders" : "Show block placeholders"}
        </Button>
      </Wrap>
      <EditorRoot
        ariaLabel="Per-block placeholders"
        initialState={initialState}
        editable={editable}
        onKeyDown={onKeyDown}
        onChange={function updateDocument(state) {
          setJson(JSON.stringify(state, null, 2))
        }}
      >
        <EditorToolbar aria-label="Placeholder block controls">
          <EditorBlockButton block="paragraph" />
          <EditorBlockButton block="h2" />
          <EditorHistoryButton action="undo" />
          <EditorHistoryButton action="redo" />
        </EditorToolbar>
        {visible && <EditorBlockPlaceholder labels={labels} />}
        <EditorContent />
      </EditorRoot>
      <Box render={<section />} aria-label="Placeholder document JSON">
        <Box render={<pre />} xstyle={styles.json}>
          {json}
        </Box>
      </Box>
      <Text>
        Hints apply only to focused empty top-level elements. They do not add
        nodes, exported text, or saved metadata. Labels stay fixed until this
        layer unmounts. Screen-reader status, focus, cleanup, and visual
        behavior remain unverified.
      </Text>
    </Stack>
  )
}
