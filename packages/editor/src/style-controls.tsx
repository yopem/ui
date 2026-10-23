"use client"

import type { ElementFormatType, ElementNode } from "lexical"

import { $isListItemNode } from "@lexical/list"
import { $patchStyleText } from "@lexical/selection"
import { Box } from "@registry/components/ui/box"
import { Button } from "@registry/components/ui/button"
import { Input } from "@registry/components/ui/input"
import {
  Popover,
  PopoverPopup,
  PopoverTitle,
  PopoverTrigger,
} from "@registry/components/ui/popover"
import { Stack } from "@registry/components/ui/stack"
import { Text } from "@registry/components/ui/text"
import { ToolbarButton } from "@registry/components/ui/toolbar"
import { tokens } from "@registry/styles/tokens.stylex"
import {
  $getSelection,
  $isElementNode,
  $isRangeSelection,
  $isTextNode,
  $setState,
  FORMAT_ELEMENT_COMMAND,
  HISTORY_PUSH_TAG,
} from "lexical"
import { useState, useSyncExternalStore } from "react"

import type { EditorControlProps } from "./controls"

import {
  $getEditorBlockPresentation,
  editorBlockPresentationState,
  isEditorLineHeight,
  isEditorStyleLength,
} from "./block-presentation"
import { useEditor, useEditorState } from "./root"
import { createEditorSelectionBookmark } from "./selection-bookmark"

function $selectedBlocks() {
  const selection = $getSelection()
  const blocks = new Set<ElementNode>()

  if (!$isRangeSelection(selection)) return blocks

  for (const node of [selection.anchor.getNode(), ...selection.getNodes()]) {
    let block = $isElementNode(node) ? node : node.getParent()

    while (block?.isInline()) block = block.getParent()

    if (block && block.getKey() !== "root" && !block.isShadowRoot())
      blocks.add(block)
  }

  return blocks
}

export type EditorAlignmentButtonProps = EditorControlProps & {
  alignment: Exclude<ElementFormatType, "">
}

export function EditorAlignmentButton({
  alignment,
  children,
  disabled,
  onMouseDown,
  onClick,
  ...props
}: EditorAlignmentButtonProps) {
  const editor = useEditor()
  const { editable } = useEditorState()

  return (
    <ToolbarButton
      {...props}
      render={<Button variant="ghost" size="sm" />}
      disabled={disabled === true || !editable}
      onMouseDown={(event) => {
        onMouseDown?.(event)
        event.preventDefault()
      }}
      onClick={(event) => {
        onClick?.(event)

        if (event.defaultPrevented || disabled || !editor.isEditable()) return
        editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, alignment)
        editor.focus()
      }}
    >
      {children ?? `Align ${alignment}`}
    </ToolbarButton>
  )
}

type StyleProperty =
  | "color"
  | "background-color"
  | "font-family"
  | "font-size"
  | "font-weight"
  | "line-height"
  | "text-indent"

const colorPalette = [
  { label: "Foreground", value: tokens["--foreground"] },
  { label: "Background", value: tokens["--background"] },
  { label: "Primary", value: tokens["--primary"] },
  { label: "Accent", value: tokens["--accent"] },
  { label: "Destructive", value: tokens["--destructive"] },
  { label: "Warning", value: tokens["--warning"] },
]

const definitions = {
  color: { label: "Font color", initial: tokens["--foreground"] },
  "background-color": {
    label: "Background color",
    initial: tokens["--accent"],
  },
  "font-family": { label: "Font family", initial: "Inter" },
  "font-size": { label: "Font size", initial: "16px" },
  "font-weight": { label: "Font weight", initial: "400" },
  "line-height": { label: "Line height", initial: "1.5" },
  "text-indent": { label: "First-line indent", initial: "24px" },
}

function validValue(property: StyleProperty, value: string) {
  switch (property) {
    case "color":
    case "background-color":
      return (
        /^#(?:[\da-f]{3}|[\da-f]{6}|[\da-f]{8})$/i.test(value) ||
        colorPalette.some((color) => color.value === value)
      )
    case "font-family":
      return [
        "Inter",
        "Arial",
        "Georgia",
        "IBM Plex Mono",
        "serif",
        "sans-serif",
        "monospace",
      ].includes(value)
    case "font-size":
      return isEditorStyleLength(value, 160) && Number.parseFloat(value) > 0
    case "font-weight":
      return /^(?:[1-9]00)$/.test(value)
    case "line-height":
      return isEditorLineHeight(value)
    case "text-indent":
      return isEditorStyleLength(value, 160)
  }
}

export type EditorStyleControlProps = EditorControlProps & {
  defaultValue?: string
}

function EditorStyleControl({
  property,
  defaultValue,
  children,
  disabled,
  onMouseDown,
  onClick,
  ...props
}: EditorStyleControlProps & { property: StyleProperty }) {
  const editor = useEditor()
  const { editable } = useEditorState()
  const [bookmark] = useState(() => createEditorSelectionBookmark(editor))

  const hasSelection = useSyncExternalStore(
    bookmark.subscribe,
    bookmark.getSnapshot,
    bookmark.getServerSnapshot,
  )

  const definition = definitions[property]
  const [value, setValue] = useState(defaultValue ?? definition.initial)
  const [open, setOpen] = useState(false)
  const [invalid, setInvalid] = useState(false)

  function apply() {
    if (disabled || !editor.isEditable() || !bookmark.getSnapshot()) return
    const next = value.trim()

    if (!validValue(property, next)) {
      setInvalid(true)

      return
    }

    editor.update(
      () => {
        if (!bookmark.restore()) return

        if (property === "line-height" || property === "text-indent") {
          for (const block of $selectedBlocks()) {
            const current = $getEditorBlockPresentation(block)
            $setState(block, editorBlockPresentationState, {
              ...current,
              [property === "line-height" ? "lineHeight" : "textIndent"]: next,
            })
          }
        } else {
          const selection = $getSelection()

          if ($isRangeSelection(selection))
            $patchStyleText(selection, {
              [property]:
                property === "font-family" && next.includes(" ")
                  ? `"${next}"`
                  : next,
            })
        }
      },
      { tag: HISTORY_PUSH_TAG },
    )
    bookmark.clear()
    setOpen(false)
    editor.focus()
  }

  return (
    <Popover
      open={open && editable && !disabled}
      onOpenChange={(next) => {
        if (next) {
          editor.read(bookmark.capture)
          setInvalid(false)
        } else bookmark.clear()
        setOpen(next)
      }}
    >
      <PopoverTrigger
        disabled={!editable || disabled}
        render={
          <ToolbarButton
            {...props}
            render={<Button variant="ghost" size="sm" />}
            disabled={!editable || disabled}
          />
        }
        onClick={onClick}
        onMouseDown={(event) => {
          onMouseDown?.(event)
          event.preventDefault()
        }}
      >
        {children ?? definition.label}
      </PopoverTrigger>
      <PopoverPopup>
        <Stack>
          <PopoverTitle>{definition.label}</PopoverTitle>
          {(property === "color" || property === "background-color") &&
            colorPalette.map((color) => (
              <Button
                key={color.label}
                variant="ghost"
                onClick={() => {
                  setValue(color.value)
                  setInvalid(false)
                }}
              >
                {color.label}
              </Button>
            ))}
          <Input
            aria-label={`${definition.label} value`}
            value={value}
            aria-invalid={invalid || undefined}
            onChange={(event) => {
              setValue(event.target.value)
              setInvalid(false)
            }}
            onKeyDown={(event) => {
              if (event.nativeEvent.isComposing) return

              if (event.key === "Enter") {
                event.preventDefault()
                apply()
              }
            }}
          />
          {invalid && <Text role="alert">Invalid style value.</Text>}
          {!hasSelection && (
            <Box render={<output />}>
              Select text again before you apply this style.
            </Box>
          )}
          <Button
            disabled={disabled === true || !editable || !hasSelection}
            onClick={apply}
          >
            Apply {definition.label}
          </Button>
        </Stack>
      </PopoverPopup>
    </Popover>
  )
}

export function EditorFontColorControl(props: EditorStyleControlProps) {
  return <EditorStyleControl {...props} property="color" />
}

export function EditorBackgroundColorControl(props: EditorStyleControlProps) {
  return <EditorStyleControl {...props} property="background-color" />
}

export function EditorFontFamilyControl(props: EditorStyleControlProps) {
  return <EditorStyleControl {...props} property="font-family" />
}

export function EditorFontSizeControl(props: EditorStyleControlProps) {
  return <EditorStyleControl {...props} property="font-size" />
}

export function EditorFontWeightControl(props: EditorStyleControlProps) {
  return <EditorStyleControl {...props} property="font-weight" />
}

export function EditorLineHeightControl(props: EditorStyleControlProps) {
  return <EditorStyleControl {...props} property="line-height" />
}

export function EditorFirstLineIndentControl(props: EditorStyleControlProps) {
  return <EditorStyleControl {...props} property="text-indent" />
}

export function EditorClearFormattingButton({
  children = "Clear formatting",
  disabled,
  onMouseDown,
  onClick,
  ...props
}: EditorControlProps) {
  const editor = useEditor()
  const { editable } = useEditorState()

  return (
    <ToolbarButton
      {...props}
      render={<Button variant="ghost" size="sm" />}
      disabled={disabled === true || !editable}
      onMouseDown={(event) => {
        onMouseDown?.(event)
        event.preventDefault()
      }}
      onClick={(event) => {
        onClick?.(event)

        if (event.defaultPrevented || disabled || !editor.isEditable()) return
        editor.update(
          () => {
            const selection = $getSelection()

            if (!$isRangeSelection(selection)) return

            if (selection.isCollapsed()) {
              selection.setStyle("")

              selection.format = 0

              return
            }

            for (const block of $selectedBlocks()) {
              block.setFormat("").setTextFormat(0).setTextStyle("")

              if (!$isListItemNode(block)) block.setIndent(0)

              $setState(block, editorBlockPresentationState, {
                lineHeight: "",
                textIndent: "",
              })
            }

            for (const node of selection.extract())
              if ($isTextNode(node)) node.setFormat(0).setStyle("")
            selection.setStyle("")
            selection.format = 0
          },
          { tag: HISTORY_PUSH_TAG },
        )
        editor.focus()
      }}
    >
      {children}
    </ToolbarButton>
  )
}
