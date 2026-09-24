"use client"

import type { StyleXComponentProps } from "@registry/lib/stylex"

import { Toggle as TogglePrimitive } from "@base-ui/react/toggle"
import { mergeStylexProps, stylexProps } from "@registry/lib/stylex"
import { themeMarker, tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"
import { clsx } from "clsx"

const styles = stylex.create({
  root: {
    alignItems: "center",
    borderRadius: tokens["--radius-lg"],
    borderStyle: "solid",
    borderWidth: 1,
    color: tokens["--foreground"],
    cursor: "pointer",
    display: "inline-flex",
    flexShrink: 0,
    fontSize: {
      default: "1rem",
      "@media (min-width: 640px)": "0.875rem",
    },
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
      ":hover": tokens["--accent"],
      "[data-pressed]":
        "color-mix(in oklab, var(--input, currentColor) 64%, transparent)",
    },
    ":focus-visible": {
      boxShadow: `0 0 0 2px ${tokens["--ring"]}, 0 0 0 3px ${tokens["--background"]}`,
    },
    ":disabled": {
      opacity: 0.64,
      pointerEvents: "none",
    },
    "::after": {
      blockSize: {
        default: null,
        "@media (pointer: coarse)": "max(100%, 2.75rem)",
      },
      content: {
        default: null,
        "@media (pointer: coarse)": '""',
      },
      inlineSize: {
        default: null,
        "@media (pointer: coarse)": "max(100%, 2.75rem)",
      },
      inset: {
        default: null,
        "@media (pointer: coarse)": 0,
      },
      position: {
        default: null,
        "@media (pointer: coarse)": "absolute",
      },
    },
    borderEndEndRadius: {
      default: null,
      ':is([data-slot="toggle-group"][data-variant="outline"][data-orientation="horizontal"] > [data-slot="toggle"]:not(:last-child))': 0,
      ':is([data-slot="toggle-group"][data-variant="outline"][data-orientation="vertical"] > [data-slot="toggle"]:not(:last-child))': 0,
    },
    borderInlineEndWidth: {
      default: null,
      ':is([data-slot="toggle-group"][data-variant="outline"][data-orientation="horizontal"] > [data-slot="toggle"]:not(:last-child))': 0,
    },
    borderStartEndRadius: {
      default: null,
      ':is([data-slot="toggle-group"][data-variant="outline"][data-orientation="horizontal"] > [data-slot="toggle"]:not(:last-child))': 0,
      ':is([data-slot="toggle-group"][data-variant="outline"][data-orientation="vertical"] > [data-slot="toggle"]:not(:first-child))': 0,
    },
    borderEndStartRadius: {
      default: null,
      ':is([data-slot="toggle-group"][data-variant="outline"][data-orientation="horizontal"] > [data-slot="toggle"]:not(:first-child))': 0,
      ':is([data-slot="toggle-group"][data-variant="outline"][data-orientation="vertical"] > [data-slot="toggle"]:not(:last-child))': 0,
    },
    borderInlineStartWidth: {
      default: null,
      ':is([data-slot="toggle-group"][data-variant="outline"][data-orientation="horizontal"] > [data-slot="toggle"]:not(:first-child))': 0,
    },
    borderStartStartRadius: {
      default: null,
      ':is([data-slot="toggle-group"][data-variant="outline"][data-orientation="horizontal"] > [data-slot="toggle"]:not(:first-child))': 0,
      ':is([data-slot="toggle-group"][data-variant="outline"][data-orientation="vertical"] > [data-slot="toggle"]:not(:first-child))': 0,
    },
    borderBlockEndWidth: {
      default: null,
      ':is([data-slot="toggle-group"][data-variant="outline"][data-orientation="vertical"] > [data-slot="toggle"]:not(:last-child))': 0,
    },
    borderBlockStartWidth: {
      default: null,
      ':is([data-slot="toggle-group"][data-variant="outline"][data-orientation="vertical"] > [data-slot="toggle"]:not(:first-child))': 0,
    },
  },
  sizeDefault: {
    blockSize: {
      default: "2.25rem",
      "@media (min-width: 640px)": "2rem",
    },
    minInlineSize: {
      default: "2.25rem",
      "@media (min-width: 640px)": "2rem",
    },
    paddingInline: "calc(0.5rem - 1px)",
  },
  sizeLarge: {
    blockSize: {
      default: "2.5rem",
      "@media (min-width: 640px)": "2.25rem",
    },
    minInlineSize: {
      default: "2.5rem",
      "@media (min-width: 640px)": "2.25rem",
    },
    paddingInline: "calc(0.625rem - 1px)",
  },
  sizeSmall: {
    blockSize: {
      default: "2rem",
      "@media (min-width: 640px)": "1.75rem",
    },
    minInlineSize: {
      default: "2rem",
      "@media (min-width: 640px)": "1.75rem",
    },
    paddingInline: "calc(0.375rem - 1px)",
  },
  default: {
    borderColor: "transparent",
  },
  outline: {
    backgroundColor: {
      default: tokens["--background"],
      [stylex.when.ancestor('[data-theme="dark"]', themeMarker)]:
        "color-mix(in oklab, var(--input, currentColor) 32%, transparent)",
      ":hover": tokens["--accent"],
      "[data-pressed]":
        "color-mix(in oklab, var(--input, currentColor) 64%, transparent)",
    },
    borderColor: tokens["--input"],
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
  xstyle: consumerXstyle,
  className,
  variant,
  size,
  ...restProps
}: StyleXComponentProps<
  TogglePrimitive.Props & Omit<ToggleVariantProps, "className">
>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <TogglePrimitive
      data-slot="toggle"
      {...mergeStylexProps(
        stylexProps(
          className,
          styles.root,
          sizeStyles[size ?? "default"],
          variantStyles[variant ?? "default"],
          xstyle,
        ),
        props,
      )}
    />
  )
}
export { TogglePrimitive }
