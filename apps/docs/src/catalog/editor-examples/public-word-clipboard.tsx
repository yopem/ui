"use client"

import type { WordClipboardImageResolver } from "@yopem-ui/editor/word-clipboard-model"

import { Box } from "@registry/components/ui/box"
import { Heading } from "@registry/components/ui/heading"
import { Stack } from "@registry/components/ui/stack"
import { Text } from "@registry/components/ui/text"
import {
  EditorBlockPresentationExtension,
  EditorContent,
  EditorHistoryButton,
  EditorRoot,
  EditorTablePresentationExtension,
  EditorToolbar,
  useEditor,
} from "@yopem-ui/editor"
import { registerDocumentPaste } from "@yopem-ui/editor/document"
import { EditorListPresentationExtension } from "@yopem-ui/editor/list-presentation"
import { MediaExtension } from "@yopem-ui/editor/media"
import {
  EditorWordClipboardExtension,
  registerWordClipboardPaste,
} from "@yopem-ui/editor/word-clipboard"
import { useState } from "react"

const extensions = [
  EditorBlockPresentationExtension,
  EditorTablePresentationExtension,
  EditorListPresentationExtension,
  MediaExtension,
  EditorWordClipboardExtension,
]

interface WordClipboardControlsProps {
  readonly resolveImage?: WordClipboardImageResolver
}

function WordClipboardControls({ resolveImage }: WordClipboardControlsProps) {
  const editor = useEditor()
  const [error, setError] = useState("")

  const [connect] = useState(
    () =>
      function connect() {
        const onError = (failure: Error) => setError(failure.message)
        const unregisterDocument = registerDocumentPaste(editor, onError)

        try {
          const unregisterWord = registerWordClipboardPaste(
            editor,
            onError,
            resolveImage ? { resolveImage } : {},
          )

          return () => {
            unregisterWord()
            unregisterDocument()
          }
        } catch (cause) {
          unregisterDocument()
          throw cause
        }
      },
  )

  return (
    <Stack ref={connect}>
      <EditorToolbar aria-label="Word clipboard history">
        <EditorHistoryButton action="undo" />
        <EditorHistoryButton action="redo" />
      </EditorToolbar>
      {error ? <Text role="alert">{error}</Text> : null}
    </Stack>
  )
}

export interface PublicWordClipboardExampleProps {
  readonly resolveImage?: WordClipboardImageResolver
}

export function PublicWordClipboardExample({
  resolveImage,
}: PublicWordClipboardExampleProps) {
  return (
    <Box
      render={<section aria-labelledby="public-word-clipboard-title" />}
      data-testid="public-word-clipboard"
    >
      <Stack>
        <Heading id="public-word-clipboard-title">Word clipboard paste</Heading>
        <Text>
          Paste text, lists, and tables copied from Word. Inline styles and
          paragraph indentation use a bounded subset. Images require an explicit
          host resolver.
        </Text>
        <EditorRoot ariaLabel="Word clipboard editor" extensions={extensions}>
          <EditorContent placeholder="Paste content copied from Word…" />
          <WordClipboardControls resolveImage={resolveImage} />
        </EditorRoot>
      </Stack>
    </Box>
  )
}
