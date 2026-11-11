"use client"

import type { StyleXComponentProps } from "@registry/lib/stylex"

import { Switch as SwitchPrimitive } from "@base-ui/react/switch"
import { mergeStylexProps, stylexProps } from "@registry/lib/stylex"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  root: {
    alignItems: "center",
    backgroundColor: {
      default: tokens["--accent"],
      "[data-checked]": tokens["--accent-solid"],
    },
    blockSize: "18px",
    borderColor: "transparent",
    borderRadius: "9999px",
    borderStyle: "solid",
    borderWidth: 2,
    cursor: {
      default: "default",
      "[data-disabled]": "not-allowed",
    },
    display: "inline-flex",
    flexShrink: 0,
    inlineSize: "37px",
    opacity: {
      default: 1,
      "[data-disabled]": 0.64,
    },
    outline: "none",
    padding: 0,
    position: "relative",
    transitionDuration: "200ms",
    transitionProperty: "background-color, box-shadow",
    ":focus-visible": {
      boxShadow: `0 0 0 1px ${tokens["--background"]}, 0 0 0 3px ${tokens["--ring"]}`,
    },
    "::after": {
      blockSize: { default: null, "@media (pointer: coarse)": "2.75rem" },
      content: { default: null, "@media (pointer: coarse)": '""' },
      inlineSize: { default: null, "@media (pointer: coarse)": "2.75rem" },
      insetBlockStart: { default: null, "@media (pointer: coarse)": "50%" },
      insetInlineStart: { default: null, "@media (pointer: coarse)": "50%" },
      position: { default: null, "@media (pointer: coarse)": "absolute" },
      translate: { default: null, "@media (pointer: coarse)": "-50% -50%" },
    },
  },
  thumb: {
    backgroundColor: {
      default: tokens["--muted-foreground"],
      "[data-checked]": tokens["--accent-solid-foreground"],
    },
    blockSize: "8px",
    inlineSize: "8px",
    borderRadius: "9999px",
    boxShadow: tokens["--shadow-sm"],
    display: "block",
    insetInlineStart: {
      default: "4px",
      "[data-checked]": "22px",
    },
    pointerEvents: "none",
    position: "relative",
    transition: "inset-inline-start .15s, border-radius .15s, scale .1s .1s",
    willChange: "transform",
    scale: {
      default: null,
      ':is( [role="switch"]:active *, [data-slot="label"]:active *, [data-slot="field-label"]:active * ):not([data-disabled])':
        "1.1 1",
    },
  },
})

export function Switch({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleXComponentProps<SwitchPrimitive.Root.Props>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      {...mergeStylexProps(stylexProps(className, styles.root, xstyle), props)}
    >
      <SwitchPrimitive.Thumb
        {...stylex.props(styles.thumb)}
        data-slot="switch-thumb"
      />
    </SwitchPrimitive.Root>
  )
}

export { SwitchPrimitive }
