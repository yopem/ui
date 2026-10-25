"use client"

import type {
  ChangeEvent,
  ComponentProps,
  Dispatch,
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent as ReactMouseEvent,
  ReactElement,
  ReactNode,
  SetStateAction,
} from "react"

import { useRender } from "@base-ui/react/use-render"
import { Box } from "@registry/components/ui/box"
import { Button } from "@registry/components/ui/button"
import {
  DialogDescription,
  DialogPanel,
  DialogPopup,
  DialogTitle,
  DialogTrigger,
} from "@registry/components/ui/dialog"
import { Input } from "@registry/components/ui/input"
import { List, ListItem } from "@registry/components/ui/list"
import { ScrollArea } from "@registry/components/ui/scroll-area"
import { Stack } from "@registry/components/ui/stack"
import { Text } from "@registry/components/ui/text"
import { Wrap } from "@registry/components/ui/wrap"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"
import {
  $getNearestNodeFromDOMNode,
  $getNodeByKey,
  $getRoot,
  $getSelection,
  $isElementNode,
  $isRangeSelection,
  HISTORY_PUSH_TAG,
  type ElementNode,
  type LexicalNode,
} from "lexical"
import {
  createContext,
  useContext,
  useState,
  useSyncExternalStore,
} from "react"

import type { EditorAiOperation } from "./ai-client"
import type { EditorReviewBinding } from "./review-extension"
import type { EditorContentProps } from "./root"

import { useAi } from "./ai-controls"
import { EditorContent, useEditor, useEditorState } from "./root"
import { createEditorSelectionBookmark } from "./selection-bookmark"

const styles = stylex.create({
  activeCommand: {
    backgroundColor: tokens["--accent"],
    color: tokens["--accent-foreground"],
  },
  chat: { maxBlockSize: "10rem" },
  commandPane: { maxBlockSize: "16rem" },
  commandList: { listStyle: "none", paddingInlineStart: 0 },
  message: { overflowWrap: "anywhere", whiteSpace: "pre-wrap" },
  proposal: { maxBlockSize: "16rem" },
})

interface EditorAiMenuCommand {
  label: string
  instruction: string
  operation: "generate" | "selection"
  review?: true
  sourceFormat?: "markdown" | "mdx"
}

interface EditorAiChatMessage {
  id: number
  role: "You" | "AI"
  text: string
}

interface EditorAiMenuRequest {
  command: EditorAiMenuCommand
  instruction: string
  operation: EditorAiOperation
}

const commands: readonly EditorAiMenuCommand[] = [
  {
    label: "Continue",
    instruction:
      "Continue the current text using the selected text and document context. Return plain text only.",
    operation: "generate",
  },
  {
    label: "Summarize",
    instruction:
      "Summarize the selected text or document context. Return concise plain text only.",
    operation: "selection",
  },
  {
    label: "Explain",
    instruction:
      "Explain the selected text or document context in clear plain text.",
    operation: "selection",
  },
  {
    label: "Improve",
    instruction:
      "Improve clarity and flow of the selected text or document context. Return the revised plain text only.",
    operation: "selection",
  },
  {
    label: "Emojify",
    instruction:
      "Rewrite the selected text or document context with suitable emoji. Return plain text only.",
    operation: "selection",
  },
  {
    label: "Shorten",
    instruction:
      "Make the selected text or document context shorter. Return the revised plain text only.",
    operation: "selection",
  },
  {
    label: "Lengthen",
    instruction:
      "Make the selected text or document context longer. Return the revised plain text only.",
    operation: "selection",
  },
  {
    label: "Fix grammar",
    instruction:
      "Fix spelling and grammar in the selected text or document context. Return the revised plain text only.",
    operation: "selection",
  },
  {
    label: "Simplify",
    instruction:
      "Simplify the selected text or document context. Return the revised plain text only.",
    operation: "selection",
  },
  {
    label: "Comment",
    instruction:
      "Draft a concise review comment about the selected text or document context. Return plain text only. Do not include HTML.",
    operation: "generate",
    review: true,
  },
  {
    label: "Markdown sample",
    instruction:
      "Write a small Markdown source sample as plain text. Do not output HTML or executable code.",
    operation: "generate",
    sourceFormat: "markdown",
  },
  {
    label: "MDX sample",
    instruction:
      "Write a small MDX source sample as plain text. Do not execute or evaluate MDX. Do not output HTML.",
    operation: "generate",
    sourceFormat: "mdx",
  },
]

const EditorAiMenuBookmarkContext = createContext<ReturnType<
  typeof createEditorSelectionBookmark
> | null>(null)

const EditorAiMenuMarkdownInsertionContext = createContext<
  ((source: string) => boolean) | null
>(null)

const EditorAiMenuMessagesContext = createContext<EditorAiChatMessage[]>([])

const EditorAiMenuMessagesDispatchContext = createContext<Dispatch<
  SetStateAction<EditorAiChatMessage[]>
> | null>(null)

function useMenuMessages() {
  const messages = useContext(EditorAiMenuMessagesContext)
  const setMessages = useContext(EditorAiMenuMessagesDispatchContext)

  if (!setMessages) throw new Error("EditorAiMenuRoot is required.")

  return { messages, setMessages }
}

function useMenuBookmark() {
  const bookmark = useContext(EditorAiMenuBookmarkContext)

  if (!bookmark) throw new Error("EditorAiMenuRoot is required.")

  return bookmark
}

export function EditorAiMenuRoot({
  children,
  markdownInsertion,
}: {
  children: ReactNode
  markdownInsertion?: (source: string) => boolean
}) {
  const editor = useEditor()
  const { session } = useAi()
  const [bookmark] = useState(() => createEditorSelectionBookmark(editor))
  const [messages, setMessages] = useState<EditorAiChatMessage[]>([])

  const [bookmarkStore] = useState(() => ({
    subscribe: (listener: () => void) => {
      const unsubscribeBookmark = bookmark.subscribe(listener)

      const unsubscribeSession = session.subscribe(() => {
        if (!session.getSnapshot().open) bookmark.clear()
        listener()
      })

      return function unsubscribe() {
        unsubscribeBookmark()
        unsubscribeSession()
      }
    },
    getSnapshot: () =>
      `${session.getSnapshot().open}:${bookmark.getSnapshot()}`,
    getServerSnapshot: () => "false:false",
  }))

  useSyncExternalStore(
    bookmarkStore.subscribe,
    bookmarkStore.getSnapshot,
    bookmarkStore.getServerSnapshot,
  )

  return (
    <EditorAiMenuBookmarkContext.Provider value={bookmark}>
      <EditorAiMenuMarkdownInsertionContext.Provider
        value={markdownInsertion ?? null}
      >
        <EditorAiMenuMessagesContext.Provider value={messages}>
          <EditorAiMenuMessagesDispatchContext.Provider value={setMessages}>
            {children}
          </EditorAiMenuMessagesDispatchContext.Provider>
        </EditorAiMenuMessagesContext.Provider>
      </EditorAiMenuMarkdownInsertionContext.Provider>
    </EditorAiMenuBookmarkContext.Provider>
  )
}

function selectedText(editor: ReturnType<typeof useEditor>) {
  return editor.getEditorState().read(() => {
    const selection = $getSelection()

    return $isRangeSelection(selection) ? selection.getTextContent() : ""
  })
}

function openAiMenu(
  session: ReturnType<typeof useAi>["session"],
  editor: ReturnType<typeof useEditor>,
  bookmark: ReturnType<typeof createEditorSelectionBookmark>,
  operation?: "generate" | "rewrite",
) {
  if (editor.isComposing()) return

  editor.getEditorState().read(() => bookmark.capture())
  session.open(operation ?? (selectedText(editor) ? "rewrite" : "generate"))
}

function resetAiSession(
  session: ReturnType<typeof useAi>["session"],
  editor: ReturnType<typeof useEditor>,
  bookmark: ReturnType<typeof createEditorSelectionBookmark>,
  operation: EditorAiOperation,
) {
  if (editor.isComposing() || !bookmark.getSnapshot()) return false

  let restored = false

  editor.update(
    () => {
      restored = bookmark.restore()
    },
    { discrete: true },
  )

  if (!restored) return false

  session.open(operation)

  return session.getSnapshot().status === "idle"
}

function $getTopLevelBlock(node: LexicalNode | null): ElementNode | null {
  if (!node) return null
  const root = $getRoot()
  let current = node

  while (current.getParent() && current.getParent() !== root) {
    const parent = current.getParent()

    if (!parent) return null
    current = parent
  }

  return current.getParent() === root && $isElementNode(current)
    ? current
    : null
}

function hasSelectedText(editor: ReturnType<typeof useEditor>) {
  return editor.getEditorState().read(() => {
    const selection = $getSelection()

    return $isRangeSelection(selection) && !selection.isCollapsed()
  })
}

function selectContextBlock(
  editor: ReturnType<typeof useEditor>,
  target: EventTarget | null,
) {
  const NodeConstructor =
    editor.getRootElement()?.ownerDocument.defaultView?.Node

  const key = editor.getEditorState().read(() => {
    const node =
      NodeConstructor && target instanceof NodeConstructor
        ? $getNearestNodeFromDOMNode(target)
        : null

    return $getTopLevelBlock(node)?.getKey() ?? null
  })

  if (!key) return false

  let selected = false
  editor.update(
    () => {
      const block = $getNodeByKey(key)

      if (block?.getParent() !== $getRoot()) return
      block.selectEnd()
      selected = true
    },
    { discrete: true },
  )

  return selected
}

function appendChatMessage(
  messages: EditorAiChatMessage[],
  role: EditorAiChatMessage["role"],
  text: string,
) {
  const id = (messages.at(-1)?.id ?? -1) + 1

  const boundedText = text.slice(0, 2048).replace(/[\uD800-\uDBFF]$/u, "")

  return [...messages, { id, role, text: boundedText }].slice(-12)
}

function chatInstruction(
  command: EditorAiMenuCommand,
  messages: EditorAiChatMessage[],
) {
  const history = messages
    .slice(-6)
    .map((message) => `${message.role}: ${message.text}`)
    .join("\n")

  return history
    ? `${command.instruction}\n\nRecent conversation:\n${history}`
    : command.instruction
}

type EditorAiMenuState = ReturnType<typeof useAi>["state"]

interface EditorAiMenuChatInputProps {
  disabled: boolean
  onChange: (event: ChangeEvent<HTMLInputElement>) => void
  onKeyDown: (event: ReactKeyboardEvent<HTMLInputElement>) => void
  onSend: () => void
  value: string
}

function EditorAiMenuChatInput({
  disabled,
  onChange,
  onKeyDown,
  onSend,
  value,
}: EditorAiMenuChatInputProps) {
  return (
    <Wrap>
      <Input
        aria-label="AI chat message"
        maxLength={2048}
        value={value}
        disabled={disabled}
        onChange={onChange}
        onKeyDown={onKeyDown}
      />
      <Button
        type="button"
        disabled={disabled || !value.trim()}
        onClick={onSend}
      >
        Send
      </Button>
    </Wrap>
  )
}

interface EditorAiMenuSearchProps {
  activeIndex: number
  bookmarkCaptured: boolean
  commands: readonly EditorAiMenuCommand[]
  disabled: boolean
  onKeyDown: (event: ReactKeyboardEvent<HTMLInputElement>) => void
  onSearchChange: (event: ChangeEvent<HTMLInputElement>) => void
  onSelect: (command: EditorAiMenuCommand) => void
  query: string
  reviewAllowed: boolean
  status: EditorAiMenuState["status"]
}

function EditorAiMenuSearch({
  activeIndex,
  bookmarkCaptured,
  commands,
  disabled,
  onKeyDown,
  onSearchChange,
  onSelect,
  query,
  reviewAllowed,
  status,
}: EditorAiMenuSearchProps) {
  return (
    <>
      <Input
        aria-label="Search AI commands"
        maxLength={128}
        value={query}
        disabled={disabled}
        onChange={onSearchChange}
        onKeyDown={onKeyDown}
      />
      <ScrollArea aria-label="AI commands" xstyle={styles.commandPane}>
        <List aria-label="AI commands" xstyle={styles.commandList}>
          {commands.length ? (
            commands.map((command, index) => (
              <ListItem key={command.label}>
                <Button
                  type="button"
                  variant="ghost"
                  xstyle={
                    index === activeIndex ? styles.activeCommand : undefined
                  }
                  aria-current={index === activeIndex ? "true" : undefined}
                  disabled={
                    !bookmarkCaptured ||
                    status === "streaming" ||
                    status === "stale" ||
                    (command.review === true && !reviewAllowed)
                  }
                  onClick={() => onSelect(command)}
                >
                  {command.label}
                </Button>
              </ListItem>
            ))
          ) : (
            <ListItem>
              <Text>No matching command.</Text>
            </ListItem>
          )}
        </List>
      </ScrollArea>
    </>
  )
}

const statusMessages: Record<
  Exclude<EditorAiMenuState["status"], "idle">,
  string
> = {
  ready: "Ready for approval.",
  streaming: "Generating proposal.",
  stale: "Proposal target expired. Close the menu and start again.",
  failed: "Request failed. No text was applied.",
  timeout: "Request timed out. No text was applied.",
  truncated: "Stream ended early. No text was applied.",
  cancelled: "Request stopped. No text was applied.",
}

function EditorAiMenuStatus({
  activeCommand,
  bookmarkCaptured,
  status,
}: {
  activeCommand: string | undefined
  bookmarkCaptured: boolean
  status: EditorAiMenuState["status"]
}) {
  const message = !bookmarkCaptured
    ? "Close and reopen through this menu to capture its target."
    : status === "idle"
      ? activeCommand
        ? `Active command: ${activeCommand}.`
        : "Choose a command."
      : statusMessages[status]

  return (
    <Box
      render={<output aria-live="polite" />}
      data-slot="editor-ai-menu-status"
      data-state={status}
    >
      {message}
    </Box>
  )
}

function EditorAiMenuTranscript({
  messages,
  text,
}: {
  messages: EditorAiChatMessage[]
  text: string
}) {
  return (
    <>
      {text ? (
        <ScrollArea aria-label="AI proposal" xstyle={styles.proposal}>
          <Text xstyle={styles.message}>{text}</Text>
        </ScrollArea>
      ) : null}
      {messages.length ? (
        <ScrollArea aria-label="AI chat history" xstyle={styles.chat}>
          {messages.map((message) => (
            <Box key={message.id}>
              <Text>{message.role}</Text>
              <Text xstyle={styles.message}>{message.text}</Text>
            </Box>
          ))}
        </ScrollArea>
      ) : null}
    </>
  )
}

interface EditorAiMenuActionsProps {
  bookmarkCaptured: boolean
  editable: boolean
  lastRequest: EditorAiMenuRequest | null
  markdownAvailable: boolean
  markdownError: string
  onApproveComment: () => void
  onApproveMarkdown: () => void
  onApproveReplace: () => void
  onCancel: () => void
  onDiscard: () => void
  onInsertBelow: () => void
  onRetry: () => void
  reviewAllowed: boolean
  reviewCommentWithinLimit: boolean
  reviewError: string
  state: EditorAiMenuState
}

type EditorAiMenuRequestActionsProps = Pick<
  EditorAiMenuActionsProps,
  | "bookmarkCaptured"
  | "editable"
  | "lastRequest"
  | "onCancel"
  | "onRetry"
  | "state"
>

function EditorAiMenuRequestActions({
  bookmarkCaptured,
  editable,
  lastRequest,
  onCancel,
  onRetry,
  state,
}: EditorAiMenuRequestActionsProps) {
  const retryable =
    state.status === "failed" ||
    state.status === "cancelled" ||
    state.status === "timeout" ||
    state.status === "truncated"

  return (
    <>
      <Button
        type="button"
        disabled={!bookmarkCaptured || state.status !== "streaming"}
        onClick={onCancel}
      >
        Stop
      </Button>
      {retryable && lastRequest ? (
        <Button
          type="button"
          disabled={!editable || !bookmarkCaptured}
          onClick={onRetry}
        >
          Retry
        </Button>
      ) : null}
    </>
  )
}

type EditorAiMenuApprovalActionsProps = Pick<
  EditorAiMenuActionsProps,
  | "bookmarkCaptured"
  | "editable"
  | "lastRequest"
  | "markdownAvailable"
  | "onApproveComment"
  | "onApproveMarkdown"
  | "onApproveReplace"
  | "onDiscard"
  | "onInsertBelow"
  | "reviewAllowed"
  | "reviewCommentWithinLimit"
  | "state"
>

function EditorAiMenuApprovalActions({
  bookmarkCaptured,
  editable,
  lastRequest,
  markdownAvailable,
  onApproveComment,
  onApproveMarkdown,
  onApproveReplace,
  onDiscard,
  onInsertBelow,
  reviewAllowed,
  reviewCommentWithinLimit,
  state,
}: EditorAiMenuApprovalActionsProps) {
  if (state.status !== "ready" || !state.text) return null

  return (
    <>
      {lastRequest?.command.review ? (
        <Button
          type="button"
          disabled={
            !reviewAllowed ||
            !editable ||
            !bookmarkCaptured ||
            !reviewCommentWithinLimit
          }
          onClick={onApproveComment}
        >
          Create review comment
        </Button>
      ) : (
        <>
          {lastRequest?.command.sourceFormat === "markdown" &&
          markdownAvailable ? (
            <Button
              type="button"
              disabled={!editable || !bookmarkCaptured}
              onClick={onApproveMarkdown}
            >
              Insert Markdown
            </Button>
          ) : null}
          <Button
            type="button"
            disabled={!editable || !bookmarkCaptured}
            onClick={onApproveReplace}
          >
            {lastRequest?.command.sourceFormat
              ? "Insert source as plain text"
              : state.operation === "rewrite"
                ? "Replace selection"
                : "Insert at caret"}
          </Button>
          <Button
            type="button"
            disabled={!editable || !bookmarkCaptured}
            onClick={onInsertBelow}
          >
            {lastRequest?.command.sourceFormat
              ? "Insert source below as plain text"
              : "Insert below"}
          </Button>
        </>
      )}
      <Button type="button" disabled={!bookmarkCaptured} onClick={onDiscard}>
        Discard proposal
      </Button>
    </>
  )
}

function EditorAiMenuActions({
  bookmarkCaptured,
  editable,
  lastRequest,
  markdownAvailable,
  markdownError,
  onApproveComment,
  onApproveMarkdown,
  onApproveReplace,
  onCancel,
  onDiscard,
  onInsertBelow,
  onRetry,
  reviewAllowed,
  reviewCommentWithinLimit,
  reviewError,
  state,
}: EditorAiMenuActionsProps) {
  return (
    <>
      {reviewError ? <Text role="alert">{reviewError}</Text> : null}
      {markdownError ? <Text role="alert">{markdownError}</Text> : null}
      {lastRequest?.command.review &&
      state.status === "ready" &&
      !reviewCommentWithinLimit ? (
        <Text role="alert">
          Review comments must be at most 16384 characters.
        </Text>
      ) : null}
      <Wrap>
        <EditorAiMenuRequestActions
          bookmarkCaptured={bookmarkCaptured}
          editable={editable}
          lastRequest={lastRequest}
          onCancel={onCancel}
          onRetry={onRetry}
          state={state}
        />
        <EditorAiMenuApprovalActions
          bookmarkCaptured={bookmarkCaptured}
          editable={editable}
          lastRequest={lastRequest}
          markdownAvailable={markdownAvailable}
          onApproveComment={onApproveComment}
          onApproveMarkdown={onApproveMarkdown}
          onApproveReplace={onApproveReplace}
          onDiscard={onDiscard}
          onInsertBelow={onInsertBelow}
          reviewAllowed={reviewAllowed}
          reviewCommentWithinLimit={reviewCommentWithinLimit}
          state={state}
        />
      </Wrap>
    </>
  )
}

export function EditorAiMenuTrigger({
  children,
  disabled,
  onClick,
  onMouseDown,
  ...props
}: ComponentProps<typeof Button>) {
  const { session } = useAi()
  const editor = useEditor()
  const bookmark = useMenuBookmark()
  const { editable } = useEditorState()

  return (
    <DialogTrigger
      render={<Button variant="ghost" size="sm" {...props} />}
      disabled={disabled === true || !editable}
      onMouseDown={(event) => {
        onMouseDown?.(event)

        if (!event.defaultPrevented) event.preventDefault()
      }}
      onClick={(event) => {
        onClick?.(event)

        if (!event.defaultPrevented && editable && disabled !== true)
          openAiMenu(session, editor, bookmark)
      }}
    >
      {children ?? "Ask AI"}
    </DialogTrigger>
  )
}

export interface EditorAiMenuContentProps extends EditorContentProps {
  render?: ReactElement
}

export function EditorAiMenuContent({
  render,
  ref,
  onKeyDownCapture,
  onContextMenu,
  ...contentProps
}: EditorAiMenuContentProps) {
  const { session } = useAi()
  const editor = useEditor()
  const bookmark = useMenuBookmark()
  const { editable } = useEditorState()

  return useRender({
    render: render ?? <EditorContent />,
    ref: ref ?? null,
    props: {
      ...contentProps,
      onKeyDownCapture: (event: ReactKeyboardEvent<HTMLDivElement>) => {
        onKeyDownCapture?.(event)

        if (
          event.defaultPrevented ||
          event.nativeEvent.isComposing ||
          !editable
        )
          return

        if (
          event.key.toLowerCase() === "j" &&
          (event.metaKey || event.ctrlKey) &&
          !event.altKey &&
          !event.shiftKey &&
          !event.repeat
        ) {
          event.preventDefault()
          openAiMenu(session, editor, bookmark)

          return
        }

        if (
          event.key === " " &&
          !event.repeat &&
          editor.getEditorState().read(() => {
            const selection = $getSelection()

            return (
              $isRangeSelection(selection) &&
              selection.isCollapsed() &&
              selection.anchor
                .getNode()
                .getTopLevelElementOrThrow()
                .getTextContentSize() === 0
            )
          })
        ) {
          event.preventDefault()
          openAiMenu(session, editor, bookmark, "generate")
        }
      },
      onContextMenu: (event: ReactMouseEvent<HTMLDivElement>) => {
        onContextMenu?.(event)

        if (event.defaultPrevented || !editable) return
        const selected = hasSelectedText(editor)

        if (!selected && !selectContextBlock(editor, event.target)) return

        event.preventDefault()
        openAiMenu(session, editor, bookmark, selected ? "rewrite" : "generate")
      },
    },
  })
}

function EditorAiMenuDialog({ review }: { review?: EditorReviewBinding }) {
  const editor = useEditor()
  const bookmark = useMenuBookmark()
  const markdownInsertion = useContext(EditorAiMenuMarkdownInsertionContext)
  const { session, config, state } = useAi()
  const { editable } = useEditorState()
  const [targetOperation] = useState(state.operation)
  const [query, setQuery] = useState("")
  const [chatInput, setChatInput] = useState("")
  const [activeIndex, setActiveIndex] = useState(0)
  const { messages, setMessages } = useMenuMessages()

  const [lastRequest, setLastRequest] = useState<EditorAiMenuRequest | null>(
    null,
  )

  const [reviewError, setReviewError] = useState("")
  const [markdownError, setMarkdownError] = useState("")
  const normalizedQuery = query.trim().toLocaleLowerCase()

  const filteredCommands = commands.filter((command) =>
    command.label.toLocaleLowerCase().includes(normalizedQuery),
  )

  const reviewAllowed = review?.available("create") === true
  const reviewCommentWithinLimit = state.text.length <= 16_384
  const bookmarkCaptured = bookmark.getSnapshot()

  function addMessage(role: EditorAiChatMessage["role"], text: string) {
    setMessages((current) => appendChatMessage(current, role, text))
  }

  async function sendRequest(request: EditorAiMenuRequest, label: string) {
    addMessage("You", label)
    await session.request(config, request.instruction, window.location.origin)

    if (!session.getSnapshot().open) return
    const result = session.getSnapshot()

    if (result.status === "ready") addMessage("AI", result.text)
  }

  function runCommand(command: EditorAiMenuCommand) {
    if (
      !editable ||
      !bookmark.getSnapshot() ||
      (command.review && !reviewAllowed)
    )
      return

    const operation =
      command.operation === "selection" && targetOperation === "rewrite"
        ? "rewrite"
        : "generate"

    if (!resetAiSession(session, editor, bookmark, operation)) return

    const request = {
      command,
      operation,
      instruction: chatInstruction(command, messages),
    } satisfies EditorAiMenuRequest

    setLastRequest(request)
    setReviewError("")
    setMarkdownError("")
    void sendRequest(request, command.label)
  }

  function sendChatMessage() {
    const prompt = chatInput.trim()

    if (!prompt || !editable || !bookmark.getSnapshot()) return

    if (!resetAiSession(session, editor, bookmark, "generate")) return

    const command: EditorAiMenuCommand = {
      label: prompt,
      instruction: prompt,
      operation: "generate",
    }

    const request = {
      command,
      operation: "generate",
      instruction: chatInstruction(command, messages),
    } satisfies EditorAiMenuRequest

    setLastRequest(request)
    setReviewError("")
    setMarkdownError("")
    setChatInput("")
    void sendRequest(request, prompt)
  }

  function onChatChange(event: ChangeEvent<HTMLInputElement>) {
    setChatInput(event.target.value)
  }

  function onChatKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (
      event.key !== "Enter" ||
      event.shiftKey ||
      event.nativeEvent.isComposing
    )
      return

    event.preventDefault()
    sendChatMessage()
  }

  function retry() {
    if (
      !lastRequest ||
      !resetAiSession(session, editor, bookmark, lastRequest.operation)
    )
      return

    setReviewError("")
    setMarkdownError("")
    void sendRequest(lastRequest, `Retry: ${lastRequest.command.label}`)
  }

  function discard() {
    if (!resetAiSession(session, editor, bookmark, targetOperation)) return

    setLastRequest(null)
    setReviewError("")
    setMarkdownError("")
  }

  function approveComment() {
    if (
      !review ||
      !review.available("create") ||
      state.status !== "ready" ||
      !editable ||
      editor.isComposing() ||
      !bookmark.getSnapshot()
    )
      return

    setReviewError("")
    let applied = false

    try {
      editor.update(
        () => {
          if (!bookmark.restore()) return
          applied = Boolean(review.$createThread(state.text))
        },
        { tag: HISTORY_PUSH_TAG, discrete: true },
      )
    } catch {
      setReviewError("Review comment was not created.")

      return
    }

    if (!applied) {
      setReviewError("Review comment was not created.")

      return
    }

    session.close()
    editor.focus()
  }

  function onSearchKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (event.nativeEvent.isComposing || filteredCommands.length === 0) return

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault()
      const direction = event.key === "ArrowDown" ? 1 : -1
      setActiveIndex(
        (activeIndex + direction + filteredCommands.length) %
          filteredCommands.length,
      )
    } else if (event.key === "Enter") {
      event.preventDefault()
      runCommand(filteredCommands[activeIndex] ?? filteredCommands[0])
    }
  }

  function onSearchChange(event: ChangeEvent<HTMLInputElement>) {
    setQuery(event.target.value)
    setActiveIndex(0)
  }

  function approveMarkdown() {
    if (!markdownInsertion) return

    setMarkdownError("")

    if (!session.approveWith(markdownInsertion))
      setMarkdownError(
        "Markdown was rejected. Insert source as plain text or discard the proposal.",
      )
  }

  function approveReplace() {
    session.approve()
  }

  function insertBelow() {
    session.approveBelow()
  }

  function cancelRequest() {
    session.cancel()
  }

  return (
    <DialogPopup
      finalFocus={() =>
        session.getApproved() ? editor.getRootElement() : true
      }
    >
      <DialogPanel>
        <Stack>
          <DialogTitle>AI command menu</DialogTitle>
          <DialogDescription>
            Review proposals. Optional Markdown approval uses validated document
            conversion. Nothing changes until approval. Your host must authorize
            document saves. A null browser selection during dialog focus remains
            ambiguous.
          </DialogDescription>
          <EditorAiMenuSearch
            activeIndex={activeIndex}
            bookmarkCaptured={bookmarkCaptured}
            commands={filteredCommands}
            disabled={
              !editable ||
              state.status === "streaming" ||
              state.status === "stale"
            }
            onKeyDown={onSearchKeyDown}
            onSearchChange={onSearchChange}
            onSelect={runCommand}
            query={query}
            reviewAllowed={reviewAllowed}
            status={state.status}
          />
          <EditorAiMenuChatInput
            disabled={
              !editable ||
              !bookmarkCaptured ||
              state.status === "streaming" ||
              state.status === "stale"
            }
            onChange={onChatChange}
            onKeyDown={onChatKeyDown}
            onSend={sendChatMessage}
            value={chatInput}
          />
          <EditorAiMenuStatus
            activeCommand={filteredCommands[activeIndex]?.label}
            bookmarkCaptured={bookmarkCaptured}
            status={state.status}
          />
          <EditorAiMenuTranscript messages={messages} text={state.text} />
          <EditorAiMenuActions
            bookmarkCaptured={bookmarkCaptured}
            editable={editable}
            lastRequest={lastRequest}
            markdownAvailable={markdownInsertion !== null}
            markdownError={markdownError}
            onApproveComment={approveComment}
            onApproveMarkdown={approveMarkdown}
            onApproveReplace={approveReplace}
            onCancel={cancelRequest}
            onDiscard={discard}
            onInsertBelow={insertBelow}
            onRetry={retry}
            reviewAllowed={reviewAllowed}
            reviewCommentWithinLimit={reviewCommentWithinLimit}
            reviewError={reviewError}
            state={state}
          />
        </Stack>
      </DialogPanel>
    </DialogPopup>
  )
}

export function EditorAiMenuPanel({
  review,
}: {
  review?: EditorReviewBinding
}) {
  const { state } = useAi()

  return state.open ? <EditorAiMenuDialog review={review} /> : null
}
