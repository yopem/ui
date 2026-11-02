"use client"

import type { MouseEvent } from "react"

import { Button } from "@registry/components/ui/button"
import { Checkbox } from "@registry/components/ui/checkbox"
import { Label } from "@registry/components/ui/label"
import { Stack } from "@registry/components/ui/stack"
import { Wrap } from "@registry/components/ui/wrap"
import { EditorContent, EditorRoot } from "@yopem-ui/editor"
import { EditorLinkFloatingToolbar } from "@yopem-ui/editor/floating-toolbar"
import { useReducer, useState } from "react"

const initialState = JSON.stringify({
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
            text: "Visit ",
            detail: 0,
            format: 0,
            mode: "normal",
            style: "",
          },
          {
            type: "link",
            version: 1,
            url: "https://example.com",
            target: null,
            rel: "noreferrer",
            title: null,
            direction: null,
            format: "",
            indent: 0,
            children: [
              {
                type: "text",
                version: 1,
                text: "Example link",
                detail: 0,
                format: 0,
                mode: "normal",
                style: "",
              },
            ],
          },
          {
            type: "text",
            version: 1,
            text: " to try link actions.",
            detail: 0,
            format: 0,
            mode: "normal",
            style: "",
          },
        ],
      },
    ],
  },
})

export function Preview() {
  const [editable, toggleEditable] = useReducer(
    (value: boolean) => !value,
    true,
  )

  const [preventActions, setPreventActions] = useState(false)
  const [preventChanges, setPreventChanges] = useState(false)

  function preventLinkActions(event: MouseEvent<HTMLDivElement>) {
    const action =
      event.target instanceof Element
        ? event.target.closest("button")?.textContent
        : null

    if (
      preventActions ||
      (preventChanges && (action === "Apply link" || action === "Remove link"))
    )
      event.preventDefault()
  }

  function changePreventActions(checked: boolean) {
    setPreventActions(checked)
  }

  return (
    <Stack>
      <Wrap>
        <Button
          variant="outline"
          aria-pressed={!editable}
          onClick={toggleEditable}
        >
          Read only
        </Button>
        <Label>
          <Checkbox
            checked={preventActions}
            onCheckedChange={changePreventActions}
          />
          Prevent link actions
        </Label>
        <Label>
          <Checkbox
            checked={preventChanges}
            onCheckedChange={setPreventChanges}
          />
          Prevent link changes
        </Label>
      </Wrap>
      <EditorRoot
        ariaLabel="Floating link editor"
        initialState={initialState}
        editable={editable}
      >
        <EditorContent />
        <EditorLinkFloatingToolbar onClickCapture={preventLinkActions} />
      </EditorRoot>
    </Stack>
  )
}
