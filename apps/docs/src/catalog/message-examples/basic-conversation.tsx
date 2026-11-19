"use client"

import { Message, MessageContent } from "@registry/components/ui/message"
import { Stack } from "@registry/components/ui/stack"
import * as stylex from "@stylexjs/stylex"

import { MessageBubble, MessagePortrait } from "./message-demo-parts"

const styles = stylex.create({
  thumbnail: { inlineSize: "100%", maxInlineSize: "16rem", gap: "0.75rem" },
})

export function Preview() {
  return (
    <Stack xstyle={styles.thumbnail}>
      <Message>
        <MessagePortrait initials="CB" />
        <MessageContent>
          <MessageBubble>Are the notes ready?</MessageBubble>
        </MessageContent>
      </Message>
      <Message align="end">
        <MessagePortrait initials="YO" />
        <MessageContent>
          <MessageBubble sent>I’ll send them shortly.</MessageBubble>
        </MessageContent>
      </Message>
    </Stack>
  )
}
