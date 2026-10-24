"use client"

import type { EditorCollaborationController } from "@yopem-ui/editor/collaboration"

import { Button } from "@registry/components/ui/button"
import { Input } from "@registry/components/ui/input"
import { Stack } from "@registry/components/ui/stack"
import { Text } from "@registry/components/ui/text"
import {
  EditorContent,
  EditorHistoryButton,
  EditorRoot,
  EditorToolbar,
} from "@yopem-ui/editor"
import {
  createEditorCollaboration,
  EditorCollaborationAwareness,
  EditorCollaborationCursors,
  EditorCollaborationRoot,
  EditorCollaborationStatus,
} from "@yopem-ui/editor/collaboration"
import { useState } from "react"

function SharedEditor({
  controller,
}: {
  controller: EditorCollaborationController
}) {
  const [extensions] = useState(() => [controller.extension])

  return (
    <EditorRoot extensions={extensions} ariaLabel="Remote cursor preview">
      <EditorCollaborationRoot controller={controller}>
        <Stack>
          <EditorCollaborationStatus />
          <EditorCollaborationAwareness />
          <EditorToolbar>
            <EditorHistoryButton action="undo" />
            <EditorHistoryButton action="redo" />
          </EditorToolbar>
          <EditorContent />
          <EditorCollaborationCursors />
        </Stack>
      </EditorCollaborationRoot>
    </EditorRoot>
  )
}

export function Preview() {
  const [documentId, setDocumentId] = useState("")
  const [ticketUrl, setTicketUrl] = useState("")
  const [socketUrl, setSocketUrl] = useState("")
  const [csrf, setCsrf] = useState("")

  const [controller, setController] =
    useState<EditorCollaborationController | null>(null)

  const [error, setError] = useState(false)

  function connect() {
    try {
      setController(
        createEditorCollaboration({
          documentId,
          ticketUrl,
          socketUrl,
          permission: "write",
          headers() {
            return { "X-CSRF-Token": csrf }
          },
        }),
      )
      setError(false)
    } catch {
      setError(true)
    }
  }

  return (
    <Stack>
      <Text>
        Use an initialized host document and authenticated collaboration
        endpoints. Open this document in another client. Select text to show
        remote carets and selections. Each client can undo its own edits. No
        service or credentials are included.
      </Text>
      {controller ? (
        <>
          <SharedEditor controller={controller} />
          <Button
            onClick={() => {
              controller.destroy()
              setController(null)
            }}
          >
            Close
          </Button>
        </>
      ) : (
        <>
          <Input
            aria-label="Document ID"
            value={documentId}
            onChange={(event) => setDocumentId(event.target.value)}
          />
          <Input
            aria-label="Ticket endpoint"
            value={ticketUrl}
            onChange={(event) => setTicketUrl(event.target.value)}
          />
          <Input
            aria-label="WebSocket endpoint"
            value={socketUrl}
            onChange={(event) => setSocketUrl(event.target.value)}
          />
          <Input
            aria-label="CSRF token"
            type="password"
            autoComplete="off"
            value={csrf}
            onChange={(event) => setCsrf(event.target.value)}
          />
          <Button
            disabled={!documentId || !ticketUrl || !socketUrl || !csrf}
            onClick={connect}
          >
            Connect to host
          </Button>
          {error ? (
            <Text role="alert">
              Check document ID and secure endpoint URLs.
            </Text>
          ) : null}
        </>
      )}
    </Stack>
  )
}
