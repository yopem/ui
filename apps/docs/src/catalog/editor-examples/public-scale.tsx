"use client"

import { Box } from "@registry/components/ui/box"
import { Button } from "@registry/components/ui/button"
import { Field, FieldLabel } from "@registry/components/ui/field"
import { NativeSelect } from "@registry/components/ui/native-select"
import { Stack } from "@registry/components/ui/stack"
import { Text } from "@registry/components/ui/text"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"
import {
  EditorContent,
  EditorHistoryButton,
  EditorRoot,
  EditorToolbar,
} from "@yopem-ui/editor"
import { type ChangeEvent, useId, useState } from "react"

const paragraphCounts = [100, 250, 500] as const

const editorCounts = [100, 200] as const

const editorFixtures = Array.from({ length: 200 }, (_, index) => ({
  id: `independent-${index + 1}`,
  number: index + 1,
}))

const styles = stylex.create({
  document: { maxBlockSize: "32rem", overflowY: "auto" },
  editorList: {
    borderColor: tokens["--border"],
    borderRadius: tokens["--radius-md"],
    borderStyle: "solid",
    borderWidth: 1,
    maxBlockSize: "32rem",
    overflowY: "auto",
    outlineStyle: { default: "none", ":focus-visible": "solid" },
    outlineWidth: 2,
    outlineColor: tokens["--ring"],
    outlineOffset: 2,
    padding: `calc(${tokens["--spacing"]} * 4)`,
  },
})

function createLongDocumentState(
  paragraphCount: (typeof paragraphCounts)[number],
) {
  return JSON.stringify({
    root: {
      type: "root",
      version: 1,
      direction: null,
      format: "",
      indent: 0,
      children: Array.from({ length: paragraphCount }, (_, index) => ({
        type: "paragraph",
        version: 1,
        direction: null,
        format: "",
        indent: 0,
        textFormat: 0,
        textStyle: "",
        children: [
          {
            type: "text",
            version: 1,
            detail: 0,
            format: 0,
            mode: "normal",
            style: "",
            text: `Paragraph ${index + 1}: This local fixture uses native Lexical content.`,
          },
        ],
      })),
    },
  })
}

export function PublicScaleExample() {
  const documentCountId = useId()
  const editorCountId = useId()

  const [paragraphCount, setParagraphCount] =
    useState<(typeof paragraphCounts)[number]>(100)

  const [editorCount, setEditorCount] =
    useState<(typeof editorCounts)[number]>(100)

  const [documentState, setDocumentState] = useState<string | null>(null)

  const [mountedEditorCount, setMountedEditorCount] = useState<
    (typeof editorCounts)[number] | null
  >(null)

  function changeParagraphCount(event: ChangeEvent<HTMLSelectElement>) {
    const value = paragraphCounts.find(
      (count) => String(count) === event.currentTarget.value,
    )

    if (value) setParagraphCount(value)
  }

  function changeEditorCount(event: ChangeEvent<HTMLSelectElement>) {
    const value = editorCounts.find(
      (count) => String(count) === event.currentTarget.value,
    )

    if (value) setEditorCount(value)
  }

  function openLongDocument() {
    setMountedEditorCount(null)
    setDocumentState(createLongDocumentState(paragraphCount))
  }

  function openIndependentEditors() {
    setDocumentState(null)
    setMountedEditorCount(editorCount)
  }

  function closeLongDocument() {
    setDocumentState(null)
  }

  function closeIndependentEditors() {
    setMountedEditorCount(null)
  }

  return (
    <Stack>
      <Text role="note">
        Scale fixtures stay closed until you open one. They use local native
        editors and browser memory. Opening one fixture unmounts the other. They
        do not measure performance.
      </Text>
      <Stack>
        <Text>Long document</Text>
        {documentState === null ? (
          <>
            <Text role="note">
              Choose up to 500 paragraphs. Building this document uses browser
              memory and may slow this tab. Reset it to unmount the document.
            </Text>
            <Field>
              <FieldLabel htmlFor={documentCountId}>
                Document block count
              </FieldLabel>
              <NativeSelect
                id={documentCountId}
                value={String(paragraphCount)}
                onChange={changeParagraphCount}
              >
                {paragraphCounts.map((count) => (
                  <option key={count} value={count}>
                    {count} blocks
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Button onClick={openLongDocument}>
              Open long-document fixture
            </Button>
          </>
        ) : (
          <Stack>
            <EditorRoot
              ariaLabel="Long document fixture"
              initialState={documentState}
            >
              <EditorToolbar aria-label="Long document history">
                <EditorHistoryButton action="undo" />
                <EditorHistoryButton action="redo" />
              </EditorToolbar>
              <EditorContent
                placeholder="Edit the bounded local document"
                xstyle={styles.document}
              />
            </EditorRoot>
            <Button onClick={closeLongDocument}>
              Reset and unmount long document
            </Button>
          </Stack>
        )}
      </Stack>
      <Stack>
        <Text>Independent editors</Text>
        {mountedEditorCount === null ? (
          <>
            <Text role="note">
              Choose 100 or 200 separate editor roots. Each root keeps its own
              document. Mounting them uses browser memory and may slow this tab.
              Unmount them to release the roots. This is not a collaboration
              session or a performance result.
            </Text>
            <Field>
              <FieldLabel htmlFor={editorCountId}>
                Independent editor count
              </FieldLabel>
              <NativeSelect
                id={editorCountId}
                value={String(editorCount)}
                onChange={changeEditorCount}
              >
                {editorCounts.map((count) => (
                  <option key={count} value={count}>
                    {count} editors
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Button onClick={openIndependentEditors}>
              Open independent-editor fixture
            </Button>
          </>
        ) : (
          <Stack>
            <Box
              render={<section aria-label="Independent editor list" />}
              tabIndex={0}
              xstyle={styles.editorList}
            >
              <Stack>
                {editorFixtures.slice(0, mountedEditorCount).map((fixture) => (
                  <EditorRoot
                    key={fixture.id}
                    ariaLabel={`Independent editor ${fixture.number}`}
                    initialState={JSON.stringify({
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
                                text: `Independent root ${fixture.number}`,
                              },
                            ],
                          },
                        ],
                      },
                    })}
                  >
                    <EditorContent placeholder="Write in this local editor" />
                  </EditorRoot>
                ))}
              </Stack>
            </Box>
            <Button onClick={closeIndependentEditors}>
              Unmount independent editors
            </Button>
          </Stack>
        )}
      </Stack>
    </Stack>
  )
}
