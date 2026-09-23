import type { StyleComponentProps, StyleProps } from "@registry/lib/style-props"
import type React from "react"

import { mergeStyleProps, stylexProps } from "@registry/lib/stylex"
import { themeMarker, tokens } from "@registry/styles/tokens.stylex"
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
    backgroundColor: tokens["--card"],
    blockSize: "2.25rem",
    borderColor: tokens["--border"],
    borderRadius: tokens["--radius-md"],
    borderStyle: "solid",
    borderWidth: 1,
    boxShadow: {
      default: "0 1px 2px color-mix(in oklab, #000 5%, transparent)",
      [stylex.when.ancestor('[data-theme="dark"]', themeMarker)]:
        "0 -1px 0 color-mix(in oklab, #fff 6%, transparent)",
    },
    color: tokens["--foreground"],
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
    fontFamily: tokens["--font-heading"],
    fontSize: "1.25rem",
    fontWeight: 600,
  },
  description: {
    color: tokens["--muted-foreground"],
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

export function Empty({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleComponentProps<React.ComponentProps<"div">>) {
  const props: Omit<typeof restProps, keyof StyleProps> = restProps
  const xstyle = consumerXstyle

  return (
    <div
      data-slot="empty"
      {...mergeStyleProps(stylexProps(className, styles.root, xstyle), props)}
    />
  )
}
export function EmptyHeader({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleComponentProps<React.ComponentProps<"div">>) {
  const props: Omit<typeof restProps, keyof StyleProps> = restProps
  const xstyle = consumerXstyle

  return (
    <div
      data-slot="empty-header"
      {...mergeStyleProps(stylexProps(className, styles.header, xstyle), props)}
    />
  )
}
export function EmptyMedia({
  xstyle: consumerXstyle,
  className,
  variant = "default",
  ...restProps
}: StyleComponentProps<
  React.ComponentProps<"div">,
  {
    variant?: keyof typeof mediaVariantStyles
  }
>) {
  const props: Omit<typeof restProps, keyof StyleProps> = restProps
  const xstyle = consumerXstyle

  const mediaClassName = emptyMediaVariants({ className, variant })
  return (
    <div
      data-slot="empty-media"
      data-variant={variant}
      {...mergeStyleProps(
        stylexProps(className, styles.mediaRoot, xstyle),
        props,
      )}
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
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleComponentProps<React.ComponentProps<"div">>) {
  const props: Omit<typeof restProps, keyof StyleProps> = restProps
  const xstyle = consumerXstyle

  return (
    <div
      data-slot="empty-title"
      {...mergeStyleProps(stylexProps(className, styles.title, xstyle), props)}
    />
  )
}
export function EmptyDescription({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleComponentProps<React.ComponentProps<"p">>) {
  const props: Omit<typeof restProps, keyof StyleProps> = restProps
  const xstyle = consumerXstyle

  return (
    <div
      data-slot="empty-description"
      {...mergeStyleProps(
        stylexProps(className, styles.description, xstyle),
        props,
      )}
    />
  )
}
export function EmptyContent({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleComponentProps<React.ComponentProps<"div">>) {
  const props: Omit<typeof restProps, keyof StyleProps> = restProps
  const xstyle = consumerXstyle

  return (
    <div
      data-slot="empty-content"
      {...mergeStyleProps(
        stylexProps(className, styles.content, xstyle),
        props,
      )}
    />
  )
}
