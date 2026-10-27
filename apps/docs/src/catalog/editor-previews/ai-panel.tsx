"use client"

import type { EditorAiConfig } from "@yopem-ui/editor"
import type { ChangeEvent } from "react"

import { useStableCallback } from "@base-ui/utils/useStableCallback"
import { Box } from "@registry/components/ui/box"
import { Button } from "@registry/components/ui/button"
import { Input } from "@registry/components/ui/input"
import { Stack } from "@registry/components/ui/stack"
import { Text } from "@registry/components/ui/text"
import {
  EditorRoot,
  EditorContent,
  EditorHistoryButton,
  EditorToolbar,
  EditorAiRoot,
  EditorAiTrigger,
  EditorAiPanel,
} from "@yopem-ui/editor"
import { useState } from "react"

export function Preview() {
  const [endpoint, setEndpoint] = useState("")
  const [documentId, setDocumentId] = useState("")
  const [csrf, setCsrf] = useState("")
  const [config, setConfig] = useState<EditorAiConfig>()

  const handleEndpointChange = useStableCallback(function handleEndpointChange(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    setEndpoint(event.target.value)
  })

  const handleDocumentIdChange = useStableCallback(
    function handleDocumentIdChange(event: ChangeEvent<HTMLInputElement>) {
      setDocumentId(event.target.value)
    },
  )

  const handleCsrfChange = useStableCallback(function handleCsrfChange(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    setCsrf(event.target.value)
  })

  const configure = useStableCallback(function configure() {
    setConfig({
      endpoint,
      documentId,
      headers: () => ({ "x-csrf-token": csrf }),
    })
  })

  return (
    <Box render={<section />} aria-label="Host AI setup">
      <Stack>
        <Text>
          No endpoint is configured. Supply your authorized same-origin
          endpoint, document ID, and CSRF token. Requests can incur charges.
        </Text>
        <Input
          aria-label="Host endpoint"
          value={endpoint}
          disabled={!!config}
          onChange={handleEndpointChange}
        />
        <Input
          aria-label="Host document ID"
          value={documentId}
          disabled={!!config}
          onChange={handleDocumentIdChange}
        />
        <Input
          aria-label="Host CSRF token"
          type="password"
          autoComplete="off"
          value={csrf}
          disabled={!!config}
          onChange={handleCsrfChange}
        />
        <Button
          disabled={!!config || !endpoint || !documentId || !csrf}
          onClick={configure}
        >
          Configure AI
        </Button>
        <EditorRoot ariaLabel="EditorAiPanel preview">
          <EditorToolbar>
            <EditorHistoryButton action="undo" />
          </EditorToolbar>
          <EditorContent />
          <EditorAiRoot config={config}>
            <EditorAiTrigger operation="generate" />
            <EditorAiTrigger operation="rewrite" />
            <EditorAiTrigger operation="copilot" />
            <EditorAiPanel />
          </EditorAiRoot>
        </EditorRoot>
      </Stack>
    </Box>
  )
}
