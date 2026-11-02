"use client"

import type { EditorToolbarMenuAction } from "@yopem-ui/editor/toolbar-menus"
import type { MouseEvent } from "react"

import { Box } from "@registry/components/ui/box"
import { Button } from "@registry/components/ui/button"
import { Checkbox } from "@registry/components/ui/checkbox"
import { Label } from "@registry/components/ui/label"
import { Stack } from "@registry/components/ui/stack"
import { Wrap } from "@registry/components/ui/wrap"
import { EditorContent, EditorRoot, useEditor } from "@yopem-ui/editor"
import {
  EditorFixedToolbar,
  EditorFixedToolbarButtons,
} from "@yopem-ui/editor/toolbar-menus"
import { $getRoot } from "lexical"
import { useRef, useState } from "react"

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
            text: "Keep this paragraph",
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

function ToolbarMenuControls({
  preventActions,
  denyConversion,
  changeDocument,
  changeDuringAuthorization,
  revokePermission,
  cycleEditable,
}: {
  preventActions: boolean
  denyConversion: boolean
  changeDocument: boolean
  changeDuringAuthorization: boolean
  revokePermission: boolean
  cycleEditable: boolean
}) {
  const editor = useEditor()
  const authorizationChecks = useRef<number | null>(null)

  function changeHostText() {
    editor.update(() => {
      const text = $getRoot().getAllTextNodes()[0]

      if (text) text.setTextContent(`X${text.getTextContent()}`)
    })
  }

  function authorizeAction(action: EditorToolbarMenuAction) {
    if (authorizationChecks.current !== null) {
      authorizationChecks.current += 1

      if (changeDuringAuthorization) {
        authorizationChecks.current = null
        changeHostText()
      } else if (cycleEditable) {
        authorizationChecks.current = null
        editor.setEditable(false)
        editor.setEditable(true)
      } else if (authorizationChecks.current === 2 && revokePermission) {
        authorizationChecks.current = null

        return false
      }
    }

    return !denyConversion || !action.startsWith("turn:")
  }

  function preventMenuActions(event: MouseEvent<HTMLDivElement>) {
    if (
      !(event.target instanceof Element) ||
      !event.target.closest('[role^="menuitem"]')
    )
      return

    if (preventActions) event.preventDefault()

    if (changeDocument) changeHostText()

    if (changeDuringAuthorization || revokePermission || cycleEditable)
      authorizationChecks.current = 0
  }

  return (
    <EditorFixedToolbar onClickCapture={preventMenuActions}>
      <EditorFixedToolbarButtons authorizeAction={authorizeAction} />
    </EditorFixedToolbar>
  )
}

export function ToolbarMenusExample() {
  const [editable, setEditable] = useState(true)
  const [preventActions, setPreventActions] = useState(false)
  const [denyConversion, setDenyConversion] = useState(false)
  const [changeDocument, setChangeDocument] = useState(false)

  const [changeDuringAuthorization, setChangeDuringAuthorization] =
    useState(false)

  const [revokePermission, setRevokePermission] = useState(false)
  const [cycleEditable, setCycleEditable] = useState(false)

  return (
    <Stack>
      <Wrap>
        <Button
          variant="outline"
          aria-pressed={!editable}
          onClick={() => setEditable(!editable)}
        >
          Read only
        </Button>
      </Wrap>
      <Box render={<details />}>
        <Box render={<summary aria-label="Advanced host checks" />}>
          Advanced host checks
        </Box>
        <Wrap>
          <Label>
            <Checkbox
              checked={preventActions}
              onCheckedChange={setPreventActions}
            />
            Prevent menu actions
          </Label>
          <Label>
            <Checkbox
              checked={denyConversion}
              onCheckedChange={setDenyConversion}
            />
            Deny block conversion
          </Label>
          <Label>
            <Checkbox
              checked={changeDocument}
              onCheckedChange={setChangeDocument}
            />
            Change document on menu action
          </Label>
          <Label>
            <Checkbox
              checked={changeDuringAuthorization}
              onCheckedChange={setChangeDuringAuthorization}
            />
            Change document during menu authorization
          </Label>
          <Label>
            <Checkbox
              checked={revokePermission}
              onCheckedChange={setRevokePermission}
            />
            Revoke menu permission on action
          </Label>
          <Label>
            <Checkbox
              checked={cycleEditable}
              onCheckedChange={setCycleEditable}
            />
            Cycle read only during menu authorization
          </Label>
        </Wrap>
      </Box>
      <EditorRoot
        initialState={initialState}
        editable={editable}
        ariaLabel="Toolbar menu document"
      >
        <ToolbarMenuControls
          preventActions={preventActions}
          denyConversion={denyConversion}
          changeDocument={changeDocument}
          changeDuringAuthorization={changeDuringAuthorization}
          revokePermission={revokePermission}
          cycleEditable={cycleEditable}
        />
        <EditorContent />
      </EditorRoot>
    </Stack>
  )
}
