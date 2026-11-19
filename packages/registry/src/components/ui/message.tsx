import type { StyleXComponentProps } from "@registry/lib/stylex"
import type { ComponentProps } from "react"

import { mergeStylexProps, stylexProps } from "@registry/lib/stylex"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"

type MessageSlotProps = StyleXComponentProps<ComponentProps<"div">>

const styles = stylex.create({
  group: {
    display: "flex",
    flexDirection: "column",
    gap: `calc(${tokens["--spacing"]} * 2)`,
    minInlineSize: 0,
  },
  root: {
    alignItems: "flex-start",
    display: "flex",
    fontSize: "0.875rem",
    gap: `calc(${tokens["--spacing"]} * 2)`,
    inlineSize: "100%",
    minInlineSize: 0,
  },
  end: { alignItems: "flex-end", flexDirection: "row-reverse" },
  avatar: {
    alignItems: "center",
    alignSelf: "flex-end",
    display: "flex",
    flexShrink: 0,
    justifyContent: "center",
    minInlineSize: `calc(${tokens["--spacing"]} * 8)`,
  },
  content: {
    alignItems: "inherit",
    alignSelf: "stretch",
    display: "flex",
    flex: 1,
    flexDirection: "column",
    gap: `calc(${tokens["--spacing"]} * 2)`,
    minInlineSize: 0,
    overflowWrap: "anywhere",
  },
  metadata: {
    alignItems: "center",
    color: tokens["--muted-foreground"],
    display: "flex",
    flexWrap: "wrap",
    fontSize: "0.75rem",
    fontWeight: 500,
    gap: tokens["--spacing"],
    maxInlineSize: "100%",
    minInlineSize: 0,
  },
})

export function MessageGroup({
  className,
  xstyle,
  ...props
}: MessageSlotProps) {
  return (
    <div
      data-slot="message-group"
      {...mergeStylexProps(stylexProps(className, styles.group, xstyle), props)}
    />
  )
}

export function Message({
  align = "start",
  className,
  xstyle,
  ...props
}: StyleXComponentProps<ComponentProps<"div">, { align?: "start" | "end" }>) {
  return (
    <div
      data-slot="message"
      data-align={align}
      {...mergeStylexProps(
        stylexProps(
          className,
          styles.root,
          align === "end" && styles.end,
          xstyle,
        ),
        props,
      )}
    />
  )
}

export function MessageAvatar({
  className,
  xstyle,
  ...props
}: MessageSlotProps) {
  return (
    <div
      data-slot="message-avatar"
      {...mergeStylexProps(
        stylexProps(className, styles.avatar, xstyle),
        props,
      )}
    />
  )
}

export function MessageContent({
  className,
  xstyle,
  ...props
}: MessageSlotProps) {
  return (
    <div
      data-slot="message-content"
      {...mergeStylexProps(
        stylexProps(className, styles.content, xstyle),
        props,
      )}
    />
  )
}

export function MessageHeader({
  className,
  xstyle,
  ...props
}: MessageSlotProps) {
  return (
    <div
      data-slot="message-header"
      {...mergeStylexProps(
        stylexProps(className, styles.metadata, xstyle),
        props,
      )}
    />
  )
}

export function MessageFooter({
  className,
  xstyle,
  ...props
}: MessageSlotProps) {
  return (
    <div
      data-slot="message-footer"
      {...mergeStylexProps(
        stylexProps(className, styles.metadata, xstyle),
        props,
      )}
    />
  )
}
