"use client"

import type { StyleXProps } from "@registry/lib/stylex"

import { Avatar as AvatarPrimitive } from "@base-ui/react/avatar"
import { stylexProps } from "@registry/lib/stylex"
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
  xstyle,
  className,
  ...props
}: AvatarPrimitive.Root.Props & StyleXProps) {
  return (
    <AvatarPrimitive.Root
      {...stylexProps(className, styles.root, xstyle)}
      data-slot="avatar"
      {...props}
    />
  )
}

export function AvatarImage({
  xstyle,
  className,
  ...props
}: AvatarPrimitive.Image.Props & StyleXProps) {
  return (
    <AvatarPrimitive.Image
      {...stylexProps(className, styles.image, xstyle)}
      data-slot="avatar-image"
      {...props}
    />
  )
}

export function AvatarFallback({
  xstyle,
  className,
  ...props
}: AvatarPrimitive.Fallback.Props & StyleXProps) {
  return (
    <AvatarPrimitive.Fallback
      {...stylexProps(className, styles.fallback, xstyle)}
      data-slot="avatar-fallback"
      {...props}
    />
  )
}

export { AvatarPrimitive }
