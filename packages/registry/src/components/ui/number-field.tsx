"use client"

import { NumberField as NumberFieldPrimitive } from "@base-ui/react/number-field"
import { Label } from "@registry/components/ui/label"
import { stylexProps } from "@registry/lib/stylex"
import { themeMarker } from "@registry/styles/markers.stylex"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"
import { MinusIcon, PlusIcon } from "lucide-react"
import * as React from "react"

const styles = stylex.create({
  root: {
    alignItems: "start",
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
    inlineSize: "100%",
  },
  group: {
    backgroundClip: "padding-box",
    backgroundColor: {
      default: tokens.background,
      [stylex.when.ancestor('[data-theme="dark"]', themeMarker)]:
        "color-mix(in oklab, var(--input, currentColor) 32%, transparent)",
    },
    borderColor: tokens.input,
    borderRadius: tokens.radiusLarge,
    borderStyle: "solid",
    borderWidth: 1,
    boxShadow: "0 1px 2px color-mix(in oklab, #000 5%, transparent)",
    color: tokens.foreground,
    display: "flex",
    fontSize: { default: "1rem", "@media (min-width: 640px)": "0.875rem" },
    inlineSize: "100%",
    justifyContent: "space-between",
    opacity: { default: 1, "[data-disabled]": 0.64 },
    pointerEvents: { default: "auto", "[data-disabled]": "none" },
    position: "relative",
    transitionProperty: "box-shadow",
    ":focus-within": {
      borderColor: tokens.ring,
      boxShadow: `0 0 0 3px color-mix(in oklab, var(--ring, currentColor) 24%, transparent)`,
    },
  },
  stepper: {
    alignItems: "center",
    cursor: "pointer",
    display: "flex",
    flexShrink: 0,
    justifyContent: "center",
    paddingInline: "calc(0.75rem - 1px)",
    position: "relative",
    transitionProperty: "color, background-color",
    backgroundColor: { default: "transparent", ":hover": tokens.accent },
  },
  decrement: {
    borderEndStartRadius: "calc(var(--radius-large, .625rem) - 1px)",
    borderStartStartRadius: "calc(var(--radius-large, .625rem) - 1px)",
  },
  increment: {
    borderEndEndRadius: "calc(var(--radius-large, .625rem) - 1px)",
    borderStartEndRadius: "calc(var(--radius-large, .625rem) - 1px)",
  },
  input: {
    backgroundColor: "transparent",
    blockSize: { default: "2.125rem", "@media (min-width: 640px)": "1.875rem" },
    color: tokens.foreground,
    flexGrow: 1,
    fontVariantNumeric: "tabular-nums",
    inlineSize: "100%",
    lineHeight: {
      default: "2.125rem",
      "@media (min-width: 640px)": "1.875rem",
    },
    minInlineSize: 0,
    outline: "none",
    paddingInline: "calc(0.75rem - 1px)",
    textAlign: "center",
  },
  scrubArea: { cursor: "ew-resize", display: "flex" },
  scrubLabel: { cursor: "ew-resize" },
  cursor: { filter: "drop-shadow(0 1px 1px #0008)" },
})

export const NumberFieldContext: React.Context<{ fieldId: string } | null> =
  React.createContext<{ fieldId: string } | null>(null)

export function NumberField({
  id,
  className,
  size = "default",
  ...props
}: NumberFieldPrimitive.Root.Props & { size?: "sm" | "default" | "lg" }) {
  const generatedId = React.useId()
  const fieldId = id ?? generatedId
  return (
    <NumberFieldContext.Provider value={{ fieldId }}>
      <NumberFieldPrimitive.Root
        {...stylexProps(className, styles.root)}
        data-size={size}
        data-slot="number-field"
        id={fieldId}
        {...props}
      />
    </NumberFieldContext.Provider>
  )
}
export function NumberFieldGroup({
  className,
  ...props
}: NumberFieldPrimitive.Group.Props) {
  return (
    <NumberFieldPrimitive.Group
      {...stylexProps(className, styles.group)}
      data-slot="number-field-group"
      {...props}
    />
  )
}
export function NumberFieldDecrement({
  className,
  ...props
}: NumberFieldPrimitive.Decrement.Props) {
  return (
    <NumberFieldPrimitive.Decrement
      {...stylexProps(className, styles.stepper, styles.decrement)}
      data-slot="number-field-decrement"
      {...props}
    >
      <MinusIcon />
    </NumberFieldPrimitive.Decrement>
  )
}
export function NumberFieldIncrement({
  className,
  ...props
}: NumberFieldPrimitive.Increment.Props) {
  return (
    <NumberFieldPrimitive.Increment
      {...stylexProps(className, styles.stepper, styles.increment)}
      data-slot="number-field-increment"
      {...props}
    >
      <PlusIcon />
    </NumberFieldPrimitive.Increment>
  )
}
export function NumberFieldInput({
  className,
  ...props
}: NumberFieldPrimitive.Input.Props) {
  return (
    <NumberFieldPrimitive.Input
      {...stylexProps(className, styles.input)}
      data-slot="number-field-input"
      {...props}
    />
  )
}
export function NumberFieldScrubArea({
  className,
  label,
  ...props
}: NumberFieldPrimitive.ScrubArea.Props & { label: string }) {
  const context = React.useContext(NumberFieldContext)
  if (!context)
    throw new Error(
      "NumberFieldScrubArea must be used within a NumberField component for accessibility.",
    )
  return (
    <NumberFieldPrimitive.ScrubArea
      {...stylexProps(className, styles.scrubArea)}
      data-slot="number-field-scrub-area"
      {...props}
    >
      <Label {...stylex.props(styles.scrubLabel)} htmlFor={context.fieldId}>
        {label}
      </Label>
      <NumberFieldPrimitive.ScrubAreaCursor {...stylex.props(styles.cursor)}>
        <CursorGrowIcon />
      </NumberFieldPrimitive.ScrubAreaCursor>
    </NumberFieldPrimitive.ScrubArea>
  )
}
export function CursorGrowIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg
      aria-hidden="true"
      fill="black"
      height="14"
      stroke="white"
      viewBox="0 0 24 14"
      width="26"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M19.5 5.5L6.49737 5.51844V2L1 6.9999L6.5 12L6.49737 8.5L19.5 8.5V12L25 6.9999L19.5 2V5.5Z" />
    </svg>
  )
}
export { NumberFieldPrimitive }
