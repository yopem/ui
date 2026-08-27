"use client"

import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { themeMarker } from "@registry/styles/markers.stylex"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"
import { clsx } from "clsx"

const styles = stylex.create({
  root: {
    alignItems: "center",
    borderColor: "transparent",
    borderRadius: tokens.radiusSmall,
    borderStyle: "solid",
    borderWidth: 1,
    display: "inline-flex",
    flexShrink: 0,
    fontWeight: 500,
    gap: "0.25rem",
    justifyContent: "center",
    outline: "none",
    position: "relative",
    transitionProperty: "box-shadow",
    whiteSpace: "nowrap",
    ":disabled": { opacity: 0.64, pointerEvents: "none" },
    ":focus-visible": {
      boxShadow: `0 0 0 2px ${tokens.ring}, 0 0 0 3px ${tokens.background}`,
    },
  },
  sizeDefault: {
    blockSize: { default: "1.375rem", "@media (min-width: 640px)": "1.125rem" },
    fontSize: { default: "0.875rem", "@media (min-width: 640px)": "0.75rem" },
    lineHeight: { default: "1.25rem", "@media (min-width: 640px)": "1rem" },
    minInlineSize: {
      default: "1.375rem",
      "@media (min-width: 640px)": "1.125rem",
    },
    paddingInline: "calc(0.25rem - 1px)",
  },
  sizeLarge: {
    blockSize: { default: "1.625rem", "@media (min-width: 640px)": "1.375rem" },
    fontSize: { default: "1rem", "@media (min-width: 640px)": "0.875rem" },
    lineHeight: {
      default: "1.5rem",
      "@media (min-width: 640px)": "1.25rem",
    },
    minInlineSize: {
      default: "1.625rem",
      "@media (min-width: 640px)": "1.375rem",
    },
    paddingInline: "calc(0.375rem - 1px)",
  },
  sizeSmall: {
    blockSize: { default: "1.25rem", "@media (min-width: 640px)": "1rem" },
    borderRadius: "0.25rem",
    fontSize: { default: "0.75rem", "@media (min-width: 640px)": "0.625rem" },
    lineHeight: {
      default: "1rem",
      "@media (min-width: 640px)": "calc(1 / 0.75)",
    },
    minInlineSize: { default: "1.25rem", "@media (min-width: 640px)": "1rem" },
    paddingInline: "calc(0.25rem - 1px)",
  },
  default: { backgroundColor: tokens.primary, color: tokens.primaryForeground },
  destructive: { backgroundColor: tokens.destructive, color: "#fff" },
  error: {
    backgroundColor: {
      default:
        "color-mix(in oklab, var(--destructive, currentColor) 8%, transparent)",
      [stylex.when.ancestor('[data-theme="dark"]', themeMarker)]:
        "color-mix(in oklab, var(--destructive, currentColor) 16%, transparent)",
    },
    color: tokens.destructiveForeground,
  },
  info: {
    backgroundColor: {
      default: "color-mix(in oklab, var(--info, currentColor) 8%, transparent)",
      [stylex.when.ancestor('[data-theme="dark"]', themeMarker)]:
        "color-mix(in oklab, var(--info, currentColor) 16%, transparent)",
    },
    color: tokens.infoForeground,
  },
  outline: {
    backgroundColor: {
      default: tokens.background,
      [stylex.when.ancestor('[data-theme="dark"]', themeMarker)]:
        "color-mix(in oklab, var(--input, currentColor) 32%, transparent)",
    },
    borderColor: tokens.input,
    color: tokens.foreground,
  },
  secondary: {
    backgroundColor: tokens.secondary,
    color: tokens.secondaryForeground,
  },
  success: {
    backgroundColor: {
      default:
        "color-mix(in oklab, var(--success, currentColor) 8%, transparent)",
      [stylex.when.ancestor('[data-theme="dark"]', themeMarker)]:
        "color-mix(in oklab, var(--success, currentColor) 16%, transparent)",
    },
    color: tokens.successForeground,
  },
  warning: {
    backgroundColor: {
      default:
        "color-mix(in oklab, var(--warning, currentColor) 8%, transparent)",
      [stylex.when.ancestor('[data-theme="dark"]', themeMarker)]:
        "color-mix(in oklab, var(--warning, currentColor) 16%, transparent)",
    },
    color: tokens.warningForeground,
  },
})

const sizeStyles = {
  default: styles.sizeDefault,
  lg: styles.sizeLarge,
  sm: styles.sizeSmall,
} as const
const variantStyles = {
  default: styles.default,
  destructive: styles.destructive,
  error: styles.error,
  info: styles.info,
  outline: styles.outline,
  secondary: styles.secondary,
  success: styles.success,
  warning: styles.warning,
} as const

interface BadgeVariantProps {
  className?: string
  size?: keyof typeof sizeStyles
  variant?: keyof typeof variantStyles
}

export function badgeVariants({
  className,
  size = "default",
  variant = "default",
}: BadgeVariantProps = {}) {
  return clsx(
    stylex.props(styles.root, sizeStyles[size], variantStyles[variant])
      .className,
    className,
  )
}

export interface BadgeProps extends useRender.ComponentProps<"span"> {
  variant?: BadgeVariantProps["variant"]
  size?: BadgeVariantProps["size"]
}

export function Badge({
  className,
  variant,
  size,
  render,
  ...props
}: BadgeProps) {
  const defaultProps = {
    className: badgeVariants({ className, size, variant }),
    "data-size": size ?? "default",
    "data-slot": "badge",
    "data-variant": variant ?? "default",
  }
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(defaultProps, props),
    render,
  })
}
