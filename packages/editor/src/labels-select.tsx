"use client"

import type { ComponentProps, ReactNode } from "react"

import { useStableCallback } from "@base-ui/utils/useStableCallback"
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxPopup,
  type ComboboxPrimitive,
} from "@registry/components/ui/combobox"
import * as stylex from "@stylexjs/stylex"
import { SKIP_DOM_SELECTION_TAG } from "lexical"
import {
  createContext,
  use,
  useRef,
  useState,
  useSyncExternalStore,
} from "react"

import { $getEditorLabels, $replaceEditorLabels } from "./labels-extension"
import {
  decodeEditorLabels,
  EDITOR_LABEL_MAX_COUNT,
  parseEditorLabelOptions,
} from "./labels-model"
import { useEditor, useEditorState } from "./root"

const styles = stylex.create({
  target: {
    minBlockSize: { default: null, "@media (pointer: coarse)": "2.75rem" },
  },
})

const LabelsSelectContext = createContext<{
  value: readonly string[]
  locked: boolean
} | null>(null)

function useLabelsSelect() {
  const context = use(LabelsSelectContext)

  if (!context)
    throw new Error("Label select parts must be inside EditorLabelsSelect.")

  return context
}

export type EditorLabelsChangeEventDetails =
  ComboboxPrimitive.Root.ChangeEventDetails

export type EditorLabelsSelectProps = Pick<
  ComboboxPrimitive.Root.Props<string, true>,
  "name" | "form" | "id" | "required" | "disabled" | "readOnly" | "onOpenChange"
> & {
  options: readonly string[]
  value?: readonly string[]
  onValueChange?: (
    value: readonly string[],
    details: EditorLabelsChangeEventDetails,
  ) => void
  children?: ReactNode
}

export function EditorLabelsSelect({
  options,
  value,
  onValueChange,
  children,
  disabled = false,
  readOnly = false,
  onOpenChange,
  ...props
}: EditorLabelsSelectProps) {
  const editor = useEditor()
  const { editable } = useEditorState()
  const subscribed = useRef(false)

  const subscribe = useStableCallback(function subscribe(listener: () => void) {
    subscribed.current = true
    const unregister = editor.registerUpdateListener(listener)

    return () => {
      subscribed.current = false
      unregister()
    }
  })

  function snapshot() {
    return editor.getEditorState()
  }

  const state = useSyncExternalStore(subscribe, snapshot, snapshot)
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const fixedOptions = parseEditorLabelOptions(options)

  if (!fixedOptions)
    throw new TypeError(
      "Editor label options must be unique bounded text values",
    )

  const selected = decodeEditorLabels(
    value ?? state.read($getEditorLabels),
    fixedOptions,
  )

  const locked =
    disabled ||
    readOnly ||
    !editable ||
    selected === null ||
    (value !== undefined && !onValueChange)

  if (locked && (open || query !== "")) {
    setOpen(false)
    setQuery("")
  }

  const values = selected ?? []

  const isLocked = useStableCallback(function isLocked() {
    return locked || !editor.isEditable() || !subscribed.current
  })

  const change = useStableCallback(function change(
    next: string[],
    details: EditorLabelsChangeEventDetails,
  ) {
    const parsed = decodeEditorLabels(next, options)

    if (isLocked() || !parsed) {
      details.cancel()

      return
    }

    const before = editor.getEditorState()
    const root = editor.getRootElement()
    onValueChange?.(parsed, details)

    if (details.isCanceled) return

    if (value === undefined) {
      if (
        isLocked() ||
        !root?.isConnected ||
        editor.getRootElement() !== root ||
        editor.getEditorState() !== before ||
        editor._updating ||
        editor._dirtyElements.size > 0 ||
        editor._dirtyLeaves.size > 0
      ) {
        details.cancel()

        return
      }

      let applied = false
      editor.update(
        () => {
          if (
            isLocked() ||
            !root.isConnected ||
            editor.getRootElement() !== root ||
            editor.getEditorState() !== before ||
            editor._dirtyElements.size > 0 ||
            editor._dirtyLeaves.size > 0
          )
            return
          applied = $replaceEditorLabels(parsed, options)
        },
        { discrete: true, tag: SKIP_DOM_SELECTION_TAG },
      )

      if (!applied) {
        details.cancel()

        return
      }
    }

    setQuery("")
  })

  return (
    <LabelsSelectContext value={{ value: values, locked }}>
      <Combobox<string, true>
        {...props}
        multiple
        items={fixedOptions}
        value={values}
        inputValue={query}
        onInputValueChange={setQuery}
        onValueChange={change}
        disabled={disabled}
        readOnly={locked}
        open={open && !locked}
        onOpenChange={(next, details) => {
          onOpenChange?.(next, details)

          if (!details.isCanceled) setOpen(next && !locked)
        }}
      >
        {children ?? (
          <>
            <EditorLabelsInput />
            <EditorLabelsContent />
          </>
        )}
      </Combobox>
    </LabelsSelectContext>
  )
}

export type EditorLabelsInputProps = Omit<
  ComponentProps<typeof ComboboxChipsInput>,
  "children"
> & {
  children?: ReactNode
}

export function EditorLabelsInput({
  children,
  ...props
}: EditorLabelsInputProps) {
  const { value, locked } = useLabelsSelect()

  return (
    <ComboboxChips data-slot="editor-labels-input">
      {children ??
        value.map((label) => <EditorLabelsTag key={label} value={label} />)}
      <ComboboxChipsInput
        aria-label="Choose labels"
        placeholder="Search labels"
        {...props}
        readOnly={locked || props.readOnly}
      />
    </ComboboxChips>
  )
}

export type EditorLabelsTagProps = Omit<
  ComponentProps<typeof ComboboxChip>,
  "children"
> & {
  value: string
  children?: ReactNode
}

export function EditorLabelsTag({
  value,
  children,
  removeProps,
  xstyle,
  ...props
}: EditorLabelsTagProps) {
  const { locked } = useLabelsSelect()

  return (
    <ComboboxChip
      {...props}
      data-slot="editor-labels-tag"
      xstyle={[styles.target, xstyle]}
      removeProps={{
        ...removeProps,
        "aria-label": removeProps?.["aria-label"] ?? `Remove ${value}`,
        disabled: locked || removeProps?.disabled,
      }}
    >
      {children ?? value}
    </ComboboxChip>
  )
}

export type EditorLabelsContentProps = Omit<
  ComponentProps<typeof ComboboxPopup>,
  "children"
> & {
  emptyText?: ReactNode
}

export function EditorLabelsContent({
  emptyText = "No labels found",
  ...props
}: EditorLabelsContentProps) {
  const { value, locked } = useLabelsSelect()

  return (
    <ComboboxPopup {...props} data-slot="editor-labels-content">
      <ComboboxEmpty>{emptyText}</ComboboxEmpty>
      <ComboboxList>
        {(option: string) => (
          <ComboboxItem
            key={option}
            value={option}
            disabled={
              locked ||
              (value.length >= EDITOR_LABEL_MAX_COUNT &&
                !value.includes(option))
            }
            xstyle={styles.target}
          >
            {option}
          </ComboboxItem>
        )}
      </ComboboxList>
    </ComboboxPopup>
  )
}
