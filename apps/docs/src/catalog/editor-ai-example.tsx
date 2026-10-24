import type { EditorAiConfig } from "@yopem-ui/editor"

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

export function EditorAiExample() {
  const [endpoint, setEndpoint] = useState("")
  const [documentId, setDocumentId] = useState("")
  const [csrf, setCsrf] = useState("")
  const [config, setConfig] = useState<EditorAiConfig>()

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
          onChange={(event) => setEndpoint(event.target.value)}
        />
        <Input
          aria-label="Host document ID"
          value={documentId}
          disabled={!!config}
          onChange={(event) => setDocumentId(event.target.value)}
        />
        <Input
          aria-label="Host CSRF token"
          type="password"
          autoComplete="off"
          value={csrf}
          disabled={!!config}
          onChange={(event) => setCsrf(event.target.value)}
        />
        <Button
          disabled={!!config || !endpoint || !documentId || !csrf}
          onClick={() =>
            setConfig({
              endpoint,
              documentId,
              headers: () => ({ "x-csrf-token": csrf }),
            })
          }
        >
          Configure AI
        </Button>
        <EditorRoot ariaLabel="AI example editor">
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
