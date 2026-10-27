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
import {
  EditorAutoformatExtension,
  type EditorAutoformatTransformer,
} from "@yopem-ui/editor/autoformat"
import { configExtension } from "lexical"
import { useReducer } from "react"

const extensions = [EditorAutoformatExtension]

const hostRule: EditorAutoformatTransformer = {
  dependencies: [],
  type: "text-match",
  trigger: ")",
  regExp: /\(ok\)$/u,
  replace(node) {
    node.setTextContent("✓")
    node.selectEnd()

    return node
  },
}

const hostExtensions = [
  configExtension(EditorAutoformatExtension, {
    transformers: [hostRule],
    includeBuiltInRules: false,
  }),
]

export function PublicAutoformatExample() {
  const [editable, toggleEditable] = useReducer(
    (current: boolean) => !current,
    true,
  )

  const [revision, resetDocument] = useReducer(
    (current: number) => current + 1,
    0,
  )

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
        Type (ok) in this independent editor for a host-defined replacement.
        Extended built-in rules are off here. Base Markdown shortcuts remain
        available.
      </Text>
      <EditorRoot
        key={`host:${revision}`}
        data-testid="host-input-rule-example"
        extensions={hostExtensions}
        editable={editable}
        ariaLabel="Host input rules"
      >
        <EditorToolbar aria-label="Host input-rule controls">
          <EditorFormatButton format="code" />
          <EditorHistoryButton action="undo" />
          <EditorHistoryButton action="redo" />
        </EditorToolbar>
        <EditorContent />
      </EditorRoot>
      <Text>
        These added rules do not replace the base Markdown registration.
        Clipboard, IME, inline-code history, custom callbacks, overlapping
        substitutions, and nested quote editing remain runtime-unverified.
      </Text>
    </Stack>
  )
}
