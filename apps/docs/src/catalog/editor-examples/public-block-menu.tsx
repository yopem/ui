"use client"

import type { EditorAiConfig } from "@yopem-ui/editor/ai/client"
import type {
  EditorBlockMenuActionPreparation,
  EditorBlockMenuContext,
} from "@yopem-ui/editor/block-menu"
import type {
  EditorDiagramRenderInput,
  EditorDiagramRenderer,
  EditorDiagramRenderers,
} from "@yopem-ui/editor/diagram"
import type { EditorReviewHost } from "@yopem-ui/editor/review"
import type { ChangeEvent, KeyboardEvent } from "react"

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
import { ToolbarButton } from "@registry/components/ui/toolbar"
import {
  EditorAiPanel,
  EditorAiRoot,
  EditorAiTrigger,
  EditorContent,
  EditorHistoryButton,
  EditorRoot,
  EditorToolbar,
  useEditor,
} from "@yopem-ui/editor"
import { validateEditorAiConfig } from "@yopem-ui/editor/ai/client"
import {
  createEditorBlockMenu,
  EditorBlockMenu,
} from "@yopem-ui/editor/block-menu"
import {
  $createEditorDiagramCodeNode,
  createEditorDiagramHttpRenderer,
  EditorDiagramDeleteButton,
  EditorDiagramDownloadButton,
  EditorDiagramExtension,
  EditorDiagramKindSelect,
  EditorDiagramPreview,
  EditorDiagramRenderButton,
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
import {
  $getRoot,
  $getSelection,
  $isRangeSelection,
  HISTORY_PUSH_TAG,
} from "lexical"
import { Redo2Icon, Undo2Icon } from "lucide-react"
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

function createExampleReviewHost(commentsAllowed: boolean): EditorReviewHost {
  return {
    viewer: reviewViewer,
    visible: true,
    replyWhileReadonly: false,
    can(action, _targetId, viewer) {
      return (
        action === "create" && viewer.id === reviewViewer.id && commentsAllowed
      )
    },
  }
}

function createMenuHostState() {
  let commentsAllowed = true
  let aiAllowed = false
  let aiConfigured = false
  let diagramsAllowed = true
  let currentDiagramRenderer: EditorDiagramRenderer | undefined

  const targets = new Map<
    "ask-ai" | "code-drawing",
    EditorBlockMenuActionPreparation
  >()

  const renderDiagram: EditorDiagramRenderer = (
    input: EditorDiagramRenderInput,
  ) => {
    if (!diagramsAllowed || !currentDiagramRenderer)
      throw new Error("Diagram renderer is unavailable.")

    return currentDiagramRenderer(input)
  }

  const diagramRenderers: EditorDiagramRenderers = {
    mermaid: renderDiagram,
    plantuml: renderDiagram,
    graphviz: renderDiagram,
    flowchart: renderDiagram,
  }

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
    allowsDiagrams() {
      return diagramsAllowed
    },
    setCommentsAllowed(value: boolean) {
      commentsAllowed = value
    },
    setAiAllowed(value: boolean) {
      aiAllowed = value
    },
    setDiagramsAllowed(value: boolean) {
      diagramsAllowed = value
    },
    setDiagramRenderer(this: void, renderer: EditorDiagramRenderer) {
      currentDiagramRenderer = renderer
    },
    diagramRenderers,
    markAiConfigured() {
      aiConfigured = true
    },
    isCurrentTarget(
      action: "ask-ai" | "code-drawing",
      target: EditorBlockMenuActionPreparation,
    ) {
      return targets.get(action) === target
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

function DiagramInsertControl({
  disabled,
  hostState,
  preparation,
  onInserted,
}: {
  disabled: boolean
  hostState: ReturnType<typeof createMenuHostState>
  preparation: EditorBlockMenuActionPreparation | null
  onInserted: (preparation: EditorBlockMenuActionPreparation) => void
}) {
  const editor = useEditor()

  return (
    <ToolbarButton
      render={<Button variant="ghost" size="sm" />}
      aria-label="Insert diagram"
      disabled={disabled || !preparation?.getSnapshot()}
      onClick={(event) => {
        if (event.defaultPrevented) return

        if (
          !preparation ||
          !hostState.isCurrentTarget("code-drawing", preparation) ||
          !hostState.allowsDiagrams() ||
          !editor.isEditable() ||
          !preparation.restoreSelection()
        ) {
          event.preventDefault()

          return
        }

        let inserted = false

        editor.update(
          () => {
            if (
              event.defaultPrevented ||
              !hostState.isCurrentTarget("code-drawing", preparation) ||
              !hostState.allowsDiagrams() ||
              !editor.isEditable() ||
              !preparation.getSnapshot() ||
              $getRoot().isDirty()
            )
              return

            const code = $createEditorDiagramCodeNode(
              "mermaid",
              "graph TD\n  A[Start] --> B[Finish]",
              "both",
            )

            const selection = $getSelection()

            if ($isRangeSelection(selection)) selection.insertNodes([code])
            else $getRoot().append(code)
            code.selectStart()
            inserted = true
          },
          { discrete: true, tag: HISTORY_PUSH_TAG },
        )

        if (!inserted) {
          event.preventDefault()

          return
        }

        onInserted(preparation)
      }}
    >
      Insert diagram
    </ToolbarButton>
  )
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
  const [diagramsAllowed, setDiagramsAllowed] = useState(true)
  const [diagramEndpoint, setDiagramEndpoint] = useState("")
  const [diagramDocumentId, setDiagramDocumentId] = useState("")
  const [diagramCsrf, setDiagramCsrf] = useState("")
  const [diagramConfigured, setDiagramConfigured] = useState(false)
  const [diagramError, setDiagramError] = useState("")

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

  const [reviewHost, setReviewHost] = useState(() =>
    createExampleReviewHost(true),
  )

  const [setup] = useState(() => {
    const review = createEditorReview()

    const controller = createEditorBlockMenu({
      authorizeAction(action) {
        if (action === "ask-ai") return hostState.allowsAiSetup() === true

        if (action === "code-drawing")
          return hostState.allowsDiagrams() === true

        if (action === "add-comment") return hostState.allowsComments() === true

        return true
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
      diagramRenderers: hostState.diagramRenderers,
      setDiagramRenderer: hostState.setDiagramRenderer,
      extensions: [
        EditorDiagramExtension,
        review.extension,
        controller.extension,
      ],
    }
  })

  function updateCommentPermission(checked: boolean | "indeterminate") {
    const allowed = checked === true
    hostState.setCommentsAllowed(allowed)
    setCommentsAllowed(allowed)
    setReviewHost(createExampleReviewHost(allowed))
  }

  function handleHostKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (
      event.defaultPrevented ||
      event.nativeEvent.isComposing ||
      !event.altKey ||
      !event.shiftKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.key.toLowerCase() !== "c"
    )
      return

    event.preventDefault()
    updateCommentPermission(!hostState.allowsComments())
  }

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

  function updateDiagramEndpoint(event: ChangeEvent<HTMLInputElement>) {
    setDiagramEndpoint(event.target.value)
  }

  function updateDiagramDocumentId(event: ChangeEvent<HTMLInputElement>) {
    setDiagramDocumentId(event.target.value)
  }

  function updateDiagramCsrf(event: ChangeEvent<HTMLInputElement>) {
    setDiagramCsrf(event.target.value)
  }

  function updateDiagramPermission(checked: boolean | "indeterminate") {
    const allowed = checked === true
    hostState.setDiagramsAllowed(allowed)
    hostState.refreshTarget("code-drawing")
    setDiagramsAllowed(allowed)
  }

  function configureDiagram() {
    const documentId = diagramDocumentId.trim()
    const csrfToken = diagramCsrf

    const localHttpHost =
      window.location.protocol === "http:" &&
      ["localhost", "127.0.0.1", "[::1]"].includes(window.location.hostname)

    try {
      if (
        !hostState.allowsDiagrams() ||
        !documentId ||
        documentId.length > 256 ||
        !csrfToken.trim() ||
        csrfToken.length > 4096 ||
        (window.location.protocol !== "https:" && !localHttpHost)
      )
        throw new Error("Diagram host setup is invalid.")

      const renderer = createEditorDiagramHttpRenderer(
        diagramEndpoint,
        (input, init) => {
          const headers = new Headers(init?.headers)

          headers.set("x-editor-document-id", documentId)
          headers.set("x-csrf-token", csrfToken)

          return fetch(input, { ...init, headers })
        },
      )

      setup.setDiagramRenderer(renderer)
      setDiagramConfigured(true)
      setDiagramCsrf("")
      setDiagramError("")
    } catch {
      setDiagramError(
        "Use a same-origin HTTPS path, document ID, and current CSRF token.",
      )
    }
  }

  function finishDiagramInsertion(
    preparation: EditorBlockMenuActionPreparation,
  ) {
    if (!hostState.isCurrentTarget("code-drawing", preparation)) return

    hostState.replaceTarget("code-drawing", null)
    setDiagramPreparation(null)
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
    <Stack onKeyDown={handleHostKeyDown}>
      <Text>
        Right-click selected text or press Shift+F10. Menu actions open local
        controls. Review policy gates comment creation. AI setup and current
        permission gate requests. The menu never starts an AI request. Replace
        the example reviewer and permission switches with verified host identity
        and policy. Alt+Shift+C changes the local comment permission while the
        composer is open.
      </Text>
      <Field>
        <FieldLabel htmlFor={`${fieldId}-comments`}>
          Comment creation permission
        </FieldLabel>
        <Checkbox
          id={`${fieldId}-comments`}
          aria-label="Host currently permits comments"
          checked={commentsAllowed}
          onCheckedChange={updateCommentPermission}
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
      <Field>
        <FieldLabel htmlFor={`${fieldId}-diagram-permission`}>
          Diagram action permission
        </FieldLabel>
        <Checkbox
          id={`${fieldId}-diagram-permission`}
          aria-label="Host currently permits diagram actions"
          checked={diagramsAllowed}
          onCheckedChange={updateDiagramPermission}
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
      <Text>
        Set an explicit same-origin HTTPS endpoint, document ID, and CSRF token.
        Loopback HTTP works for local testing. Setup sends no request. Activate
        Render to send bounded source to the host. The host must check
        authentication, current permission, document access, CSRF, and quota.
      </Text>
      <Field>
        <FieldLabel htmlFor={`${fieldId}-diagram-endpoint`}>
          Diagram host endpoint
        </FieldLabel>
        <Input
          id={`${fieldId}-diagram-endpoint`}
          aria-label="Diagram host endpoint"
          value={diagramEndpoint}
          disabled={diagramConfigured || !diagramsAllowed}
          onChange={updateDiagramEndpoint}
        />
      </Field>
      <Field>
        <FieldLabel htmlFor={`${fieldId}-diagram-document`}>
          Diagram document ID
        </FieldLabel>
        <Input
          id={`${fieldId}-diagram-document`}
          aria-label="Diagram document ID"
          value={diagramDocumentId}
          disabled={diagramConfigured || !diagramsAllowed}
          onChange={updateDiagramDocumentId}
        />
      </Field>
      <Field>
        <FieldLabel htmlFor={`${fieldId}-diagram-csrf`}>
          Diagram CSRF token
        </FieldLabel>
        <Input
          id={`${fieldId}-diagram-csrf`}
          aria-label="Diagram CSRF token"
          type="password"
          autoComplete="off"
          maxLength={4096}
          value={diagramCsrf}
          disabled={diagramConfigured || !diagramsAllowed}
          onChange={updateDiagramCsrf}
        />
      </Field>
      <Button
        disabled={
          diagramConfigured ||
          !diagramsAllowed ||
          !diagramEndpoint ||
          !diagramDocumentId ||
          !diagramCsrf
        }
        onClick={configureDiagram}
      >
        Configure diagram renderer
      </Button>
      {diagramError ? <Text role="alert">{diagramError}</Text> : null}
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
          <EditorDiagramRoot
            disabled={!diagramsAllowed}
            renderers={setup.diagramRenderers}
          >
            {diagramToolsOpen ? (
              <Box
                render={<section />}
                aria-label="Code drawing action context"
              >
                <Stack>
                  {!diagramConfigured ? (
                    <Box render={<output />}>
                      Configure the host before rendering. No request is sent
                      during setup.
                    </Box>
                  ) : null}
                  <EditorDiagramToolbar aria-label="Block menu diagram controls">
                    <DiagramInsertControl
                      disabled={
                        !diagramPreparationValid ||
                        !diagramsAllowed ||
                        !editable
                      }
                      hostState={hostState}
                      onInserted={finishDiagramInsertion}
                      preparation={diagramPreparation}
                    />
                    <EditorDiagramKindSelect />
                    <EditorDiagramViewModeSelect />
                    <EditorDiagramRenderButton
                      disabled={!diagramConfigured || !diagramsAllowed}
                    />
                    <EditorDiagramDownloadButton />
                    <EditorDiagramDeleteButton />
                    <EditorDiagramStatus />
                  </EditorDiagramToolbar>
                  <EditorDiagramPreview />
                  <Button variant="outline" onClick={closeDiagramTools}>
                    Close diagram tools
                  </Button>
                </Stack>
              </Box>
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
