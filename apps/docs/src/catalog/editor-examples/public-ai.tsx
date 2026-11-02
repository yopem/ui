"use client"

import type { EditorAiConfig } from "@yopem-ui/editor/ai/client"
import type { EditorReviewHost } from "@yopem-ui/editor/review"
import type { KeyboardEvent } from "react"

import { useStableCallback } from "@base-ui/utils/useStableCallback"
import { Box } from "@registry/components/ui/box"
import { Button } from "@registry/components/ui/button"
import { Field, FieldLabel } from "@registry/components/ui/field"
import { Input } from "@registry/components/ui/input"
import { Stack } from "@registry/components/ui/stack"
import { Text } from "@registry/components/ui/text"
import {
  EditorAiRoot,
  EditorHistoryButton,
  EditorRoot,
  EditorToolbar,
  useEditor,
} from "@yopem-ui/editor"
import { EditorAiInlinePreview } from "@yopem-ui/editor/ai-menu-preview"
import { validateEditorAiConfig } from "@yopem-ui/editor/ai/client"
import {
  EditorAiMenuContent,
  EditorAiMenuPanel,
  EditorAiMenuRoot,
  EditorAiMenuTrigger,
} from "@yopem-ui/editor/ai/menu"
import { $insertDocumentFragment } from "@yopem-ui/editor/document"
import { EditorFloatingToolbar } from "@yopem-ui/editor/floating-toolbar"
import {
  createEditorReview,
  EditorReviewPanel,
  EditorReviewProvider,
} from "@yopem-ui/editor/review"
import { Redo2Icon, Undo2Icon } from "lucide-react"
import { useId, useRef, useState, type MouseEvent } from "react"

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
            detail: 0,
            format: 0,
            mode: "normal",
            style: "",
            text: "Select this sentence to improve it, ask a question, or draft a review comment.",
          },
        ],
      },
    ],
  },
})

const reviewViewer = { id: "public-ai-reviewer", name: "Example reviewer" }

const reviewHost: EditorReviewHost = {
  viewer: reviewViewer,
  visible: true,
  replyWhileReadonly: false,
  can(action, _targetId, viewer) {
    return (
      viewer.id === reviewViewer.id &&
      ["create", "suggest", "accept", "reject"].includes(action)
    )
  },
}

function PublicAiEditor({
  config,
  review,
}: {
  config: EditorAiConfig
  review: ReturnType<typeof createEditorReview>
}) {
  const editor = useEditor()
  const binding = review.forEditor(editor)

  const markdownInsertion = useStableCallback(function markdownInsertion(
    source: string,
  ) {
    $insertDocumentFragment(source)

    return true
  })

  const handleContextMenu = useStableCallback(function handleContextMenu(
    event: MouseEvent<HTMLDivElement>,
  ) {
    if (event.altKey) event.preventDefault()
  })

  return (
    <EditorReviewProvider controller={review} host={reviewHost}>
      <EditorAiRoot config={config}>
        <EditorAiMenuRoot markdownInsertion={markdownInsertion}>
          <EditorToolbar aria-label="AI tools">
            <EditorAiMenuTrigger />
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
          </EditorToolbar>
          <EditorAiMenuPanel review={binding} />
          <EditorAiMenuContent
            aria-label="Public AI editor"
            placeholder="Select text, press Mod+J, or press Space in an empty block."
            onContextMenu={handleContextMenu}
          />
          <EditorFloatingToolbar aria-label="Selection AI commands">
            <EditorAiMenuTrigger>Ask about selection</EditorAiMenuTrigger>
          </EditorFloatingToolbar>
          <EditorAiInlinePreview />
          <EditorReviewPanel />
        </EditorAiMenuRoot>
      </EditorAiRoot>
    </EditorReviewProvider>
  )
}

export function PublicAiExample() {
  const fieldId = useId()
  const endpointRef = useRef<HTMLInputElement>(null)
  const documentIdRef = useRef<HTMLInputElement>(null)
  const csrfRef = useRef<HTMLInputElement>(null)
  const [config, setConfig] = useState<EditorAiConfig>()
  const [error, setError] = useState("")
  const [editable, setEditable] = useState(true)
  const [review] = useState(createEditorReview)
  const [extensions] = useState(() => [review.extension])

  const configure = useStableCallback(function configure() {
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
      setConfig(next)
      setError("")
    } catch {
      setError("Use a valid same-origin endpoint, document ID, and CSRF token.")
    }
  })

  const toggleEditable = useStableCallback(function toggleEditable() {
    setEditable((current) => !current)
  })

  const handleHostShortcut = useStableCallback(function handleHostShortcut(
    event: KeyboardEvent<HTMLElement>,
  ) {
    if (
      event.defaultPrevented ||
      event.repeat ||
      event.nativeEvent.isComposing ||
      !event.altKey ||
      !event.shiftKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.key.toLowerCase() !== "r"
    )
      return
    event.preventDefault()
    toggleEditable()
  })

  return (
    <Box
      render={<section />}
      aria-label="AI host setup"
      onKeyDownCapture={handleHostShortcut}
    >
      <Stack>
        {config ? (
          <Text>Host request settings are configured for this example.</Text>
        ) : (
          <Text>
            No endpoint is configured. Supply your same-origin endpoint,
            document ID, and CSRF token. No request runs before you configure
            these values.
          </Text>
        )}
        <Text>
          Your server must authenticate requests, verify CSRF and document
          access, choose an authorized model, and enforce quota. Requests can
          incur charges. No endpoint or model is provided.
        </Text>
        <Field>
          <FieldLabel htmlFor={`${fieldId}-endpoint`}>Host endpoint</FieldLabel>
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
        {!config ? (
          <Field>
            <FieldLabel htmlFor={`${fieldId}-csrf`}>Host CSRF token</FieldLabel>
            <Input
              id={`${fieldId}-csrf`}
              aria-label="Host CSRF token"
              type="password"
              autoComplete="off"
              ref={csrfRef}
              required
            />
          </Field>
        ) : null}
        <Button disabled={config !== undefined} onClick={configure}>
          Configure AI
        </Button>
        {error ? <Text role="alert">{error}</Text> : null}
        <Text>
          Review comments use an in-memory example viewer and create-only
          policy. Replace both with your authenticated viewer and host policy. A
          saved author ID does not grant access.
        </Text>
        {config ? (
          <>
            <Text>
              Use Alt+Shift+R to change host read-only state, including while a
              proposal has focus. Markdown and MDX sample commands return
              literal source. They do not execute markup.
            </Text>
            <Button variant="outline" onClick={toggleEditable}>
              {editable ? "Make AI editor read-only" : "Restore AI editing"}
            </Button>
            <EditorRoot
              ariaLabel="Public AI editor"
              editable={editable}
              extensions={extensions}
              initialState={initialState}
            >
              <PublicAiEditor config={config} review={review} />
            </EditorRoot>
          </>
        ) : (
          <Text>Configure the host before opening the editor.</Text>
        )}
      </Stack>
    </Box>
  )
}
