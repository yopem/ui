"use client"

import type { StyleXComponentProps } from "@registry/lib/stylex"
import type * as React from "react"

import { mergeStylexProps, stylexProps } from "@registry/lib/stylex"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  root: { marginInline: `calc(${tokens["--spacing"]} * -4)` },
})

export type BleedProps = StyleXComponentProps<
  React.ComponentPropsWithRef<"div">
>

export function Bleed({ xstyle, className, ref, ...props }: BleedProps) {
  return (
    <div
      data-slot="bleed"
      {...mergeStylexProps(stylexProps(className, styles.root, xstyle), props)}
      ref={ref}
    />
  )
}
