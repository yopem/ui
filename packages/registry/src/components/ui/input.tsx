"use client"

import type * as React from "react"

import { Input as InputPrimitive } from "@base-ui/react/input"
import { stylexProps } from "@registry/lib/stylex"
import { themeMarker } from "@registry/styles/markers.stylex"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  control: {
    backgroundClip: "padding-box",
    backgroundColor: {
      default: "var(--input-control-background, var(--background))",
      [stylex.when.ancestor('[data-theme="dark"]', themeMarker)]:
        "var(--input-control-background, color-mix(in oklab, var(--input, currentColor) 32%, transparent))",
    },
    borderColor: "var(--input-control-border, var(--input))",
    borderRadius: "var(--radius-lg)",
    borderStyle: "solid",
    borderWidth: 1,
    boxShadow: {
      default: "var(--input-control-shadow, var(--button-outline-shadow))",
      [stylex.when.descendant(":disabled")]: "none",
      [stylex.when.descendant(":focus-visible")]:
        "0 0 0 3px color-mix(in oklab, var(--ring, currentColor) 24%, transparent)",
      [stylex.when.descendant("[aria-invalid]")]: "none",
      [stylex.when.descendant(":focus-visible[aria-invalid]")]:
        "0 0 0 3px color-mix(in oklab, var(--destructive, currentColor) 16%, transparent)",
    },
    display: "inline-flex",
    fontSize: { default: "1rem", "@media (min-width: 640px)": "0.875rem" },
    inlineSize: "100%",
    lineHeight: {
      default: "1.5rem",
      "@media (min-width: 640px)": "1.25rem",
    },
    opacity: {
      default: 1,
      [stylex.when.descendant(":disabled")]: 0.64,
    },
    position: "relative",
    transitionProperty: "box-shadow",
    "::before": {
      borderRadius: "calc(var(--radius-lg) - 1px)",
      boxShadow: {
        default:
          "var(--input-control-inset-shadow, var(--button-outline-inset-shadow))",
        [stylex.when.ancestor('[data-theme="dark"]', themeMarker)]:
          "var(--input-control-inset-shadow, var(--button-outline-inset-shadow-dark))",
        [stylex.when.descendant(":disabled")]: "none",
        [stylex.when.descendant(":focus-visible")]: "none",
        [stylex.when.descendant("[aria-invalid]")]: "none",
      },
      content: '""',
      display: "var(--input-control-before-display, block)",
      inset: 0,
      pointerEvents: "none",
      position: "absolute",
    },
  },
  input: {
    blockSize: { default: "2.125rem", "@media (min-width: 640px)": "1.875rem" },
    borderRadius: "inherit",
    color: tokens.foreground,
    inlineSize: "100%",
    lineHeight: {
      default: "2.125rem",
      "@media (min-width: 640px)": "1.875rem",
    },
    minInlineSize: 0,
    outline: "none",
    paddingInline: "calc(0.75rem - 1px)",
    transition: "background-color 5000000s ease-in-out 0s",
    "::placeholder": {
      color:
        "color-mix(in oklab, var(--muted-foreground, currentColor) 72%, transparent)",
    },
  },
  small: {
    blockSize: { default: "1.875rem", "@media (min-width: 640px)": "1.625rem" },
    lineHeight: {
      default: "1.875rem",
      "@media (min-width: 640px)": "1.625rem",
    },
    paddingInline: "calc(0.625rem - 1px)",
  },
  large: {
    blockSize: { default: "2.375rem", "@media (min-width: 640px)": "2.125rem" },
    lineHeight: {
      default: "2.375rem",
      "@media (min-width: 640px)": "2.125rem",
    },
  },
  search: {
    "::-webkit-search-cancel-button": { appearance: "none" },
    "::-webkit-search-decoration": { appearance: "none" },
    "::-webkit-search-results-button": { appearance: "none" },
    "::-webkit-search-results-decoration": { appearance: "none" },
  },
  file: {
    color: tokens.mutedForeground,
    "::file-selector-button": {
      backgroundColor: "transparent",
      borderStyle: "solid",
      borderWidth: 0,
      color: tokens.foreground,
      fontFamily: "inherit",
      fontSize: "0.875rem",
      fontWeight: 500,
      letterSpacing: "inherit",
      lineHeight: "inherit",
      marginInlineEnd: "0.75rem",
      padding: 0,
    },
  },
})

export type InputProps = Omit<
  InputPrimitive.Props & React.RefAttributes<HTMLInputElement>,
  "size"
> & {
  size?: "sm" | "default" | "lg" | number
  unstyled?: boolean
  nativeInput?: boolean
}

export function Input({
  className,
  size = "default",
  unstyled = false,
  nativeInput = false,
  style,
  ...props
}: InputProps) {
  const sizeStyle =
    size === "sm" ? styles.small : size === "lg" ? styles.large : null
  const inputClassName = stylex.props(
    styles.input,
    sizeStyle,
    props.type === "search" && styles.search,
    props.type === "file" && styles.file,
    stylex.defaultMarker(),
  ).className
  const wrapperClassName = typeof className === "string" ? className : undefined
  return (
    <span
      {...(unstyled
        ? { className: wrapperClassName }
        : stylexProps(wrapperClassName, styles.control))}
      data-size={size}
      data-slot="input-control"
    >
      {nativeInput ? (
        <input
          className={inputClassName}
          data-slot="input"
          size={typeof size === "number" ? size : undefined}
          style={typeof style === "function" ? undefined : style}
          {...props}
        />
      ) : (
        <InputPrimitive
          className={inputClassName}
          data-slot="input"
          size={typeof size === "number" ? size : undefined}
          style={style}
          {...props}
        />
      )}
    </span>
  )
}

export { InputPrimitive }
