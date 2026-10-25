"use client"

import type {
  WordClipboardImage,
  WordClipboardImageResolver,
} from "@yopem-ui/editor/word-clipboard-model"

import { Box } from "@registry/components/ui/box"
import { Button } from "@registry/components/ui/button"
import { Field, FieldLabel } from "@registry/components/ui/field"
import { Form } from "@registry/components/ui/form"
import { Heading } from "@registry/components/ui/heading"
import { Input } from "@registry/components/ui/input"
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
import { useId, useState, type FormEvent } from "react"
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

const imageLookupSchema = z.strictObject({
  source: z.string().min(1).max(2048),
  url: z.string().min(1).max(2048),
  alt: z.string().min(1).max(2000),
})

function WordImageLookup({
  onConfigure,
}: {
  readonly onConfigure: (mapping: PublicWordClipboardImageMapping) => void
}) {
  const sourceId = useId()
  const urlId = useId()
  const altId = useId()
  const [error, setError] = useState("")
  const [configured, setConfigured] = useState(false)

  function configure(event: FormEvent<HTMLFormElement>) {
    if (event.defaultPrevented) return
    event.preventDefault()
    const fields = new FormData(event.currentTarget)

    const parsed = imageLookupSchema.safeParse({
      source: fields.get("source"),
      url: fields.get("url"),
      alt: fields.get("alt"),
    })

    if (!parsed.success) {
      setError(
        "Supply a bounded exact source, HTTPS URL, and alternative text.",
      )

      return
    }

    try {
      onConfigure({
        source: parsed.data.source,
        media: { kind: "image", url: parsed.data.url, alt: parsed.data.alt },
      })
      setError("")
      setConfigured(true)
    } catch {
      setError(
        "Use an approved HTTPS image URL without credentials, queries, or fragments.",
      )
    }
  }

  return (
    <Form onSubmit={configure}>
      <Stack>
        <Text>
          This local fixture maps one exact Word source to a host-approved
          image. Apply the lookup to reset this local document. Setup makes no
          image request. Hosts must authorize and scan images before they supply
          a mapping.
        </Text>
        <Field>
          <FieldLabel htmlFor={sourceId}>Exact Word image source</FieldLabel>
          <Input id={sourceId} name="source" required maxLength={2048} />
        </Field>
        <Field>
          <FieldLabel htmlFor={urlId}>Approved HTTPS image URL</FieldLabel>
          <Input id={urlId} name="url" type="url" required maxLength={2048} />
        </Field>
        <Field>
          <FieldLabel htmlFor={altId}>
            Approved image alternative text
          </FieldLabel>
          <Input id={altId} name="alt" required maxLength={2000} />
        </Field>
        <Button type="submit" variant="outline">
          Apply image lookup and reset
        </Button>
        {error ? <Text role="alert">{error}</Text> : null}
        {configured ? (
          <Box render={<output />}>Image lookup configured.</Box>
        ) : null}
      </Stack>
    </Form>
  )
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
  const titleId = useId()
  const [editable, setEditable] = useState(true)

  const [session, setSession] = useState(() => ({
    generation: 0,
    resolveImage: createImageResolver(imageMappings),
  }))

  function configureImage(mapping: PublicWordClipboardImageMapping) {
    const resolveImage = createImageResolver([mapping])
    setSession((current) => ({
      generation: current.generation + 1,
      resolveImage,
    }))
  }

  function toggleEditable() {
    setEditable((current) => !current)
  }

  return (
    <Box
      render={<section aria-labelledby={titleId} />}
      data-testid="public-word-clipboard"
    >
      <Stack>
        <Heading id={titleId}>Word clipboard paste</Heading>
        <Text>
          Paste supported Word text, lists, and tables. Formatting uses a
          bounded subset. Images stay rejected unless the host supplies exact,
          validated mappings before root creation. Keep mappings fixed until
          remount.
        </Text>
        {imageMappings === undefined ? (
          <WordImageLookup onConfigure={configureImage} />
        ) : null}
        <Button variant="outline" onClick={toggleEditable}>
          {editable
            ? "Make Word clipboard editor read-only"
            : "Make Word clipboard editor editable"}
        </Button>
        <EditorRoot
          key={session.generation}
          ariaLabel="Word clipboard editor"
          editable={editable}
          extensions={extensions}
        >
          <EditorContent placeholder="Paste content copied from Word…" />
          <WordClipboardControls resolveImage={session.resolveImage} />
        </EditorRoot>
      </Stack>
    </Box>
  )
}
