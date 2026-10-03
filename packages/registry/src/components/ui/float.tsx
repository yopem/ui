"use client"

import type { StyleXComponentProps } from "@registry/lib/stylex"
import type { ComponentPropsWithRef } from "react"

import { mergeStylexProps, stylexProps } from "@registry/lib/stylex"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  root: { position: "absolute", zIndex: 1 },
  topStart: { insetBlockStart: 0, insetInlineStart: 0 },
  top: {
    inlineSize: "max-content",
    insetBlockStart: 0,
    insetInline: 0,
    marginInline: "auto",
  },
  topEnd: { insetBlockStart: 0, insetInlineEnd: 0 },
  middleStart: {
    insetBlockStart: "50%",
    insetInlineStart: 0,
    transform: "translateY(-50%)",
  },
  middle: {
    inlineSize: "max-content",
    insetBlockStart: "50%",
    insetInline: 0,
    marginInline: "auto",
    transform: "translateY(-50%)",
  },
  middleEnd: {
    insetBlockStart: "50%",
    insetInlineEnd: 0,
    transform: "translateY(-50%)",
  },
  bottomStart: { insetBlockEnd: 0, insetInlineStart: 0 },
  bottom: {
    inlineSize: "max-content",
    insetBlockEnd: 0,
    insetInline: 0,
    marginInline: "auto",
  },
  bottomEnd: { insetBlockEnd: 0, insetInlineEnd: 0 },
})

export type FloatPlacement =
  | "bottom-end"
  | "bottom-start"
  | "bottom-center"
  | "middle-end"
  | "middle-start"
  | "middle-center"
  | "top-end"
  | "top-start"
  | "top-center"

export type FloatProps = StyleXComponentProps<
  ComponentPropsWithRef<"div">,
  { placement?: FloatPlacement }
>

export function Float({
  placement = "top-end",
  xstyle,
  className,
  ref,
  ...props
}: FloatProps) {
  const placementStyle = {
    "bottom-end": styles.bottomEnd,
    "bottom-start": styles.bottomStart,
    "bottom-center": styles.bottom,
    "middle-end": styles.middleEnd,
    "middle-start": styles.middleStart,
    "middle-center": styles.middle,
    "top-end": styles.topEnd,
    "top-start": styles.topStart,
    "top-center": styles.top,
  }[placement]

  return (
    <div
      data-slot="float"
      {...mergeStylexProps(
        stylexProps(className, styles.root, placementStyle, xstyle),
        props,
      )}
      ref={ref}
    />
  )
}
