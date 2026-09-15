"use client"

// oxlint-disable jsx-a11y/prefer-tag-over-role -- input-group uses div+role=group intentionally; fieldset semantics not appropriate

import type { StyleXProps } from "@registry/lib/stylex"
import type * as React from "react"

import { Input, type InputProps } from "@registry/components/ui/input"
import { Textarea, type TextareaProps } from "@registry/components/ui/textarea"
import { stylexProps } from "@registry/lib/stylex"
import { themeMarker, tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  root: {
    alignItems: "center",
    backgroundClip: "padding-box",
    backgroundColor: {
      default: tokens["--background"],
      [stylex.when.ancestor('[data-theme="dark"]', themeMarker)]:
        "color-mix(in oklab, var(--input, currentColor) 32%, transparent)",
    },
    borderColor: {
      default: tokens["--input"],
      ":has(input:focus-visible, textarea:focus-visible)": tokens["--ring"],
      ':has( input[aria-invalid="true"], textarea[aria-invalid="true"] )':
        "color-mix( in oklab, var(--destructive, currentColor) 36%, transparent )",
      ':has(input[aria-invalid="true"], textarea[aria-invalid="true"]):has(input:focus-visible, textarea:focus-visible)':
        "color-mix(in oklab, var(--destructive, currentColor) 36%, transparent)",
    },
    borderRadius: tokens["--radius-lg"],
    borderStyle: "solid",
    borderWidth: 1,
    boxShadow: {
      default: "0 1px 2px color-mix(in oklab, #000 5%, transparent)",
      ":has(input:focus-visible, textarea:focus-visible)":
        "0 0 0 3px color-mix(in oklab, var(--ring, currentColor) 24%, transparent)",
      ":has(input:disabled, textarea:disabled)": "none",
    },
    color: tokens["--foreground"],
    display: "inline-flex",
    fontSize: {
      default: "1rem",
      "@media (min-width: 640px)": "0.875rem",
    },
    inlineSize: "100%",
    minInlineSize: 0,
    position: "relative",
    transitionProperty: "box-shadow",
    opacity: {
      default: null,
      ":has(input:disabled, textarea:disabled)": 0.64,
    },
    flexDirection: {
      default: null,
      ':has( [data-align="block-start"], [data-align="block-end"] )': "column",
    },
    lineHeight: {
      default: null,
      ':is([data-slot="group"] *)': "1.5rem",
      "@media (min-width: 640px)": {
        default: null,
        ':is([data-slot="group"] *)': "1.25rem",
      },
    },
  },
  addon: {
    alignItems: "center",
    blockSize: "auto",
    cursor: "text",
    display: "flex",
    gap: "0.5rem",
    justifyContent: "center",
    userSelect: "none",
    marginInlineEnd: {
      default: null,
      ':is([data-slot="group"] [data-slot="input-group"] > [data-align="inline-end"]:has(> button))':
        "-0.5rem",
    },
  },
  blockEnd: {
    inlineSize: "100%",
    justifyContent: "start",
    order: 1,
    paddingBlockEnd: "calc(0.75rem - 1px)",
    paddingInline: "calc(0.75rem - 1px)",
  },
  blockStart: {
    inlineSize: "100%",
    justifyContent: "start",
    order: -1,
    paddingBlockStart: "calc(0.75rem - 1px)",
    paddingInline: "calc(0.75rem - 1px)",
  },
  inlineEnd: {
    order: 1,
    paddingInlineEnd: "calc(0.75rem - 1px)",
  },
  inlineStart: {
    order: -1,
    paddingInlineStart: "calc(0.75rem - 1px)",
  },
  text: {
    alignItems: "center",
    color: tokens["--muted-foreground"],
    display: "flex",
    gap: "0.5rem",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  textarea: {
    minBlockSize: "5.125rem",
    resize: "none",
  },
  control: {
    display: "contents",
  },
})

const alignStyles = {
  "block-end": styles.blockEnd,
  "block-start": styles.blockStart,
  "inline-end": styles.inlineEnd,
  "inline-start": styles.inlineStart,
} as const

export function InputGroup({
  xstyle,
  className,
  ...props
}: React.ComponentProps<"div"> & StyleXProps) {
  return (
    <div
      {...stylexProps(className, styles.root, xstyle)}
      data-slot="input-group"
      role="group"
      {...props}
    />
  )
}

export function InputGroupAddon({
  xstyle,
  className,
  align = "inline-start",
  ...props
}: React.ComponentProps<"div"> & {
  align?: keyof typeof alignStyles
} & StyleXProps) {
  return (
    <div
      {...stylexProps(className, styles.addon, alignStyles[align], xstyle)}
      data-align={align}
      data-slot="input-group-addon"
      role="presentation"
      onMouseDown={(event: React.MouseEvent<HTMLDivElement>) => {
        const target = event.target as HTMLElement
        if (
          target.closest(
            "button, a, input, select, textarea, [role='button'], [role='combobox'], [role='listbox'], [data-slot='select-trigger']",
          )
        )
          return
        event.preventDefault()
        const parent = event.currentTarget.parentElement
        const input = parent?.querySelector<
          HTMLInputElement | HTMLTextAreaElement
        >("input, textarea")
        if (input && !parent?.querySelector("input:focus, textarea:focus"))
          input.focus()
      }}
      {...props}
    />
  )
}

export function InputGroupText({
  xstyle,
  className,
  ...props
}: React.ComponentProps<"span"> & StyleXProps) {
  return (
    <span
      {...stylexProps(className, styles.text, xstyle)}
      data-slot="input-group-text"
      {...props}
    />
  )
}
export function InputGroupInput({
  xstyle,
  controlXstyle,
  className,
  ...props
}: InputProps & StyleXProps) {
  return (
    <Input
      className={className}
      controlXstyle={[styles.control, controlXstyle]}
      data-slot="input-group-input"
      xstyle={xstyle}
      unstyled
      {...props}
    />
  )
}
export function InputGroupTextarea({
  xstyle,
  controlXstyle,
  className,
  ...props
}: TextareaProps & StyleXProps) {
  return (
    <Textarea
      className={className}
      controlXstyle={[styles.control, controlXstyle]}
      data-slot="input-group-textarea"
      xstyle={[styles.textarea, xstyle]}
      unstyled
      {...props}
    />
  )
}
