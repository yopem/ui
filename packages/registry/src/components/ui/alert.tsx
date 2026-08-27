import type * as React from "react"

import { stylexProps } from "@registry/lib/stylex"
import { themeMarker } from "@registry/styles/markers.stylex"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"
import { clsx } from "clsx"

const styles = stylex.create({
  root: {
    alignItems: "start",
    borderColor: tokens.border,
    borderRadius: tokens.radiusXLarge,
    borderStyle: "solid",
    borderWidth: 1,
    color: tokens.cardForeground,
    columnGap: "0.5rem",
    display: "grid",
    fontSize: "0.875rem",
    gridTemplateColumns: "1fr",
    lineHeight: "1.25rem",
    paddingBlock: "0.75rem",
    paddingInline: "0.875rem",
    position: "relative",
    rowGap: "0.125rem",
    width: "100%",
  },
  default: {
    backgroundColor: {
      default: "transparent",
      [stylex.when.ancestor('[data-theme="dark"]', themeMarker)]:
        "color-mix(in oklab, var(--input, currentColor) 32%, transparent)",
    },
  },
  error: {
    backgroundColor:
      "color-mix(in oklab, var(--destructive, currentColor) 4%, transparent)",
    borderColor:
      "color-mix(in oklab, var(--destructive, currentColor) 32%, transparent)",
  },
  info: {
    backgroundColor:
      "color-mix(in oklab, var(--info, currentColor) 4%, transparent)",
    borderColor:
      "color-mix(in oklab, var(--info, currentColor) 32%, transparent)",
  },
  success: {
    backgroundColor:
      "color-mix(in oklab, var(--success, currentColor) 4%, transparent)",
    borderColor:
      "color-mix(in oklab, var(--success, currentColor) 32%, transparent)",
  },
  warning: {
    backgroundColor:
      "color-mix(in oklab, var(--warning, currentColor) 4%, transparent)",
    borderColor:
      "color-mix(in oklab, var(--warning, currentColor) 32%, transparent)",
  },
  title: { fontWeight: 500 },
  description: {
    color: tokens.mutedForeground,
    display: "flex",
    flexDirection: "column",
    gap: "0.625rem",
  },
  action: {
    display: "flex",
    gap: "0.25rem",
    marginBlockStart: { default: "0.5rem", "@media (min-width: 640px)": 0 },
    alignSelf: { default: "auto", "@media (min-width: 640px)": "center" },
  },
})

const variantStyles = {
  default: styles.default,
  error: styles.error,
  info: styles.info,
  success: styles.success,
  warning: styles.warning,
} as const

type AlertVariant = keyof typeof variantStyles

function alertVariants({
  className,
  variant = "default",
}: { className?: string; variant?: AlertVariant } = {}) {
  return clsx(
    stylex.props(styles.root, variantStyles[variant]).className,
    className,
  )
}

export function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & { variant?: AlertVariant }) {
  return (
    <div
      className={alertVariants({ className, variant })}
      data-slot="alert"
      data-variant={variant ?? "default"}
      role="alert"
      {...props}
    />
  )
}

export function AlertTitle({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      {...stylexProps(className, styles.title)}
      data-slot="alert-title"
      {...props}
    />
  )
}

export function AlertDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      {...stylexProps(className, styles.description)}
      data-slot="alert-description"
      {...props}
    />
  )
}

export function AlertAction({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      {...stylexProps(className, styles.action)}
      data-slot="alert-action"
      {...props}
    />
  )
}
