"use client"

import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageGroup,
  MessageHeader,
} from "@registry/components/ui/message"

import {
  MessageBubble,
  MessageDemo,
  MessagePortrait,
} from "./message-demo-parts"

export function Preview() {
  return (
    <MessageDemo>
      <MessageGroup>
        <Message>
          <MessageAvatar aria-hidden="true" />
          <MessageContent>
            <MessageHeader>Casey</MessageHeader>
            <MessageBubble>The survey is complete.</MessageBubble>
          </MessageContent>
        </Message>
        <Message>
          <MessagePortrait initials="CB" />
          <MessageContent>
            <MessageBubble>I’ll share the results today.</MessageBubble>
          </MessageContent>
        </Message>
      </MessageGroup>
    </MessageDemo>
  )
}
