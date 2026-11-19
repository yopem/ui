"use client"

import type { ReactNode } from "react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@registry/components/ui/avatar"
import { Box } from "@registry/components/ui/box"
import { MessageAvatar } from "@registry/components/ui/message"
import { Stack } from "@registry/components/ui/stack"
import { Text } from "@registry/components/ui/text"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"

const photos = {
  CB: "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=96&h=96&fit=crop",
  YO: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=96&h=96&fit=crop",
}

const styles = stylex.create({
  demo: { inlineSize: "100%", maxInlineSize: "26rem" },
  bubble: {
    backgroundColor: tokens["--muted"],
    borderRadius: tokens["--radius"],
    color: tokens["--foreground"],
    paddingBlock: "0.625rem",
    paddingInline: "0.875rem",
  },
  blue: {
    backgroundColor: tokens["--accent-solid"],
    color: tokens["--accent-solid-foreground"],
  },
  text: { color: "inherit", fontSize: "0.875rem", lineHeight: 1.5 },
})

export function MessageDemo({ children }: { children: ReactNode }) {
  return <Stack xstyle={styles.demo}>{children}</Stack>
}

export function MessageBubble({
  children,
  sent,
}: {
  children: ReactNode
  sent?: boolean
}) {
  return (
    <Box xstyle={[styles.bubble, sent && styles.blue]}>
      <Text xstyle={styles.text}>{children}</Text>
    </Box>
  )
}

export function MessagePortrait({
  initials,
}: {
  initials: keyof typeof photos
}) {
  return (
    <MessageAvatar aria-hidden="true">
      <Avatar>
        <AvatarImage alt="" src={photos[initials]} />
        <AvatarFallback xstyle={styles.blue}>{initials}</AvatarFallback>
      </Avatar>
    </MessageAvatar>
  )
}
