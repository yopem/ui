"use client"

// oxlint-disable jsx-a11y/prefer-tag-over-role -- Button group uses div+role=group for styling; fieldset not appropriate

import type { StyleComponentProps } from "@registry/lib/style-props"
import type * as React from "react"

import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { Separator } from "@registry/components/ui/separator"
import { splitStyleProps } from "@registry/lib/style-props"
import { mergeStyleProps, stylexProps } from "@registry/lib/stylex"
import { themeMarker, tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"
import { clsx } from "clsx"

// Keep topology in private variables: caller xstyle can replace each final property
// without repeating relationship selectors. Final shorthand properties match the
// controls' defaults; :dir() preserves logical edges.
export const groupItemStyles = stylex.create({
  item: {
    "--group-item-border-bottom-right-radius": {
      default: tokens["--radius-lg"],
      ':is([data-slot="group"][data-orientation="horizontal"] > [data-slot]:not([data-slot="separator"]):not(:last-child)):not(:dir(rtl))': 0,
      ':is([data-slot="group"][data-orientation="vertical"] > [data-slot]:not([data-slot="separator"]):not(:last-child)):not(:dir(rtl))': 0,
      ':is([data-slot="group"][data-orientation="horizontal"] > [data-slot]:not([data-slot="separator"]):not(:has(~ [data-slot]))):not(:dir(rtl))':
        tokens["--radius"],
      ':is([data-slot="group"][data-orientation="vertical"] > [data-slot]:not([data-slot="separator"]):not(:has(~ [data-slot]))):not(:dir(rtl))':
        tokens["--radius"],
      ':is([data-slot="group"][data-orientation="horizontal"] > [data-slot]:not([data-slot="separator"]):not(:first-child)):dir(rtl)': 0,
      ':is([data-slot="group"][data-orientation="vertical"] > [data-slot]:not([data-slot="separator"]):not(:last-child)):dir(rtl)': 0,
      ':is([data-slot="group"][data-orientation="horizontal"] > [data-slot]:not([data-slot="separator"]):not([data-slot] ~ [data-slot])):dir(rtl)':
        tokens["--radius"],
      ':is([data-slot="group"][data-orientation="vertical"] > [data-slot]:not([data-slot="separator"]):not(:has(~ [data-slot]))):dir(rtl)':
        tokens["--radius"],
    },
    "--group-item-border-bottom-left-radius": {
      default: tokens["--radius-lg"],
      ':is([data-slot="group"][data-orientation="horizontal"] > [data-slot]:not([data-slot="separator"]):not(:last-child)):dir(rtl)': 0,
      ':is([data-slot="group"][data-orientation="vertical"] > [data-slot]:not([data-slot="separator"]):not(:last-child)):dir(rtl)': 0,
      ':is([data-slot="group"][data-orientation="horizontal"] > [data-slot]:not([data-slot="separator"]):not(:has(~ [data-slot]))):dir(rtl)':
        tokens["--radius"],
      ':is([data-slot="group"][data-orientation="vertical"] > [data-slot]:not([data-slot="separator"]):not(:has(~ [data-slot]))):dir(rtl)':
        tokens["--radius"],
      ':is([data-slot="group"][data-orientation="horizontal"] > [data-slot]:not([data-slot="separator"]):not(:first-child)):not(:dir(rtl))': 0,
      ':is([data-slot="group"][data-orientation="vertical"] > [data-slot]:not([data-slot="separator"]):not(:last-child)):not(:dir(rtl))': 0,
      ':is([data-slot="group"][data-orientation="horizontal"] > [data-slot]:not([data-slot="separator"]):not([data-slot] ~ [data-slot])):not(:dir(rtl))':
        tokens["--radius"],
      ':is([data-slot="group"][data-orientation="vertical"] > [data-slot]:not([data-slot="separator"]):not(:has(~ [data-slot]))):not(:dir(rtl))':
        tokens["--radius"],
    },
    "--group-item-border-right-width": {
      default: "1px",
      ':is([data-slot="group"][data-orientation="horizontal"] > [data-slot]:not([data-slot="separator"]):not(:last-child)):not(:dir(rtl))': 0,
      ':is([data-slot="group"][data-orientation="horizontal"] > [data-slot]:not([data-slot="separator"]):not(:first-child)):dir(rtl)': 0,
    },
    "--group-item-border-left-width": {
      default: "1px",
      ':is([data-slot="group"][data-orientation="horizontal"] > [data-slot]:not([data-slot="separator"]):not(:last-child)):dir(rtl)': 0,
      ':is([data-slot="group"][data-orientation="horizontal"] > [data-slot]:not([data-slot="separator"]):not(:first-child)):not(:dir(rtl))': 0,
    },
    "--group-item-border-top-right-radius": {
      default: tokens["--radius-lg"],
      ':is([data-slot="group"][data-orientation="horizontal"] > [data-slot]:not([data-slot="separator"]):not(:last-child)):not(:dir(rtl))': 0,
      ':is([data-slot="group"][data-orientation="vertical"] > [data-slot]:not([data-slot="separator"]):not(:first-child)):not(:dir(rtl))': 0,
      ':is([data-slot="group"][data-orientation="horizontal"] > [data-slot]:not([data-slot="separator"]):not(:has(~ [data-slot]))):not(:dir(rtl))':
        tokens["--radius"],
      ':is([data-slot="group"][data-orientation="vertical"] > [data-slot]:not([data-slot="separator"]):not([data-slot] ~ [data-slot])):not(:dir(rtl))':
        tokens["--radius"],
      ':is([data-slot="group"][data-orientation="horizontal"] > [data-slot]:not([data-slot="separator"]):not(:first-child)):dir(rtl)': 0,
      ':is([data-slot="group"][data-orientation="vertical"] > [data-slot]:not([data-slot="separator"]):not(:first-child)):dir(rtl)': 0,
      ':is([data-slot="group"][data-orientation="horizontal"] > [data-slot]:not([data-slot="separator"]):not([data-slot] ~ [data-slot])):dir(rtl)':
        tokens["--radius"],
      ':is([data-slot="group"][data-orientation="vertical"] > [data-slot]:not([data-slot="separator"]):not([data-slot] ~ [data-slot])):dir(rtl)':
        tokens["--radius"],
    },
    "--group-item-border-top-left-radius": {
      default: tokens["--radius-lg"],
      ':is([data-slot="group"][data-orientation="horizontal"] > [data-slot]:not([data-slot="separator"]):not(:last-child)):dir(rtl)': 0,
      ':is([data-slot="group"][data-orientation="vertical"] > [data-slot]:not([data-slot="separator"]):not(:first-child)):dir(rtl)': 0,
      ':is([data-slot="group"][data-orientation="horizontal"] > [data-slot]:not([data-slot="separator"]):not(:has(~ [data-slot]))):dir(rtl)':
        tokens["--radius"],
      ':is([data-slot="group"][data-orientation="vertical"] > [data-slot]:not([data-slot="separator"]):not([data-slot] ~ [data-slot])):dir(rtl)':
        tokens["--radius"],
      ':is([data-slot="group"][data-orientation="horizontal"] > [data-slot]:not([data-slot="separator"]):not(:first-child)):not(:dir(rtl))': 0,
      ':is([data-slot="group"][data-orientation="vertical"] > [data-slot]:not([data-slot="separator"]):not(:first-child)):not(:dir(rtl))': 0,
      ':is([data-slot="group"][data-orientation="horizontal"] > [data-slot]:not([data-slot="separator"]):not([data-slot] ~ [data-slot])):not(:dir(rtl))':
        tokens["--radius"],
      ':is([data-slot="group"][data-orientation="vertical"] > [data-slot]:not([data-slot="separator"]):not([data-slot] ~ [data-slot])):not(:dir(rtl))':
        tokens["--radius"],
    },
    "--group-item-border-bottom-width": {
      default: "1px",
      ':is([data-slot="group"][data-orientation="vertical"] > [data-slot]:not([data-slot="separator"]):not(:last-child))': 0,
    },
    "--group-item-border-top-width": {
      default: "1px",
      ':is([data-slot="group"][data-orientation="vertical"] > [data-slot]:not([data-slot="separator"]):not(:first-child))': 0,
    },
    "--group-item-z-index": {
      default: "auto",
      ':is([data-slot="group"] > [data-slot]:focus-visible)': 1,
      ':is([data-slot="group"] > [data-slot]:has(:focus-visible))': 1,
    },
    zIndex: "var(--group-item-z-index)",
    "::before": {
      "--group-item-before-border-bottom-right-radius": {
        default: "calc(var(--radius-lg) - 1px)",
        ':is([data-slot="group"][data-orientation="horizontal"] > [data-slot]:has(~ [data-slot])):not(:dir(rtl))': 0,
        ':is([data-slot="group"][data-orientation="vertical"] > [data-slot]:has(~ [data-slot])):not(:dir(rtl))': 0,
        ':is([data-slot="group"][data-orientation="horizontal"] > [data-slot]:not([data-slot="separator"]):not(:has(~ [data-slot]))):not(:dir(rtl))':
          "calc(var(--radius-lg, 0.625rem) - 1px)",
        ':is([data-slot="group"][data-orientation="vertical"] > [data-slot]:not([data-slot="separator"]):not(:has(~ [data-slot]))):not(:dir(rtl))':
          "calc(var(--radius-lg, 0.625rem) - 1px)",
        ':is([data-slot="group"][data-orientation="horizontal"] > [data-slot] ~ [data-slot]):dir(rtl)': 0,
        ':is([data-slot="group"][data-orientation="vertical"] > [data-slot]:has(~ [data-slot])):dir(rtl)': 0,
        ':is([data-slot="group"][data-orientation="horizontal"] > [data-slot]:not([data-slot="separator"]):not( [data-slot] ~ [data-slot] )):dir(rtl)':
          "calc(var(--radius-lg, 0.625rem) - 1px)",
        ':is([data-slot="group"][data-orientation="vertical"] > [data-slot]:not([data-slot="separator"]):not(:has(~ [data-slot]))):dir(rtl)':
          "calc(var(--radius-lg, 0.625rem) - 1px)",
      },
      "--group-item-before-border-bottom-left-radius": {
        default: "calc(var(--radius-lg) - 1px)",
        ':is([data-slot="group"][data-orientation="horizontal"] > [data-slot]:has(~ [data-slot])):dir(rtl)': 0,
        ':is([data-slot="group"][data-orientation="vertical"] > [data-slot]:has(~ [data-slot])):dir(rtl)': 0,
        ':is([data-slot="group"][data-orientation="horizontal"] > [data-slot]:not([data-slot="separator"]):not(:has(~ [data-slot]))):dir(rtl)':
          "calc(var(--radius-lg, 0.625rem) - 1px)",
        ':is([data-slot="group"][data-orientation="vertical"] > [data-slot]:not([data-slot="separator"]):not(:has(~ [data-slot]))):dir(rtl)':
          "calc(var(--radius-lg, 0.625rem) - 1px)",
        ':is([data-slot="group"][data-orientation="horizontal"] > [data-slot] ~ [data-slot]):not(:dir(rtl))': 0,
        ':is([data-slot="group"][data-orientation="vertical"] > [data-slot]:has(~ [data-slot])):not(:dir(rtl))': 0,
        ':is([data-slot="group"][data-orientation="horizontal"] > [data-slot]:not([data-slot="separator"]):not( [data-slot] ~ [data-slot] )):not(:dir(rtl))':
          "calc(var(--radius-lg, 0.625rem) - 1px)",
        ':is([data-slot="group"][data-orientation="vertical"] > [data-slot]:not([data-slot="separator"]):not(:has(~ [data-slot]))):not(:dir(rtl))':
          "calc(var(--radius-lg, 0.625rem) - 1px)",
      },
      "--group-item-before-border-top-right-radius": {
        default: "calc(var(--radius-lg) - 1px)",
        ':is([data-slot="group"][data-orientation="horizontal"] > [data-slot]:has(~ [data-slot])):not(:dir(rtl))': 0,
        ':is([data-slot="group"][data-orientation="vertical"] > [data-slot] ~ [data-slot]):not(:dir(rtl))': 0,
        ':is([data-slot="group"][data-orientation="horizontal"] > [data-slot]:not([data-slot="separator"]):not(:has(~ [data-slot]))):not(:dir(rtl))':
          "calc(var(--radius-lg, 0.625rem) - 1px)",
        ':is([data-slot="group"][data-orientation="vertical"] > [data-slot]:not([data-slot="separator"]):not( [data-slot] ~ [data-slot] )):not(:dir(rtl))':
          "calc(var(--radius-lg, 0.625rem) - 1px)",
        ':is([data-slot="group"][data-orientation="horizontal"] > [data-slot] ~ [data-slot]):dir(rtl)': 0,
        ':is([data-slot="group"][data-orientation="vertical"] > [data-slot] ~ [data-slot]):dir(rtl)': 0,
        ':is([data-slot="group"][data-orientation="horizontal"] > [data-slot]:not([data-slot="separator"]):not( [data-slot] ~ [data-slot] )):dir(rtl)':
          "calc(var(--radius-lg, 0.625rem) - 1px)",
        ':is([data-slot="group"][data-orientation="vertical"] > [data-slot]:not([data-slot="separator"]):not( [data-slot] ~ [data-slot] )):dir(rtl)':
          "calc(var(--radius-lg, 0.625rem) - 1px)",
      },
      "--group-item-before-border-top-left-radius": {
        default: "calc(var(--radius-lg) - 1px)",
        ':is([data-slot="group"][data-orientation="horizontal"] > [data-slot]:has(~ [data-slot])):dir(rtl)': 0,
        ':is([data-slot="group"][data-orientation="vertical"] > [data-slot] ~ [data-slot]):dir(rtl)': 0,
        ':is([data-slot="group"][data-orientation="horizontal"] > [data-slot]:not([data-slot="separator"]):not(:has(~ [data-slot]))):dir(rtl)':
          "calc(var(--radius-lg, 0.625rem) - 1px)",
        ':is([data-slot="group"][data-orientation="vertical"] > [data-slot]:not([data-slot="separator"]):not( [data-slot] ~ [data-slot] )):dir(rtl)':
          "calc(var(--radius-lg, 0.625rem) - 1px)",
        ':is([data-slot="group"][data-orientation="horizontal"] > [data-slot] ~ [data-slot]):not(:dir(rtl))': 0,
        ':is([data-slot="group"][data-orientation="vertical"] > [data-slot] ~ [data-slot]):not(:dir(rtl))': 0,
        ':is([data-slot="group"][data-orientation="horizontal"] > [data-slot]:not([data-slot="separator"]):not( [data-slot] ~ [data-slot] )):not(:dir(rtl))':
          "calc(var(--radius-lg, 0.625rem) - 1px)",
        ':is([data-slot="group"][data-orientation="vertical"] > [data-slot]:not([data-slot="separator"]):not( [data-slot] ~ [data-slot] )):not(:dir(rtl))':
          "calc(var(--radius-lg, 0.625rem) - 1px)",
      },
      "--group-item-before-right": {
        default: 0,
        ':is([data-slot="group"][data-orientation="horizontal"] > [data-slot]:not([data-slot="separator"]):has(~ [data-slot])):not(:dir(rtl))':
          "-0.5px",
        ':is([data-slot="group"][data-orientation="horizontal"] > [data-slot] ~ [data-slot]:not([data-slot="separator"])):dir(rtl)':
          "-0.5px",
      },
      right: "var(--group-item-before-right)",
      "--group-item-before-left": {
        default: 0,
        ':is([data-slot="group"][data-orientation="horizontal"] > [data-slot]:not([data-slot="separator"]):has(~ [data-slot])):dir(rtl)':
          "-0.5px",
        ':is([data-slot="group"][data-orientation="horizontal"] > [data-slot] ~ [data-slot]:not([data-slot="separator"])):not(:dir(rtl))':
          "-0.5px",
      },
      left: "var(--group-item-before-left)",
      "--group-item-before-bottom": {
        default: 0,
        ':is([data-slot="group"][data-orientation="vertical"] > [data-slot]:not([data-slot="separator"]):has(~ [data-slot]))':
          "-0.5px",
      },
      bottom: "var(--group-item-before-bottom)",
      "--group-item-before-display": {
        default: "var(--input-control-before-display, block)",
        ':is([data-slot="group"][data-orientation="vertical"] > [data-slot]:not([data-slot="separator"]):has(~ [data-slot]))':
          "none",
        ':is([data-theme="dark"] [data-slot="group"][data-orientation="vertical"] > [data-slot]:not([data-slot] ~ [data-slot]))':
          "block",
        ':is([data-theme="dark"] [data-slot="group"][data-orientation="vertical"] > [data-slot]:not(:has(~ [data-slot])))':
          "none",
      },
      display: "var(--group-item-before-display)",
      "--group-item-before-top": {
        default: 0,
        ':is([data-slot="group"][data-orientation="vertical"] > [data-slot] ~ [data-slot]:not([data-slot="separator"]))':
          "-0.5px",
      },
      top: "var(--group-item-before-top)",
      borderRadius:
        "var(--group-item-before-border-top-left-radius) var(--group-item-before-border-top-right-radius) var(--group-item-before-border-bottom-right-radius) var(--group-item-before-border-bottom-left-radius)",
    },
    "::after": {
      "--group-item-after-min-inline-size": {
        default: null,
        "@media (pointer: coarse)": {
          default: null,
          ':is([data-slot="group"][data-orientation="horizontal"] > [data-slot])':
            "auto",
        },
      },
      minInlineSize: "var(--group-item-after-min-inline-size)",
      "--group-item-after-min-block-size": {
        default: null,
        "@media (pointer: coarse)": {
          default: null,
          ':is([data-slot="group"][data-orientation="vertical"] > [data-slot])':
            "auto",
        },
      },
      minBlockSize: "var(--group-item-after-min-block-size)",
    },
    borderRadius:
      "var(--group-item-border-top-left-radius) var(--group-item-border-top-right-radius) var(--group-item-border-bottom-right-radius) var(--group-item-border-bottom-left-radius)",
    borderWidth:
      "var(--group-item-border-top-width) var(--group-item-border-right-width) var(--group-item-border-bottom-width) var(--group-item-border-left-width)",
  },
})

const styles = stylex.create({
  root: {
    display: "flex",
    inlineSize: "fit-content",
    gap: {
      default: null,
      ':has(> [data-slot="group"])': "0.5rem",
    },
  },
  horizontal: {
    flexDirection: "row",
  },
  vertical: {
    flexDirection: "column",
  },
  text: {
    alignItems: "center",
    backgroundClip: {
      default: "padding-box",
      [stylex.when.ancestor('[data-theme="dark"]', themeMarker)]: "border-box",
    },
    backgroundColor: {
      default: tokens["--muted"],
      [stylex.when.ancestor('[data-theme="dark"]', themeMarker)]:
        "color-mix(in oklab, var(--input, currentColor) 64%, transparent)",
    },
    borderColor: tokens["--input"],
    borderRadius: tokens["--radius-lg"],
    borderStyle: "solid",
    borderWidth: 1,
    color: tokens["--muted-foreground"],
    display: "inline-flex",
    fontSize: {
      default: "1rem",
      "@media (min-width: 640px)": "0.875rem",
    },
    lineHeight: {
      default: "1.5rem",
      "@media (min-width: 640px)": "1.25rem",
    },
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
    borderWidth: 0,
    borderRadius: 0,
    backgroundColor: {
      default: tokens["--input"],
      ':is([data-slot="group"] > [data-slot="separator"]:has( + [data-slot="input-control"]:focus-within, + [data-slot="input-group"]:focus-within, + [data-slot="select-trigger"]:focus-visible + *, + [data-slot="number-field"]:focus-within ))':
        tokens["--ring"],
      ':is([data-slot="group"] > :is( [data-slot="input-control"]:focus-within, [data-slot="input-group"]:focus-within, [data-slot="select-trigger"]:focus-visible + *, [data-slot="number-field"]:focus-within, [data-slot="number-field"]:focus-within + input ) + [data-slot="separator"])':
        tokens["--ring"],
    },
    pointerEvents: "none",
    position: "relative",
    zIndex: 2,
    "::before": {
      borderRadius: 0,
      backgroundColor: {
        default: "transparent",
        [stylex.when.ancestor('[data-theme="dark"]', themeMarker)]:
          "color-mix(in oklab, var(--input, currentColor) 32%, transparent)",
        ':is([data-theme="dark"] [data-slot="group"] > :is( [data-slot="separator"]:has(~ button:hover):not( :has(~ [data-slot="separator"] ~ [data-slot]:hover) ), [data-slot="separator"]:has(~ [data-slot][data-pressed]):not( :has(~ [data-slot="separator"] ~ [data-slot][data-pressed]) ), button:hover ~ [data-slot="separator"]:not( [data-slot]:hover ~ [data-slot="separator"] ~ [data-slot="separator"] ), [data-slot][data-pressed] ~ [data-slot="separator"]:not( [data-slot][data-pressed] ~ [data-slot="separator"] ~ [data-slot="separator"] ) ))':
          "color-mix(in oklab, var(--input) 64%, transparent)",
      },
      content: '""',
      inset: 0,
      position: "absolute",
    },
    translate: {
      default: null,
      ':is([data-slot="group"] > [data-slot="separator"]:has( + [data-slot="input-control"]:focus-within, + [data-slot="input-group"]:focus-within, + [data-slot="select-trigger"]:focus-visible + *, + [data-slot="number-field"]:focus-within ))':
        "1px 0",
      ':is([data-slot="group"] > :is( [data-slot="input-control"]:focus-within, [data-slot="input-group"]:focus-within, [data-slot="select-trigger"]:focus-visible + *, [data-slot="number-field"]:focus-within, [data-slot="number-field"]:focus-within + input ) + [data-slot="separator"])':
        "-1px 0",
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
  xstyle: consumerXstyle,
  className,
  orientation = "horizontal",
  children,
  ...restProps
}: StyleComponentProps<
  React.ComponentProps<"div">,
  {
    className?: string
    orientation?: keyof typeof orientationStyles
    children: React.ReactNode
  }
>) {
  const { domProps: props, xstyle: styleProps } = splitStyleProps(restProps)
  const xstyle = [styleProps, consumerXstyle]

  return (
    <div
      data-orientation={orientation}
      data-slot="group"
      role="group"
      {...mergeStyleProps(
        stylexProps(
          className,
          styles.root,
          orientationStyles[orientation],
          xstyle,
        ),
        props,
      )}
    >
      {children}
    </div>
  )
}

export function GroupText({
  xstyle: consumerXstyle,
  className,
  render,
  ...restProps
}: StyleComponentProps<useRender.ComponentProps<"div">>) {
  const { domProps: props, xstyle: styleProps } = splitStyleProps(restProps)
  const xstyle = [styleProps, consumerXstyle]

  const defaultProps = {
    ...stylexProps(className, styles.text, groupItemStyles.item, xstyle),
    "data-slot": "group-text",
  }
  return useRender({
    defaultTagName: "div",
    props: mergeProps(defaultProps, props),
    render,
  })
}

export function GroupSeparator({
  xstyle: consumerXstyle,
  className,
  orientation = "vertical",
  ...restProps
}: StyleComponentProps<React.ComponentProps<typeof Separator>>) {
  const { domProps: props, xstyle: styleProps } = splitStyleProps(restProps)
  const xstyle = [styleProps, consumerXstyle]

  return (
    <Separator
      className={className}
      xstyle={[groupItemStyles.item, styles.separator, xstyle]}
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
