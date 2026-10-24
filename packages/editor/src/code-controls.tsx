"use client"

import type { StyleXComponentProps } from "@registry/lib/stylex"
import type { ComponentProps } from "react"

import { Box } from "@registry/components/ui/box"
import { Button } from "@registry/components/ui/button"
import { NativeSelect } from "@registry/components/ui/native-select"
import { Toolbar, ToolbarButton } from "@registry/components/ui/toolbar"
import { stylexProps } from "@registry/lib/stylex"
import {
  createContext,
  use,
  useId,
  useState,
  useSyncExternalStore,
} from "react"

import {
  createEditorCodeStore,
  editorCodeLanguages,
  type EditorCodeFormatter,
} from "./code-model"
import { useEditor } from "./root"
import { editorStyles } from "./theme"

const CodeContext = createContext<ReturnType<
  typeof createEditorCodeStore
> | null>(null)

const CodeDisabledContext = createContext(false)

function useCodeStore() {
  const context = use(CodeContext)

  if (!context)
    throw new Error("Code controls must be inside EditorCodeToolbar.")

  return context
}

function useCodeState() {
  const store = useCodeStore()

  return useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot,
  )
}

export type EditorCodeToolbarProps = ComponentProps<typeof Toolbar>

export function EditorCodeToolbar({
  children,
  xstyle,
  disabled,
  onFocusCapture,
  onBlurCapture,
  "aria-label": label = "Code tools",
  ...props
}: EditorCodeToolbarProps) {
  const editor = useEditor()
  const [store] = useState(() => createEditorCodeStore(editor))
  const toolbarXstyle = [editorStyles.toolbar, xstyle]

  function handleFocus(
    event: Parameters<NonNullable<EditorCodeToolbarProps["onFocusCapture"]>>[0],
  ) {
    store.enterControls()
    onFocusCapture?.(event)
  }

  function handleBlur(
    event: Parameters<NonNullable<EditorCodeToolbarProps["onBlurCapture"]>>[0],
  ) {
    onBlurCapture?.(event)

    if (!event.currentTarget.contains(event.relatedTarget))
      store.leaveControls()
  }

  return (
    <CodeContext value={store}>
      <CodeDisabledContext value={disabled === true}>
        <Toolbar
          {...props}
          aria-label={label}
          disabled={disabled}
          xstyle={toolbarXstyle}
          onFocusCapture={handleFocus}
          onBlurCapture={handleBlur}
        >
          {children}
        </Toolbar>
      </CodeDisabledContext>
    </CodeContext>
  )
}

export type EditorCodeLanguageProps = Omit<
  ComponentProps<typeof NativeSelect>,
  "value" | "defaultValue" | "multiple" | "children"
>

export function EditorCodeLanguage({
  disabled,
  onChange,
  onKeyDown,
  "aria-label": label = "Code language",
  ...props
}: EditorCodeLanguageProps) {
  const store = useCodeStore()
  const state = useCodeState()
  const language = state?.language ?? ""
  const toolbarDisabled = use(CodeDisabledContext)

  function handleChange(
    event: Parameters<NonNullable<EditorCodeLanguageProps["onChange"]>>[0],
  ) {
    const revision = store.getRevision()
    onChange?.(event)

    if (!event.defaultPrevented && !disabled && !toolbarDisabled)
      store.setLanguage(event.currentTarget.value, revision)
  }

  function handleKeyDown(
    event: Parameters<NonNullable<EditorCodeLanguageProps["onKeyDown"]>>[0],
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
      value={language}
      disabled={disabled === true || toolbarDisabled || !state?.editable}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
    >
      <option value="">Unspecified</option>
      {language &&
      !editorCodeLanguages.some((option) => option.value === language) ? (
        <option value={language} disabled>
          {language}
        </option>
      ) : null}
      {editorCodeLanguages.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </NativeSelect>
  )
}

export type EditorCodeFormatButtonProps = ComponentProps<
  typeof ToolbarButton
> & {
  formatter?: EditorCodeFormatter
}

export function EditorCodeFormatButton({
  formatter,
  children,
  disabled,
  onClick,
  "aria-label": label = "Format code",
  "aria-describedby": describedBy,
  ...props
}: EditorCodeFormatButtonProps) {
  const store = useCodeStore()
  const state = useCodeState()
  const toolbarDisabled = use(CodeDisabledContext)
  const id = useId()

  const status = useSyncExternalStore(
    store.subscribe,
    store.getFormatSnapshot,
    store.getCopyServerSnapshot,
  )

  const pending = status === "Formatting code"
  const supported = formatter?.supports(state?.language ?? "") === true

  const explanation = !supported
    ? "Formatting is not supported for this language"
    : "Format the whole code block. Activate again to cancel pending formatting."

  function handleClick(
    event: Parameters<NonNullable<EditorCodeFormatButtonProps["onClick"]>>[0],
  ) {
    const revision = store.getRevision()
    onClick?.(event)

    if (event.defaultPrevented || disabled || toolbarDisabled) return

    if (pending) store.cancelFormat()
    else void store.format(formatter, revision)
  }

  if (!formatter) return null

  return (
    <>
      <ToolbarButton
        render={<Button variant="ghost" size="sm" />}
        {...props}
        aria-label={pending ? "Cancel formatting" : label}
        title={props.title ?? explanation}
        aria-describedby={[describedBy, id].filter(Boolean).join(" ")}
        disabled={
          disabled === true || toolbarDisabled || !state?.editable || !supported
        }
        onClick={handleClick}
      >
        {pending ? "Cancel formatting" : (children ?? label)}
      </ToolbarButton>
      <Box render={<span />} id={id} hidden>
        {explanation}
      </Box>
    </>
  )
}

export type EditorCodeCopyButtonProps = ComponentProps<typeof ToolbarButton>

export function EditorCodeCopyButton({
  children,
  disabled,
  onClick,
  "aria-label": label = "Copy code",
  ...props
}: EditorCodeCopyButtonProps) {
  const store = useCodeStore()
  const state = useCodeState()

  function handleClick(
    event: Parameters<NonNullable<EditorCodeCopyButtonProps["onClick"]>>[0],
  ) {
    const revision = store.getRevision()
    onClick?.(event)

    if (!event.defaultPrevented && !disabled) void store.copy(revision)
  }

  return (
    <ToolbarButton
      render={<Button variant="ghost" size="sm" />}
      {...props}
      aria-label={label}
      disabled={disabled === true || !state}
      onClick={handleClick}
    >
      {children ?? label}
    </ToolbarButton>
  )
}

export type EditorCodeToggleProps = ComponentProps<typeof ToolbarButton> & {
  setting: "wrap" | "lineNumbers"
}

export function EditorCodeToggle({
  setting,
  children,
  disabled,
  onClick,
  "aria-label": label = setting === "wrap" ? "Wrap code" : "Line numbers",
  ...props
}: EditorCodeToggleProps) {
  const store = useCodeStore()
  const state = useCodeState()

  function handleClick(
    event: Parameters<NonNullable<EditorCodeToggleProps["onClick"]>>[0],
  ) {
    const revision = store.getRevision()
    onClick?.(event)

    if (!event.defaultPrevented && !disabled) store.toggle(setting, revision)
  }

  return (
    <ToolbarButton
      render={<Button variant="ghost" size="sm" />}
      {...props}
      aria-label={label}
      aria-pressed={state?.[setting] ?? false}
      disabled={disabled === true || !state?.editable}
      onClick={handleClick}
    >
      {children ?? label}
    </ToolbarButton>
  )
}

export type EditorCodeStatusProps = StyleXComponentProps<
  ComponentProps<"output">
>

export function EditorCodeStatus({
  xstyle,
  className,
  ...props
}: EditorCodeStatusProps) {
  const store = useCodeStore()

  const copyStatus = useSyncExternalStore(
    store.subscribe,
    store.getCopySnapshot,
    store.getCopyServerSnapshot,
  )

  const formatStatus = useSyncExternalStore(
    store.subscribe,
    store.getFormatSnapshot,
    store.getCopyServerSnapshot,
  )

  const status = [copyStatus, formatStatus].filter(Boolean).join(". ")

  return (
    <output
      {...props}
      {...stylexProps(className, xstyle)}
      aria-live="polite"
      aria-atomic="true"
    >
      {status}
    </output>
  )
}
