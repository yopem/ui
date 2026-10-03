"use client"

import type { StyleXComponentProps } from "@registry/lib/stylex"
import type { ComponentPropsWithRef } from "react"

import { mergeStylexProps, stylexProps } from "@registry/lib/stylex"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  root: {
    alignItems: "center",
    display: "flex",
    justifyContent: "center",
    position: "absolute",
  },
  both: {
    inlineSize: "max-content",
    insetBlockStart: "50%",
    insetInline: 0,
    marginInline: "auto",
    maxInlineSize: "100%",
    transform: "translateY(-50%)",
  },
  horizontal: {
    inlineSize: "max-content",
    insetInline: 0,
    marginInline: "auto",
    maxInlineSize: "100%",
  },
  vertical: {
    insetBlockStart: "50%",
    transform: "translateY(-50%)",
  },
})

export type AbsoluteCenterAxis = "both" | "horizontal" | "vertical"

export type AbsoluteCenterProps = StyleXComponentProps<
  ComponentPropsWithRef<"div">,
  { axis?: AbsoluteCenterAxis }
>

export function AbsoluteCenter({
  axis = "both",
  xstyle,
  className,
  ref,
  ...props
}: AbsoluteCenterProps) {
  const axisStyle =
    axis === "horizontal"
      ? styles.horizontal
      : axis === "vertical"
        ? styles.vertical
        : styles.both

  return (
    <div
      data-slot="absolute-center"
      {...mergeStylexProps(
        stylexProps(className, styles.root, axisStyle, xstyle),
        props,
      )}
      ref={ref}
    />
  )
}
