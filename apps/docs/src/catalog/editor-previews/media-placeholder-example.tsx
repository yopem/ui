"use client"

import { Box } from "@registry/components/ui/box"
import { Button } from "@registry/components/ui/button"
import { Stack } from "@registry/components/ui/stack"
import { Text } from "@registry/components/ui/text"
import { Wrap } from "@registry/components/ui/wrap"
import {
  EditorContent,
  EditorHistoryButton,
  EditorRoot,
  EditorToolbar,
  useEditor,
} from "@yopem-ui/editor"
import { exportDocument } from "@yopem-ui/editor/document"
import { MediaExtension } from "@yopem-ui/editor/media"
import {
  createEditorMediaPlaceholder,
  createMediaPlaceholderExtension,
  MediaPlaceholderInsertButton,
  MediaUploadNotification,
} from "@yopem-ui/editor/media-placeholder"
import { $createParagraphNode, $createTextNode, $getRoot } from "lexical"
import { useState } from "react"

function createExample() {
  let pending: ReturnType<typeof Promise.withResolvers<string>> | null = null

  function upload(
    _file: File,
    context: { onProgress: (percent: number) => void },
  ) {
    pending = Promise.withResolvers<string>()
    context.onProgress(35)

    return pending.promise
  }

  const controller = createEditorMediaPlaceholder({ upload })

  return {
    controller,
    extensions: [MediaExtension, createMediaPlaceholderExtension(controller)],
    complete(this: void) {
      pending?.resolve("https://media.test/report.txt")
      pending = null
    },
    fail(this: void) {
      pending?.reject(new Error("Example host failure"))
      pending = null
    },
    changeHost(this: void) {
      controller.configure((file, context) => upload(file, context))
    },
  }
}

function ExampleControls({
  runtime,
}: {
  runtime: ReturnType<typeof createExample>
}) {
  const editor = useEditor()
  const [exported, setExported] = useState("")

  function exportCurrentDocument() {
    try {
      setExported(exportDocument(editor, "json"))
    } catch (error) {
      setExported(
        error instanceof Error ? error.message : "Document export failed.",
      )
    }
  }

  return (
    <Wrap>
      <MediaPlaceholderInsertButton controller={runtime.controller} />
      <Button onClick={runtime.complete}>Complete upload</Button>
      <Button onClick={runtime.fail}>Fail upload</Button>
      <Button onClick={runtime.changeHost}>Change upload host</Button>
      <Button
        onClick={() =>
          editor.update(
            () =>
              $getRoot().append(
                $createParagraphNode().append($createTextNode("Host change")),
              ),
            { discrete: true },
          )
        }
      >
        Change document
      </Button>
      <Button
        onClick={() =>
          editor.setEditorState(
            editor.parseEditorState(
              JSON.stringify(editor.getEditorState().toJSON()),
            ),
          )
        }
      >
        Reload document
      </Button>
      <Button onClick={() => editor.setEditable(!editor.isEditable())}>
        Toggle read only
      </Button>
      <Button onClick={exportCurrentDocument}>Export document</Button>
      <Box render={<output />} hidden data-slot="placeholder-document-export">
        {exported}
      </Box>
      <EditorHistoryButton action="undo" />
      <EditorHistoryButton action="redo" />
    </Wrap>
  )
}

function ExampleRoot({ number }: { number: number }) {
  const [runtime] = useState(createExample)

  return (
    <Box
      render={<section />}
      aria-label={`Media placeholder example ${number}`}
    >
      <EditorRoot
        extensions={runtime.extensions}
        ariaLabel={`Placeholder content ${number}`}
      >
        <EditorToolbar aria-label={`Placeholder tools ${number}`}>
          <ExampleControls runtime={runtime} />
        </EditorToolbar>
        <EditorContent />
        <MediaUploadNotification controller={runtime.controller} />
      </EditorRoot>
    </Box>
  )
}

export function MediaPlaceholderExample() {
  return (
    <Stack>
      <Text>
        This local fixture does not upload files. Select a file, then complete
        or fail its upload. Cancellation retains capacity until completion.
      </Text>
      <ExampleRoot number={1} />
      <ExampleRoot number={2} />
    </Stack>
  )
}
