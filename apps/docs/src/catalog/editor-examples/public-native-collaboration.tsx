"use client"

import type { EditorCollaborationController } from "@yopem-ui/editor/collaboration"
import type { ComponentProps } from "react"

import { useStableCallback } from "@base-ui/utils/useStableCallback"
import { Box } from "@registry/components/ui/box"
import { Button } from "@registry/components/ui/button"
import { Checkbox } from "@registry/components/ui/checkbox"
import { Field, FieldLabel } from "@registry/components/ui/field"
import { Form } from "@registry/components/ui/form"
import { HStack } from "@registry/components/ui/hstack"
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
import {
  createEditorCollaborationWithProvider,
  EditorCollaborationAwareness,
  EditorCollaborationCursors,
  EditorCollaborationRoot,
  EditorCollaborationStatus,
  useEditorCollaboration,
} from "@yopem-ui/editor/collaboration"
import {
  createEditorNativeCollaboration,
  type EditorNativeCollaborationOptions,
  type EditorNativeCollaborationProvider,
} from "@yopem-ui/editor/collaboration/native"
import { Redo2Icon, Undo2Icon } from "lucide-react"
import {
  useId,
  useReducer,
  useState,
  useSyncExternalStore,
  type FormEvent,
  type RefCallback,
} from "react"
import { z } from "zod"

const roomIdSchema = z
  .string()
  .trim()
  .min(1)
  .max(256)
  .regex(/^[A-Za-z0-9_-]+:[A-Za-z0-9_:-]+$/)

const defaultRoomId = "native:shared-room"

const roomStorageKey = "yopem-native-collaboration-room"

interface NativeClient {
  native: EditorNativeCollaborationProvider
  controller: EditorCollaborationController<EditorNativeCollaborationProvider>
  attachEditorRoot: RefCallback<HTMLDivElement>
  retire(): Promise<void>
}

interface NativeExampleLifecycle {
  attachExampleRoot: RefCallback<HTMLElement>
  beginOperation(this: void): number
  isCurrent(this: void, operation: number): boolean
  install(this: void, client: NativeClient, operation: number): boolean
  retireCurrent(this: void): Promise<void>
}

function readStoredRoom() {
  try {
    const parsed = roomIdSchema.safeParse(
      window.localStorage.getItem(roomStorageKey),
    )

    return parsed.success ? parsed.data : defaultRoomId
  } catch {
    return defaultRoomId
  }
}

function isRoomStorageAvailable() {
  try {
    window.localStorage.getItem(roomStorageKey)

    return true
  } catch {
    return false
  }
}

function storeRoom(roomId: string) {
  const parsed = roomIdSchema.safeParse(roomId)

  if (!parsed.success) return false

  try {
    window.localStorage.setItem(roomStorageKey, parsed.data)

    return true
  } catch {
    return false
  }
}

function createNativeClientLifecycle(
  native: EditorNativeCollaborationProvider,
  controller: EditorCollaborationController<EditorNativeCollaborationProvider>,
): NativeClient {
  let rootState: "unmounted" | "mounted" | "unmounting" = "unmounted"
  let rootGeneration = 0
  let resolveRootUnmount: (() => void) | undefined

  let disposal: Promise<void> | undefined
  let retirement: Promise<void> | undefined

  const rootUnmounted = new Promise<void>((resolve) => {
    resolveRootUnmount = resolve
  })

  function dispose() {
    if (disposal) return disposal
    disposal = Promise.resolve().then(() => {
      controller.destroy()

      return native.whenDisposed()
    })

    return disposal
  }

  const attachEditorRoot: RefCallback<HTMLDivElement> = (element) => {
    if (!element) return
    const generation = ++rootGeneration
    rootState = "mounted"

    return () => {
      rootState = "unmounting"
      queueMicrotask(() => {
        if (rootGeneration !== generation || rootState !== "unmounting") return
        rootState = "unmounted"
        resolveRootUnmount?.()
        void dispose().catch(() => undefined)
      })
    }
  }

  function retire() {
    if (retirement) return retirement
    retirement =
      rootState === "mounted" || rootState === "unmounting"
        ? rootUnmounted.then(dispose)
        : dispose()

    return retirement
  }

  return { native, controller, attachEditorRoot, retire }
}

function createNativeExampleLifecycle(
  setClient: (client: NativeClient | undefined) => void,
): NativeExampleLifecycle {
  let mounted = false
  let operation = 0
  let rootGeneration = 0
  let activeClient: NativeClient | undefined
  let retirement: Promise<void> = Promise.resolve()

  function queueRetirement(client: NativeClient) {
    retirement = retirement.catch(() => undefined).then(() => client.retire())

    return retirement
  }

  const attachExampleRoot: RefCallback<HTMLElement> = (element) => {
    if (!element) return
    const generation = ++rootGeneration
    mounted = true

    return () => {
      mounted = false
      operation += 1
      queueMicrotask(() => {
        if (rootGeneration !== generation || mounted) return
        const previous = activeClient
        activeClient = undefined

        if (previous) void queueRetirement(previous).catch(() => undefined)
      })
    }
  }

  function beginOperation() {
    operation += 1

    return operation
  }

  function isCurrent(candidate: number) {
    return mounted && operation === candidate
  }

  function install(client: NativeClient, candidate: number) {
    if (!isCurrent(candidate)) return false
    activeClient = client
    setClient(client)

    return true
  }

  function retireCurrent() {
    const previous = activeClient
    activeClient = undefined

    if (!previous) return retirement

    setClient(undefined)

    return queueRetirement(previous)
  }

  return {
    attachExampleRoot,
    beginOperation,
    isCurrent,
    install,
    retireCurrent,
  }
}

async function createNativeClient(options: EditorNativeCollaborationOptions) {
  const native = createEditorNativeCollaboration(options)

  try {
    const controller = createEditorCollaborationWithProvider(
      native,
      options.roomId,
    )

    return createNativeClientLifecycle(native, controller)
  } catch (cause) {
    native.destroy()
    await native.whenDisposed()
    throw cause
  }
}

function NativeEditor({
  client: { attachEditorRoot, controller, native: provider },
}: {
  client: NativeClient
}) {
  const [extensions] = useState(() => [controller.extension])

  const [editable, toggleEditable] = useReducer(
    (current: boolean) => !current,
    true,
  )

  const collaboration = useEditorCollaboration(controller)

  const native = useSyncExternalStore(
    provider.subscribe,
    provider.getNativeSnapshot,
    provider.getNativeSnapshot,
  )

  const handleDisconnect = useStableCallback(function handleDisconnect() {
    provider.disconnect()
  })

  const handleReconnect = useStableCallback(function handleReconnect() {
    void provider.reconnect().catch(() => undefined)
  })

  return (
    <Box ref={attachEditorRoot}>
      <EditorRoot
        ariaLabel="Native collaboration editor"
        editable={editable}
        extensions={extensions}
      >
        <EditorCollaborationRoot controller={controller}>
          <Stack>
            <EditorCollaborationStatus />
            <Text>
              Hocuspocus socket: {native.hocuspocus.status}; authenticated:{" "}
              {String(native.hocuspocus.authenticated)}; Yjs-synced:{" "}
              {String(native.hocuspocus.synced)}; unconfirmed updates:{" "}
              {native.hocuspocus.unsyncedChanges}.
            </Text>
            <Text>
              Hocuspocus sync does not confirm durable storage. Keep document
              persistence and write policy on your host.
            </Text>
            <Text>
              WebRTC: {native.webrtc.status}; reported WebRTC peers:{" "}
              {native.webrtc.reportedWebrtcPeers}; BroadcastChannel peers:{" "}
              {native.webrtc.reportedBroadcastChannelPeers}.
            </Text>
            <Text>
              “Looking” means y-webrtc is looking for peers. Peer counts do not
              prove a physical connection.
            </Text>
            <Text>
              Server write access:{" "}
              {collaboration.writable ? "enabled" : "disabled"}.
            </Text>
            <EditorToolbar aria-label="Native collaboration history">
              <EditorHistoryButton
                action="undo"
                aria-label="Undo"
                title="Undo"
                render={<Button variant="ghost" size="icon-sm" />}
              >
                <Undo2Icon aria-hidden="true" size={16} />
              </EditorHistoryButton>
              <EditorHistoryButton
                action="redo"
                aria-label="Redo"
                title="Redo"
                render={<Button variant="ghost" size="icon-sm" />}
              >
                <Redo2Icon aria-hidden="true" size={16} />
              </EditorHistoryButton>
              <Button
                type="button"
                aria-pressed={!editable}
                onClick={toggleEditable}
              >
                {editable ? "Pause local editing" : "Resume local editing"}
              </Button>
              <Button
                type="button"
                disabled={native.hocuspocus.status === "disconnected"}
                onClick={handleDisconnect}
              >
                Disconnect
              </Button>
              <Button
                type="button"
                disabled={
                  collaboration.status !== "disconnected" &&
                  collaboration.status !== "denied" &&
                  collaboration.status !== "error"
                }
                onClick={handleReconnect}
              >
                Reconnect
              </Button>
            </EditorToolbar>
            <EditorCollaborationAwareness />
            <EditorContent placeholder="Write after host sync completes." />
            <EditorCollaborationCursors />
          </Stack>
        </EditorCollaborationRoot>
      </EditorRoot>
    </Box>
  )
}

export function PublicNativeCollaborationExample() {
  const fieldId = useId()
  const [roomId, setRoomId] = useState(readStoredRoom)
  const [roomDraft, setRoomDraft] = useState(roomId)
  const [grantUrl, setGrantUrl] = useState("")
  const [socketUrl, setSocketUrl] = useState("")
  const [csrfToken, setCsrfToken] = useState("")
  const [signaling, setSignaling] = useState("")
  const [displayName, setDisplayName] = useState("Collaborator")
  const [cursorColor, setCursorColor] = useState("#3466aa")
  const [client, setClient] = useState<NativeClient>()

  const [
    { attachExampleRoot, beginOperation, isCurrent, install, retireCurrent },
  ] = useState(() => createNativeExampleLifecycle(setClient))

  const [busy, setBusy] = useState(false)

  const [storageAvailable, setStorageAvailable] = useState(
    isRoomStorageAvailable,
  )

  const [requestedPermission, setRequestedPermission] = useState<
    "read" | "write"
  >("write")

  const [error, setError] = useState("")

  const applyRoomId = useStableCallback(async function applyRoomId(
    value: string,
  ) {
    const parsed = roomIdSchema.safeParse(value)

    if (!parsed.success) {
      setError("Use a bounded room ID with one colon.")

      return
    }

    setError("")

    if (parsed.data === roomId) {
      setRoomDraft(parsed.data)
      setStorageAvailable(storeRoom(parsed.data))

      return
    }

    const operation = beginOperation()
    setBusy(true)

    try {
      await retireCurrent()

      if (!isCurrent(operation)) return

      setRoomId(parsed.data)
      setRoomDraft(parsed.data)
      setStorageAvailable(storeRoom(parsed.data))
    } catch {
      if (isCurrent(operation))
        setError("The previous native providers did not finish cleanup.")
    } finally {
      if (isCurrent(operation)) setBusy(false)
    }
  })

  const createRoomId = useStableCallback(function createRoomId() {
    try {
      void applyRoomId(`native:${crypto.randomUUID()}`)
    } catch {
      setError("Create a room ID in a secure browser context.")
    }
  })

  const connect = useStableCallback(async function connect(
    event: FormEvent<HTMLFormElement>,
  ) {
    if (event.defaultPrevented) return
    event.preventDefault()
    const csrf = csrfToken.trim()
    setCsrfToken("")

    if (!csrf) {
      setError("CSRF token is required.")

      return
    }

    const operation = beginOperation()
    setBusy(true)
    setError("")
    setStorageAvailable(storeRoom(roomId))

    try {
      await retireCurrent()

      if (!isCurrent(operation)) return

      const signalingUrls = signaling
        .split(",")
        .map((url) => url.trim())
        .filter(Boolean)

      const options: EditorNativeCollaborationOptions = {
        roomId,
        trustedOrigin: window.location.origin,
        grantUrl,
        socketUrl,
        displayName,
        cursorColor,
        requestedPermission,
        headers() {
          return { "X-CSRF-Token": csrf }
        },
      }

      if (signalingUrls.length > 0) options.signalingUrls = signalingUrls
      const nextClient = await createNativeClient(options)

      if (!install(nextClient, operation)) await nextClient.retire()
    } catch {
      if (isCurrent(operation))
        setError(
          "Check the secure host URLs, grant policy, identity, and CSRF token.",
        )
    } finally {
      if (isCurrent(operation)) setBusy(false)
    }
  })

  const handleRoomDraftChange = useStableCallback(
    function handleRoomDraftChange(
      event: Parameters<
        NonNullable<ComponentProps<typeof Input>["onChange"]>
      >[0],
    ) {
      setRoomDraft(event.currentTarget.value)
    },
  )

  const handleGrantUrlChange = useStableCallback(function handleGrantUrlChange(
    event: Parameters<NonNullable<ComponentProps<typeof Input>["onChange"]>>[0],
  ) {
    setGrantUrl(event.currentTarget.value)
  })

  const handleSocketUrlChange = useStableCallback(
    function handleSocketUrlChange(
      event: Parameters<
        NonNullable<ComponentProps<typeof Input>["onChange"]>
      >[0],
    ) {
      setSocketUrl(event.currentTarget.value)
    },
  )

  const handleCsrfTokenChange = useStableCallback(
    function handleCsrfTokenChange(
      event: Parameters<
        NonNullable<ComponentProps<typeof Input>["onChange"]>
      >[0],
    ) {
      setCsrfToken(event.currentTarget.value)
    },
  )

  const handleSignalingChange = useStableCallback(
    function handleSignalingChange(
      event: Parameters<
        NonNullable<ComponentProps<typeof Input>["onChange"]>
      >[0],
    ) {
      setSignaling(event.currentTarget.value)
    },
  )

  const handleDisplayNameChange = useStableCallback(
    function handleDisplayNameChange(
      event: Parameters<
        NonNullable<ComponentProps<typeof Input>["onChange"]>
      >[0],
    ) {
      setDisplayName(event.currentTarget.value)
    },
  )

  const handlePermissionChange = useStableCallback(
    function handlePermissionChange(
      checked: Parameters<
        NonNullable<ComponentProps<typeof Checkbox>["onCheckedChange"]>
      >[0],
    ) {
      setRequestedPermission(checked === true ? "read" : "write")
    },
  )

  const handleCursorColorChange = useStableCallback(
    function handleCursorColorChange(
      event: Parameters<
        NonNullable<ComponentProps<typeof Input>["onChange"]>
      >[0],
    ) {
      setCursorColor(event.currentTarget.value)
    },
  )

  const handleApplyRoomId = useStableCallback(function handleApplyRoomId() {
    void applyRoomId(roomDraft)
  })

  return (
    <Box
      ref={attachExampleRoot}
      render={<section />}
      aria-label="Native collaboration example"
      data-testid="public-native-collaboration-example"
    >
      <Stack>
        <Text>
          Set an HTTPS grant endpoint and a WSS Hocuspocus endpoint. This
          example sets no default host, token, or signaler.
        </Text>
        <Text>
          Your authorizeRoom callback must authenticate the user. Verify Origin
          and CSRF. Authorize the room. Seed one Lexical Y.Doc generation once
          per room. Allow new IDs only under your host policy.
        </Text>
        <Text>
          Return the same room ID and literal seeded: true. Return a stable
          generation and credential expiry within five minutes. Keep grant
          credentials out of URLs, browser storage, and logs.
        </Text>
        <Text>
          WebRTC is optional. Set only trusted WSS signalers. Give a peer room
          only to writers. Rotate its credential when membership changes. WebRTC
          has no per-frame host authorization or durable-write confirmation.
        </Text>
        <Form onSubmit={connect}>
          <Stack>
            <Field>
              <FieldLabel htmlFor={`${fieldId}-room`}>Room ID</FieldLabel>
              <Input
                id={`${fieldId}-room`}
                value={roomDraft}
                maxLength={256}
                autoComplete="off"
                onChange={handleRoomDraftChange}
              />
            </Field>
            <HStack>
              <Button type="button" disabled={busy} onClick={handleApplyRoomId}>
                Apply room ID
              </Button>
              <Button type="button" disabled={busy} onClick={createRoomId}>
                New room
              </Button>
            </HStack>
            <Text>Active room ID: {roomId}</Text>
            <Text>
              {storageAvailable
                ? "Only room ID is stored in this browser."
                : "Browser storage is unavailable. Room ID remains in memory."}
            </Text>
            <Field>
              <FieldLabel htmlFor={`${fieldId}-grant`}>
                HTTPS grant endpoint
              </FieldLabel>
              <Input
                id={`${fieldId}-grant`}
                type="url"
                value={grantUrl}
                maxLength={2048}
                autoComplete="off"
                onChange={handleGrantUrlChange}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor={`${fieldId}-socket`}>
                WSS Hocuspocus endpoint
              </FieldLabel>
              <Input
                id={`${fieldId}-socket`}
                type="url"
                value={socketUrl}
                maxLength={2048}
                autoComplete="off"
                onChange={handleSocketUrlChange}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor={`${fieldId}-csrf`}>
                Host CSRF token
              </FieldLabel>
              <Input
                id={`${fieldId}-csrf`}
                type="password"
                autoComplete="off"
                value={csrfToken}
                maxLength={4096}
                onChange={handleCsrfTokenChange}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor={`${fieldId}-signaling`}>
                Optional WSS signaling URLs
              </FieldLabel>
              <Input
                id={`${fieldId}-signaling`}
                value={signaling}
                maxLength={8192}
                autoComplete="off"
                onChange={handleSignalingChange}
              />
              <Text>
                Separate URLs with commas. Leave blank to disable WebRTC.
              </Text>
            </Field>
            <Field>
              <FieldLabel htmlFor={`${fieldId}-name`}>
                Requested display name
              </FieldLabel>
              <Input
                id={`${fieldId}-name`}
                value={displayName}
                maxLength={128}
                onChange={handleDisplayNameChange}
              />
            </Field>
            <Label>
              <Checkbox
                aria-label="Request read-only access"
                checked={requestedPermission === "read"}
                onCheckedChange={handlePermissionChange}
              />
              Request read-only access. Host still decides granted permission.
            </Label>
            <Field>
              <FieldLabel htmlFor={`${fieldId}-color`}>
                Requested cursor color
              </FieldLabel>
              <Input
                id={`${fieldId}-color`}
                type="color"
                value={cursorColor}
                onChange={handleCursorColorChange}
              />
            </Field>
            <Button type="submit" disabled={busy || !grantUrl || !socketUrl}>
              Connect to host
            </Button>
            {error ? <Text role="alert">{error}</Text> : null}
          </Stack>
        </Form>
        {client ? <NativeEditor key={roomId} client={client} /> : null}
      </Stack>
    </Box>
  )
}
