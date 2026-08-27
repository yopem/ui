"use client"

// oxlint-disable jsx-a11y/prefer-tag-over-role -- input-group uses div+role=group intentionally; fieldset semantics not appropriate

import type * as React from "react"

import { Input, type InputProps } from "@registry/components/ui/input"
import { Textarea, type TextareaProps } from "@registry/components/ui/textarea"
import { stylexProps } from "@registry/lib/stylex"
import { themeMarker } from "@registry/styles/markers.stylex"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"
import { clsx } from "clsx"

const styles = stylex.create({
  root: {
    alignItems: "center",
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
    display: "inline-flex",
    fontSize: { default: "1rem", "@media (min-width: 640px)": "0.875rem" },
    inlineSize: "100%",
    minInlineSize: 0,
    position: "relative",
    transitionProperty: "box-shadow",
  },
  addon: {
    alignItems: "center",
    blockSize: "auto",
    cursor: "text",
    display: "flex",
    gap: "0.5rem",
    justifyContent: "center",
    userSelect: "none",
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
  inlineEnd: { order: 1, paddingInlineEnd: "calc(0.75rem - 1px)" },
  inlineStart: { order: -1, paddingInlineStart: "calc(0.75rem - 1px)" },
  text: {
    alignItems: "center",
    color: tokens.mutedForeground,
    display: "flex",
    gap: "0.5rem",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
})

const alignStyles = {
  "block-end": styles.blockEnd,
  "block-start": styles.blockStart,
  "inline-end": styles.inlineEnd,
  "inline-start": styles.inlineStart,
} as const
function inputGroupAddonVariants({
  className,
  align = "inline-start",
}: { className?: string; align?: keyof typeof alignStyles } = {}) {
  return clsx(
    stylex.props(styles.addon, alignStyles[align]).className,
    className,
  )
}

export function InputGroup({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      {...stylexProps(className, styles.root)}
      data-slot="input-group"
      role="group"
      {...props}
    />
  )
}

export function InputGroupAddon({
  className,
  align = "inline-start",
  ...props
}: React.ComponentProps<"div"> & { align?: keyof typeof alignStyles }) {
  return (
    <div
      className={inputGroupAddonVariants({ className, align })}
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
  className,
  ...props
}: React.ComponentProps<"span">) {
  return <span {...stylexProps(className, styles.text)} {...props} />
}
export function InputGroupInput({ className, ...props }: InputProps) {
  return <Input className={className} unstyled {...props} />
}
export function InputGroupTextarea({ className, ...props }: TextareaProps) {
  return <Textarea className={className} unstyled {...props} />
}
