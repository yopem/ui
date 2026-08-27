"use client"

import type * as React from "react"

import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { Spinner } from "@registry/components/ui/spinner"
import { themeMarker } from "@registry/styles/markers.stylex"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"
import { clsx } from "clsx"

const styles = stylex.create({
  root: {
    alignItems: "center",
    borderStyle: "solid",
    borderWidth: 1,
    cursor: {
      default: "pointer",
      ":disabled": "default",
    },
    display: "inline-flex",
    flexShrink: 0,
    fontFamily: tokens.fontSans,
    fontSize: {
      default: "1rem",
      "@media (min-width: 640px)": "0.875rem",
    },
    fontWeight: 500,
    gap: "0.5rem",
    justifyContent: "center",
    lineHeight: {
      default: "1.5rem",
      "@media (min-width: 640px)": "1.25rem",
    },
    opacity: {
      default: 1,
      ":disabled": 0.64,
    },
    outline: "none",
    pointerEvents: {
      default: "auto",
      ":disabled": "none",
    },
    position: "relative",
    transitionDuration: "150ms",
    transitionProperty: "box-shadow",
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    whiteSpace: "nowrap",
    "[data-loading]": {
      color: "transparent",
      userSelect: "none",
    },
    ":focus-visible": {
      boxShadow: "0 0 0 1px var(--background), 0 0 0 3px var(--ring)",
    },
    "::before": {
      borderRadius: "var(--button-inner-radius, calc(var(--radius-lg) - 1px))",
      content: '""',
      inset: 0,
      pointerEvents: "none",
      position: "absolute",
    },
    "::after": {
      blockSize: {
        default: null,
        "@media (pointer: coarse)": "100%",
      },
      content: {
        default: null,
        "@media (pointer: coarse)": '""',
      },
      inlineSize: {
        default: null,
        "@media (pointer: coarse)": "100%",
      },
      inset: 0,
      minBlockSize: {
        default: null,
        "@media (pointer: coarse)": "2.75rem",
      },
      minInlineSize: {
        default: null,
        "@media (pointer: coarse)": "2.75rem",
      },
      position: {
        default: null,
        "@media (pointer: coarse)": "absolute",
      },
    },
  },
  default: {
    backgroundColor: {
      default: tokens.primary,
      ":hover":
        "color-mix(in oklab, var(--primary, currentColor) 90%, transparent)",
      "[data-pressed]":
        "color-mix(in oklab, var(--primary, currentColor) 90%, transparent)",
    },
    borderColor: tokens.primary,
    boxShadow: {
      default:
        "var(--button-solid-inset-highlight), 0 1px 2px color-mix(in oklab, var(--primary) 24%, transparent)",
      ":active": "var(--button-solid-inset-pressed)",
      "[data-pressed]": "var(--button-solid-inset-pressed)",
      ":disabled": "none",
      ":focus-visible":
        "var(--button-solid-inset-highlight), 0 0 0 1px var(--background), 0 0 0 3px var(--ring), 0 1px 2px color-mix(in oklab, var(--primary) 24%, transparent)",
      ":focus-visible:active":
        "var(--button-solid-inset-pressed), 0 0 0 1px var(--background), 0 0 0 3px var(--ring)",
      ":focus-visible[data-pressed]":
        "var(--button-solid-inset-pressed), 0 0 0 1px var(--background), 0 0 0 3px var(--ring)",
    },
    color: tokens.primaryForeground,
  },
  destructive: {
    backgroundColor: {
      default: tokens.destructive,
      ":hover": "color-mix(in oklab, var(--destructive) 90%, transparent)",
      "[data-pressed]":
        "color-mix(in oklab, var(--destructive) 90%, transparent)",
    },
    borderColor: tokens.destructive,
    boxShadow: {
      default:
        "var(--button-solid-inset-highlight), 0 1px 2px color-mix(in oklab, var(--destructive) 24%, transparent)",
      ":active": "var(--button-solid-inset-pressed)",
      "[data-pressed]": "var(--button-solid-inset-pressed)",
      ":disabled": "none",
      ":focus-visible":
        "var(--button-solid-inset-highlight), 0 0 0 1px var(--background), 0 0 0 3px var(--ring), 0 1px 2px color-mix(in oklab, var(--destructive) 24%, transparent)",
      ":focus-visible:active":
        "var(--button-solid-inset-pressed), 0 0 0 1px var(--background), 0 0 0 3px var(--ring)",
      ":focus-visible[data-pressed]":
        "var(--button-solid-inset-pressed), 0 0 0 1px var(--background), 0 0 0 3px var(--ring)",
    },
    color: "#fff",
  },
  destructiveOutline: {
    backgroundClip: {
      default: "padding-box",
      [stylex.when.ancestor('[data-theme="dark"]', themeMarker)]: "border-box",
    },
    backgroundColor: {
      default: tokens.popover,
      [stylex.when.ancestor('[data-theme="dark"]', themeMarker)]:
        "color-mix(in oklab, var(--input, currentColor) 32%, transparent)",
      ":hover":
        "color-mix(in oklab, oklch(63.7% 0.237 25.331) 4%, transparent)",
    },
    borderColor: {
      default: tokens.input,
      ":hover": "color-mix(in oklab, var(--destructive) 32%, transparent)",
      "[data-pressed]":
        "color-mix(in oklab, var(--destructive) 32%, transparent)",
    },
    boxShadow: {
      default: "var(--button-outline-shadow)",
      ":active": "none",
      "[data-pressed]": "none",
      ":disabled": "none",
      ":focus-visible":
        "0 0 0 1px var(--background), 0 0 0 3px var(--ring), 0 1px 2px color-mix(in oklab, #000 5%, transparent)",
      ":focus-visible:active":
        "0 0 0 1px var(--background), 0 0 0 3px var(--ring)",
      ":focus-visible[data-pressed]":
        "0 0 0 1px var(--background), 0 0 0 3px var(--ring)",
    },
    color: tokens.destructiveForeground,
    "::before": {
      boxShadow: {
        default: "var(--button-outline-inset-shadow)",
        [stylex.when.ancestor('[data-theme="dark"]', themeMarker)]:
          "var(--button-outline-inset-shadow-dark)",
        ":active": "none",
        "[data-pressed]": "none",
        ":disabled": "none",
      },
    },
  },
  ghost: {
    backgroundColor: {
      default: "transparent",
      ":hover": tokens.accent,
      "[data-pressed]": tokens.accent,
    },
    borderColor: "transparent",
    color: tokens.foreground,
  },
  link: {
    backgroundColor: "transparent",
    borderColor: "transparent",
    color: tokens.foreground,
    textDecorationLine: {
      default: "none",
      ":hover": "underline",
      "[data-pressed]": "underline",
    },
    textUnderlineOffset: "4px",
  },
  loadingIndicator: {
    pointerEvents: "none",
    position: "absolute",
  },
  loadingIndicatorDefault: {
    color: tokens.primaryForeground,
  },
  loadingIndicatorDestructive: {
    color: "#fff",
  },
  loadingIndicatorForeground: {
    color: tokens.foreground,
  },
  loadingIndicatorSecondary: {
    color: tokens.secondaryForeground,
  },
  outline: {
    backgroundClip: {
      default: "padding-box",
      [stylex.when.ancestor('[data-theme="dark"]', themeMarker)]: "border-box",
    },
    backgroundColor: {
      default: tokens.popover,
      [stylex.when.ancestor('[data-theme="dark"]', themeMarker)]:
        "color-mix(in oklab, var(--input, currentColor) 32%, transparent)",
      ":hover":
        "color-mix(in oklab, var(--accent, currentColor) 50%, transparent)",
      "[data-pressed]":
        "color-mix(in oklab, var(--accent, currentColor) 50%, transparent)",
    },
    borderColor: tokens.input,
    boxShadow: {
      default: "var(--button-outline-shadow)",
      ":active": "none",
      "[data-pressed]": "none",
      ":disabled": "none",
      ":focus-visible":
        "0 0 0 1px var(--background), 0 0 0 3px var(--ring), 0 1px 2px color-mix(in oklab, #000 5%, transparent)",
      ":focus-visible:active":
        "0 0 0 1px var(--background), 0 0 0 3px var(--ring)",
      ":focus-visible[data-pressed]":
        "0 0 0 1px var(--background), 0 0 0 3px var(--ring)",
    },
    color: tokens.foreground,
    "::before": {
      boxShadow: {
        default: "var(--button-outline-inset-shadow)",
        [stylex.when.ancestor('[data-theme="dark"]', themeMarker)]:
          "var(--button-outline-inset-shadow-dark)",
        ":active": "none",
        "[data-pressed]": "none",
        ":disabled": "none",
      },
    },
  },
  secondary: {
    backgroundColor: {
      default: tokens.secondary,
      ":hover":
        "color-mix(in oklab, var(--secondary, currentColor) 90%, transparent)",
      "[data-pressed]":
        "color-mix(in oklab, var(--secondary, currentColor) 80%, transparent)",
    },
    borderColor: "transparent",
    color: tokens.secondaryForeground,
  },
  sizeDefault: {
    borderRadius: tokens.radiusLarge,
    blockSize: {
      default: "2.25rem",
      "@media (min-width: 640px)": "2rem",
    },
    paddingInline: "calc(0.75rem - 1px)",
  },
  sizeIcon: {
    borderRadius: tokens.radiusLarge,
    blockSize: {
      default: "2.25rem",
      "@media (min-width: 640px)": "2rem",
    },
    inlineSize: {
      default: "2.25rem",
      "@media (min-width: 640px)": "2rem",
    },
  },
  sizeIconLarge: {
    borderRadius: tokens.radiusLarge,
    blockSize: {
      default: "2.5rem",
      "@media (min-width: 640px)": "2.25rem",
    },
    inlineSize: {
      default: "2.5rem",
      "@media (min-width: 640px)": "2.25rem",
    },
  },
  sizeIconSmall: {
    borderRadius: tokens.radiusLarge,
    blockSize: {
      default: "2rem",
      "@media (min-width: 640px)": "1.75rem",
    },
    inlineSize: {
      default: "2rem",
      "@media (min-width: 640px)": "1.75rem",
    },
  },
  sizeIconXLarge: {
    borderRadius: tokens.radiusLarge,
    blockSize: {
      default: "2.75rem",
      "@media (min-width: 640px)": "2.5rem",
    },
    inlineSize: {
      default: "2.75rem",
      "@media (min-width: 640px)": "2.5rem",
    },
  },
  sizeIconXSmall: {
    borderRadius: tokens.radiusMedium,
    blockSize: {
      default: "1.75rem",
      "@media (min-width: 640px)": "1.5rem",
    },
    inlineSize: {
      default: "1.75rem",
      "@media (min-width: 640px)": "1.5rem",
    },
    "::before": {
      borderRadius: "var(--button-inner-radius, calc(var(--radius-md) - 1px))",
    },
  },
  sizeLarge: {
    borderRadius: tokens.radiusLarge,
    blockSize: {
      default: "2.5rem",
      "@media (min-width: 640px)": "2.25rem",
    },
    paddingInline: "calc(0.875rem - 1px)",
  },
  sizeSmall: {
    borderRadius: tokens.radiusLarge,
    blockSize: {
      default: "2rem",
      "@media (min-width: 640px)": "1.75rem",
    },
    gap: "0.375rem",
    paddingInline: "calc(0.625rem - 1px)",
  },
  sizeXLarge: {
    borderRadius: tokens.radiusLarge,
    blockSize: {
      default: "2.75rem",
      "@media (min-width: 640px)": "2.5rem",
    },
    fontSize: {
      default: "1.125rem",
      "@media (min-width: 640px)": "1rem",
    },
    lineHeight: {
      default: "1.75rem",
      "@media (min-width: 640px)": "1.5rem",
    },
    paddingInline: "calc(1rem - 1px)",
  },
  sizeXSmall: {
    borderRadius: tokens.radiusMedium,
    blockSize: {
      default: "1.75rem",
      "@media (min-width: 640px)": "1.5rem",
    },
    fontSize: {
      default: "0.875rem",
      "@media (min-width: 640px)": "0.75rem",
    },
    gap: "0.25rem",
    lineHeight: {
      default: "1.25rem",
      "@media (min-width: 640px)": "1rem",
    },
    paddingInline: "calc(0.5rem - 1px)",
    "::before": {
      borderRadius: "var(--button-inner-radius, calc(var(--radius-md) - 1px))",
    },
  },
})

const sizeStyles = {
  default: styles.sizeDefault,
  icon: styles.sizeIcon,
  "icon-lg": styles.sizeIconLarge,
  "icon-sm": styles.sizeIconSmall,
  "icon-xl": styles.sizeIconXLarge,
  "icon-xs": styles.sizeIconXSmall,
  lg: styles.sizeLarge,
  sm: styles.sizeSmall,
  xl: styles.sizeXLarge,
  xs: styles.sizeXSmall,
} as const

const variantStyles = {
  default: styles.default,
  destructive: styles.destructive,
  "destructive-outline": styles.destructiveOutline,
  ghost: styles.ghost,
  link: styles.link,
  outline: styles.outline,
  secondary: styles.secondary,
} as const

const loadingIndicatorStyles = {
  default: styles.loadingIndicatorDefault,
  destructive: styles.loadingIndicatorDestructive,
  "destructive-outline": styles.loadingIndicatorForeground,
  ghost: styles.loadingIndicatorForeground,
  link: styles.loadingIndicatorForeground,
  outline: styles.loadingIndicatorForeground,
  secondary: styles.loadingIndicatorSecondary,
} as const

interface ButtonVariantProps {
  className?: string
  size?: keyof typeof sizeStyles
  variant?: keyof typeof variantStyles
}

export function buttonVariants({
  className,
  size = "default",
  variant = "default",
}: ButtonVariantProps = {}) {
  return clsx(
    stylex.props(styles.root, sizeStyles[size], variantStyles[variant])
      .className,
    className,
  )
}

export interface ButtonProps extends useRender.ComponentProps<"button"> {
  variant?: ButtonVariantProps["variant"]
  size?: ButtonVariantProps["size"]
  loading?: boolean
}

export function Button({
  className,
  variant,
  size,
  render,
  children,
  loading = false,
  disabled: disabledProp,
  ...props
}: ButtonProps) {
  const isDisabled = Boolean(loading || disabledProp)
  const typeValue: React.ButtonHTMLAttributes<HTMLButtonElement>["type"] =
    render ? undefined : "button"

  const defaultProps = {
    children: (
      <>
        {children}
        {loading ? (
          <Spinner
            className={
              stylex.props(
                styles.loadingIndicator,
                loadingIndicatorStyles[variant ?? "default"],
              ).className
            }
            data-slot="button-loading-indicator"
          />
        ) : null}
      </>
    ),
    className: buttonVariants({ className, size, variant }),
    "aria-disabled": loading || undefined,
    "data-loading": loading ? "" : undefined,
    "data-size": size ?? "default",
    "data-slot": "button",
    disabled: isDisabled,
    type: typeValue,
  }

  return useRender({
    defaultTagName: "button",
    props: mergeProps<"button">(defaultProps, props),
    render,
  })
}
