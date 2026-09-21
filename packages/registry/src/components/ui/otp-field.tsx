"use client"

import type { StyleComponentProps } from "@registry/lib/style-props"
import type * as React from "react"

import { OTPField as OTPFieldPrimitive } from "@base-ui/react/otp-field"
import { Separator } from "@registry/components/ui/separator"
import { splitStyleProps } from "@registry/lib/style-props"
import { mergeStyleProps, stylexProps } from "@registry/lib/stylex"
import { themeMarker, tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  root: {
    alignItems: "center",
    display: "flex",
    gap: "0.5rem",
    opacity: {
      default: 1,
      ":has(:disabled)": 0.64,
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
      default: tokens["--background"],
      [stylex.when.ancestor('[data-theme="dark"]', themeMarker)]:
        "color-mix(in oklab, var(--input, currentColor) 32%, transparent)",
    },
    blockSize: {
      default: "var(--otp-field-input-size)",
      ':is([data-slot="otp-field"][data-size="lg"] [data-slot="otp-field-input"])':
        "2.5rem",
    },
    borderColor: {
      default: tokens["--input"],
      ":focus-visible": tokens["--ring"],
      '[aria-invalid="true"]':
        "color-mix(in oklab, var(--destructive, currentColor) 36%, transparent)",
      ':focus-visible[aria-invalid="true"]':
        "color-mix(in oklab, var(--destructive, currentColor) 64%, transparent)",
    },
    borderRadius: tokens["--radius-lg"],
    borderStyle: "solid",
    borderWidth: 1,
    boxShadow: {
      default: "var(--button-outline-shadow)",
      ":disabled": "none",
      ":focus-visible":
        "0 0 0 3px color-mix(in oklab, var(--ring, currentColor) 24%, transparent)",
      '[aria-invalid="true"]': "none",
      ':focus-visible[aria-invalid="true"]': {
        default:
          "0 0 0 3px color-mix(in oklab, var(--destructive, currentColor) 16%, transparent)",
        [stylex.when.ancestor('[data-theme="dark"]', themeMarker)]:
          "0 0 0 3px color-mix(in oklab, var(--destructive, currentColor) 24%, transparent)",
      },
    },
    color: tokens["--foreground"],
    fontSize: "var(--otp-field-input-font-size)",
    inlineSize: {
      default: "var(--otp-field-input-size)",
      ':is([data-slot="otp-field"][data-size="lg"] [data-slot="otp-field-input"])':
        "2.5rem",
    },
    lineHeight: "var(--otp-field-input-size)",
    minInlineSize: 0,
    outline: "none",
    position: "relative",
    textAlign: "center",
    transitionProperty: "box-shadow",
    zIndex: {
      default: "auto",
      ":focus-visible": 10,
    },
    "::before": {
      borderRadius: "calc(var(--radius-lg) - 1px)",
      boxShadow: {
        default: "var(--button-outline-inset-shadow)",
        [stylex.when.ancestor('[data-theme="dark"]', themeMarker)]:
          "var(--button-outline-inset-shadow-dark)",
        ":disabled": "none",
        ":focus-visible": "none",
        '[aria-invalid="true"]': "none",
      },
      content: '""',
      inset: 0,
      pointerEvents: "none",
      position: "absolute",
    },
  },
  separator: {
    backgroundColor: tokens["--input"],
    blockSize: "0.125rem",
    borderRadius: "9999px",
    inlineSize: "0.75rem",
  },
})

export function OTPField({
  xstyle: consumerXstyle,
  className,
  size = "default",
  mask,
  ...restProps
}: StyleComponentProps<
  React.ComponentProps<typeof OTPFieldPrimitive.Root>,
  {
    size?: "default" | "lg"
    mask?: React.ComponentProps<typeof OTPFieldPrimitive.Root>["mask"]
  }
>) {
  const { domProps: props, xstyle: styleProps } = splitStyleProps(restProps)
  const xstyle = [styleProps, consumerXstyle]

  return (
    <OTPFieldPrimitive.Root
      data-size={size}
      data-slot="otp-field"
      mask={mask}
      {...mergeStyleProps(
        stylexProps(
          className,
          styles.root,
          size === "lg" ? styles.largeSize : styles.defaultSize,
          xstyle,
        ),
        props,
      )}
    />
  )
}
export function OTPFieldInput({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleComponentProps<React.ComponentProps<typeof OTPFieldPrimitive.Input>>) {
  const { domProps: props, xstyle: styleProps } = splitStyleProps(restProps)
  const xstyle = [styleProps, consumerXstyle]

  return (
    <OTPFieldPrimitive.Input
      data-slot="otp-field-input"
      spellCheck={false}
      {...mergeStyleProps(stylexProps(className, styles.input, xstyle), props)}
    />
  )
}
export function OTPFieldSeparator({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleComponentProps<React.ComponentProps<typeof Separator>>) {
  const { domProps: props, xstyle: styleProps } = splitStyleProps(restProps)
  const xstyle = [styleProps, consumerXstyle]

  return (
    <OTPFieldPrimitive.Separator
      render={
        <Separator
          className={className}
          xstyle={[styles.separator, xstyle]}
          orientation="horizontal"
          {...props}
        />
      }
    />
  )
}
export { OTPFieldPrimitive }
