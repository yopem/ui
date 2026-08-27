"use client"

import { Field as FieldPrimitive } from "@base-ui/react/field"
import { stylexProps } from "@registry/lib/stylex"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  root: {
    alignItems: "flex-start",
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
    tabSize: 4,
  },
  label: {
    alignItems: "center",
    color: tokens.foreground,
    display: "inline-flex",
    fontSize: { default: "1rem", "@media (min-width: 640px)": "0.875rem" },
    fontWeight: 500,
    gap: "0.5rem",
    lineHeight: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    opacity: { default: 1, "[data-disabled]": 0.64 },
  },
  item: { display: "flex" },
  description: {
    color: tokens.mutedForeground,
    fontSize: "0.75rem",
    lineHeight: "1rem",
  },
  error: {
    color: tokens.destructiveForeground,
    fontSize: "0.75rem",
    lineHeight: "1rem",
  },
})

export function Field({ className, ...props }: FieldPrimitive.Root.Props) {
  return (
    <FieldPrimitive.Root
      {...stylexProps(className, styles.root)}
      data-slot="field"
      {...props}
    />
  )
}
export function FieldLabel({
  className,
  ...props
}: FieldPrimitive.Label.Props) {
  return (
    <FieldPrimitive.Label
      {...stylexProps(className, styles.label)}
      data-slot="field-label"
      {...props}
    />
  )
}
export function FieldItem({ className, ...props }: FieldPrimitive.Item.Props) {
  return (
    <FieldPrimitive.Item
      {...stylexProps(className, styles.item)}
      data-slot="field-item"
      {...props}
    />
  )
}
export function FieldDescription({
  className,
  ...props
}: FieldPrimitive.Description.Props) {
  return (
    <FieldPrimitive.Description
      {...stylexProps(className, styles.description)}
      data-slot="field-description"
      {...props}
    />
  )
}
export function FieldError({
  className,
  ...props
}: FieldPrimitive.Error.Props) {
  return (
    <FieldPrimitive.Error
      {...stylexProps(className, styles.error)}
      data-slot="field-error"
      {...props}
    />
  )
}

export const FieldControl: typeof FieldPrimitive.Control =
  FieldPrimitive.Control
export const FieldValidity: typeof FieldPrimitive.Validity =
  FieldPrimitive.Validity
export { FieldPrimitive }
