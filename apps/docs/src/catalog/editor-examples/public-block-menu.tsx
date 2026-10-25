"use client"

import type { EditorAiConfig } from "@yopem-ui/editor/ai/client"
import type {
  EditorBlockMenuActionPreparation,
  EditorBlockMenuContext,
} from "@yopem-ui/editor/block-menu"
import type { EditorReviewHost } from "@yopem-ui/editor/review"
import type { ChangeEvent } from "react"

import { Box } from "@registry/components/ui/box"
import { Button } from "@registry/components/ui/button"
import { Checkbox } from "@registry/components/ui/checkbox"
import {
  Dialog,
  DialogDescription,
  DialogPanel,
  DialogPopup,
  DialogTitle,
} from "@registry/components/ui/dialog"
import { Field, FieldLabel } from "@registry/components/ui/field"
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
import {
  createEditorBlockMenu,
  EditorBlockMenu,
} from "@yopem-ui/editor/block-menu"
import {
  EditorDiagramDeleteButton,
  EditorDiagramExtension,
  EditorDiagramInsertButton,
  EditorDiagramKindSelect,
  EditorDiagramRoot,
  EditorDiagramStatus,
  EditorDiagramToolbar,
  EditorDiagramViewModeSelect,
} from "@yopem-ui/editor/diagram"
import {
  createEditorReview,
  EditorReviewCreateControl,
  EditorReviewPanel,
  EditorReviewProvider,
} from "@yopem-ui/editor/review"
import { useId, useState, useSyncExternalStore } from "react"

function subscribeToNoPreparation(_listener: () => void) {
  return () => undefined
}

function getNoPreparationSnapshot(): false {
  return false
}

function usePreparationSnapshot(
  preparation: EditorBlockMenuActionPreparation | null,
) {
  return useSyncExternalStore(
    preparation?.subscribe ?? subscribeToNoPreparation,
    preparation?.getSnapshot ?? getNoPreparationSnapshot,
    preparation?.getServerSnapshot ?? getNoPreparationSnapshot,
  )
}

const reviewViewer = {
  id: "public-block-menu-reviewer",
  name: "Example reviewer",
}

const initialState = JSON.stringify({
  root: {
    type: "root",
    version: 1,
    direction: null,
    format: "",
    indent: 0,
    children: ["First block", "Second block"].map((text) => ({
      type: "paragraph",
      version: 1,
      direction: null,
      format: "",
      indent: 0,
      children: [
        {
          type: "text",
          version: 1,
          text,
          format: 0,
          detail: 0,
          mode: "normal",
          style: "",
        },
      ],
    })),
  },
})

function createMenuHostState() {
  let commentsAllowed = true
  let aiAllowed = false
  let aiConfigured = false

  const targets = new Map<
    "ask-ai" | "code-drawing",
    EditorBlockMenuActionPreparation
  >()

  return {
    allowsComments() {
      return commentsAllowed
    },
    allowsAiSetup() {
      return !aiConfigured || aiAllowed
    },
    allowsAiRequest() {
      return aiConfigured && aiAllowed
    },
    setCommentsAllowed(value: boolean) {
      commentsAllowed = value
    },
    setAiAllowed(value: boolean) {
      aiAllowed = value
    },
    markAiConfigured() {
      aiConfigured = true
    },
    replaceTarget(
      action: "ask-ai" | "code-drawing",
      target: EditorBlockMenuActionPreparation | null,
    ) {
      targets.get(action)?.dispose()

      if (target) targets.set(action, target)
      else targets.delete(action)
    },
    refreshTarget(action: "ask-ai" | "code-drawing") {
      targets.get(action)?.refresh()
    },
  }
}

export function PublicBlockMenuExample() {
  const fieldId = useId()
  const [editable, setEditable] = useState(true)
  const [commentsAllowed, setCommentsAllowed] = useState(true)
  const [aiAllowed, setAiAllowed] = useState(false)
  const [aiEndpoint, setAiEndpoint] = useState("")
  const [aiDocumentId, setAiDocumentId] = useState("")
  const [aiCsrf, setAiCsrf] = useState("")
  const [aiConfig, setAiConfig] = useState<EditorAiConfig>()
  const [aiError, setAiError] = useState("")

  const [commentContext, setCommentContext] =
    useState<EditorBlockMenuContext | null>(null)

  const [aiPanelOpen, setAiPanelOpen] = useState(false)
  const [diagramToolsOpen, setDiagramToolsOpen] = useState(false)

  const [aiPreparation, setAiPreparation] =
    useState<EditorBlockMenuActionPreparation | null>(null)

  const [diagramPreparation, setDiagramPreparation] =
    useState<EditorBlockMenuActionPreparation | null>(null)

  const aiPreparationValid = usePreparationSnapshot(aiPreparation)
  const diagramPreparationValid = usePreparationSnapshot(diagramPreparation)
  const [hostState] = useState(createMenuHostState)

  const commentText = commentContext
    ? commentContext.selectedText.length > 0
      ? commentContext.selectedText
      : commentContext.blockText
    : ""

  const [reviewHost] = useState<EditorReviewHost>(() => ({
    viewer: reviewViewer,
    visible: true,
    replyWhileReadonly: false,
    can(action, _targetId, viewer) {
      return (
        action === "create" &&
        viewer.id === reviewViewer.id &&
        hostState.allowsComments()
      )
    },
  }))

  const [setup] = useState(() => {
    const review = createEditorReview()

    const controller = createEditorBlockMenu({
      authorizeAction(action) {
        return action !== "ask-ai" || hostState.allowsAiSetup()
      },
      onAskAI(_context, preparation) {
        hostState.replaceTarget("ask-ai", preparation)
        setAiPreparation(preparation)
        setAiPanelOpen(true)
      },
      onCodeDrawing(_context, preparation) {
        hostState.replaceTarget("code-drawing", preparation)
        setDiagramPreparation(preparation)
        setDiagramToolsOpen(true)
      },
      onAddComment(context) {
        setCommentContext(context)
      },
    })

    return {
      controller,
      review,
      extensions: [
        EditorDiagramExtension,
        review.extension,
        controller.extension,
      ],
    }
  })

  function updateAiEndpoint(event: ChangeEvent<HTMLInputElement>) {
    setAiEndpoint(event.target.value)
  }

  function updateAiDocumentId(event: ChangeEvent<HTMLInputElement>) {
    setAiDocumentId(event.target.value)
  }

  function updateAiCsrf(event: ChangeEvent<HTMLInputElement>) {
    setAiCsrf(event.target.value)
  }

  function configureAi() {
    const csrfToken = aiCsrf

    if (!csrfToken.trim()) {
      setAiError("Enter a current host CSRF token.")

      return
    }

    const next: EditorAiConfig = {
      endpoint: aiEndpoint,
      documentId: aiDocumentId,
      headers: () => ({ "x-csrf-token": csrfToken }),
    }

    try {
      validateEditorAiConfig(next, window.location.origin)
      hostState.markAiConfigured()
      hostState.refreshTarget("ask-ai")
      setAiConfig(next)
      setAiCsrf("")
      setAiError("")
    } catch {
      setAiError("Use a same-origin endpoint, document ID, and CSRF token.")
    }
  }

  function updateAiPermission(checked: boolean | "indeterminate") {
    const allowed = checked === true
    hostState.setAiAllowed(allowed)
    hostState.refreshTarget("ask-ai")
    setAiAllowed(allowed)
  }

  function closeAiContext() {
    hostState.replaceTarget("ask-ai", null)
    setAiPreparation(null)
    setAiPanelOpen(false)
  }

  function closeDiagramTools() {
    hostState.replaceTarget("code-drawing", null)
    setDiagramPreparation(null)
    setDiagramToolsOpen(false)
  }

  function toggleEditable() {
    setEditable((current) => !current)
  }

  return (
    <Stack>
      <Text>
        Right-click selected text or press Shift+F10. Menu actions open local
        controls. Review policy gates comment creation. AI setup and current
        permission gate requests. The menu never starts an AI request. Replace
        the example reviewer and permission switches with verified host identity
        and policy.
      </Text>
      <Field>
        <FieldLabel htmlFor={`${fieldId}-comments`}>
          Comment creation permission
        </FieldLabel>
        <Checkbox
          id={`${fieldId}-comments`}
          aria-label="Host currently permits comments"
          checked={commentsAllowed}
          onCheckedChange={(checked) => {
            const allowed = checked === true
            hostState.setCommentsAllowed(allowed)
            setCommentsAllowed(allowed)
          }}
        />
      </Field>
      <Field>
        <FieldLabel htmlFor={`${fieldId}-ai-permission`}>
          AI request permission
        </FieldLabel>
        <Checkbox
          id={`${fieldId}-ai-permission`}
          aria-label="Host currently permits AI requests"
          checked={aiAllowed}
          onCheckedChange={updateAiPermission}
        />
      </Field>
      <Text>
        Configure a same-origin AI endpoint, document ID, and CSRF token. The
        server must verify authentication, permission, document access, CSRF,
        and quota. Requests can incur charges.
      </Text>
      <Field>
        <FieldLabel htmlFor={`${fieldId}-ai-endpoint`}>
          AI host endpoint
        </FieldLabel>
        <Input
          id={`${fieldId}-ai-endpoint`}
          aria-label="AI host endpoint"
          value={aiEndpoint}
          disabled={aiConfig !== undefined}
          onChange={updateAiEndpoint}
        />
      </Field>
      <Field>
        <FieldLabel htmlFor={`${fieldId}-ai-document`}>
          AI host document ID
        </FieldLabel>
        <Input
          id={`${fieldId}-ai-document`}
          aria-label="AI host document ID"
          value={aiDocumentId}
          disabled={aiConfig !== undefined}
          onChange={updateAiDocumentId}
        />
      </Field>
      <Field>
        <FieldLabel htmlFor={`${fieldId}-ai-csrf`}>
          AI host CSRF token
        </FieldLabel>
        <Input
          id={`${fieldId}-ai-csrf`}
          aria-label="AI host CSRF token"
          type="password"
          autoComplete="off"
          maxLength={4096}
          value={aiCsrf}
          disabled={aiConfig !== undefined}
          onChange={updateAiCsrf}
        />
      </Field>
      <Button
        disabled={
          aiConfig !== undefined || !aiEndpoint || !aiDocumentId || !aiCsrf
        }
        onClick={configureAi}
      >
        Configure AI host
      </Button>
      {aiError ? <Text role="alert">{aiError}</Text> : null}
      <Button variant="outline" onClick={toggleEditable}>
        {editable
          ? "Make block menu editor read-only"
          : "Make block menu editor editable"}
      </Button>
      <EditorRoot
        ariaLabel="Public block menu editor"
        editable={editable}
        initialState={initialState}
        extensions={setup.extensions}
      >
        <EditorReviewProvider controller={setup.review} host={reviewHost}>
          <EditorToolbar aria-label="Block menu history">
            <EditorHistoryButton action="undo" />
            <EditorHistoryButton action="redo" />
          </EditorToolbar>
          <EditorDiagramRoot>
            {diagramToolsOpen ? (
              <Stack>
                <Text>
                  Insertion restores the captured block selection. This example
                  has no renderer. Edit native diagram source only.
                </Text>
                <EditorDiagramToolbar aria-label="Block menu diagram controls">
                  <EditorDiagramInsertButton
                    disabled={!diagramPreparationValid}
                    onClick={(event) => {
                      if (
                        event.defaultPrevented ||
                        diagramPreparation?.restoreSelection()
                      )
                        return

                      event.preventDefault()
                    }}
                  />
                  <EditorDiagramKindSelect />
                  <EditorDiagramViewModeSelect />
                  <EditorDiagramDeleteButton />
                  <EditorDiagramStatus />
                </EditorDiagramToolbar>
                <Button variant="outline" onClick={closeDiagramTools}>
                  Close diagram tools
                </Button>
              </Stack>
            ) : null}
            <EditorBlockMenu controller={setup.controller}>
              <EditorContent placeholder="Enter block content" />
            </EditorBlockMenu>
          </EditorDiagramRoot>
          <EditorReviewPanel />
          <Dialog
            open={commentContext !== null}
            onOpenChange={(open) => {
              if (!open) setCommentContext(null)
            }}
          >
            <DialogPopup>
              <DialogTitle>Comment on selected text</DialogTitle>
              <DialogDescription>
                The review controller keeps the anchor and checks host policy.
              </DialogDescription>
              <DialogPanel>
                <Stack>
                  <Box render={<section />} aria-label="Selected text">
                    <Text>{commentText}</Text>
                  </Box>
                  {!commentsAllowed || !editable ? (
                    <Box render={<output />}>
                      The current host policy or editor state prevents comment
                      creation.
                    </Box>
                  ) : null}
                  <EditorReviewCreateControl />
                </Stack>
              </DialogPanel>
            </DialogPopup>
          </Dialog>
          {aiPanelOpen ? (
            <Box render={<section />} aria-label="AI action context">
              <Stack>
                <Text>
                  The AI trigger restores the captured block selection before it
                  opens. The server must still check permission and access.
                </Text>
                {aiConfig && aiAllowed ? (
                  <EditorAiRoot config={aiConfig}>
                    <EditorAiTrigger
                      operation="generate"
                      disabled={!aiAllowed || !aiPreparationValid}
                      onClick={(event) => {
                        if (
                          event.defaultPrevented ||
                          (hostState.allowsAiRequest() &&
                            aiPreparation?.restoreSelection())
                        )
                          return

                        event.preventDefault()
                      }}
                    >
                      Open AI proposal
                    </EditorAiTrigger>
                    <EditorAiPanel />
                  </EditorAiRoot>
                ) : (
                  <Box render={<output />}>
                    Configure the host and enable current AI permission before
                    opening a proposal.
                  </Box>
                )}
                <Button variant="outline" onClick={closeAiContext}>
                  Close AI context
                </Button>
              </Stack>
            </Box>
          ) : null}
        </EditorReviewProvider>
      </EditorRoot>
    </Stack>
  )
}
