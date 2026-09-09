"use client"

import type { StyleXProps } from "@registry/lib/stylex"

import { Switch as SwitchPrimitive } from "@base-ui/react/switch"
import { stylexProps } from "@registry/lib/stylex"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  root: {
    alignItems: "center",
    backgroundColor: {
      default: tokens["--input"],
      "[data-checked]": tokens["--primary"],
    },
    blockSize: {
      default: "1.375rem",
      "@media (min-width: 640px)": "1.125rem",
    },
    borderRadius: "9999px",
    cursor: {
      default: "default",
      "[data-disabled]": "not-allowed",
    },
    display: "inline-flex",
    flexShrink: 0,
    inlineSize: {
      default: "2.25rem",
      "@media (min-width: 640px)": "1.75rem",
    },
    opacity: {
      default: 1,
      "[data-disabled]": 0.64,
    },
    outline: "none",
    padding: 1,
    transitionDuration: "200ms",
    transitionProperty: "background-color, box-shadow",
    ":focus-visible": {
      boxShadow: `0 0 0 2px ${tokens["--ring"]}, 0 0 0 3px ${tokens["--background"]}`,
    },
  },
  thumb: {
    aspectRatio: 1,
    backgroundColor: tokens["--background"],
    blockSize: "100%",
    borderRadius: "9999px",
    boxShadow: "0 1px 2px color-mix(in oklab, #000 5%, transparent)",
    display: "block",
    pointerEvents: "none",
    transform: {
      default: "translateX(0)",
      "[data-checked]": "translateX(calc(100% - 2px))",
    },
    transformOrigin: {
      default: "left center",
      "[data-checked]": "right center",
    },
    transition: "transform .15s, border-radius .15s, scale .1s .1s",
    willChange: "transform",
    scale: {
      default: null,
      ':is( [role="switch"]:active *, [data-slot="label"]:active *, [data-slot="field-label"]:active * ):not([data-disabled])':
        "1.1 1",
    },
  },
})

export function Switch({
  xstyle,
  className,
  ...props
}: SwitchPrimitive.Root.Props & StyleXProps) {
  return (
    <SwitchPrimitive.Root
      {...stylexProps(className, styles.root, xstyle)}
      data-slot="switch"
      {...props}
    >
      <SwitchPrimitive.Thumb
        {...stylex.props(styles.thumb)}
        data-slot="switch-thumb"
      />
    </SwitchPrimitive.Root>
  )
}
export { SwitchPrimitive }
