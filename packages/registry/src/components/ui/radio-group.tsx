"use client"

import type { StyleComponentProps, StyleProps } from "@registry/lib/style-props"

import { Radio as RadioPrimitive } from "@base-ui/react/radio"
import { RadioGroup as RadioGroupPrimitive } from "@base-ui/react/radio-group"
import { mergeStyleProps, stylexProps } from "@registry/lib/stylex"
import { themeMarker, tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  group: { display: "flex", flexDirection: "column", gap: "0.75rem" },
  radio: {
    alignItems: "center",
    backgroundColor: {
      default: tokens["--background"],
      [stylex.when.ancestor('[data-theme="dark"]', themeMarker)]:
        "color-mix(in oklab, var(--input, currentColor) 32%, transparent)",
    },
    blockSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    borderColor: {
      default: tokens["--input"],
      "[aria-invalid]":
        "color-mix(in oklab, var(--destructive, currentColor) 36%, transparent)",
    },
    borderRadius: "9999px",
    borderStyle: "solid",
    borderWidth: 1,
    boxShadow: "0 1px 2px color-mix(in oklab, #000 5%, transparent)",
    cursor: { default: "default", "[data-disabled]": "not-allowed" },
    display: "inline-flex",
    flexShrink: 0,
    inlineSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    justifyContent: "center",
    opacity: { default: 1, "[data-disabled]": 0.64 },
    outline: "none",
    position: "relative",
    transitionProperty: "box-shadow",
    ":focus-visible": {
      boxShadow: `0 0 0 2px ${tokens["--ring"]}, 0 0 0 3px ${tokens["--background"]}`,
    },
  },
  indicator: {
    alignItems: "center",
    backgroundColor: {
      default: "transparent",
      "[data-checked]": tokens["--primary"],
    },
    blockSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    borderRadius: "9999px",
    display: { default: "flex", "[data-unchecked]": "none" },
    inlineSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    inset: -1,
    justifyContent: "center",
    position: "absolute",
    "::before": {
      backgroundColor: tokens["--primary-foreground"],
      blockSize: { default: "0.5rem", "@media (min-width: 640px)": "0.375rem" },
      borderRadius: "9999px",
      content: '""',
      inlineSize: {
        default: "0.5rem",
        "@media (min-width: 640px)": "0.375rem",
      },
    },
  },
})

export function RadioGroup({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleComponentProps<RadioGroupPrimitive.Props>) {
  const props: Omit<typeof restProps, keyof StyleProps> = restProps
  const xstyle = consumerXstyle

  return (
    <RadioGroupPrimitive
      data-slot="radio-group"
      {...mergeStyleProps(stylexProps(className, styles.group, xstyle), props)}
    />
  )
}
export function Radio({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleComponentProps<RadioPrimitive.Root.Props>) {
  const props: Omit<typeof restProps, keyof StyleProps> = restProps
  const xstyle = consumerXstyle

  return (
    <RadioPrimitive.Root
      data-slot="radio"
      {...mergeStyleProps(stylexProps(className, styles.radio, xstyle), props)}
    >
      <RadioPrimitive.Indicator
        {...stylex.props(styles.indicator)}
        data-slot="radio-indicator"
      />
    </RadioPrimitive.Root>
  )
}
export { RadioGroupPrimitive, RadioPrimitive, Radio as RadioGroupItem }
