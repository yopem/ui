"use client"

import { Button } from "@registry/components/ui/button"
import { Field, FieldLabel } from "@registry/components/ui/field"
import { Input } from "@registry/components/ui/input"
import { Stack } from "@registry/components/ui/stack"
import { Text } from "@registry/components/ui/text"
import {
  EditorContent,
  EditorHistoryButton,
  EditorFormatButton,
  EditorRoot,
  EditorToolbar,
} from "@yopem-ui/editor"
import { useId, useState } from "react"
import { z } from "zod"

const fixtureIdSchema = z.enum([
  "basic-blocks",
  "basic-marks",
  "list-classic",
  "link",
])

const elementFields = { direction: null, format: "", indent: 0, version: 1 }

function fixtureText(text: string, format = 0) {
  return {
    type: "text",
    version: 1,
    detail: 0,
    format,
    mode: "normal",
    style: "",
    text,
  }
}

function createFixtureDocument(id: z.infer<typeof fixtureIdSchema>) {
  const children =
    id === "basic-blocks"
      ? [
          {
            ...elementFields,
            type: "heading",
            tag: "h1",
            children: [fixtureText("Native fixture heading")],
          },
          {
            ...elementFields,
            type: "paragraph",
            children: [
              fixtureText(
                "Edit one fresh document without changing the other.",
              ),
            ],
          },
          {
            ...elementFields,
            type: "quote",
            children: [fixtureText("Independent native quote")],
          },
        ]
      : id === "basic-marks"
        ? [
            {
              ...elementFields,
              type: "paragraph",
              children: [
                fixtureText("Bold", 1),
                fixtureText(" and "),
                fixtureText("italic", 2),
              ],
            },
          ]
        : id === "list-classic"
          ? [
              {
                ...elementFields,
                type: "list",
                listType: "bullet",
                tag: "ul",
                start: 1,
                children: [
                  {
                    ...elementFields,
                    type: "listitem",
                    value: 1,
                    children: [fixtureText("First native item")],
                  },
                  {
                    ...elementFields,
                    type: "listitem",
                    value: 2,
                    children: [fixtureText("Second native item")],
                  },
                ],
              },
            ]
          : [
              {
                ...elementFields,
                type: "paragraph",
                children: [
                  fixtureText("Open "),
                  {
                    ...elementFields,
                    type: "link",
                    url: "https://example.com/reference",
                    target: null,
                    rel: null,
                    title: null,
                    children: [fixtureText("Reference")],
                  },
                ],
              },
            ]

  return JSON.stringify({ root: { ...elementFields, type: "root", children } })
}

function createFixturePair(
  id: z.infer<typeof fixtureIdSchema>,
  revision: number,
) {
  return {
    id,
    revision,
    first: createFixtureDocument(id),
    second: createFixtureDocument(id),
  }
}

export function PublicDemoHostExample() {
  const inputId = useId()
  const [input, setInput] = useState("basic-blocks")

  const [mounted, setMounted] = useState(() =>
    createFixturePair("basic-blocks", 0),
  )

  const [error, setError] = useState("")

  function loadFixture() {
    const parsed = fixtureIdSchema.safeParse(input)

    if (!parsed.success) {
      setError("Choose a supported canonical fixture ID.")

      return
    }

    setMounted((previous) =>
      createFixturePair(parsed.data, previous.revision + 1),
    )
    setError("")
  }

  return (
    <Stack>
      <Text>
        Choose basic-blocks, basic-marks, list-classic, or link. Load creates
        fresh native values for two independent roots.
      </Text>
      <Text>
        These are local Lexical fixtures for the named public families, not
        imported Slate state or a complete upstream fixture inventory.
      </Text>
      <Field>
        <FieldLabel htmlFor={inputId}>Canonical fixture ID</FieldLabel>
        <Input
          id={inputId}
          value={input}
          maxLength={64}
          onChange={(event) => setInput(event.currentTarget.value)}
        />
      </Field>
      <Button onClick={loadFixture}>Load fresh fixture roots</Button>
      {error ? <Text role="alert">{error}</Text> : null}
      <EditorRoot
        key={`first-${mounted.id}-${mounted.revision}`}
        ariaLabel="First fixture document"
        initialState={mounted.first}
      >
        <EditorToolbar aria-label="First fixture tools">
          <EditorFormatButton format="bold" />
          <EditorHistoryButton action="undo" />
          <EditorHistoryButton action="redo" />
        </EditorToolbar>
        <EditorContent />
      </EditorRoot>
      <EditorRoot
        key={`second-${mounted.id}-${mounted.revision}`}
        ariaLabel="Second fixture document"
        initialState={mounted.second}
      >
        <EditorToolbar aria-label="Second fixture tools">
          <EditorFormatButton format="bold" />
          <EditorHistoryButton action="undo" />
          <EditorHistoryButton action="redo" />
        </EditorToolbar>
        <EditorContent />
      </EditorRoot>
    </Stack>
  )
}
