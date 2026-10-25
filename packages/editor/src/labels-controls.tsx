"use client"

import type { ComponentProps, ReactNode } from "react"

import { Checkbox } from "@registry/components/ui/checkbox"
import { CheckboxGroup } from "@registry/components/ui/checkbox-group"
import { Label } from "@registry/components/ui/label"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"

import {
  EDITOR_LABEL_MAX_OPTIONS,
  parseEditorLabelOptions,
} from "./labels-model"

const styles = stylex.create({
  option: {
    borderRadius: tokens["--radius-sm"],
    minBlockSize: "2.75rem",
    paddingInline: `calc(${tokens["--spacing"]} * 2)`,
  },
})

export type EditorLabelsPickerProps = Omit<
  ComponentProps<typeof CheckboxGroup>,
  "children" | "value" | "onValueChange"
> & {
  options: readonly string[]
  value: readonly string[]
  onValueChange: (value: readonly string[]) => void
}

export type EditorLabelsOptionProps = Omit<
  ComponentProps<typeof Label>,
  "children"
> & {
  value: string
  disabled?: boolean
  children?: ReactNode
}

export function EditorLabelsOption({
  value,
  disabled,
  children,
  xstyle,
  ...props
}: EditorLabelsOptionProps) {
  return (
    <Label
      {...props}
      data-slot="editor-labels-option"
      xstyle={[styles.option, xstyle]}
    >
      <Checkbox value={value} disabled={disabled} />
      {children ?? value}
    </Label>
  )
}

export function EditorLabelsPicker({
  options,
  value,
  onValueChange,
  ...props
}: EditorLabelsPickerProps) {
  const fixedOptions = parseEditorLabelOptions(options)

  if (!fixedOptions)
    throw new TypeError(
      "Editor label options must be unique bounded text values",
    )

  const allowed = new Set(fixedOptions)

  function cleanSelection(values: readonly string[]) {
    const selected = new Set<string>()

    for (const item of values.slice(0, EDITOR_LABEL_MAX_OPTIONS))
      if (allowed.has(item)) selected.add(item)

    return Array.from(selected)
  }

  function changeSelection(values: readonly string[]) {
    onValueChange(cleanSelection(values))
  }

  return (
    <CheckboxGroup
      {...props}
      data-slot="editor-labels-picker"
      value={cleanSelection(value)}
      onValueChange={changeSelection}
    >
      {fixedOptions.map((option) => (
        <EditorLabelsOption
          key={option}
          value={option}
          disabled={props.disabled}
        />
      ))}
    </CheckboxGroup>
  )
}
