"use client"

import { Message, MessageContent } from "@registry/components/ui/message"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"

import { MessageBubble, MessageDemo } from "./message-demo-parts"

const styles = stylex.create({
  media: {
    aspectRatio: "16 / 9",
    borderRadius: tokens["--radius-sm"],
    display: "block",
    inlineSize: "100%",
    maxInlineSize: "16rem",
    objectFit: "cover",
  },
  link: {
    color: tokens["--foreground"],
    display: "block",
    fontSize: "0.875rem",
    textDecoration: "underline",
    textUnderlineOffset: "0.2em",
    ":focus-visible": {
      outlineColor: tokens["--ring"],
      outlineStyle: "solid",
      outlineWidth: 2,
      outlineOffset: 2,
    },
  },
})

export function Preview() {
  return (
    <MessageDemo>
      <Message align="end">
        <MessageContent>
          <img
            alt="Desks in the team workspace"
            height={144}
            loading="lazy"
            src="https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=512&auto=format&fit=crop&q=80"
            width={256}
            {...stylex.props(styles.media)}
          />
          <MessageBubble sent>
            Please add this photo to the report.
          </MessageBubble>
        </MessageContent>
      </Message>
      <Message>
        <MessageContent>
          <MessageBubble>
            Here are the meeting notes.
            <a
              download="Meeting notes.txt"
              href="data:text/plain;charset=utf-8,Meeting%20notes%0A"
              {...stylex.props(styles.link)}
            >
              Meeting notes.txt
            </a>
          </MessageBubble>
        </MessageContent>
      </Message>
    </MessageDemo>
  )
}
