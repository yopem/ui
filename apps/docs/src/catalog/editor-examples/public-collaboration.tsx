"use client"

import type {
  EditorCollaborationClientOptions,
  EditorCollaborationController,
} from "@yopem-ui/editor/collaboration"

import { useStableCallback } from "@base-ui/utils/useStableCallback"
import { Box } from "@registry/components/ui/box"
import { Button } from "@registry/components/ui/button"
import { Field, FieldLabel } from "@registry/components/ui/field"
import { Form } from "@registry/components/ui/form"
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
  EditorCollaborationRoot,
  EditorCollaborationStatus,
  useEditorCollaboration,
} from "@yopem-ui/editor/collaboration"
import { type FormEvent, useId, useReducer, useState } from "react"
import { z } from "zod"

const hostSettingsSchema = z.strictObject({
  documentId: z.string().trim().min(1).max(256),
  ticketUrl: z.string().trim().url(),
  socketUrl: z.string().trim().url(),
  csrfToken: z.string().trim().min(1).max(2048),
})

type CollaborationClients = readonly [
  EditorCollaborationController,
  EditorCollaborationController,
]

function clientOptions(
  settings: z.infer<typeof hostSettingsSchema>,
  displayName: string,
): EditorCollaborationClientOptions {
  const ticketUrl = new URL(settings.ticketUrl)
  const socketUrl = new URL(settings.socketUrl)
  const socketOrigin = new URL(socketUrl.href)
  socketOrigin.protocol = "https:"

  if (
    !/^[A-Za-z0-9_-]+:[A-Za-z0-9_:-]+$/.test(settings.documentId) ||
    window.location.protocol !== "https:" ||
    ticketUrl.protocol !== "https:" ||
    socketUrl.protocol !== "wss:" ||
    ticketUrl.origin !== window.location.origin ||
    socketOrigin.origin !== ticketUrl.origin ||
    ticketUrl.search ||
    ticketUrl.hash ||
    ticketUrl.username ||
    ticketUrl.password ||
    socketUrl.search ||
    socketUrl.hash ||
    socketUrl.username ||
    socketUrl.password
  )
    throw new Error("Use secure, same-origin collaboration endpoints.")

  return {
    documentId: settings.documentId,
    ticketUrl: ticketUrl.toString(),
    socketUrl: socketUrl.toString(),
    permission: "write",
    displayName,
    headers() {
      return { "X-CSRF-Token": settings.csrfToken }
    },
  }
}

function createClients(
  settings: z.infer<typeof hostSettingsSchema>,
): CollaborationClients {
  const clientA = createEditorCollaboration(clientOptions(settings, "Client A"))

  try {
    return [
      clientA,
      createEditorCollaboration(clientOptions(settings, "Client B")),
    ]
  } catch (cause) {
    clientA.destroy()
    throw cause
  }
}

function CollaborationClient({
  controller,
  name,
}: {
  controller: EditorCollaborationController
  name: "Client A" | "Client B"
}) {
  const [extensions] = useState(() => [controller.extension])

  const [editable, toggleEditable] = useReducer(
    (current: boolean) => !current,
    true,
  )

  const snapshot = useEditorCollaboration(controller)

  const handleDisconnect = useStableCallback(function handleDisconnect() {
    controller.provider.disconnect()
  })

  const handleReconnect = useStableCallback(function handleReconnect() {
    void controller.provider.reconnect().catch(() => undefined)
  })

  return (
    <Box render={<section aria-label={name} />}>
      <EditorRoot
        ariaLabel={`${name} shared editor`}
        editable={editable}
        extensions={extensions}
      >
        <EditorCollaborationRoot controller={controller}>
          <Stack>
            <Text>{name}</Text>
            <EditorCollaborationStatus />
            <Stack>
              <Button
                type="button"
                disabled={
                  snapshot.status === "idle" ||
                  snapshot.status === "disconnected"
                }
                onClick={handleDisconnect}
              >
                Disconnect {name}
              </Button>
              <Button
                type="button"
                disabled={
                  !["disconnected", "error", "denied"].includes(snapshot.status)
                }
                onClick={handleReconnect}
              >
                Reconnect {name}
              </Button>
              <Button
                type="button"
                aria-pressed={!editable}
                onClick={toggleEditable}
              >
                Toggle {name} read only
              </Button>
            </Stack>
            <EditorToolbar aria-label={`${name} history`}>
              <EditorHistoryButton action="undo" />
              <EditorHistoryButton action="redo" />
            </EditorToolbar>
            <EditorContent placeholder={`Write in ${name}`} />
          </Stack>
        </EditorCollaborationRoot>
      </EditorRoot>
    </Box>
  )
}

export function PublicCollaborationExample() {
  const [hostReady, setHostReady] = useState(false)
  const [error, setError] = useState(false)
  const [clients, setClients] = useState<CollaborationClients | null>(null)
  const formId = useId()

  const resetApproval = useStableCallback(function resetApproval() {
    setHostReady(false)
    setError(false)
  })

  const connectBoth = useStableCallback(function connectBoth(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    if (!hostReady) {
      setError(true)

      return
    }

    try {
      const settings = hostSettingsSchema.parse(
        Object.fromEntries(new FormData(event.currentTarget)),
      )

      setClients(createClients(settings))
      setError(false)
    } catch {
      setError(true)
    }
  })

  const handleHostSetup = useStableCallback(function handleHostSetup() {
    setHostReady((current) => !current)
    setError(false)
  })

  return (
    <Box data-testid="public-collaboration-example">
      <Stack>
        <Text>Use HTTPS and WSS routes from this page origin.</Text>
        <Text>
          The host must authenticate requests, verify CSRF, enforce document
          policy, and initialize this document with the same Lexical schema
          before either client connects.
        </Text>
        <Text>A write request does not grant access.</Text>
        <Text>This form does not create or initialize host documents.</Text>
        {clients ? (
          <Stack>
            <CollaborationClient controller={clients[0]} name="Client A" />
            <CollaborationClient controller={clients[1]} name="Client B" />
          </Stack>
        ) : (
          <Form onSubmit={connectBoth}>
            <Stack>
              <Field>
                <FieldLabel htmlFor={`${formId}-document`}>
                  Document ID
                </FieldLabel>
                <Input
                  id={`${formId}-document`}
                  name="documentId"
                  autoComplete="off"
                  onChange={resetApproval}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor={`${formId}-ticket`}>
                  Ticket endpoint
                </FieldLabel>
                <Input
                  id={`${formId}-ticket`}
                  name="ticketUrl"
                  type="url"
                  autoComplete="off"
                  onChange={resetApproval}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor={`${formId}-socket`}>
                  WebSocket endpoint
                </FieldLabel>
                <Input
                  id={`${formId}-socket`}
                  name="socketUrl"
                  type="url"
                  autoComplete="off"
                  onChange={resetApproval}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor={`${formId}-csrf`}>CSRF token</FieldLabel>
                <Input
                  id={`${formId}-csrf`}
                  name="csrfToken"
                  type="password"
                  autoComplete="off"
                  onChange={resetApproval}
                  required
                />
              </Field>
              <Button
                type="button"
                aria-pressed={hostReady}
                onClick={handleHostSetup}
              >
                Confirm host setup
              </Button>
              <Button type="submit" disabled={!hostReady}>
                Connect both clients
              </Button>
              {error ? (
                <Text role="alert">
                  Check the host setup and secure same-origin endpoints.
                </Text>
              ) : null}
            </Stack>
          </Form>
        )}
      </Stack>
    </Box>
  )
}
