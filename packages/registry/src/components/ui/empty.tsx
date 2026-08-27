import type React from "react"

import { stylexProps } from "@registry/lib/stylex"
import { themeMarker } from "@registry/styles/markers.stylex"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"
import { clsx } from "clsx"

const styles = stylex.create({
  root: {
    alignItems: "center",
    display: "flex",
    flex: 1,
    flexDirection: "column",
    gap: "1.5rem",
    justifyContent: "center",
    minInlineSize: 0,
    paddingBlock: { default: "3rem", "@media (min-width: 768px)": "5rem" },
    paddingInline: "1.5rem",
    textAlign: "center",
    textWrap: "balance",
  },
  header: {
    alignItems: "center",
    display: "flex",
    flexDirection: "column",
    maxInlineSize: "24rem",
    textAlign: "center",
  },
  mediaRoot: { marginBlockEnd: "1.5rem", position: "relative" },
  media: {
    alignItems: "center",
    display: "flex",
    flexShrink: 0,
    justifyContent: "center",
  },
  mediaDefault: { backgroundColor: "transparent" },
  mediaIcon: {
    backgroundColor: tokens.card,
    blockSize: "2.25rem",
    borderColor: tokens.border,
    borderRadius: tokens.radiusMedium,
    borderStyle: "solid",
    borderWidth: 1,
    boxShadow: {
      default: "0 1px 2px color-mix(in oklab, #000 5%, transparent)",
      [stylex.when.ancestor('[data-theme="dark"]', themeMarker)]:
        "0 -1px 0 color-mix(in oklab, #fff 6%, transparent)",
    },
    color: tokens.foreground,
    inlineSize: "2.25rem",
    position: "relative",
  },
  back: {
    bottom: 1,
    pointerEvents: "none",
    position: "absolute",
    transform: "translateX(-0.125rem) rotate(-10deg) scale(.84)",
    transformOrigin: "bottom left",
  },
  front: {
    bottom: 1,
    pointerEvents: "none",
    position: "absolute",
    transform: "translateX(0.125rem) rotate(10deg) scale(.84)",
    transformOrigin: "bottom right",
  },
  title: {
    fontFamily: tokens.fontHeading,
    fontSize: "1.25rem",
    fontWeight: 600,
  },
  description: {
    color: tokens.mutedForeground,
    fontSize: "0.875rem",
    marginBlockStart: "0.25rem",
  },
  content: {
    alignItems: "center",
    display: "flex",
    flexDirection: "column",
    fontSize: "0.875rem",
    gap: "1rem",
    inlineSize: "100%",
    maxInlineSize: "24rem",
    minInlineSize: 0,
    textWrap: "balance",
  },
})

const mediaVariantStyles = {
  default: styles.mediaDefault,
  icon: styles.mediaIcon,
} as const
function emptyMediaVariants({
  className,
  variant = "default",
}: { className?: string; variant?: keyof typeof mediaVariantStyles } = {}) {
  return clsx(
    stylex.props(styles.media, mediaVariantStyles[variant]).className,
    className,
  )
}

export function Empty({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      {...stylexProps(className, styles.root)}
      data-slot="empty"
      {...props}
    />
  )
}
export function EmptyHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      {...stylexProps(className, styles.header)}
      data-slot="empty-header"
      {...props}
    />
  )
}
export function EmptyMedia({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"div"> & {
  variant?: keyof typeof mediaVariantStyles
}) {
  const mediaClassName = emptyMediaVariants({ className, variant })
  return (
    <div
      {...stylexProps(className, styles.mediaRoot)}
      data-slot="empty-media"
      data-variant={variant}
      {...props}
    >
      {variant === "icon" ? (
        <>
          <div
            aria-hidden="true"
            className={clsx(
              mediaClassName,
              stylex.props(styles.back).className,
            )}
          />
          <div
            aria-hidden="true"
            className={clsx(
              mediaClassName,
              stylex.props(styles.front).className,
            )}
          />
        </>
      ) : null}
      <div className={mediaClassName} {...props} />
    </div>
  )
}
export function EmptyTitle({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      {...stylexProps(className, styles.title)}
      data-slot="empty-title"
      {...props}
    />
  )
}
export function EmptyDescription({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <div
      {...stylexProps(className, styles.description)}
      data-slot="empty-description"
      {...props}
    />
  )
}
export function EmptyContent({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      {...stylexProps(className, styles.content)}
      data-slot="empty-content"
      {...props}
    />
  )
}
