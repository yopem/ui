"use client"

import type { StyleXProps } from "@registry/lib/stylex"

import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { stylexProps } from "@registry/lib/stylex"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  root: {
    alignItems: "center",
    color: tokens["--foreground"],
    display: "inline-flex",
    fontSize: { default: "1rem", "@media (min-width: 640px)": "0.875rem" },
    fontWeight: 500,
    gap: "0.5rem",
    lineHeight: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
  },
})

export function Label({
  xstyle,
  className,
  render,
  ...props
}: useRender.ComponentProps<"label"> & StyleXProps) {
  const defaultProps = {
    ...stylexProps(className, styles.root, xstyle),
    "data-slot": "label",
  }
  return useRender({
    defaultTagName: "label",
    props: mergeProps<"label">(defaultProps, props),
    render,
  })
}
