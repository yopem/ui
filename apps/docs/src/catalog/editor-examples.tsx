"use client"

import { Box } from "@registry/components/ui/box"
import { Button } from "@registry/components/ui/button"
import { Heading } from "@registry/components/ui/heading"
import { HStack } from "@registry/components/ui/hstack"
import { Stack } from "@registry/components/ui/stack"
import { Text } from "@registry/components/ui/text"
import { useEventCallback } from "@registry/hooks/use-event-callback"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"
import { Editor, type EditorProps } from "@yopem-ui/editor"
import { useState } from "react"

const initialState = JSON.stringify({
  root: {
    children: [
      {
        children: [],
        direction: null,
        format: "",
        indent: 0,
        type: "paragraph",
        version: 1,
        textFormat: 0,
        textStyle: "",
      },
    ],
    direction: null,
    format: "",
    indent: 0,
    type: "root",
    version: 1,
  },
})

const readOnlyState = JSON.stringify({
  root: {
    children: [
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: "normal",
            style: "",
            text: "Read-only content",
            type: "text",
            version: 1,
          },
        ],
        direction: null,
        format: "",
        indent: 0,
        type: "paragraph",
        version: 1,
        textFormat: 0,
        textStyle: "",
      },
    ],
    direction: null,
    format: "",
    indent: 0,
    type: "root",
    version: 1,
  },
})

export function EditorExamples() {
  const [serialized, setSerialized] = useState(initialState)
  const [readOnlyEditable, setReadOnlyEditable] = useState(false)

  function toggleEditing() {
    setReadOnlyEditable((value) => !value)
  }

  const handleChange = useEventCallback(
    (state: Parameters<NonNullable<EditorProps["onChange"]>>[0]) => {
      setSerialized(JSON.stringify(state.toJSON(), null, 2))
    },
  )

  return (
    <Stack>
      <Editor
        id="example-editor"
        data-testid="preset-editor"
        ariaLabel="Rich text editor"
        initialState={initialState}
        placeholder="Write your field notes…"
        onChange={handleChange}
      />
      <Heading render={<h3>Serialized state</h3>} />
      <Text>
        Change the content or formatting to update the Lexical JSON below.
      </Text>
      <Box render={<section />} aria-label="Serialized editor state">
        <Box render={<pre />} tabIndex={0} xstyle={styles.output}>
          {serialized}
        </Box>
      </Box>
      <Heading render={<h3>Read-only example</h3>} />
      <HStack>
        <Button variant="outline" onClick={toggleEditing}>
          {readOnlyEditable ? "Disable editing" : "Enable editing"}
        </Button>
      </HStack>
      <Editor
        ariaLabel="Read-only editor"
        editable={readOnlyEditable}
        initialState={readOnlyState}
      />
    </Stack>
  )
}

const styles = stylex.create({
  output: {
    backgroundColor: tokens["--code"],
    color: tokens["--code-foreground"],
    borderColor: tokens["--border"],
    borderStyle: "solid",
    borderWidth: 1,
    borderRadius: tokens["--radius-md"],
    fontFamily: tokens["--font-mono"],
    fontSize: "0.8125rem",
    lineHeight: 1.75,
    marginBlock: 0,
    maxBlockSize: "24rem",
    overflow: "auto",
    padding: `calc(${tokens["--spacing"]} * 4)`,
  },
})
