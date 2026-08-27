"use client"

import type * as React from "react"

import { OTPField as OTPFieldPrimitive } from "@base-ui/react/otp-field"
import { Separator } from "@registry/components/ui/separator"
import { stylexProps } from "@registry/lib/stylex"
import { themeMarker } from "@registry/styles/markers.stylex"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  root: {
    alignItems: "center",
    display: "flex",
    gap: "0.5rem",
    opacity: {
      default: 1,
      [stylex.when.descendant(":disabled")]: 0.64,
    },
  },
  defaultSize: {
    "--otp-field-input-font-size": {
      default: "1rem",
      "@media (min-width: 640px)": "0.875rem",
    },
    "--otp-field-input-size": {
      default: "2.25rem",
      "@media (min-width: 640px)": "2rem",
    },
  },
  largeSize: {
    "--otp-field-input-font-size": {
      default: "1.125rem",
      "@media (min-width: 640px)": "1rem",
    },
    "--otp-field-input-size": {
      default: "2.5rem",
      "@media (min-width: 640px)": "2.25rem",
    },
  },
  input: {
    backgroundClip: {
      default: "padding-box",
      [stylex.when.ancestor('[data-theme="dark"]', themeMarker)]: "border-box",
    },
    backgroundColor: {
      default: tokens.background,
      [stylex.when.ancestor('[data-theme="dark"]', themeMarker)]:
        "color-mix(in oklab, var(--input, currentColor) 32%, transparent)",
    },
    blockSize: "var(--otp-field-input-size)",
    borderColor: {
      default: tokens.input,
      ":focus-visible": tokens.ring,
      "[aria-invalid]":
        "color-mix(in oklab, var(--destructive, currentColor) 36%, transparent)",
      ":focus-visible[aria-invalid]":
        "color-mix(in oklab, var(--destructive, currentColor) 64%, transparent)",
    },
    borderRadius: tokens.radiusLarge,
    borderStyle: "solid",
    borderWidth: 1,
    boxShadow: {
      default: "var(--button-outline-shadow)",
      ":disabled": "none",
      ":focus-visible":
        "0 0 0 3px color-mix(in oklab, var(--ring, currentColor) 24%, transparent)",
      "[aria-invalid]": "none",
      ":focus-visible[aria-invalid]": {
        default:
          "0 0 0 3px color-mix(in oklab, var(--destructive, currentColor) 16%, transparent)",
        [stylex.when.ancestor('[data-theme="dark"]', themeMarker)]:
          "0 0 0 3px color-mix(in oklab, var(--destructive, currentColor) 24%, transparent)",
      },
    },
    color: tokens.foreground,
    fontSize: "var(--otp-field-input-font-size) !important",
    inlineSize: "var(--otp-field-input-size)",
    lineHeight: "var(--otp-field-input-size) !important",
    minInlineSize: 0,
    outline: "none",
    position: "relative",
    textAlign: "center",
    transitionProperty: "box-shadow",
    zIndex: { default: "auto", ":focus-visible": 10 },
    "::before": {
      borderRadius: "calc(var(--radius-lg) - 1px)",
      boxShadow: {
        default: "var(--button-outline-inset-shadow)",
        [stylex.when.ancestor('[data-theme="dark"]', themeMarker)]:
          "var(--button-outline-inset-shadow-dark)",
        [stylex.when.ancestor(":disabled")]: "none",
        [stylex.when.ancestor(":focus-visible")]: "none",
        [stylex.when.ancestor("[aria-invalid]")]: "none",
      },
      content: '""',
      inset: 0,
      pointerEvents: "none",
      position: "absolute",
    },
  },
  separator: {
    backgroundColor: tokens.input,
    blockSize: "0.125rem !important",
    borderRadius: "9999px",
    inlineSize: "0.75rem !important",
  },
})

export function OTPField({
  className,
  size = "default",
  ...props
}: React.ComponentProps<typeof OTPFieldPrimitive.Root> & {
  size?: "default" | "lg"
}) {
  return (
    <OTPFieldPrimitive.Root
      {...stylexProps(
        className,
        styles.root,
        size === "lg" ? styles.largeSize : styles.defaultSize,
      )}
      data-size={size}
      data-slot="otp-field"
      {...props}
    />
  )
}
export function OTPFieldInput({
  className,
  ...props
}: React.ComponentProps<typeof OTPFieldPrimitive.Input>) {
  return (
    <OTPFieldPrimitive.Input
      {...stylexProps(className, styles.input)}
      data-slot="otp-field-input"
      spellCheck={false}
      {...props}
    />
  )
}
export function OTPFieldSeparator({
  className,
  ...props
}: React.ComponentProps<typeof Separator>) {
  return (
    <OTPFieldPrimitive.Separator
      render={
        <Separator
          {...stylexProps(className, styles.separator)}
          orientation="horizontal"
          {...props}
        />
      }
    />
  )
}
export { OTPFieldPrimitive }
