"use client"

import type { EditorCopilotConfig } from "@yopem-ui/editor/copilot"

import { Box } from "@registry/components/ui/box"
import { Button } from "@registry/components/ui/button"
import { Checkbox } from "@registry/components/ui/checkbox"
import { Input } from "@registry/components/ui/input"
import { Label } from "@registry/components/ui/label"
import { Stack } from "@registry/components/ui/stack"
import { Text } from "@registry/components/ui/text"
import {
  EditorContent,
  EditorHistoryButton,
  EditorRoot,
  EditorToolbar,
} from "@yopem-ui/editor"
import { validateEditorAiConfig } from "@yopem-ui/editor/ai/client"
import { EditorCopilot } from "@yopem-ui/editor/copilot"
import { useRef, useState } from "react"

export function PublicCopilotExample() {
  const endpointRef = useRef<HTMLInputElement>(null)
  const documentIdRef = useRef<HTMLInputElement>(null)
  const csrfRef = useRef<HTMLInputElement>(null)
  const automaticRef = useRef<HTMLInputElement>(null)
  const [config, setConfig] = useState<EditorCopilotConfig>()
  const [error, setError] = useState("")

  function configure() {
    const endpoint = endpointRef.current?.value ?? ""
    const documentId = documentIdRef.current?.value ?? ""
    const csrf = csrfRef.current?.value ?? ""

    const hostAllowsAutomatic = automaticRef.current?.checked === true

    if (!csrf.trim()) {
      setError("Enter a CSRF token before configuring Copilot.")

      return
    }

    const next: EditorCopilotConfig = {
      endpoint,
      documentId,
      headers: () => ({ "x-csrf-token": csrf }),
    }

    if (hostAllowsAutomatic) next.allowAutomatic = true

    try {
      validateEditorAiConfig(next, window.location.origin)
      setConfig(next)
      setError("")
    } catch {
      setError("Use a valid same-origin endpoint, document ID, and CSRF token.")
    }
  }

  return (
    <Box render={<section />} aria-label="Copilot host setup">
      <Stack>
        {config ? (
          <Text>Host request settings are configured for this example.</Text>
        ) : (
          <Text>
            No endpoint is configured. Supply your same-origin endpoint,
            document ID, and CSRF token. Requests can incur charges.
          </Text>
        )}
        <Text>
          Your server must authenticate requests, verify CSRF and document
          access, choose an authorized model, and enforce quota. No default
          endpoint or model is provided.
        </Text>
        <Input
          aria-label="Host endpoint"
          ref={endpointRef}
          disabled={config !== undefined}
          required
        />
        <Input
          aria-label="Host document ID"
          ref={documentIdRef}
          disabled={config !== undefined}
          required
        />
        <Input
          aria-label="Host CSRF token"
          type="password"
          autoComplete="off"
          ref={csrfRef}
          disabled={config !== undefined}
          required
        />
        <Label>
          <Checkbox
            aria-label="Host allows automatic predictions"
            inputRef={automaticRef}
            defaultChecked={false}
            disabled={config !== undefined}
          />
          Host allows automatic predictions
        </Label>
        <Button disabled={config !== undefined} onClick={configure}>
          Configure Copilot
        </Button>
        {error ? <Text role="alert">{error}</Text> : null}
        {config ? (
          <EditorRoot ariaLabel="Copilot editor">
            <EditorToolbar aria-label="Copilot editor tools">
              <EditorHistoryButton action="undo" />
            </EditorToolbar>
            <EditorContent placeholder="Write a paragraph, then press Control+Space at its end." />
            <EditorCopilot config={config} />
          </EditorRoot>
        ) : (
          <Text>Configure the host before sending any request.</Text>
        )}
      </Stack>
    </Box>
  )
}
