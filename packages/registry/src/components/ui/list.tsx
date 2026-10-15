"use client"

import type { StyleXComponentProps } from "@registry/lib/stylex"
import type { ComponentProps } from "react"

import { useRender } from "@base-ui/react/use-render"
import { mergeStylexProps, stylexProps } from "@registry/lib/stylex"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  root: {
    margin: 0,
    paddingInlineStart: `calc(${tokens["--spacing"]} * 6)`,
  },
})

export type ListProps = StyleXComponentProps<
  useRender.ComponentProps<"ul" | "ol">
>

export function List({ render, xstyle, className, ...props }: ListProps) {
  return useRender({
    defaultTagName: "ul",
    render,
    props: mergeStylexProps(
      {
        ...stylexProps(className, styles.root, xstyle),
        "data-slot": "list",
      },
      props,
    ),
  })
}

export type ListItemProps = StyleXComponentProps<ComponentProps<"li">>

export function ListItem({ xstyle, className, ...props }: ListItemProps) {
  return (
    <li
      data-slot="list-item"
      {...mergeStylexProps(stylexProps(className, xstyle), props)}
    />
  )
}
