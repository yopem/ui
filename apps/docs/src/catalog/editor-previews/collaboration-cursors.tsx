"use client"

import type { EditorCollaborationController } from "@yopem-ui/editor/collaboration"

import { useStableCallback } from "@base-ui/utils/useStableCallback"
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
import { useState, type ChangeEvent } from "react"

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

  const changeDocumentId = useStableCallback(function changeDocumentId(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    setDocumentId(event.target.value)
  })

  const changeTicketUrl = useStableCallback(function changeTicketUrl(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    setTicketUrl(event.target.value)
  })

  const changeSocketUrl = useStableCallback(function changeSocketUrl(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    setSocketUrl(event.target.value)
  })

  const changeCsrf = useStableCallback(function changeCsrf(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    setCsrf(event.target.value)
  })

  const connect = useStableCallback(function connect() {
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
  })

  const closeCollaboration = useStableCallback(function closeCollaboration() {
    if (!controller) return
    controller.destroy()
    setController(null)
  })

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
          <Button onClick={closeCollaboration}>Close</Button>
        </>
      ) : (
        <>
          <Input
            aria-label="Document ID"
            value={documentId}
            onChange={changeDocumentId}
          />
          <Input
            aria-label="Ticket endpoint"
            value={ticketUrl}
            onChange={changeTicketUrl}
          />
          <Input
            aria-label="WebSocket endpoint"
            value={socketUrl}
            onChange={changeSocketUrl}
          />
          <Input
            aria-label="CSRF token"
            type="password"
            autoComplete="off"
            value={csrf}
            onChange={changeCsrf}
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
