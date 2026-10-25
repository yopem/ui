"use client"

import type {
  WordClipboardImage,
  WordClipboardImageResolver,
} from "@yopem-ui/editor/word-clipboard-model"

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
import {
  mediaSchema,
  parseMedia,
  type MediaInput,
} from "@yopem-ui/editor/media"
import { MediaExtension } from "@yopem-ui/editor/media"
import {
  EditorWordClipboardExtension,
  registerWordClipboardPaste,
} from "@yopem-ui/editor/word-clipboard"
import { useState } from "react"
import { z } from "zod"

const extensions = [
  EditorBlockPresentationExtension,
  EditorTablePresentationExtension,
  EditorListPresentationExtension,
  MediaExtension,
  EditorWordClipboardExtension,
]

const maxImageMappings = 50

const maxImageMappingSourceLength = 1_048_576

const imageMappingsSchema = z
  .array(
    z.strictObject({
      source: z.string().min(1).max(maxImageMappingSourceLength),
      media: mediaSchema,
    }),
  )
  .max(maxImageMappings)
  .optional()

export interface PublicWordClipboardImageMapping {
  readonly source: string
  readonly media: MediaInput
}

interface WordClipboardControlsProps {
  readonly resolveImage?: WordClipboardImageResolver
}

function createImageResolver(
  imageMappings: readonly PublicWordClipboardImageMapping[] | undefined,
): WordClipboardImageResolver | undefined {
  const parsed = imageMappingsSchema.safeParse(imageMappings)

  if (!parsed.success) throw new Error("Invalid Word image mappings.")
  const mappings = parsed.data

  if (!mappings?.length) return undefined

  const mediaBySource = new Map<string, MediaInput>()
  let totalSourceLength = 0

  for (const mapping of mappings) {
    if (mediaBySource.has(mapping.source))
      throw new Error("Word image mappings need unique source keys.")

    totalSourceLength += mapping.source.length

    if (totalSourceLength > maxImageMappingSourceLength)
      throw new Error("Word image mapping sources exceed the host limit.")

    let media: MediaInput

    try {
      media = parseMedia(mapping.media)

      if (media.kind !== "image")
        throw new Error("Word image mapping must resolve to an image.")
    } catch {
      throw new Error("Word image mappings need validated image media.")
    }

    mediaBySource.set(mapping.source, media)
  }

  return function resolveImage(image: WordClipboardImage) {
    const media = mediaBySource.get(image.source)

    if (!media) throw new Error("Word image is not approved by the host.")

    return media
  }
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
  readonly imageMappings?: readonly PublicWordClipboardImageMapping[]
}

export function PublicWordClipboardExample({
  imageMappings,
}: PublicWordClipboardExampleProps) {
  const [resolveImage] = useState(() => createImageResolver(imageMappings))

  return (
    <Box
      render={<section aria-labelledby="public-word-clipboard-title" />}
      data-testid="public-word-clipboard"
    >
      <Stack>
        <Heading id="public-word-clipboard-title">Word clipboard paste</Heading>
        <Text>
          Paste supported Word text, lists, and tables. Formatting uses a
          bounded subset. Images stay rejected unless the host supplies exact,
          validated mappings before root creation. Keep mappings fixed until
          remount.
        </Text>
        <EditorRoot ariaLabel="Word clipboard editor" extensions={extensions}>
          <EditorContent placeholder="Paste content copied from Word…" />
          <WordClipboardControls resolveImage={resolveImage} />
        </EditorRoot>
      </Stack>
    </Box>
  )
}
