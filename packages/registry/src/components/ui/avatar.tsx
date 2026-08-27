"use client"

import { Avatar as AvatarPrimitive } from "@base-ui/react/avatar"
import { stylexProps } from "@registry/lib/stylex"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  root: {
    alignItems: "center",
    backgroundColor: tokens.background,
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
    backgroundColor: tokens.muted,
    blockSize: "100%",
    borderRadius: "9999px",
    display: "flex",
    inlineSize: "100%",
    justifyContent: "center",
  },
})

export function Avatar({ className, ...props }: AvatarPrimitive.Root.Props) {
  return (
    <AvatarPrimitive.Root
      {...stylexProps(className, styles.root)}
      data-slot="avatar"
      {...props}
    />
  )
}

export function AvatarImage({
  className,
  ...props
}: AvatarPrimitive.Image.Props) {
  return (
    <AvatarPrimitive.Image
      {...stylexProps(className, styles.image)}
      data-slot="avatar-image"
      {...props}
    />
  )
}

export function AvatarFallback({
  className,
  ...props
}: AvatarPrimitive.Fallback.Props) {
  return (
    <AvatarPrimitive.Fallback
      {...stylexProps(className, styles.fallback)}
      data-slot="avatar-fallback"
      {...props}
    />
  )
}

export { AvatarPrimitive }
