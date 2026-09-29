"use client"

import type { StyleXComponentProps } from "@registry/lib/stylex"

import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { stylexProps } from "@registry/lib/stylex"

export type LinkProps = StyleXComponentProps<useRender.ComponentProps<"a">>

export function Link({
  xstyle: consumerXstyle,
  className,
  render,
  ...restProps
}: LinkProps) {
  const props = restProps
  const xstyle = consumerXstyle

  const defaultProps = {
    ...stylexProps(className, xstyle),
    "data-slot": "link",
  }

  return useRender({
    defaultTagName: "a",
    props: mergeProps<"a">(defaultProps, props),
    render,
  })
}
