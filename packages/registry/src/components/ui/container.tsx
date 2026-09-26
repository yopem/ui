"use client"

import type { StyleXComponentProps } from "@registry/lib/stylex"
import type * as React from "react"

import { mergeStylexProps, stylexProps } from "@registry/lib/stylex"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  root: {
    boxSizing: "border-box",
    inlineSize: "100%",
    marginInline: "auto",
    maxInlineSize: "90rem",
    paddingInline: `calc(${tokens["--spacing"]} * 4)`,
  },
  fluid: { maxInlineSize: "none" },
})

type ContainerElementProps = React.ComponentPropsWithoutRef<"div"> &
  React.RefAttributes<HTMLDivElement>

export type ContainerProps = StyleXComponentProps<
  ContainerElementProps,
  { fluid?: boolean }
>

export function Container({
  fluid = false,
  xstyle,
  className,
  ref,
  ...props
}: ContainerProps) {
  return (
    <div
      data-slot="container"
      {...mergeStylexProps(
        stylexProps(className, styles.root, fluid && styles.fluid, xstyle),
        props,
      )}
      ref={ref}
    />
  )
}
