"use client"

import type { StyleComponentProps } from "@registry/lib/style-props"
import type { ComponentProps } from "react"

import { Field as FieldPrimitive } from "@base-ui/react/field"
import { splitStyleProps } from "@registry/lib/style-props"
import { mergeStyleProps, stylexProps } from "@registry/lib/stylex"
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
    color: tokens["--foreground"],
    display: "inline-flex",
    fontSize: { default: "1rem", "@media (min-width: 640px)": "0.875rem" },
    fontWeight: 500,
    gap: "0.5rem",
    lineHeight: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    opacity: { default: 1, "[data-disabled]": 0.64 },
  },
  item: { display: "flex" },
  description: {
    color: tokens["--muted-foreground"],
    fontSize: "0.75rem",
    lineHeight: "1rem",
  },
  error: {
    color: tokens["--destructive-foreground"],
    fontSize: "0.75rem",
    lineHeight: "1rem",
  },
})

export function Field({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleComponentProps<FieldPrimitive.Root.Props>) {
  const { domProps: props, xstyle: styleProps } = splitStyleProps(restProps)
  const xstyle = [styleProps, consumerXstyle]

  return (
    <FieldPrimitive.Root
      data-slot="field"
      {...mergeStyleProps(stylexProps(className, styles.root, xstyle), props)}
    />
  )
}
export function FieldLabel({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleComponentProps<FieldPrimitive.Label.Props>) {
  const { domProps: props, xstyle: styleProps } = splitStyleProps(restProps)
  const xstyle = [styleProps, consumerXstyle]

  return (
    <FieldPrimitive.Label
      data-slot="field-label"
      {...mergeStyleProps(stylexProps(className, styles.label, xstyle), props)}
    />
  )
}
export function FieldItem({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleComponentProps<FieldPrimitive.Item.Props>) {
  const { domProps: props, xstyle: styleProps } = splitStyleProps(restProps)
  const xstyle = [styleProps, consumerXstyle]

  return (
    <FieldPrimitive.Item
      data-slot="field-item"
      {...mergeStyleProps(stylexProps(className, styles.item, xstyle), props)}
    />
  )
}
export function FieldDescription({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleComponentProps<FieldPrimitive.Description.Props>) {
  const { domProps: props, xstyle: styleProps } = splitStyleProps(restProps)
  const xstyle = [styleProps, consumerXstyle]

  return (
    <FieldPrimitive.Description
      data-slot="field-description"
      {...mergeStyleProps(
        stylexProps(className, styles.description, xstyle),
        props,
      )}
    />
  )
}
export function FieldError({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleComponentProps<FieldPrimitive.Error.Props>) {
  const { domProps: props, xstyle: styleProps } = splitStyleProps(restProps)
  const xstyle = [styleProps, consumerXstyle]

  return (
    <FieldPrimitive.Error
      data-slot="field-error"
      {...mergeStyleProps(stylexProps(className, styles.error, xstyle), props)}
    />
  )
}

export function FieldControl({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleComponentProps<ComponentProps<typeof FieldPrimitive.Control>>) {
  const { domProps: props, xstyle: styleProps } = splitStyleProps(restProps)
  const xstyle = [styleProps, consumerXstyle]

  return (
    <FieldPrimitive.Control
      {...mergeStyleProps(stylexProps(className, xstyle), props)}
    />
  )
}
export const FieldValidity: typeof FieldPrimitive.Validity =
  FieldPrimitive.Validity
export { FieldPrimitive }
