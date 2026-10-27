"use client"

import { useStableCallback } from "@base-ui/utils/useStableCallback"
import { Box } from "@registry/components/ui/box"
import { Button } from "@registry/components/ui/button"
import {
  Command,
  CommandInput,
  CommandEmpty,
  CommandItem,
  CommandList,
} from "@registry/components/ui/command"
import { NativeSelect } from "@registry/components/ui/native-select"
import {
  Popover,
  PopoverPopup,
  PopoverTrigger,
} from "@registry/components/ui/popover"
import { Text } from "@registry/components/ui/text"
import { ToolbarButton } from "@registry/components/ui/toolbar"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"
import {
  createContext,
  useContext,
  useState,
  useSyncExternalStore,
  type ComponentProps,
  type ReactNode,
} from "react"

import type { EditorEmoji } from "./typeahead-emoji"

import {
  createEditorEmojiPicker,
  type EditorEmojiOptions,
  type EditorEmojiPickerController,
} from "./emoji-picker-store"
import { useEditor } from "./root"

const EmojiContext = createContext<EditorEmojiPickerController | null>(null)

const styles = stylex.create({
  item: {
    minBlockSize: {
      default: null,
      "@media (pointer: coarse)": `calc(${tokens["--spacing"]} * 11)`,
    },
  },
})

export function useEditorEmojiPicker() {
  const controller = useContext(EmojiContext)

  if (!controller) throw new Error("Use emoji parts inside EditorEmojiPopover")

  const state = useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
    controller.getServerSnapshot,
  )

  return { controller, state }
}

export interface EditorEmojiPopoverProps extends EditorEmojiOptions {
  children: ReactNode
}

export function EditorEmojiPopover({
  children,
  ...options
}: EditorEmojiPopoverProps) {
  const editor = useEditor()
  const [controller] = useState(() => createEditorEmojiPicker(editor, options))

  const state = useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
    controller.getServerSnapshot,
  )

  return (
    <EmojiContext value={controller}>
      <Popover
        open={state.open && state.editable}
        onOpenChange={controller.setOpen}
      >
        {children}
      </Popover>
    </EmojiContext>
  )
}

export function EditorEmojiToolbarButton({
  children = "Emoji",
  disabled,
  onClick,
  onMouseDown,
  ...props
}: ComponentProps<typeof ToolbarButton>) {
  const { state } = useEditorEmojiPicker()

  const handleMouseDown = useStableCallback(function handleMouseDown(
    event: Parameters<
      NonNullable<ComponentProps<typeof ToolbarButton>["onMouseDown"]>
    >[0],
  ) {
    onMouseDown?.(event)

    if (!event.defaultPrevented) event.preventDefault()
  })

  return (
    <PopoverTrigger
      disabled={disabled === true || !state.editable}
      onClick={onClick}
      render={
        <ToolbarButton
          render={<Button variant="ghost" size="sm" />}
          {...props}
          disabled={disabled === true || !state.editable}
        />
      }
      data-slot="editor-emoji-toolbar-button"
      onMouseDown={handleMouseDown}
    >
      {children}
    </PopoverTrigger>
  )
}

export function EditorEmojiPopoverContent(
  props: Omit<ComponentProps<typeof PopoverPopup>, "finalFocus">,
) {
  const { state } = useEditorEmojiPicker()

  return (
    <PopoverPopup
      aria-label="Emoji picker"
      {...props}
      finalFocus={state.returnFocusToTrigger}
      data-slot="editor-emoji-popover-content"
    />
  )
}

export function EditorEmojiSearch(props: ComponentProps<typeof CommandInput>) {
  useEditorEmojiPicker()

  return (
    <CommandInput
      aria-label="Search emoji"
      {...props}
      maxLength={64}
      data-slot="editor-emoji-search"
    />
  )
}

export function EditorEmojiCategory({
  onChange,
  ...props
}: Omit<ComponentProps<typeof NativeSelect>, "value" | "children">) {
  const { controller, state } = useEditorEmojiPicker()

  const handleChange = useStableCallback(function handleChange(
    event: Parameters<
      NonNullable<ComponentProps<typeof NativeSelect>["onChange"]>
    >[0],
  ) {
    onChange?.(event)

    if (!event.defaultPrevented) controller.setCategory(event.target.value)
  })

  return (
    <NativeSelect
      aria-label="Emoji category"
      {...props}
      value={state.category}
      data-slot="editor-emoji-category"
      onChange={handleChange}
    >
      <option value="all">All emoji</option>
      <option value="frequent">Frequently used</option>
      {state.categories.map((name) => (
        <option key={name} value={`category:${name}`}>
          {name.replaceAll("-", " ")}
        </option>
      ))}
    </NativeSelect>
  )
}

export function EditorEmojiItem({
  item,
  children,
  disabled,
  onClick,
  onMouseDown,
  xstyle,
  ...props
}: Omit<ComponentProps<typeof CommandItem>, "value"> & { item: EditorEmoji }) {
  const { controller, state } = useEditorEmojiPicker()
  const current = state.items.find((candidate) => candidate === item)

  const handleMouseDown = useStableCallback(function handleMouseDown(
    event: Parameters<
      NonNullable<ComponentProps<typeof CommandItem>["onMouseDown"]>
    >[0],
  ) {
    onMouseDown?.(event)
    event.preventDefault()
  })

  const handleClick = useStableCallback(function handleClick(
    event: Parameters<
      NonNullable<ComponentProps<typeof CommandItem>["onClick"]>
    >[0],
  ) {
    onClick?.(event)

    if (!event.defaultPrevented) controller.insert(item.id)
  })

  if (!current) return null

  return (
    <CommandItem
      {...props}
      value={item}
      disabled={disabled === true || !state.valid || !state.editable}
      xstyle={[styles.item, xstyle]}
      data-slot="editor-emoji-item"
      onMouseDown={handleMouseDown}
      onClick={handleClick}
    >
      {children ?? `${item.emoji} ${item.label}`}
    </CommandItem>
  )
}

export function EditorEmojiList({
  children,
  ...props
}: ComponentProps<typeof CommandList>) {
  const { state } = useEditorEmojiPicker()

  return (
    <CommandList aria-label="Emoji" {...props} data-slot="editor-emoji-list">
      {children ??
        state.items.map((item) => (
          <EditorEmojiItem key={item.id} item={item} />
        ))}
    </CommandList>
  )
}

export function EditorEmojiEmpty({
  children = "No emoji",
  ...props
}: ComponentProps<typeof CommandEmpty>) {
  useEditorEmojiPicker()

  return (
    <CommandEmpty {...props} data-slot="editor-emoji-empty">
      {children}
    </CommandEmpty>
  )
}

export function EditorEmojiPrevious({
  children = "Previous emoji",
  disabled,
  onClick,
  ...props
}: ComponentProps<typeof Button>) {
  const { controller, state } = useEditorEmojiPicker()

  const handleClick = useStableCallback(function handleClick(
    event: Parameters<NonNullable<ComponentProps<typeof Button>["onClick"]>>[0],
  ) {
    onClick?.(event)

    if (!event.defaultPrevented) controller.previous()
  })

  return (
    <Button
      variant="ghost"
      {...props}
      disabled={disabled === true || state.offset === 0}
      onClick={handleClick}
    >
      {children}
    </Button>
  )
}

export function EditorEmojiNext({
  children = "Next emoji",
  disabled,
  onClick,
  ...props
}: ComponentProps<typeof Button>) {
  const { controller, state } = useEditorEmojiPicker()

  const handleClick = useStableCallback(function handleClick(
    event: Parameters<NonNullable<ComponentProps<typeof Button>["onClick"]>>[0],
  ) {
    onClick?.(event)

    if (!event.defaultPrevented) controller.next()
  })

  return (
    <Button
      variant="ghost"
      {...props}
      disabled={disabled === true || !state.hasNext}
      onClick={handleClick}
    >
      {children}
    </Button>
  )
}

export function EditorEmojiClearHistory({
  children = "Clear emoji history",
  disabled,
  onClick,
  ...props
}: ComponentProps<typeof Button>) {
  const { controller, state } = useEditorEmojiPicker()

  const handleClick = useStableCallback(function handleClick(
    event: Parameters<NonNullable<ComponentProps<typeof Button>["onClick"]>>[0],
  ) {
    onClick?.(event)

    if (!event.defaultPrevented) controller.clearHistory()
  })

  return (
    <Button
      variant="ghost"
      {...props}
      disabled={disabled === true || !state.usage.length}
      onClick={handleClick}
    >
      {children}
    </Button>
  )
}

export function EditorEmojiClearSearch({
  children = "Clear emoji search",
  disabled,
  onClick,
  ...props
}: ComponentProps<typeof Button>) {
  const { controller, state } = useEditorEmojiPicker()

  const handleClick = useStableCallback(function handleClick(
    event: Parameters<NonNullable<ComponentProps<typeof Button>["onClick"]>>[0],
  ) {
    onClick?.(event)

    if (!event.defaultPrevented) controller.setQuery("")
  })

  return (
    <Button
      variant="ghost"
      {...props}
      disabled={disabled === true || !state.query}
      onClick={handleClick}
    >
      {children}
    </Button>
  )
}

export function EditorEmojiPreview({
  children,
  ...props
}: ComponentProps<typeof Box>) {
  const { state } = useEditorEmojiPicker()

  return (
    <Box {...props} data-slot="editor-emoji-preview">
      {state.preview
        ? (children ?? (
            <Text>
              {state.preview.emoji} {state.preview.label}{" "}
              {state.preview.aliases.map((alias) => `:${alias}:`).join(" ")}
            </Text>
          ))
        : null}
    </Box>
  )
}

export type EditorEmojiPickerProps = Omit<
  ComponentProps<typeof Command>,
  "items" | "value" | "onValueChange" | "filter"
>

export function EditorEmojiPicker({
  children,
  onItemHighlighted,
  ...props
}: EditorEmojiPickerProps) {
  const { controller, state } = useEditorEmojiPicker()

  const handleItemHighlighted = useStableCallback(
    function handleItemHighlighted(
      value: Parameters<
        NonNullable<EditorEmojiPickerProps["onItemHighlighted"]>
      >[0],
      details: Parameters<
        NonNullable<EditorEmojiPickerProps["onItemHighlighted"]>
      >[1],
    ) {
      onItemHighlighted?.(value, details)
      controller.highlight(state.items.find((item) => item === value) ?? null)
    },
  )

  return (
    <Command
      {...props}
      items={state.items}
      value={state.query}
      onValueChange={controller.setQuery}
      filter={null}
      onItemHighlighted={handleItemHighlighted}
    >
      {children ?? (
        <>
          <EditorEmojiSearch />
          <EditorEmojiCategory />
          <EditorEmojiClearSearch />
          <EditorEmojiList />
          <EditorEmojiEmpty />
          <EditorEmojiPreview />
          <EditorEmojiPrevious />
          <EditorEmojiNext />
          <EditorEmojiClearHistory />
        </>
      )}
    </Command>
  )
}

export type EditorEmojiMenuProps = EditorEmojiOptions

export function EditorEmojiMenu(props: EditorEmojiMenuProps) {
  return (
    <EditorEmojiPopover {...props}>
      <EditorEmojiToolbarButton />
      <EditorEmojiPopoverContent>
        <EditorEmojiPicker />
      </EditorEmojiPopoverContent>
    </EditorEmojiPopover>
  )
}
