"use client"

import type { ChangeEvent, FormEvent, MouseEvent, ReactNode } from "react"

import { useStableCallback } from "@base-ui/utils/useStableCallback"
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

  function connect(element: HTMLDivElement | null) {
    binding.setHost(element ? host : null)
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

  const handleClick = useStableCallback(function handleClick() {
    controller.run(() => controller.setSuggesting(!view.suggesting))
  })

  return (
    <Button
      disabled={!view.suggesting && !controller.available("suggest")}
      aria-pressed={view.suggesting}
      onClick={handleClick}
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

  const capture = useStableCallback(function capture() {
    controller.capture()
  })

  const open = useStableCallback(function open() {
    setTarget(view.text)
    setOpened(true)
  })

  const submit = useStableCallback(function submit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    if (
      controller.run(() => {
        controller.restore()
        controller.$suggestDocumentText(target)
      })
    )
      setOpened(false)
  })

  const changeTarget = useStableCallback(function changeTarget(
    event: ChangeEvent<HTMLTextAreaElement>,
  ) {
    setTarget(event.target.value)
  })

  const close = useStableCallback(function close() {
    setOpened(false)
  })

  return (
    <Stack>
      <Button
        disabled={!view.diffAvailable || !controller.available("suggest")}
        onPointerDown={capture}
        onFocus={capture}
        onClick={open}
      >
        Review replacement
      </Button>
      {opened ? (
        <Form onSubmit={submit}>
          <Stack>
            <Field>
              <FieldLabel>Proposed document text</FieldLabel>
              <Textarea
                aria-label="Proposed document text"
                value={target}
                maxLength={4096}
                onChange={changeTarget}
              />
            </Field>
            <Text>Use one paragraph with at most 2048 graphemes.</Text>
            <HStack>
              <Button type="submit" disabled={!controller.available("suggest")}>
                Suggest document text
              </Button>
              <Button type="button" onClick={close}>
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

  const capture = useStableCallback(function capture() {
    controller.capture()
  })

  const open = useStableCallback(function open() {
    setCaptured(true)
  })

  const submit = useStableCallback(function submit(
    event: FormEvent<HTMLFormElement>,
  ) {
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
  })

  const cancel = useStableCallback(function cancel() {
    setDraft(null)
    setCaptured(false)
  })

  return (
    <Stack>
      <Button
        disabled={!controller.available("create")}
        onPointerDown={capture}
        onFocus={capture}
        onClick={open}
      >
        Comment on selection
      </Button>
      {captured ? (
        <Form onSubmit={submit}>
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
              <Button type="button" onClick={cancel}>
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

  const submit = useStableCallback(function submit(
    event: FormEvent<HTMLFormElement>,
  ) {
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
  })

  return (
    <Form onSubmit={submit}>
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

  const goToThread = useStableCallback(function goToThread() {
    controller.goToThread(id)
  })

  const resolveThread = useStableCallback(function resolveThread() {
    if (thread) controller.run(() => controller.$resolve(id, !thread.resolved))
  })

  const deleteThread = useStableCallback(function deleteThread() {
    controller.run(() => controller.$deleteThread(id))
  })

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
            onClick={goToThread}
          >
            Go to thread
          </Button>
          <Button
            disabled={
              !controller.available(thread.resolved ? "reopen" : "resolve", id)
            }
            onClick={resolveThread}
          >
            {thread.resolved ? "Reopen thread" : "Resolve thread"}
          </Button>
          <Button
            disabled={!controller.available("delete", id)}
            variant="destructive-outline"
            onClick={deleteThread}
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

  const finishEditing = useStableCallback(function finishEditing() {
    setEditing(false)
    queueMicrotask(() => {
      const button = editButton.current

      if (button?.isConnected && !button.disabled) button.focus()
    })
  })

  const submit = useStableCallback(function submit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    if (!draft) return

    if (
      controller.run(() => {
        controller.$editComment(threadId, comment.id, text, draft)
      })
    )
      finishEditing()
  })

  const edit = useStableCallback(function edit() {
    setDraft(comment.content ?? makeReviewRichContent(comment.text))
    setEditing(true)
  })

  const deleteComment = useStableCallback(function deleteComment() {
    controller.run(() => controller.$deleteComment(threadId, comment.id))
  })

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
          <Form onSubmit={submit}>
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
            onClick={edit}
          >
            Edit comment
          </Button>
          <Button
            disabled={!controller.availableDeleteComment(threadId, comment.id)}
            variant="destructive-outline"
            onClick={deleteComment}
          >
            Delete comment
          </Button>
        </HStack>
      </Stack>
    </Box>
  )
}

function EditorReviewDecisionButton({
  action,
  id,
}: {
  action: "accept" | "reject"
  id?: string
}) {
  const controller = useEditorReview()

  const handleClick = useStableCallback(function handleClick() {
    controller.run(() =>
      id ? controller.$decide(id, action) : controller.$decideAll(action),
    )
  })

  return (
    <Button
      disabled={
        !(id
          ? controller.available(action, id)
          : controller.availableAllDecisions(action))
      }
      onClick={handleClick}
    >
      {action === "accept" ? "Accept" : "Reject"}
      {id ? " suggestion" : " all suggestions"}
    </Button>
  )
}

export function EditorReviewDecisionControls({ id }: { id?: string }) {
  return (
    <HStack>
      {(["accept", "reject"] as const).map((action) => (
        <EditorReviewDecisionButton key={action} action={action} id={id} />
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

  const accept = useStableCallback(function accept(
    event: MouseEvent<HTMLButtonElement>,
  ) {
    if (!event.defaultPrevented) controller.decideStructural(id, "accept")
  })

  const reject = useStableCallback(function reject(
    event: MouseEvent<HTMLButtonElement>,
  ) {
    if (!event.defaultPrevented) controller.decideStructural(id, "reject")
  })

  return (
    <HStack>
      <Button
        type="button"
        disabled={!controller.available("accept", id)}
        onClick={accept}
      >
        Accept structural proposal
      </Button>
      <Button
        type="button"
        disabled={!controller.available("reject", id)}
        onClick={reject}
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

function EditorReviewGoToSuggestion({ id }: { id: string }) {
  const controller = useEditorReview()

  const goToSuggestion = useStableCallback(function goToSuggestion() {
    controller.goToSuggestion(id)
  })

  return (
    <Button type="button" onClick={goToSuggestion}>
      Go to suggestion
    </Button>
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
              <EditorReviewGoToSuggestion id={suggestion.id} />
              <EditorReviewDecisionControls id={suggestion.id} />
            </Stack>
          </Box>
        ))}
        <EditorReviewStructuralProposals />
      </Stack>
    </Box>
  )
}
