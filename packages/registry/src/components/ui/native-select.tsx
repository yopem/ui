import type { StyleXComponentProps } from "@registry/lib/stylex"
import type { ComponentPropsWithRef } from "react"

import { mergeStylexProps, stylexProps } from "@registry/lib/stylex"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  root: {
    appearance: "auto",
    backgroundColor: tokens["--background"],
    borderColor: {
      default: tokens["--input"],
      ":focus-visible": tokens["--ring"],
      "[aria-invalid]":
        "color-mix(in oklab, var(--destructive, currentColor) 36%, transparent)",
    },
    borderRadius: tokens["--radius-lg"],
    borderStyle: "solid",
    borderWidth: 1,
    color: tokens["--foreground"],
    cursor: { default: "pointer", ":disabled": "not-allowed" },
    fontFamily: "inherit",
    fontSize: { default: "1rem", "@media (min-width: 640px)": "0.875rem" },
    inlineSize: "100%",
    minBlockSize: { default: "2.25rem", "@media (pointer: coarse)": "2.75rem" },
    opacity: { default: 1, ":disabled": 0.64 },
    paddingBlock: "0.5rem",
    paddingInline: "0.75rem",
    ":focus-visible": {
      outlineColor: tokens["--ring"],
      outlineOffset: 2,
      outlineStyle: "solid",
      outlineWidth: 2,
    },
  },
})

export type NativeSelectProps = StyleXComponentProps<
  ComponentPropsWithRef<"select">
>

export function NativeSelect({
  xstyle: consumerXstyle,
  className,
  ...props
}: NativeSelectProps) {
  return (
    <select
      data-slot="native-select"
      {...mergeStylexProps(
        stylexProps(className, styles.root, consumerXstyle),
        props,
      )}
    />
  )
}
