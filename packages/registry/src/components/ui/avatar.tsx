"use client"

import type { StyleXComponentProps } from "@registry/lib/stylex"

import { Avatar as AvatarPrimitive } from "@base-ui/react/avatar"
import { mergeStylexProps, stylexProps } from "@registry/lib/stylex"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  root: {
    alignItems: "center",
    backgroundColor: tokens["--background"],
    blockSize: "2rem",
    borderRadius: "9999px",
    display: "inline-flex",
    flexShrink: 0,
    fontSize: "0.75rem",
    fontWeight: 500,
    inlineSize: "2rem",
    justifyContent: "center",
    overflow: "hidden",
    userSelect: "none",
    verticalAlign: "middle",
  },
  image: { blockSize: "100%", inlineSize: "100%", objectFit: "cover" },
  fallback: {
    alignItems: "center",
    backgroundColor: tokens["--muted"],
    blockSize: "100%",
    borderRadius: "9999px",
    display: "flex",
    inlineSize: "100%",
    justifyContent: "center",
  },
})

export function Avatar({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleXComponentProps<AvatarPrimitive.Root.Props>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      {...mergeStylexProps(stylexProps(className, styles.root, xstyle), props)}
    />
  )
}

export function AvatarImage({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleXComponentProps<AvatarPrimitive.Image.Props>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      {...mergeStylexProps(stylexProps(className, styles.image, xstyle), props)}
    />
  )
}

export function AvatarFallback({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleXComponentProps<AvatarPrimitive.Fallback.Props>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      {...mergeStylexProps(
        stylexProps(className, styles.fallback, xstyle),
        props,
      )}
    />
  )
}

export { AvatarPrimitive }
