"use client"

import type { StyleXComponentProps } from "@registry/lib/stylex"
import type { ComponentPropsWithRef } from "react"

import { mergeStylexProps, stylexProps } from "@registry/lib/stylex"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  root: {
    alignItems: "center",
    display: "flex",
    flexWrap: "wrap",
    gap: `calc(${tokens["--spacing"]} * 2)`,
  },
})

export type WrapProps = StyleXComponentProps<ComponentPropsWithRef<"div">>

export function Wrap({ xstyle, className, ref, ...props }: WrapProps) {
  return (
    <div
      data-slot="wrap"
      {...mergeStylexProps(stylexProps(className, styles.root, xstyle), props)}
      ref={ref}
    />
  )
}
