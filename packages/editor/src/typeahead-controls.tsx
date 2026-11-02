"use client"

import type { Popover as PopoverPrimitive } from "@base-ui/react/popover"
import type { BaseUIEvent } from "@base-ui/react/types"
import type { StyleXComponentProps } from "@registry/lib/stylex"

import { useStableCallback } from "@base-ui/utils/useStableCallback"
import { Box } from "@registry/components/ui/box"
import {
  Command,
  CommandGroup,
  CommandGroupLabel,
  CommandItem,
  CommandList,
} from "@registry/components/ui/command"
import { HStack } from "@registry/components/ui/hstack"
import {
  Popover,
  PopoverPopup,
  PopoverTrigger,
} from "@registry/components/ui/popover"
import { Text } from "@registry/components/ui/text"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"
import {
  createContext,
  isValidElement,
  useContext,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type AriaAttributes,
  type ComponentProps,
  type KeyboardEvent,
  type ReactNode,
} from "react"

import type {
  EditorTypeaheadController,
  EditorTypeaheadItem,
} from "./typeahead"

import { EditorContent, type EditorContentProps } from "./root"

const ReturnFocusContext = createContext<{ current: boolean } | null>(null)

const InlineContext = createContext<EditorTypeaheadController | null>(null)

export function useEditorInlineCombobox() {
  const controller = useContext(InlineContext)

  if (!controller)
    throw new Error("Use inline combobox parts inside EditorInlineCombobox")

  const state = useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
    controller.getServerSnapshot,
  )

  return { controller, state }
}

export interface EditorInlineComboboxProps {
  controller: EditorTypeaheadController
  children: ReactNode
}

export function EditorInlineCombobox({
  controller,
  children,
}: EditorInlineComboboxProps) {
  const state = useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
    controller.getServerSnapshot,
  )

  const returnFocus = useRef(true)
  const actionsRef = useRef<PopoverPrimitive.Root.Actions>(null)
  const [initial] = useState(() => controller)

  if (initial !== controller)
    throw new Error("Keep typeahead controller stable for the mounted root")

  const [connect] = useState(
    () =>
      function connect(element: HTMLDivElement | null) {
        if (element) return controller.connectView()
      },
  )

  const changeOpen = useStableCallback(function changeOpen(open: boolean) {
    if (!open) controller.close()
  })

  const captureKeyDown = useStableCallback(function captureKeyDown(
    event: KeyboardEvent<HTMLDivElement>,
  ) {
    returnFocus.current = event.key !== "Tab" || event.defaultPrevented
  })

  const captureFocus = useStableCallback(function captureFocus() {
    returnFocus.current = true
  })

  const handleKeyDown = useStableCallback(function handleKeyDown(
    event: KeyboardEvent<HTMLDivElement>,
  ) {
    if (event.key === "Tab") returnFocus.current = event.defaultPrevented

    if (event.key === "Tab" && !event.defaultPrevented) {
      controller.close()
      actionsRef.current?.unmount()
    }
  })

  return (
    <InlineContext value={controller}>
      <ReturnFocusContext value={returnFocus}>
        <Popover
          actionsRef={actionsRef}
          modal={false}
          open={state.query !== null}
          onOpenChange={changeOpen}
        >
          <Box
            ref={connect}
            data-slot="editor-inline-combobox"
            onKeyDownCapture={captureKeyDown}
            onFocusCapture={captureFocus}
            onKeyDown={handleKeyDown}
          >
            {children}
          </Box>
        </Popover>
      </ReturnFocusContext>
    </InlineContext>
  )
}

function preserveNativeEditing(event: BaseUIEvent<KeyboardEvent<HTMLElement>>) {
  event.preventBaseUIHandler()
}

export function EditorInlineComboboxInput({
  id,
  ...props
}: ComponentProps<typeof EditorContent>) {
  useEditorInlineCombobox()

  return (
    <PopoverTrigger
      id={id}
      nativeButton={false}
      role={props.role ?? "textbox"}
      aria-expanded={undefined}
      onKeyDown={preserveNativeEditing}
      onKeyUp={preserveNativeEditing}
      render={<EditorContent {...props} />}
    />
  )
}

export function EditorInlineComboboxContent({
  children,
  ...props
}: Omit<
  ComponentProps<typeof PopoverPopup>,
  "anchor" | "initialFocus" | "finalFocus"
>) {
  const { controller, state } = useEditorInlineCombobox()
  const returnFocus = useContext(ReturnFocusContext)

  const focusFinal = useStableCallback(function focusFinal() {
    if (!returnFocus?.current) return false
    const anchor = controller.getAnchor()

    const root =
      anchor && ("contextElement" in anchor ? anchor.contextElement : anchor)

    if (root?.contains(root.ownerDocument.activeElement)) return false

    return root
  })

  return (
    <PopoverPopup
      {...props}
      anchor={controller.getAnchor()}
      align="start"
      initialFocus={false}
      finalFocus={focusFinal}
      data-slot="editor-inline-combobox-content"
    >
      <Command
        autoHighlight={false}
        highlightItemOnHover={false}
        mode="none"
        items={state.items}
      >
        {children}
      </Command>
    </PopoverPopup>
  )
}

export function EditorInlineComboboxList({
  children,
  ...props
}: Omit<ComponentProps<typeof CommandList>, "id" | "ref">) {
  const { controller, state } = useEditorInlineCombobox()
  const id = useId()

  const [connect] = useState(
    () =>
      function connect(element: HTMLDivElement | null) {
        if (element) return controller.connectList(id)
      },
  )

  return (
    <CommandList
      {...props}
      ref={connect}
      id={id}
      aria-busy={state.status === "loading"}
      data-slot="editor-inline-combobox-list"
    >
      {children}
    </CommandList>
  )
}

function hasRenderDescription(
  render: ComponentProps<typeof CommandItem>["render"],
) {
  return (
    isValidElement<AriaAttributes>(render) &&
    render.props["aria-description"] !== undefined
  )
}

export function EditorInlineComboboxItem({
  item,
  children,
  onClick,
  onPointerDown,
  onMouseDown,
  onPointerMove,
  xstyle,
  "aria-label": ariaLabel,
  "aria-description": ariaDescription,
  "aria-describedby": ariaDescribedBy,
  ...props
}: Omit<
  ComponentProps<typeof CommandItem>,
  "value" | "ref" | "disabled" | "id" | "tabIndex" | "aria-selected"
> & { item: EditorTypeaheadItem }) {
  const { controller, state } = useEditorInlineCombobox()
  const index = state.items.findIndex((candidate) => candidate === item)
  const descriptionId = useId()
  const description = children == null ? item.description : undefined

  function connect(element: HTMLDivElement | null) {
    controller.connectOption(index, element)
  }

  const handlePointerDown = useStableCallback(function handlePointerDown(
    event: Parameters<NonNullable<typeof onPointerDown>>[0],
  ) {
    onPointerDown?.(event)
    event.preventDefault()
  })

  const handleMouseDown = useStableCallback(function handleMouseDown(
    event: Parameters<NonNullable<typeof onMouseDown>>[0],
  ) {
    onMouseDown?.(event)
    event.preventDefault()
  })

  const handlePointerMove = useStableCallback(function handlePointerMove(
    event: Parameters<NonNullable<typeof onPointerMove>>[0],
  ) {
    onPointerMove?.(event)

    if (!event.defaultPrevented && !event.baseUIHandlerPrevented)
      controller.highlight(index)
  })

  const handleClick = useStableCallback(function handleClick(
    event: Parameters<NonNullable<typeof onClick>>[0],
  ) {
    onClick?.(event)

    if (!event.defaultPrevented && !event.baseUIHandlerPrevented)
      controller.choose(item.id)
  })

  if (index < 0) return null

  const option = (
    <CommandItem
      {...props}
      value={item}
      ref={connect}
      tabIndex={-1}
      aria-selected={index === state.active}
      aria-label={ariaLabel ?? item.label}
      aria-description={
        ariaDescription ?? (description ? undefined : item.description)
      }
      aria-describedby={
        ariaDescribedBy ??
        (description &&
        ariaDescription === undefined &&
        !hasRenderDescription(props.render)
          ? descriptionId
          : undefined)
      }
      xstyle={[styles.item, description ? styles.describedItem : null, xstyle]}
      data-highlighted={index === state.active ? "" : undefined}
      data-slot="editor-inline-combobox-item"
      onPointerDown={handlePointerDown}
      onMouseDown={handleMouseDown}
      onPointerMove={handlePointerMove}
      onClick={handleClick}
    >
      {children ?? (
        <Text data-slot="editor-inline-combobox-label" xstyle={styles.label}>
          {item.emoji ? `${item.emoji} ` : ""}
          {item.label}
        </Text>
      )}
    </CommandItem>
  )

  return description ? (
    <Box
      data-slot="editor-inline-combobox-option-row"
      xstyle={styles.optionRow}
    >
      {option}
      <Box
        render={<span />}
        id={descriptionId}
        data-slot="editor-inline-combobox-description"
        xstyle={styles.description}
      >
        {description}
      </Box>
    </Box>
  ) : (
    option
  )
}

export function EditorInlineComboboxGroup(
  props: ComponentProps<typeof CommandGroup>,
) {
  useEditorInlineCombobox()

  return <CommandGroup {...props} data-slot="editor-inline-combobox-group" />
}

export function EditorInlineComboboxGroupLabel(
  props: ComponentProps<typeof CommandGroupLabel>,
) {
  useEditorInlineCombobox()

  return (
    <CommandGroupLabel
      {...props}
      data-slot="editor-inline-combobox-group-label"
    />
  )
}

export function EditorInlineComboboxRow(props: ComponentProps<typeof HStack>) {
  useEditorInlineCombobox()

  return <HStack {...props} data-slot="editor-inline-combobox-row" />
}

export function EditorInlineComboboxEmpty({
  children = "No suggestions",
  className,
  xstyle,
  ...props
}: StyleXComponentProps<ComponentProps<"output">>) {
  const { state } = useEditorInlineCombobox()

  return state.status === "empty" ? (
    <Box
      className={className}
      xstyle={xstyle}
      render={<output {...props} aria-live="polite" />}
      data-slot="editor-inline-combobox-empty"
    >
      {children}
    </Box>
  ) : null
}

export function EditorInlineComboboxStatus({
  children,
  className,
  xstyle,
  ...props
}: StyleXComponentProps<ComponentProps<"output">>) {
  const { state } = useEditorInlineCombobox()

  const message =
    state.status === "loading"
      ? "Loading suggestions"
      : state.status === "error"
        ? "Suggestions unavailable"
        : ""

  return message ? (
    <Box
      className={className}
      xstyle={xstyle}
      render={<output {...props} aria-live="polite" />}
      data-slot="editor-inline-combobox-status"
    >
      {children ?? message}
    </Box>
  ) : null
}

export interface EditorTypeaheadProps extends EditorContentProps {
  controller: EditorTypeaheadController
  ariaLabel?: string
}

function EditorTypeaheadOptions({ ariaLabel }: { ariaLabel: string }) {
  const { state } = useEditorInlineCombobox()

  return (
    <EditorInlineComboboxContent aria-label={ariaLabel}>
      <EditorInlineComboboxList aria-label={ariaLabel}>
        {state.items.map((item) => (
          <EditorInlineComboboxItem key={item.id} item={item} />
        ))}
      </EditorInlineComboboxList>
      <EditorInlineComboboxEmpty />
      <EditorInlineComboboxStatus />
    </EditorInlineComboboxContent>
  )
}

export function EditorTypeahead({
  controller,
  ariaLabel = "Editor suggestions",
  ...props
}: EditorTypeaheadProps) {
  return (
    <EditorInlineCombobox controller={controller}>
      <EditorInlineComboboxInput {...props} />
      <EditorTypeaheadOptions ariaLabel={ariaLabel} />
    </EditorInlineCombobox>
  )
}

const styles = stylex.create({
  item: {
    minBlockSize: {
      default: null,
      "@media (pointer: coarse)": `calc(${tokens["--spacing"]} * 11)`,
    },
  },
  optionRow: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr)",
    gridTemplateRows: "auto auto",
    rowGap: `calc(${tokens["--spacing"]} / 2)`,
  },
  describedItem: {
    alignItems: "start",
    display: "grid",
    gridColumn: "1",
    gridRow: "1 / 3",
    gridTemplateRows: "subgrid",
  },
  label: {
    fontSize: "inherit",
    lineHeight: "inherit",
    whiteSpace: "normal",
    overflowWrap: "anywhere",
  },
  description: {
    alignSelf: "start",
    color: tokens["--muted-foreground"],
    fontSize: "0.75rem",
    gridColumn: "1",
    gridRow: "2",
    lineHeight: 1.4,
    marginBlockEnd: `calc(${tokens["--spacing"]} * 1.5)`,
    marginInline: `calc(${tokens["--spacing"]} * 2)`,
    overflowWrap: "anywhere",
    pointerEvents: "none",
    whiteSpace: "normal",
    zIndex: 1,
  },
})
