"use client"

import type { EditorAiConfig } from "@yopem-ui/editor/ai/client"

import { useStableCallback } from "@base-ui/utils/useStableCallback"
import { Box } from "@registry/components/ui/box"
import { Button } from "@registry/components/ui/button"
import { Field, FieldLabel } from "@registry/components/ui/field"
import { HStack } from "@registry/components/ui/hstack"
import { Input } from "@registry/components/ui/input"
import { Stack } from "@registry/components/ui/stack"
import { Text } from "@registry/components/ui/text"
import {
  EditorAiPanel,
  EditorAiRoot,
  EditorAiTrigger,
  EditorContent,
  EditorHistoryButton,
  EditorRoot,
  EditorToolbar,
} from "@yopem-ui/editor"
import { validateEditorAiConfig } from "@yopem-ui/editor/ai/client"
import { EditorCursorOverlay } from "@yopem-ui/editor/cursor-overlay"
import { useId, useReducer, useRef, useState } from "react"

const initialState = JSON.stringify({
  root: {
    type: "root",
    version: 1,
    direction: null,
    format: "",
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
            text: "Select this text, then move focus to the toolbar.",
            format: 0,
            detail: 0,
            mode: "normal",
            style: "",
          },
        ],
      },
    ],
  },
})

function toggleState(current: boolean) {
  return !current
}

export function PublicCursorsExample() {
  const fieldId = useId()
  const endpointRef = useRef<HTMLInputElement>(null)
  const documentIdRef = useRef<HTMLInputElement>(null)
  const csrfRef = useRef<HTMLInputElement>(null)
  const [editable, toggleEditable] = useReducer(toggleState, true)
  const [overlayMounted, toggleOverlay] = useReducer(toggleState, true)
  const [config, setConfig] = useState<EditorAiConfig>()
  const [error, setError] = useState("")

  const configureAi = useStableCallback(function configureAi() {
    const endpoint = endpointRef.current?.value ?? ""
    const documentId = documentIdRef.current?.value ?? ""
    const csrf = csrfRef.current?.value ?? ""

    if (!csrf.trim()) {
      setError("Enter a CSRF token before configuring AI.")

      return
    }

    const next: EditorAiConfig = {
      endpoint,
      documentId,
      headers: () => ({ "x-csrf-token": csrf }),
    }

    try {
      validateEditorAiConfig(next, window.location.origin)

      if (csrfRef.current) csrfRef.current.value = ""
      setConfig(next)
      setError("")
    } catch {
      setError("Use a valid same-origin endpoint, document ID, and CSRF token.")
    }
  })

  return (
    <Stack>
      <Text>
        Drag text into the editor to see its native drop caret. Select text,
        then focus a toolbar control or the configured AI panel to see its
        retained highlight. Native keyboard editing remains unchanged.
      </Text>
      <Box render={<section />} aria-label="Cursor overlay AI host setup">
        <Stack>
          <Text>
            AI setup is optional. The editor works before setup. No endpoint or
            model is preconfigured. No request starts until you request a
            proposal.
          </Text>
          <Text>
            Use a same-origin endpoint, document ID, and CSRF token. Your server
            must authenticate the user, verify CSRF, and return literal true for
            ai:invoke for this user and document.
          </Text>
          <Text>
            Client setup does not grant permission. Your server chooses the
            model and enforces quota. Requests can incur charges.
          </Text>
          <Field>
            <FieldLabel htmlFor={`${fieldId}-endpoint`}>
              Host endpoint
            </FieldLabel>
            <Input
              id={`${fieldId}-endpoint`}
              aria-label="Host endpoint"
              ref={endpointRef}
              disabled={config !== undefined}
              required
            />
          </Field>
          <Field>
            <FieldLabel htmlFor={`${fieldId}-document`}>
              Host document ID
            </FieldLabel>
            <Input
              id={`${fieldId}-document`}
              aria-label="Host document ID"
              ref={documentIdRef}
              disabled={config !== undefined}
              required
            />
          </Field>
          <Field>
            <FieldLabel htmlFor={`${fieldId}-csrf`}>Host CSRF token</FieldLabel>
            <Input
              id={`${fieldId}-csrf`}
              aria-label="Host CSRF token"
              type="password"
              autoComplete="off"
              ref={csrfRef}
              disabled={config !== undefined}
              required
            />
          </Field>
          <Button
            type="button"
            disabled={config !== undefined}
            onClick={configureAi}
          >
            Configure AI
          </Button>
          {error ? <Text role="alert">{error}</Text> : null}
          {config ? (
            <Text>
              Host request settings stay fixed until this example unmounts.
            </Text>
          ) : null}
        </Stack>
      </Box>
      <HStack>
        <Button type="button" variant="outline" onClick={toggleEditable}>
          {editable ? "Make editor read-only" : "Restore editing"}
        </Button>
        <Button type="button" variant="outline" onClick={toggleOverlay}>
          {overlayMounted ? "Unmount cursor overlay" : "Mount cursor overlay"}
        </Button>
      </HStack>
      <EditorRoot
        ariaLabel="Public cursor overlay editor"
        editable={editable}
        initialState={initialState}
      >
        <EditorToolbar aria-label="Editor controls">
          <EditorHistoryButton action="undo" />
          <EditorHistoryButton action="redo" />
          <Button variant="outline" type="button">
            Focused toolbar control
          </Button>
          {config ? (
            <EditorAiRoot config={config}>
              <EditorAiTrigger operation="rewrite" />
              <EditorAiPanel />
            </EditorAiRoot>
          ) : null}
        </EditorToolbar>
        <EditorContent placeholder="Enter text" />
        {overlayMounted ? <EditorCursorOverlay /> : null}
      </EditorRoot>
    </Stack>
  )
}
