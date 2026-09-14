"use client"

import type { StyleXProps } from "@registry/lib/stylex"

import { NumberField as NumberFieldPrimitive } from "@base-ui/react/number-field"
import { Label } from "@registry/components/ui/label"
import { stylexProps } from "@registry/lib/stylex"
import { themeMarker, tokens } from "@registry/styles/tokens.stylex"
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
    lineHeight: {
      default: null,
      ':is([data-slot="group"] *)': "1.5rem",
      "@media (min-width: 640px)": {
        default: null,
        ':is([data-slot="group"] *)': "1.25rem",
      },
    },
    flexBasis: {
      default: null,
      ':is([data-slot="group"][data-orientation="horizontal"] > [data-slot="number-field"])':
        "15.1875rem",
      "@media (min-width: 640px)": {
        default: null,
        ':is([data-slot="group"][data-orientation="horizontal"] > [data-slot="number-field"])':
          "14.625rem",
      },
    },
  },
  group: {
    backgroundClip: "padding-box",
    backgroundColor: {
      default: tokens["--background"],
      [stylex.when.ancestor('[data-theme="dark"]', themeMarker)]:
        "color-mix(in oklab, var(--input, currentColor) 32%, transparent)",
    },
    borderColor: tokens["--input"],
    borderRadius: tokens["--radius-lg"],
    borderStyle: "solid",
    borderWidth: 1,
    boxShadow: "0 1px 2px color-mix(in oklab, #000 5%, transparent)",
    color: tokens["--foreground"],
    display: "flex",
    fontSize: {
      default: "1rem",
      "@media (min-width: 640px)": "0.875rem",
    },
    inlineSize: "100%",
    justifyContent: "space-between",
    opacity: {
      default: 1,
      "[data-disabled]": 0.64,
    },
    pointerEvents: {
      default: "auto",
      "[data-disabled]": "none",
    },
    position: "relative",
    transitionProperty: "box-shadow",
    ":focus-within": {
      borderColor: tokens["--ring"],
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
    backgroundColor: {
      default: "transparent",
      ":hover": tokens["--accent"],
    },
    "::after": {
      blockSize: {
        default: null,
        "@media (pointer: coarse)": "max(100%, 2.75rem)",
      },
      content: {
        default: null,
        "@media (pointer: coarse)": '""',
      },
      inlineSize: {
        default: null,
        "@media (pointer: coarse)": "max(100%, 2.75rem)",
      },
      inset: {
        default: null,
        "@media (pointer: coarse)": 0,
      },
      position: {
        default: null,
        "@media (pointer: coarse)": "absolute",
      },
    },
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
    blockSize: {
      default: "2.125rem",
      "@media (min-width: 640px)": {
        default: "1.875rem",
        ':is([data-slot="number-field"][data-size="sm"] [data-slot="number-field-input"])':
          "1.875rem",
        ':is([data-slot="number-field"][data-size="lg"] [data-slot="number-field-input"])':
          "2.375rem",
      },
      ':is([data-slot="number-field"][data-size="sm"] [data-slot="number-field-input"])':
        "1.875rem",
      ':is([data-slot="number-field"][data-size="lg"] [data-slot="number-field-input"])':
        "2.375rem",
    },
    color: tokens["--foreground"],
    flexGrow: 1,
    fontVariantNumeric: "tabular-nums",
    inlineSize: "100%",
    lineHeight: {
      default: "2.125rem",
      "@media (min-width: 640px)": {
        default: "1.875rem",
        ':is([data-slot="number-field"][data-size="sm"] [data-slot="number-field-input"])':
          "1.875rem",
        ':is([data-slot="number-field"][data-size="lg"] [data-slot="number-field-input"])':
          "2.375rem",
      },
      ':is([data-slot="number-field"][data-size="sm"] [data-slot="number-field-input"])':
        "1.875rem",
      ':is([data-slot="number-field"][data-size="lg"] [data-slot="number-field-input"])':
        "2.375rem",
    },
    minInlineSize: 0,
    outline: "none",
    paddingInline: {
      default: "calc(0.75rem - 1px)",
      ':is([data-slot="number-field"][data-size="sm"] [data-slot="number-field-input"])':
        "calc(0.625rem - 1px)",
    },
    textAlign: "center",
  },
  scrubArea: {
    cursor: "ew-resize",
    display: "flex",
  },
  scrubLabel: {
    cursor: "ew-resize",
  },
  cursor: {
    filter: "drop-shadow(0 1px 1px #0008)",
  },
  icon: {
    blockSize: {
      default: "1.125rem",
      "@media (min-width: 640px)": "1rem",
    },
    inlineSize: {
      default: "1.125rem",
      "@media (min-width: 640px)": "1rem",
    },
    flexShrink: 0,
    pointerEvents: "none",
  },
})

export const NumberFieldContext: React.Context<{ fieldId: string } | null> =
  React.createContext<{ fieldId: string } | null>(null)

export function NumberField({
  xstyle,
  id,
  className,
  size = "default",
  ...props
}: NumberFieldPrimitive.Root.Props & {
  size?: "sm" | "default" | "lg"
} & StyleXProps) {
  const generatedId = React.useId()
  const fieldId = id ?? generatedId
  const contextValue = React.useMemo(() => ({ fieldId }), [fieldId])
  return (
    <NumberFieldContext.Provider value={contextValue}>
      <NumberFieldPrimitive.Root
        {...stylexProps(className, styles.root, xstyle)}
        data-size={size}
        data-slot="number-field"
        id={fieldId}
        {...props}
      />
    </NumberFieldContext.Provider>
  )
}
export function NumberFieldGroup({
  xstyle,
  className,
  ...props
}: NumberFieldPrimitive.Group.Props & StyleXProps) {
  return (
    <NumberFieldPrimitive.Group
      {...stylexProps(className, styles.group, xstyle)}
      data-slot="number-field-group"
      {...props}
    />
  )
}
export function NumberFieldDecrement({
  xstyle,
  className,
  ...props
}: NumberFieldPrimitive.Decrement.Props & StyleXProps) {
  return (
    <NumberFieldPrimitive.Decrement
      {...stylexProps(className, styles.stepper, styles.decrement, xstyle)}
      data-slot="number-field-decrement"
      {...props}
    >
      <MinusIcon {...stylex.props(styles.icon)} />
    </NumberFieldPrimitive.Decrement>
  )
}
export function NumberFieldIncrement({
  xstyle,
  className,
  ...props
}: NumberFieldPrimitive.Increment.Props & StyleXProps) {
  return (
    <NumberFieldPrimitive.Increment
      {...stylexProps(className, styles.stepper, styles.increment, xstyle)}
      data-slot="number-field-increment"
      {...props}
    >
      <PlusIcon {...stylex.props(styles.icon)} />
    </NumberFieldPrimitive.Increment>
  )
}
export function NumberFieldInput({
  xstyle,
  className,
  ...props
}: NumberFieldPrimitive.Input.Props & StyleXProps) {
  return (
    <NumberFieldPrimitive.Input
      {...stylexProps(className, styles.input, xstyle)}
      data-slot="number-field-input"
      {...props}
    />
  )
}
export function NumberFieldScrubArea({
  xstyle,
  className,
  label,
  ...props
}: NumberFieldPrimitive.ScrubArea.Props & { label: string } & StyleXProps) {
  const context = React.useContext(NumberFieldContext)
  if (!context)
    throw new Error(
      "NumberFieldScrubArea must be used within a NumberField component for accessibility.",
    )
  return (
    <NumberFieldPrimitive.ScrubArea
      {...stylexProps(className, styles.scrubArea, xstyle)}
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
