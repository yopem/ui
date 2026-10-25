"use client"

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
import { useState } from "react"

const extensions = [EditorAutoformatExtension]

export function PublicAutoformatExample() {
  const [editable, setEditable] = useState(true)
  const [revision, setRevision] = useState(0)

  function toggleEditable() {
    setEditable((value) => !value)
  }

  function resetDocument() {
    setRevision((value) => value + 1)
  }

  return (
    <Stack>
      <Text>
        Use the native marks and block shortcuts. Additional rules support smart
        quotes, symbols, fractions, Unicode scripts, checklist prefixes, and two
        through six quote prefixes.
      </Text>
      <Text>
        Type &gt;&gt; followed by Space for two nested quotes. Type [ ] followed
        by Space for a checklist. Type --- then Enter for a rule.
      </Text>
      <Text>
        Guillemet shortcuts require preceding text or whitespace so a line-start
        quote prefix stays available. Fraction shortcuts require a word
        boundary. Programmatic imports and code contexts must retain literal
        input.
      </Text>
      <Button onClick={toggleEditable} aria-pressed={!editable}>
        {editable
          ? "Make input-rule editor read-only"
          : "Enable input-rule editing"}
      </Button>
      <Button onClick={resetDocument} disabled={!editable}>
        Reset input-rule document
      </Button>
      <EditorRoot
        key={revision}
        extensions={extensions}
        editable={editable}
        ariaLabel="Extended input rules"
      >
        <EditorToolbar aria-label="Input-rule controls">
          <EditorFormatButton format="code" />
          <EditorBlockButton block="code" />
          <EditorHistoryButton action="undo" />
          <EditorHistoryButton action="redo" />
        </EditorToolbar>
        <EditorContent />
      </EditorRoot>
      <Text>
        These added rules do not replace the base Markdown registration.
        Clipboard, IME, inline-code history, overlapping substitutions, and
        nested quote editing remain runtime-unverified.
      </Text>
    </Stack>
  )
}
