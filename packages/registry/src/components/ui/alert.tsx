import type { StyleXComponentProps } from "@registry/lib/stylex"
import type * as React from "react"

import { mergeStylexProps, stylexProps } from "@registry/lib/stylex"
import { themeMarker, tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  root: {
    alignItems: "start",
    borderColor: tokens["--border"],
    borderRadius: tokens["--radius-xl"],
    borderStyle: "solid",
    borderWidth: 1,
    color: tokens["--card-foreground"],
    columnGap: "0.5rem",
    display: "grid",
    fontSize: "0.875rem",
    gridTemplateColumns: {
      default: "1fr",
      ':has([data-slot="alert-action"])': "1fr auto",
      ":has(> svg)": "1rem 1fr",
      ':has(> svg):has([data-slot="alert-action"])': "1rem 1fr auto",
    },
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
  title: {
    fontWeight: 500,
    gridColumnStart: {
      default: null,
      ':is([data-slot="alert"] > svg ~ [data-slot="alert-title"])': 2,
    },
  },
  description: {
    color: tokens["--muted-foreground"],
    display: "flex",
    flexDirection: "column",
    gap: "0.625rem",
    gridColumnStart: {
      default: null,
      ':is([data-slot="alert"] > svg ~ [data-slot="alert-description"])': 2,
    },
  },
  action: {
    display: "flex",
    gap: "0.25rem",
    marginBlockStart: {
      default: "0.5rem",
      "@media (min-width: 640px)": 0,
    },
    alignSelf: {
      default: "auto",
      "@media (min-width: 640px)": "center",
    },
    gridColumnStart: {
      default: 2,
      "@media (min-width: 640px)": {
        default: null,
        ':is([data-slot="alert"] > svg ~ [data-slot="alert-title"] ~ [data-slot="alert-action"])': 3,
        ':is([data-slot="alert"] > svg ~ [data-slot="alert-description"] ~ [data-slot="alert-action"])': 3,
      },
    },
    gridRow: {
      default: null,
      "@media (min-width: 640px)": "1 / 3",
    },
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

export function Alert({
  xstyle: consumerXstyle,
  className,
  variant,
  ...restProps
}: StyleXComponentProps<
  React.ComponentProps<"div">,
  { variant?: AlertVariant }
>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <div
      data-slot="alert"
      data-variant={variant ?? "default"}
      role="alert"
      {...mergeStylexProps(
        stylexProps(
          className,
          styles.root,
          variantStyles[variant ?? "default"],
          xstyle,
        ),
        props,
      )}
    />
  )
}

export function AlertTitle({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleXComponentProps<React.ComponentProps<"div">>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <div
      data-slot="alert-title"
      {...mergeStylexProps(stylexProps(className, styles.title, xstyle), props)}
    />
  )
}

export function AlertDescription({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleXComponentProps<React.ComponentProps<"div">>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <div
      data-slot="alert-description"
      {...mergeStylexProps(
        stylexProps(className, styles.description, xstyle),
        props,
      )}
    />
  )
}

export function AlertAction({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleXComponentProps<React.ComponentProps<"div">>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <div
      data-slot="alert-action"
      {...mergeStylexProps(
        stylexProps(className, styles.action, xstyle),
        props,
      )}
    />
  )
}
