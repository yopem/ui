"use client"

import type { ReactNode } from "react"

import { AutoFocusExtension } from "@lexical/extension"
import { Box } from "@registry/components/ui/box"
import { Button } from "@registry/components/ui/button"
import { Field, FieldLabel } from "@registry/components/ui/field"
import { Form } from "@registry/components/ui/form"
import { Heading } from "@registry/components/ui/heading"
import { HStack } from "@registry/components/ui/hstack"
import { List, ListItem } from "@registry/components/ui/list"
import { Stack } from "@registry/components/ui/stack"
import { Text } from "@registry/components/ui/text"
import { Textarea } from "@registry/components/ui/textarea"
import { Wrap } from "@registry/components/ui/wrap"
import * as stylex from "@stylexjs/stylex"
import {
  createContext,
  use,
  useRef,
  useState,
  useSyncExternalStore,
} from "react"

import type {
  EditorReviewController,
  EditorReviewBinding,
} from "./review-extension"
import type { EditorReviewHost } from "./review-model"
import type { EditorReviewTreeChange } from "./review-tree-diff"

import {
  makeReviewRichContent,
  reviewRichText,
  type EditorReviewRichContent as ReviewRichContent,
} from "./review-richtext"
import {
  EditorReviewRichComposer,
  EditorReviewRichContent,
} from "./review-richtext-components"
import { useEditor } from "./root"

const reviewDraftFocusExtensions = Object.freeze([AutoFocusExtension])

const reviewStyles = stylex.create({ panel: { overflowWrap: "anywhere" } })

const ReviewContext = createContext<EditorReviewBinding | null>(null)

function createReviewConnection(
  binding: EditorReviewBinding,
  host: EditorReviewHost | null,
) {
  function connect(element: HTMLDivElement | null) {
    if (!element) return
    binding.setHost(host)

    return function disconnect() {
      binding.setHost(null)
    }
  }

  return connect
}

export function EditorReviewProvider({
  controller,
  host,
  children,
}: {
  controller: EditorReviewController
  host: EditorReviewHost | null
  children: ReactNode
}) {
  const binding = controller.forEditor(useEditor())
  const [source, setSource] = useState({ binding, host })

  const [connect, setConnect] = useState(() =>
    createReviewConnection(binding, host),
  )

  if (source.binding !== binding || source.host !== host) {
    setSource({ binding, host })
    setConnect(() => createReviewConnection(binding, host))
  }

  return (
    <ReviewContext value={binding}>
      <Box ref={connect}>{children}</Box>
    </ReviewContext>
  )
}

export function useEditorReview() {
  const controller = use(ReviewContext)

  if (!controller) throw new Error("Review parts require EditorReviewProvider.")

  const revision = useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
    controller.getSnapshot,
  )

  return { ...controller, revision }
}

export function EditorReviewModeControl() {
  const controller = useEditorReview()
  const view = controller.getView()

  return (
    <Button
      disabled={!view.suggesting && !controller.available("suggest")}
      aria-pressed={view.suggesting}
      onClick={() =>
        controller.run(() => controller.setSuggesting(!view.suggesting))
      }
    >
      Suggest edits
    </Button>
  )
}

export function EditorReviewDiffControl() {
  const controller = useEditorReview()
  const view = controller.getView()
  const [opened, setOpened] = useState(false)
  const [target, setTarget] = useState("")

  return (
    <Stack>
      <Button
        disabled={!view.diffAvailable || !controller.available("suggest")}
        onPointerDown={() => controller.capture()}
        onFocus={() => controller.capture()}
        onClick={() => {
          setTarget(view.text)
          setOpened(true)
        }}
      >
        Review replacement
      </Button>
      {opened ? (
        <Form
          onSubmit={(event) => {
            event.preventDefault()

            if (
              controller.run(() => {
                controller.restore()
                controller.$suggestDocumentText(target)
              })
            )
              setOpened(false)
          }}
        >
          <Stack>
            <Field>
              <FieldLabel>Proposed document text</FieldLabel>
              <Textarea
                aria-label="Proposed document text"
                value={target}
                maxLength={4096}
                onChange={(event) => setTarget(event.target.value)}
              />
            </Field>
            <Text>Use one paragraph with at most 2048 graphemes.</Text>
            <HStack>
              <Button type="submit" disabled={!controller.available("suggest")}>
                Suggest document text
              </Button>
              <Button type="button" onClick={() => setOpened(false)}>
                Cancel replacement
              </Button>
            </HStack>
          </Stack>
        </Form>
      ) : null}
    </Stack>
  )
}

export function EditorReviewCreateControl() {
  const controller = useEditorReview()
  const [draft, setDraft] = useState<ReviewRichContent | null>(null)
  const [captured, setCaptured] = useState(false)
  const text = draft ? reviewRichText(draft).trim() : ""

  const view = controller.getView()
  const [request, setRequest] = useState(view.commentRequest)

  if (request !== view.commentRequest) {
    setRequest(view.commentRequest)
    setCaptured(true)
  }

  return (
    <Stack>
      <Button
        disabled={!controller.available("create")}
        onPointerDown={() => controller.capture()}
        onFocus={() => controller.capture()}
        onClick={() => setCaptured(true)}
      >
        Comment on selection
      </Button>
      {captured ? (
        <Form
          onSubmit={(event) => {
            event.preventDefault()

            if (!draft) return

            if (
              controller.run(() => {
                controller.restore()
                controller.$createThread(text, draft)
              })
            ) {
              setDraft(null)
              setCaptured(false)
            }
          }}
        >
          <Stack>
            <EditorReviewRichComposer
              extensions={reviewDraftFocusExtensions}
              label="New comment"
              onChange={setDraft}
              disabled={!controller.available("create")}
            />
            <HStack>
              <Button
                type="submit"
                disabled={!text || !controller.available("create")}
              >
                Add comment
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setDraft(null)
                  setCaptured(false)
                }}
              >
                Cancel comment
              </Button>
            </HStack>
          </Stack>
        </Form>
      ) : null}
    </Stack>
  )
}

export function EditorReviewReplyForm({ id }: { id: string }) {
  const controller = useEditorReview()
  const [draft, setDraft] = useState<ReviewRichContent | null>(null)
  const [revision, setRevision] = useState(0)
  const text = draft ? reviewRichText(draft).trim() : ""

  return (
    <Form
      onSubmit={(event) => {
        event.preventDefault()

        if (!draft) return

        if (
          controller.run(() => {
            controller.$reply(id, text, draft)
          })
        ) {
          setDraft(null)
          setRevision((value) => value + 1)
        }
      }}
    >
      <Stack>
        <EditorReviewRichComposer
          key={revision}
          extensions={revision > 0 ? reviewDraftFocusExtensions : undefined}
          label={`Reply to thread ${id}`}
          onChange={setDraft}
          disabled={!controller.available("reply", id)}
        />
        <Button
          type="submit"
          disabled={!text || !controller.available("reply", id)}
        >
          Reply
        </Button>
      </Stack>
    </Form>
  )
}

export function EditorReviewThread({ id }: { id: string }) {
  const controller = useEditorReview()
  const view = controller.getView()
  const thread = view.data.threads.find((item) => item.id === id)

  if (!thread) return null

  return (
    <Box render={<section aria-label={`Thread ${id}`} />}>
      <Stack>
        <Heading render={<h3>Review thread</h3>}>
          {thread.resolved ? "Resolved thread" : "Open thread"}
        </Heading>
        {view.detachedThreadIds.includes(id) ? (
          <Text>Anchor removed</Text>
        ) : null}
        {thread.comments.map((comment) => (
          <EditorReviewComment
            key={comment.id}
            threadId={id}
            comment={comment}
          />
        ))}
        <Wrap>
          <Button
            disabled={view.detachedThreadIds.includes(id)}
            onClick={() => controller.goToThread(id)}
          >
            Go to thread
          </Button>
          <Button
            disabled={
              !controller.available(thread.resolved ? "reopen" : "resolve", id)
            }
            onClick={() =>
              controller.run(() => controller.$resolve(id, !thread.resolved))
            }
          >
            {thread.resolved ? "Reopen thread" : "Resolve thread"}
          </Button>
          <Button
            disabled={!controller.available("delete", id)}
            variant="destructive-outline"
            onClick={() => controller.run(() => controller.$deleteThread(id))}
          >
            Delete thread
          </Button>
        </Wrap>
        <Box hidden={thread.resolved}>
          <EditorReviewReplyForm id={id} />
        </Box>
      </Stack>
    </Box>
  )
}

export function EditorReviewComment({
  threadId,
  comment,
}: {
  threadId: string
  comment: ReturnType<
    EditorReviewBinding["getView"]
  >["data"]["threads"][number]["comments"][number]
}) {
  const controller = useEditorReview()
  const [editing, setEditing] = useState(false)
  const editButton = useRef<HTMLButtonElement | null>(null)
  const [draft, setDraft] = useState<ReviewRichContent | null>(null)
  const text = draft ? reviewRichText(draft).trim() : ""

  function finishEditing() {
    setEditing(false)
    queueMicrotask(() => {
      const button = editButton.current

      if (button?.isConnected && !button.disabled) button.focus()
    })
  }

  return (
    <Box render={<article aria-label={`Comment by ${comment.author.name}`} />}>
      <Stack>
        <Text>
          {comment.author.name} ·{" "}
          <time dateTime={new Date(comment.createdAt).toISOString()}>
            {new Date(comment.createdAt).toISOString()}
          </time>
        </Text>
        {editing ? (
          <Form
            onSubmit={(event) => {
              event.preventDefault()

              if (!draft) return

              if (
                controller.run(() => {
                  controller.$editComment(threadId, comment.id, text, draft)
                })
              )
                finishEditing()
            }}
          >
            <Stack>
              <EditorReviewRichComposer
                extensions={reviewDraftFocusExtensions}
                label="Edit comment"
                initialContent={draft ?? undefined}
                onChange={setDraft}
                disabled={!controller.available("edit", comment.id)}
              />
              <HStack>
                <Button
                  type="submit"
                  disabled={!text || !controller.available("edit", comment.id)}
                >
                  Save comment
                </Button>
                <Button type="button" onClick={finishEditing}>
                  Cancel edit
                </Button>
              </HStack>
            </Stack>
          </Form>
        ) : comment.content ? (
          <EditorReviewRichContent content={comment.content} />
        ) : (
          <Text>{comment.text}</Text>
        )}
        <HStack>
          <Button
            ref={editButton}
            disabled={editing || !controller.available("edit", comment.id)}
            onClick={() => {
              setDraft(comment.content ?? makeReviewRichContent(comment.text))
              setEditing(true)
            }}
          >
            Edit comment
          </Button>
          <Button
            disabled={!controller.availableDeleteComment(threadId, comment.id)}
            variant="destructive-outline"
            onClick={() =>
              controller.run(() =>
                controller.$deleteComment(threadId, comment.id),
              )
            }
          >
            Delete comment
          </Button>
        </HStack>
      </Stack>
    </Box>
  )
}

export function EditorReviewDecisionControls({ id }: { id?: string }) {
  const controller = useEditorReview()

  return (
    <HStack>
      {(["accept", "reject"] as const).map((action) => (
        <Button
          key={action}
          disabled={
            !(id
              ? controller.available(action, id)
              : controller.availableAllDecisions(action))
          }
          onClick={() =>
            controller.run(() =>
              id
                ? controller.$decide(id, action)
                : controller.$decideAll(action),
            )
          }
        >
          {action === "accept" ? "Accept" : "Reject"}
          {id ? " suggestion" : " all suggestions"}
        </Button>
      ))}
    </HStack>
  )
}

function structuralChangeLabel(change: EditorReviewTreeChange) {
  if (change.kind === "break")
    return change.after === "(removed)"
      ? "Remove line break"
      : "Insert line break"

  if (change.kind === "move")
    return `Move ${change.nodeType ?? "block"} from ${change.fromPath?.join(".")} to ${change.toPath?.join(".")}`

  if (change.kind === "property")
    return `Change ${change.property ?? "property"} on ${change.nodeType ?? "node"}`

  if (change.kind === "replace")
    return `Replace ${change.beforeType ?? "node"} with ${change.afterType ?? "node"}`

  if (change.kind === "remove") return `Remove ${change.nodeType ?? "node"}`

  return `Insert ${change.nodeType ?? "node"}`
}

export function EditorReviewStructuralChangeList({ id }: { id: string }) {
  const controller = useEditorReview()

  const proposal = controller
    .getView()
    .structuralProposals.find((item) => item.id === id)

  if (!proposal) return null

  return (
    <List aria-label="Structural changes">
      {proposal.changes.map((change) => (
        <ListItem key={JSON.stringify([proposal.id, change])}>
          <Stack>
            <Text>{structuralChangeLabel(change)}</Text>
            {change.before ? <Text>Before: {change.before}</Text> : null}
            {change.after ? <Text>After: {change.after}</Text> : null}
          </Stack>
        </ListItem>
      ))}
    </List>
  )
}

export function EditorReviewStructuralDecisionControls({ id }: { id: string }) {
  const controller = useEditorReview()

  return (
    <HStack>
      <Button
        type="button"
        disabled={!controller.available("accept", id)}
        onClick={(event) => {
          if (!event.defaultPrevented) controller.decideStructural(id, "accept")
        }}
      >
        Accept structural proposal
      </Button>
      <Button
        type="button"
        disabled={!controller.available("reject", id)}
        onClick={(event) => {
          if (!event.defaultPrevented) controller.decideStructural(id, "reject")
        }}
      >
        Reject structural proposal
      </Button>
    </HStack>
  )
}

export function EditorReviewStructuralProposal({ id }: { id: string }) {
  const controller = useEditorReview()

  const proposal = controller
    .getView()
    .structuralProposals.find((item) => item.id === id)

  if (!proposal) return null

  return (
    <Box render={<section aria-label={`Structural proposal ${id}`} />}>
      <Stack>
        <Text>Proposed by {proposal.author.name}</Text>
        <EditorReviewStructuralChangeList id={id} />
        <EditorReviewStructuralDecisionControls id={id} />
      </Stack>
    </Box>
  )
}

export function EditorReviewStructuralProposals() {
  const controller = useEditorReview()
  const view = controller.getView()

  if (!view.visible) return null

  const proposals = view.structuralProposals

  return (
    <Box render={<section aria-label="Structural proposals" />}>
      <Stack>
        <Heading>Structural proposals</Heading>
        {proposals.length ? (
          proposals.map((proposal) => (
            <EditorReviewStructuralProposal
              key={proposal.id}
              id={proposal.id}
            />
          ))
        ) : (
          <Text>No structural proposals.</Text>
        )}
      </Stack>
    </Box>
  )
}

export function EditorReviewPanel() {
  const controller = useEditorReview()
  const view = controller.getView()

  return (
    <Box render={<aside aria-label="Document review" />}>
      <Stack xstyle={reviewStyles.panel}>
        <Heading>Document review</Heading>
        <Box render={<output aria-live="polite" />}>{view.diagnostic}</Box>
        {view.data.threads.map((thread) => (
          <EditorReviewThread key={thread.id} id={thread.id} />
        ))}
        {view.suggestions.length ? <EditorReviewDecisionControls /> : null}
        {view.suggestions.map((suggestion) => (
          <Box
            render={<section aria-label={`Suggestion ${suggestion.id}`} />}
            key={suggestion.id}
          >
            <Stack>
              <Text>
                {suggestion.author.name}: {suggestion.kind}
              </Text>
              {suggestion.breakKind ? (
                <Text>
                  {suggestion.breakKind === "paragraph"
                    ? "Paragraph break"
                    : "Line break"}
                </Text>
              ) : null}
              {suggestion.insertedText &&
              (!suggestion.breakKind || suggestion.insertedText !== "\n") ? (
                <Text>Inserted preview: {suggestion.insertedText}</Text>
              ) : null}
              {suggestion.removedText ? (
                <Text>Removed preview: {suggestion.removedText}</Text>
              ) : null}
              {suggestion.formattedText ? (
                <Text>Format preview: {suggestion.formattedText}</Text>
              ) : null}
              <Button
                type="button"
                onClick={() => controller.goToSuggestion(suggestion.id)}
              >
                Go to suggestion
              </Button>
              <EditorReviewDecisionControls id={suggestion.id} />
            </Stack>
          </Box>
        ))}
        <EditorReviewStructuralProposals />
      </Stack>
    </Box>
  )
}
