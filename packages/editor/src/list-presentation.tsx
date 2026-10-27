"use client"

export {
  EditorListPresentationExtension,
  createEditorListPresentationHTMLConfig,
} from "./list-presentation-extension"

export {
  EDITOR_LIST_MARKER_ATTRIBUTE,
  EDITOR_LIST_START_MAX,
  EDITOR_LIST_START_MIN,
  editorListMarkerSchema,
  isEditorListMarkerForType,
  isEditorListStart,
  parseEditorListStartHTML,
} from "./list-presentation-model"

export type { EditorListMarker } from "./list-presentation-model"

import type { InputProps } from "@registry/components/ui/input"
import type { NativeSelectProps } from "@registry/components/ui/native-select"
import type { ChangeEvent, ComponentProps, FocusEvent } from "react"

import { useStableCallback } from "@base-ui/utils/useStableCallback"
import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@registry/components/ui/field"
import { Fieldset, FieldsetLegend } from "@registry/components/ui/fieldset"
import { Input } from "@registry/components/ui/input"
import { NativeSelect } from "@registry/components/ui/native-select"
import { Wrap } from "@registry/components/ui/wrap"
import { useId, useState } from "react"

import { useEditorListPresentationSelection } from "./list-presentation-controls"
import {
  EDITOR_BULLET_LIST_MARKERS,
  EDITOR_LIST_START_MAX,
  EDITOR_LIST_START_MIN,
  EDITOR_ORDERED_LIST_MARKERS,
  editorListMarkerSchema,
  isEditorListMarkerForType,
  isEditorListStart,
} from "./list-presentation-model"

function isPresentationControlTarget(event: FocusEvent<HTMLElement>) {
  const target = event.relatedTarget

  const ElementConstructor =
    event.currentTarget.ownerDocument.defaultView?.Element

  if (!ElementConstructor || !(target instanceof ElementConstructor))
    return false

  return target.closest("[data-editor-list-presentation-control]") !== null
}

function useListPresentationControl() {
  const selection = useEditorListPresentationSelection()

  const blur = useStableCallback(function blur(event: FocusEvent<HTMLElement>) {
    if (!isPresentationControlTarget(event)) selection.clear()
  })

  return { ...selection, blur }
}

export type EditorListMarkerControlProps = Omit<
  NativeSelectProps,
  "children" | "onChange" | "value"
>

export function EditorListMarkerControl({
  disabled,
  id: providedId,
  ...props
}: EditorListMarkerControlProps) {
  const generatedId = useId()
  const id = providedId ?? generatedId
  const selection = useListPresentationControl()

  const markers =
    selection.listType === "bullet"
      ? EDITOR_BULLET_LIST_MARKERS
      : selection.listType === "number"
        ? EDITOR_ORDERED_LIST_MARKERS
        : []

  const controlDisabled =
    (disabled ?? false) ||
    !selection.editable ||
    !selection.available ||
    selection.listType === "check"

  const handleChange = useStableCallback(function handleChange(
    event: ChangeEvent<HTMLSelectElement>,
  ) {
    const value = event.currentTarget.value

    if (!value) {
      selection.setMarker(undefined)

      return
    }

    const parsed = editorListMarkerSchema.safeParse(value)

    if (
      parsed.success &&
      selection.listType &&
      isEditorListMarkerForType(parsed.data, selection.listType)
    )
      selection.setMarker(parsed.data)
  })

  return (
    <Field
      data-editor-list-presentation-control=""
      onPointerDownCapture={selection.capture}
      onFocusCapture={selection.capture}
      onBlurCapture={selection.blur}
    >
      <FieldLabel htmlFor={id}>List marker</FieldLabel>
      <NativeSelect
        {...props}
        disabled={controlDisabled}
        id={id}
        value={selection.marker ?? ""}
        onChange={handleChange}
      >
        <option value="">Default</option>
        {markers.map((marker) => (
          <option key={marker} value={marker}>
            {marker}
          </option>
        ))}
      </NativeSelect>
    </Field>
  )
}

export type EditorListStartControlProps = Omit<
  InputProps,
  "children" | "max" | "min" | "onChange" | "step" | "type" | "value"
>

export function EditorListStartControl({
  "aria-describedby": providedDescription,
  "aria-invalid": providedInvalid,
  disabled,
  id: providedId,
  onFocus,
  ...props
}: EditorListStartControlProps) {
  const generatedId = useId()
  const id = providedId ?? generatedId
  const descriptionId = `${id}-description`
  const selection = useListPresentationControl()
  const [draft, setDraft] = useState<string | null>(null)
  const [invalid, setInvalid] = useState(false)

  const value =
    draft ?? (selection.start === undefined ? "" : String(selection.start))

  const invalidByConsumer =
    providedInvalid === true ||
    providedInvalid === "true" ||
    providedInvalid === "grammar" ||
    providedInvalid === "spelling"

  const isInvalid = invalid || invalidByConsumer

  const describedBy = [providedDescription, descriptionId]
    .filter(Boolean)
    .join(" ")

  const controlDisabled =
    (disabled ?? false) ||
    !selection.editable ||
    !selection.available ||
    selection.listType !== "number"

  const change = useStableCallback(function change(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const next = event.currentTarget.value
    setDraft(next)

    if (!/^-?\d+$/.test(next)) {
      setInvalid(true)

      return
    }

    const start = Number(next)

    if (!isEditorListStart(start)) {
      setInvalid(true)

      return
    }

    setInvalid(false)
    selection.setStart(start)
  })

  const blur = useStableCallback(function blur(event: FocusEvent<HTMLElement>) {
    selection.blur(event)

    if (!isPresentationControlTarget(event)) {
      setDraft(null)
      setInvalid(false)
    }
  })

  const handleFocus = useStableCallback(function handleFocus(
    event: Parameters<NonNullable<typeof onFocus>>[0],
  ) {
    onFocus?.(event)

    if (event.defaultPrevented) return

    setDraft(selection.start === undefined ? "" : String(selection.start))
    setInvalid(false)
  })

  return (
    <Field
      data-editor-list-presentation-control=""
      onPointerDownCapture={selection.capture}
      onFocusCapture={selection.capture}
      onBlurCapture={blur}
    >
      <FieldLabel htmlFor={id}>Ordered list start</FieldLabel>
      <Input
        {...props}
        aria-describedby={describedBy}
        aria-invalid={isInvalid}
        disabled={controlDisabled}
        id={id}
        type="text"
        value={value}
        onFocus={handleFocus}
        onChange={change}
      />
      <FieldDescription id={descriptionId}>
        Enter a whole number from {EDITOR_LIST_START_MIN} to{" "}
        {EDITOR_LIST_START_MAX}.
      </FieldDescription>
    </Field>
  )
}

export type EditorListPresentationControlsProps = Omit<
  ComponentProps<typeof Fieldset>,
  "children"
>

export function EditorListPresentationControls(
  props: EditorListPresentationControlsProps,
) {
  return (
    <Fieldset {...props}>
      <FieldsetLegend>List presentation</FieldsetLegend>
      <Wrap>
        <EditorListMarkerControl />
        <EditorListStartControl />
      </Wrap>
    </Fieldset>
  )
}
