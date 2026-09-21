import type { StyleComponentProps } from "@registry/lib/style-props"
import type * as React from "react"

import { splitStyleProps } from "@registry/lib/style-props"
import { mergeStyleProps, stylexProps } from "@registry/lib/stylex"
import { createElement } from "react"

export type BoxElement = keyof React.JSX.IntrinsicElements

type NativeCollisionProps<Tag extends BoxElement> = Tag extends "input"
  ? Pick<React.ComponentPropsWithRef<"input">, "size">
  : Tag extends "img"
    ? Pick<React.ComponentPropsWithRef<"img">, "width" | "height">
    : Tag extends "meta"
      ? Pick<React.ComponentPropsWithRef<"meta">, "content">
      : Record<never, never>

export type BoxProps<Tag extends BoxElement = "div"> = StyleComponentProps<
  React.ComponentPropsWithRef<Tag>,
  { as?: Tag }
> &
  NativeCollisionProps<Tag>

interface NativeProps {
  size?: number
  width?: string | number
  height?: string | number
  content?: string
}

function extractNativeProps<Tag extends BoxElement>(
  as: Tag | undefined,
  restProps: Omit<BoxProps<Tag>, "as" | "className" | "xstyle">,
) {
  const native: NativeProps = {}
  if (as === "input" && "size" in restProps) {
    native.size =
      typeof restProps.size === "number" ? restProps.size : undefined
  }
  if (as === "img") {
    for (const key of ["width", "height"] as const) {
      const value = restProps[key]
      native[key] =
        typeof value === "string" || typeof value === "number"
          ? value
          : undefined
    }
  }
  if (as === "meta") {
    native.content =
      typeof restProps.content === "string" ? restProps.content : undefined
  }
  for (const key of Object.keys(native)) Reflect.deleteProperty(restProps, key)
  return native
}

export function Box<Tag extends BoxElement = "div">({
  as,
  xstyle: consumerXstyle,
  className,
  ...restProps
}: BoxProps<Tag>) {
  const native = extractNativeProps(as, restProps)
  const { domProps, xstyle: styleProps } = splitStyleProps(restProps)
  const xstyle = [styleProps, consumerXstyle]
  const Component: React.ElementType = as ?? "div"
  return createElement(
    Component,
    mergeStyleProps(
      { ...stylexProps(className, xstyle), "data-slot": "box" },
      { ...domProps, ...native },
    ),
  )
}
