"use client"

import { Toggle as TogglePrimitive } from "@base-ui/react/toggle"
import { themeMarker } from "@registry/styles/markers.stylex"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"
import { clsx } from "clsx"

const styles = stylex.create({
  root: {
    alignItems: "center",
    borderRadius: tokens.radiusLarge,
    borderStyle: "solid",
    borderWidth: 1,
    color: tokens.foreground,
    cursor: "pointer",
    display: "inline-flex",
    flexShrink: 0,
    fontSize: { default: "1rem", "@media (min-width: 640px)": "0.875rem" },
    fontWeight: 500,
    gap: "0.5rem",
    justifyContent: "center",
    outline: "none",
    position: "relative",
    transitionProperty: "box-shadow",
    userSelect: "none",
    whiteSpace: "nowrap",
    backgroundColor: {
      default: "transparent",
      ":hover": tokens.accent,
      "[data-pressed]":
        "color-mix(in oklab, var(--input, currentColor) 64%, transparent)",
    },
    ":focus-visible": {
      boxShadow: `0 0 0 2px ${tokens.ring}, 0 0 0 3px ${tokens.background}`,
    },
    ":disabled": { opacity: 0.64, pointerEvents: "none" },
  },
  sizeDefault: {
    blockSize: { default: "2.25rem", "@media (min-width: 640px)": "2rem" },
    minInlineSize: { default: "2.25rem", "@media (min-width: 640px)": "2rem" },
    paddingInline: "calc(0.5rem - 1px)",
  },
  sizeLarge: {
    blockSize: { default: "2.5rem", "@media (min-width: 640px)": "2.25rem" },
    minInlineSize: {
      default: "2.5rem",
      "@media (min-width: 640px)": "2.25rem",
    },
    paddingInline: "calc(0.625rem - 1px)",
  },
  sizeSmall: {
    blockSize: { default: "2rem", "@media (min-width: 640px)": "1.75rem" },
    minInlineSize: { default: "2rem", "@media (min-width: 640px)": "1.75rem" },
    paddingInline: "calc(0.375rem - 1px)",
  },
  default: { borderColor: "transparent" },
  outline: {
    backgroundColor: {
      default: tokens.background,
      [stylex.when.ancestor('[data-theme="dark"]', themeMarker)]:
        "color-mix(in oklab, var(--input, currentColor) 32%, transparent)",
      ":hover": tokens.accent,
      "[data-pressed]":
        "color-mix(in oklab, var(--input, currentColor) 64%, transparent)",
    },
    borderColor: tokens.input,
    boxShadow: "0 1px 2px color-mix(in oklab, #000 5%, transparent)",
  },
})

const sizeStyles = {
  default: styles.sizeDefault,
  lg: styles.sizeLarge,
  sm: styles.sizeSmall,
} as const
const variantStyles = {
  default: styles.default,
  outline: styles.outline,
} as const
export interface ToggleVariantProps {
  className?: string
  size?: keyof typeof sizeStyles
  variant?: keyof typeof variantStyles
}
export function toggleVariants({
  className,
  size = "default",
  variant = "default",
}: ToggleVariantProps = {}) {
  return clsx(
    stylex.props(styles.root, sizeStyles[size], variantStyles[variant])
      .className,
    className,
  )
}
export function Toggle({
  className,
  variant,
  size,
  ...props
}: TogglePrimitive.Props & ToggleVariantProps) {
  return (
    <TogglePrimitive
      className={toggleVariants({ className, size, variant })}
      data-slot="toggle"
      {...props}
    />
  )
}
export { TogglePrimitive }
