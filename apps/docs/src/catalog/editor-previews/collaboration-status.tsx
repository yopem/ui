"use client"

import type { EditorCollaborationController } from "@yopem-ui/editor/collaboration"
import type { FormEvent } from "react"

import { useStableCallback } from "@base-ui/utils/useStableCallback"
import { Button } from "@registry/components/ui/button"
import { Form } from "@registry/components/ui/form"
import { Input } from "@registry/components/ui/input"
import { Stack } from "@registry/components/ui/stack"
import { Text } from "@registry/components/ui/text"
import { EditorContent, EditorRoot } from "@yopem-ui/editor"
import {
  createEditorCollaboration,
  EditorCollaborationRoot,
  EditorCollaborationStatus,
  useEditorCollaboration,
} from "@yopem-ui/editor/collaboration"
import { useRef, useState } from "react"
import { z } from "zod"

function StatusEditor({
  controller,
}: {
  controller: EditorCollaborationController
}) {
  const [extensions] = useState(() => [controller.extension])
  const snapshot = useEditorCollaboration(controller)
  const connected = snapshot.status === "connected"

  const busy =
    snapshot.status === "connecting" ||
    snapshot.status === "syncing" ||
    snapshot.status === "reconnecting"

  const toggleConnection = useStableCallback(function toggleConnection() {
    if (controller.provider.getSnapshot().status === "connected")
      controller.provider.disconnect()
    else void controller.provider.reconnect().catch(() => undefined)
  })

  return (
    <EditorRoot extensions={extensions} ariaLabel="Connection status document">
      <EditorCollaborationRoot controller={controller}>
        <Stack>
          <EditorCollaborationStatus />
          <Button disabled={busy} onClick={toggleConnection}>
            {connected ? "Disconnect" : "Reconnect"}
          </Button>
          <EditorContent />
        </Stack>
      </EditorCollaborationRoot>
    </EditorRoot>
  )
}

export function Preview() {
  const [controller, setController] =
    useState<EditorCollaborationController | null>(null)

  const controllerRef = useRef<EditorCollaborationController | null>(null)
  const [error, setError] = useState(false)

  const closeController = useStableCallback(function closeController() {
    controllerRef.current?.destroy()
    controllerRef.current = null
    setController(null)
  })

  const connectToHost = useStableCallback(function connectToHost(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)

    try {
      const { csrf, documentId, ticketUrl, socketUrl } = z
        .object({
          csrf: z.string().min(1),
          documentId: z.string().min(1),
          ticketUrl: z.string().min(1),
          socketUrl: z.string().min(1),
        })
        .parse(Object.fromEntries(data))

      const nextController = createEditorCollaboration({
        documentId,
        ticketUrl,
        socketUrl,
        permission: "write",
        headers() {
          return { "X-CSRF-Token": csrf }
        },
      })

      controllerRef.current = nextController
      setController(nextController)
      setError(false)
    } catch {
      setError(true)
    }
  })

  return (
    <Stack>
      <Text>
        Supply authenticated routes for an initialized host document. Disconnect
        to block editing. Reconnect to request a fresh ticket and sync. No
        service or credentials are included.
      </Text>
      {controller ? (
        <>
          <StatusEditor controller={controller} />
          <Button onClick={closeController}>Close</Button>
        </>
      ) : (
        <Form onSubmit={connectToHost}>
          <Stack>
            <Input name="documentId" aria-label="Document ID" required />
            <Input
              name="ticketUrl"
              aria-label="Ticket endpoint"
              type="url"
              required
            />
            <Input
              name="socketUrl"
              aria-label="WebSocket endpoint"
              type="url"
              required
            />
            <Input
              name="csrf"
              aria-label="CSRF token"
              type="password"
              autoComplete="off"
              required
            />
            <Button type="submit">Connect to host</Button>
            {error ? (
              <Text role="alert">
                Check document ID and secure endpoint URLs.
              </Text>
            ) : null}
          </Stack>
        </Form>
      )}
    </Stack>
  )
}
