"use client"

import type { ComponentProps, ReactNode } from "react"

import { Box } from "@registry/components/ui/box"
import { Button } from "@registry/components/ui/button"
import { NativeSelect } from "@registry/components/ui/native-select"
import { Toolbar, ToolbarButton } from "@registry/components/ui/toolbar"
import { stylexProps } from "@registry/lib/stylex"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"
import { createContext, use, useState, useSyncExternalStore } from "react"

import {
  EDITOR_DIAGRAM_KINDS,
  isEditorDiagramKind,
  isEditorDiagramViewMode,
  type EditorDiagramKind,
  type EditorDiagramViewMode,
} from "./diagram-model"
import {
  createEditorDiagramStore,
  type EditorDiagramRenderers,
} from "./diagram-store"
import { useEditor, useEditorState } from "./root"
import { editorStyles } from "./theme"

const DiagramContext = createContext<ReturnType<
  typeof createEditorDiagramStore
> | null>(null)

const DiagramDisabledContext = createContext(false)

const styles = stylex.create({
  preview: {
    backgroundColor: tokens["--card"],
    borderColor: tokens["--border"],
    borderRadius: tokens["--radius-md"],
    borderStyle: "solid",
    borderWidth: 1,
    display: "grid",
    gap: `calc(${tokens["--spacing"]} * 3)`,
    minInlineSize: 0,
    overflow: "auto",
    padding: `calc(${tokens["--spacing"]} * 4)`,
  },
  image: {
    display: "block",
    inlineSize: "100%",
    maxBlockSize: "40rem",
    objectFit: "contain",
  },
})

function useDiagramStore() {
  const store = use(DiagramContext)

  if (!store)
    throw new Error("Diagram controls must be inside EditorDiagramRoot.")

  return store
}

function useDiagramState() {
  const store = useDiagramStore()

  return useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot,
  )
}

function useDiagramRenderState() {
  const store = useDiagramStore()

  return useSyncExternalStore(
    store.subscribe,
    store.getRenderSnapshot,
    store.getRenderServerSnapshot,
  )
}

export interface EditorDiagramRootProps {
  children: ReactNode
  renderers?: EditorDiagramRenderers
  timeoutMs?: number
  autoRender?: boolean
  disabled?: boolean
}

export function EditorDiagramRoot({
  children,
  renderers,
  timeoutMs,
  autoRender,
  disabled,
}: EditorDiagramRootProps) {
  const editor = useEditor()

  const [store] = useState(() =>
    createEditorDiagramStore(editor, { renderers, timeoutMs, autoRender }),
  )

  return (
    <DiagramContext value={store}>
      <DiagramDisabledContext value={disabled === true}>
        <Box
          onBlurCapture={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) store.blur()
          }}
        >
          {children}
        </Box>
      </DiagramDisabledContext>
    </DiagramContext>
  )
}

export type EditorDiagramToolbarProps = ComponentProps<typeof Toolbar>

export function EditorDiagramToolbar({
  children,
  xstyle,
  disabled,
  onFocusCapture,
  onBlurCapture,
  "aria-label": label = "Diagram tools",
  ...props
}: EditorDiagramToolbarProps) {
  const store = useDiagramStore()

  function handleFocus(
    event: Parameters<
      NonNullable<EditorDiagramToolbarProps["onFocusCapture"]>
    >[0],
  ) {
    store.enterControls()
    onFocusCapture?.(event)
  }

  function handleBlur(
    event: Parameters<
      NonNullable<EditorDiagramToolbarProps["onBlurCapture"]>
    >[0],
  ) {
    onBlurCapture?.(event)

    if (!event.currentTarget.contains(event.relatedTarget))
      store.leaveControls()
  }

  return (
    <Toolbar
      {...props}
      aria-label={label}
      disabled={disabled}
      xstyle={[editorStyles.toolbar, xstyle]}
      onFocusCapture={handleFocus}
      onBlurCapture={handleBlur}
    >
      {children}
    </Toolbar>
  )
}

export type EditorDiagramInsertButtonProps = ComponentProps<
  typeof ToolbarButton
> & {
  kind?: EditorDiagramKind
  source?: string
  viewMode?: EditorDiagramViewMode
}

export function EditorDiagramInsertButton({
  kind = "mermaid",
  source = "graph TD\n  A[Start] --> B[Finish]",
  viewMode = "both",
  children,
  disabled,
  onClick,
  "aria-label": label = "Insert diagram",
  ...props
}: EditorDiagramInsertButtonProps) {
  const store = useDiagramStore()
  const toolbarDisabled = use(DiagramDisabledContext)
  const state = useDiagramState()
  const { editable } = useEditorState()

  function handleClick(
    event: Parameters<
      NonNullable<EditorDiagramInsertButtonProps["onClick"]>
    >[0],
  ) {
    onClick?.(event)

    if (!event.defaultPrevented && !disabled && !toolbarDisabled && editable)
      store.insert(kind, source, viewMode)
  }

  return (
    <ToolbarButton
      render={<Button variant="ghost" size="sm" />}
      {...props}
      aria-label={label}
      disabled={
        disabled === true ||
        toolbarDisabled ||
        !editable ||
        state?.editable === false
      }
      onClick={handleClick}
    >
      {children ?? label}
    </ToolbarButton>
  )
}

export type EditorDiagramKindSelectProps = Omit<
  ComponentProps<typeof NativeSelect>,
  "value" | "defaultValue" | "multiple" | "children"
>

export function EditorDiagramKindSelect({
  disabled,
  onChange,
  onKeyDown,
  "aria-label": label = "Diagram type",
  ...props
}: EditorDiagramKindSelectProps) {
  const store = useDiagramStore()
  const state = useDiagramState()
  const toolbarDisabled = use(DiagramDisabledContext)

  function handleChange(
    event: Parameters<NonNullable<EditorDiagramKindSelectProps["onChange"]>>[0],
  ) {
    const revision = store.getRevision()
    onChange?.(event)

    if (
      !event.defaultPrevented &&
      !disabled &&
      !toolbarDisabled &&
      isEditorDiagramKind(event.currentTarget.value)
    )
      store.setKind(event.currentTarget.value, revision)
  }

  function handleKeyDown(
    event: Parameters<
      NonNullable<EditorDiagramKindSelectProps["onKeyDown"]>
    >[0],
  ) {
    onKeyDown?.(event)

    if (
      event.key.startsWith("Arrow") ||
      ["Home", "End", "PageUp", "PageDown"].includes(event.key)
    )
      event.stopPropagation()
  }

  return (
    <NativeSelect
      {...props}
      aria-label={label}
      value={state?.metadata.kind ?? "mermaid"}
      disabled={
        disabled === true ||
        toolbarDisabled ||
        !state?.metadata ||
        !state.editable
      }
      onChange={handleChange}
      onKeyDown={handleKeyDown}
    >
      {EDITOR_DIAGRAM_KINDS.map((kind) => (
        <option key={kind} value={kind}>
          {kind === "plantuml"
            ? "PlantUML"
            : kind[0]?.toUpperCase() + kind.slice(1)}
        </option>
      ))}
    </NativeSelect>
  )
}

export type EditorDiagramViewModeSelectProps = Omit<
  ComponentProps<typeof NativeSelect>,
  "value" | "defaultValue" | "multiple" | "children"
>

export function EditorDiagramViewModeSelect({
  disabled,
  onChange,
  onKeyDown,
  "aria-label": label = "Diagram view",
  ...props
}: EditorDiagramViewModeSelectProps) {
  const store = useDiagramStore()
  const state = useDiagramState()
  const toolbarDisabled = use(DiagramDisabledContext)

  function handleChange(
    event: Parameters<
      NonNullable<EditorDiagramViewModeSelectProps["onChange"]>
    >[0],
  ) {
    const revision = store.getRevision()
    onChange?.(event)

    if (
      !event.defaultPrevented &&
      !disabled &&
      !toolbarDisabled &&
      isEditorDiagramViewMode(event.currentTarget.value)
    )
      store.setViewMode(event.currentTarget.value, revision)
  }

  function handleKeyDown(
    event: Parameters<
      NonNullable<EditorDiagramViewModeSelectProps["onKeyDown"]>
    >[0],
  ) {
    onKeyDown?.(event)

    if (
      event.key.startsWith("Arrow") ||
      ["Home", "End", "PageUp", "PageDown"].includes(event.key)
    )
      event.stopPropagation()
  }

  return (
    <NativeSelect
      {...props}
      aria-label={label}
      value={state?.metadata.viewMode ?? "both"}
      disabled={
        disabled === true ||
        toolbarDisabled ||
        !state?.metadata ||
        !state.editable
      }
      onChange={handleChange}
      onKeyDown={handleKeyDown}
    >
      <option value="code">Code</option>
      <option value="image">Image</option>
      <option value="both">Code and image</option>
    </NativeSelect>
  )
}

export type EditorDiagramRenderButtonProps = ComponentProps<
  typeof ToolbarButton
>

export function EditorDiagramRenderButton({
  children,
  disabled,
  onClick,
  "aria-label": label = "Render diagram",
  ...props
}: EditorDiagramRenderButtonProps) {
  const store = useDiagramStore()
  const state = useDiagramState()
  const rendering = useDiagramRenderState().status === "loading"
  const toolbarDisabled = use(DiagramDisabledContext)

  function handleClick(
    event: Parameters<
      NonNullable<EditorDiagramRenderButtonProps["onClick"]>
    >[0],
  ) {
    const revision = store.getRevision()
    onClick?.(event)

    if (event.defaultPrevented || disabled || toolbarDisabled) return

    if (rendering) store.cancelRender()
    else void store.render(revision)
  }

  return (
    <ToolbarButton
      render={<Button variant="ghost" size="sm" />}
      {...props}
      aria-label={rendering ? "Cancel rendering" : label}
      disabled={
        disabled === true || toolbarDisabled || !state || !store.canRender()
      }
      onClick={handleClick}
    >
      {rendering ? "Cancel" : (children ?? label)}
    </ToolbarButton>
  )
}

export type EditorDiagramDownloadButtonProps = ComponentProps<
  typeof ToolbarButton
>

export function EditorDiagramDownloadButton({
  children,
  disabled,
  onClick,
  "aria-label": label = "Download diagram as SVG",
  ...props
}: EditorDiagramDownloadButtonProps) {
  const store = useDiagramStore()
  const state = useDiagramState()
  const rendered = useDiagramRenderState()
  const toolbarDisabled = use(DiagramDisabledContext)

  function handleClick(
    event: Parameters<
      NonNullable<EditorDiagramDownloadButtonProps["onClick"]>
    >[0],
  ) {
    const revision = store.getRevision()
    onClick?.(event)

    if (
      event.defaultPrevented ||
      disabled ||
      toolbarDisabled ||
      rendered.status !== "ready" ||
      !state
    )
      return

    const download = store.getDownload(revision)
    const document = event.currentTarget.ownerDocument
    const view = document.defaultView

    if (!download || !view) return
    const link = document.createElement("a")

    const url = view.URL.createObjectURL(
      new view.Blob([download.svg], { type: "image/svg+xml;charset=utf-8" }),
    )

    try {
      link.href = url
      link.download = `${download.kind}-diagram.svg`
      document.body.append(link)
      link.click()
    } finally {
      link.remove()
      view.setTimeout(() => view.URL.revokeObjectURL(url), 0)
    }
  }

  return (
    <ToolbarButton
      render={<Button variant="ghost" size="sm" />}
      {...props}
      aria-label={label}
      disabled={
        disabled === true ||
        toolbarDisabled ||
        !state ||
        rendered.status !== "ready"
      }
      onClick={handleClick}
    >
      {children ?? label}
    </ToolbarButton>
  )
}

export type EditorDiagramDeleteButtonProps = ComponentProps<
  typeof ToolbarButton
>

export function EditorDiagramDeleteButton({
  children,
  disabled,
  onClick,
  "aria-label": label = "Delete diagram",
  ...props
}: EditorDiagramDeleteButtonProps) {
  const store = useDiagramStore()
  const state = useDiagramState()
  const toolbarDisabled = use(DiagramDisabledContext)

  function handleClick(
    event: Parameters<
      NonNullable<EditorDiagramDeleteButtonProps["onClick"]>
    >[0],
  ) {
    const revision = store.getRevision()
    onClick?.(event)

    if (!event.defaultPrevented && !disabled && !toolbarDisabled)
      store.delete(revision)
  }

  return (
    <ToolbarButton
      render={<Button variant="ghost" size="sm" />}
      {...props}
      aria-label={label}
      disabled={disabled === true || toolbarDisabled || !state?.editable}
      onClick={handleClick}
    >
      {children ?? label}
    </ToolbarButton>
  )
}

export type EditorDiagramStatusProps = ComponentProps<"output">

export function EditorDiagramStatus(props: EditorDiagramStatusProps) {
  const store = useDiagramStore()
  const state = useDiagramState()
  const rendered = useDiagramRenderState()

  const text =
    rendered.status === "loading"
      ? "Rendering diagram."
      : rendered.status === "error"
        ? rendered.message
        : rendered.status === "ready"
          ? "SVG ready."
          : state && !store.canRender()
            ? `No ${state.metadata.kind} renderer is configured.`
            : ""

  return (
    <output {...props} aria-live="polite" aria-atomic="true">
      {text}
    </output>
  )
}

export type EditorDiagramPreviewProps = Omit<
  ComponentProps<typeof Box>,
  "children"
>

export function EditorDiagramPreview({
  className,
  xstyle,
  "aria-label": label,
  ...props
}: EditorDiagramPreviewProps) {
  const store = useDiagramStore()
  const state = useDiagramState()
  const rendered = useDiagramRenderState()

  if (!state || state.metadata.viewMode === "code") return null

  return (
    <Box
      render={<section />}
      {...props}
      aria-label={label ?? `${state.metadata.kind} diagram preview`}
      data-slot="editor-diagram-inspector"
      {...stylexProps(className, styles.preview, xstyle)}
    >
      {rendered.status === "loading" ? (
        <output aria-live="polite" aria-atomic="true">
          Rendering diagram.
        </output>
      ) : rendered.status === "error" ? (
        <Box render={<p role="alert" />}>{rendered.message}</Box>
      ) : rendered.status === "ready" ? (
        <img
          alt={`${state.metadata.kind} diagram`}
          src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(rendered.svg)}`}
          {...stylex.props(styles.image)}
        />
      ) : store.canRender() ? (
        <output aria-live="polite" aria-atomic="true">
          Activate Render diagram to update preview.
        </output>
      ) : (
        <output aria-live="polite" aria-atomic="true">
          No {state.metadata.kind} renderer is configured.
        </output>
      )}
    </Box>
  )
}
