"use client"

import type { ComponentProps, ReactNode } from "react"

import { useStableCallback } from "@base-ui/utils/useStableCallback"
import { Box } from "@registry/components/ui/box"
import { Button } from "@registry/components/ui/button"
import {
  Dialog,
  DialogPopup,
  DialogPanel,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@registry/components/ui/dialog"
import { Input } from "@registry/components/ui/input"
import { Stack } from "@registry/components/ui/stack"
import { Text } from "@registry/components/ui/text"
import * as stylex from "@stylexjs/stylex"
import { createContext, use, useState, useSyncExternalStore } from "react"
import { z } from "zod"

import type { EditorAiConfig, EditorAiOperation } from "./ai-client"

import { createEditorAiSession } from "./ai-session"
import { useEditor, useEditorState } from "./root"

const styles = stylex.create({
  proposal: { whiteSpace: "pre-wrap", overflowWrap: "anywhere" },
})

const AiSessionContext = createContext<ReturnType<
  typeof createEditorAiSession
> | null>(null)

const AiConfigContext = createContext<EditorAiConfig | null>(null)

export function useAi() {
  const session = use(AiSessionContext)
  const config = use(AiConfigContext)

  if (!session || !config)
    throw new Error("AI parts require configured EditorAiRoot.")

  const state = useSyncExternalStore(
    session.subscribe,
    session.getSnapshot,
    session.getSnapshot,
  )

  return { session, config, state }
}

export function EditorAiRoot({
  config,
  children,
}: {
  config?: EditorAiConfig
  children: ReactNode
}) {
  if (
    !config?.endpoint ||
    !config.documentId ||
    !z.function().safeParse(config.headers).success
  )
    return null

  return (
    <EditorAiConfiguredRoot
      key={JSON.stringify([config.endpoint, config.documentId])}
      config={config}
    >
      {children}
    </EditorAiConfiguredRoot>
  )
}

export function EditorAiConfiguredRoot({
  config,
  children,
}: {
  config: EditorAiConfig
  children: ReactNode
}) {
  const editor = useEditor()
  const [session] = useState(() => createEditorAiSession(editor))

  const state = useSyncExternalStore(
    session.subscribe,
    session.getSnapshot,
    session.getSnapshot,
  )

  const handleOpenChange = useStableCallback(function handleOpenChange(
    open: boolean,
  ) {
    if (!open) session.close()
  })

  return (
    <AiSessionContext value={session}>
      <AiConfigContext value={config}>
        <Dialog open={state.open} onOpenChange={handleOpenChange}>
          {children}
        </Dialog>
      </AiConfigContext>
    </AiSessionContext>
  )
}

export function EditorAiTrigger({
  operation,
  children,
  disabled,
  onClick,
  onMouseDown,
  ...props
}: ComponentProps<typeof Button> & { operation: EditorAiOperation }) {
  const { session } = useAi()
  const { editable } = useEditorState()

  const handleMouseDown = useStableCallback(function handleMouseDown(
    event: Parameters<
      NonNullable<ComponentProps<typeof Button>["onMouseDown"]>
    >[0],
  ) {
    onMouseDown?.(event)

    if (!event.defaultPrevented) event.preventDefault()
  })

  const handleClick = useStableCallback(function handleClick(
    event: Parameters<NonNullable<ComponentProps<typeof Button>["onClick"]>>[0],
  ) {
    onClick?.(event)

    if (!event.defaultPrevented && editable && !disabled)
      session.open(operation)
  })

  return (
    <DialogTrigger
      render={<Button variant="ghost" size="sm" {...props} />}
      disabled={disabled === true || !editable}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
    >
      {children ??
        (operation === "generate"
          ? "Generate"
          : operation === "rewrite"
            ? "Rewrite"
            : "Copilot")}
    </DialogTrigger>
  )
}

export function EditorAiPanel() {
  const editor = useEditor()
  const { session, config, state } = useAi()
  const { editable } = useEditorState()
  const [instruction, setInstruction] = useState("")

  const finalFocus = useStableCallback(function finalFocus() {
    return session.getApproved() ? editor.getRootElement() : true
  })

  const handleInstructionChange = useStableCallback(
    function handleInstructionChange(
      event: Parameters<
        NonNullable<ComponentProps<typeof Input>["onChange"]>
      >[0],
    ) {
      setInstruction(event.target.value)
    },
  )

  const handleRequest = useStableCallback(function handleRequest() {
    void session.request(config, instruction, window.location.origin)
  })

  return (
    <DialogPopup finalFocus={finalFocus}>
      <DialogPanel>
        <Stack>
          <DialogTitle>AI proposal</DialogTitle>
          <DialogDescription>
            Review untrusted plain text. Approval changes this editor only. Your
            host must authorize document saves.
          </DialogDescription>
          <Input
            aria-label="AI instruction"
            value={instruction}
            maxLength={16_384}
            disabled={state.status !== "idle" || !editable}
            onChange={handleInstructionChange}
          />
          <Button
            disabled={
              !editable || state.status !== "idle" || !instruction.trim()
            }
            onClick={handleRequest}
          >
            Request proposal
          </Button>
          <Box render={<output />}>{state.status}</Box>
          <Box render={<section />} aria-label="AI proposal">
            <Text xstyle={styles.proposal}>{state.text}</Text>
          </Box>
          {(state.status === "timeout" ||
            state.status === "truncated" ||
            state.status === "failed" ||
            state.status === "stale" ||
            state.status === "cancelled") && (
            <Text role="alert">
              Proposal unavailable. Close this dialog and select text again. No
              text was applied.
            </Text>
          )}
          <Button
            disabled={state.status !== "streaming"}
            onClick={session.cancel}
          >
            Cancel request
          </Button>
          <Button
            disabled={!editable || state.status !== "ready" || !state.text}
            onClick={session.approve}
          >
            Approve proposal
          </Button>
        </Stack>
      </DialogPanel>
    </DialogPopup>
  )
}
