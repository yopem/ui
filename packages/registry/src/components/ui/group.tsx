"use client"

// oxlint-disable jsx-a11y/prefer-tag-over-role -- Button group uses div+role=group for styling; fieldset not appropriate

import type * as React from "react"

import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { Separator } from "@registry/components/ui/separator"
import { themeMarker } from "@registry/styles/markers.stylex"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"
import { clsx } from "clsx"

const styles = stylex.create({
  root: { display: "flex", inlineSize: "fit-content" },
  horizontal: { flexDirection: "row" },
  vertical: { flexDirection: "column" },
  text: {
    alignItems: "center",
    backgroundClip: {
      default: "padding-box",
      [stylex.when.ancestor('[data-theme="dark"]', themeMarker)]: "border-box",
    },
    backgroundColor: {
      default: tokens.muted,
      [stylex.when.ancestor('[data-theme="dark"]', themeMarker)]:
        "color-mix(in oklab, var(--input, currentColor) 64%, transparent)",
    },
    borderColor: tokens.input,
    borderRadius: tokens.radiusLarge,
    borderStyle: "solid",
    borderWidth: 1,
    color: tokens.mutedForeground,
    display: "inline-flex",
    fontSize: { default: "1rem", "@media (min-width: 640px)": "0.875rem" },
    lineHeight: { default: "1.5rem", "@media (min-width: 640px)": "1.25rem" },
    boxShadow: "0 1px 2px color-mix(in oklab, #000 5%, transparent)",
    gap: "0.5rem",
    outline: "none",
    paddingInline: "calc(0.75rem - 1px)",
    position: "relative",
    transitionProperty: "box-shadow",
    whiteSpace: "nowrap",
    "::before": {
      borderRadius: "calc(var(--radius-lg) - 1px)",
      boxShadow: {
        default: "0 1px color-mix(in oklab, #000 6%, transparent)",
        [stylex.when.ancestor('[data-theme="dark"]', themeMarker)]:
          "0 -1px color-mix(in oklab, #fff 6%, transparent)",
      },
      content: '""',
      inset: 0,
      pointerEvents: "none",
      position: "absolute",
    },
  },
  separator: {
    backgroundColor: tokens.input,
    pointerEvents: "none",
    position: "relative",
    zIndex: 2,
    "::before": {
      backgroundColor: {
        default: "transparent",
        [stylex.when.ancestor('[data-theme="dark"]', themeMarker)]:
          "color-mix(in oklab, var(--input, currentColor) 32%, transparent)",
      },
      content: '""',
      inset: 0,
      position: "absolute",
    },
  },
})

const orientationStyles = {
  horizontal: styles.horizontal,
  vertical: styles.vertical,
} as const
export function groupVariants({
  className,
  orientation = "horizontal",
}: { className?: string; orientation?: keyof typeof orientationStyles } = {}) {
  return clsx(
    stylex.props(styles.root, orientationStyles[orientation]).className,
    className,
  )
}

export function Group({
  className,
  orientation = "horizontal",
  children,
  ...props
}: {
  className?: string
  orientation?: keyof typeof orientationStyles
  children: React.ReactNode
} & React.ComponentProps<"div">) {
  return (
    <div
      className={groupVariants({ className, orientation })}
      data-orientation={orientation}
      data-slot="group"
      role="group"
      {...props}
    >
      {children}
    </div>
  )
}

export function GroupText({
  className,
  render,
  ...props
}: useRender.ComponentProps<"div">) {
  const defaultProps = {
    className: clsx(stylex.props(styles.text).className, className),
    "data-slot": "group-text",
  }
  return useRender({
    defaultTagName: "div",
    props: mergeProps(defaultProps, props),
    render,
  })
}

export function GroupSeparator({
  className,
  orientation = "vertical",
  ...props
}: { className?: string } & React.ComponentProps<typeof Separator>) {
  return (
    <Separator
      className={clsx(stylex.props(styles.separator).className, className)}
      orientation={orientation}
      {...props}
    />
  )
}

export {
  Group as ButtonGroup,
  GroupText as ButtonGroupText,
  GroupSeparator as ButtonGroupSeparator,
}
