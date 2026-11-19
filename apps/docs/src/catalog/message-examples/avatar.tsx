"use client"

import {
  Message,
  MessageContent,
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
      <Message>
        <MessagePortrait initials="CB" />
        <MessageContent>
          <MessageHeader>Casey</MessageHeader>
          <MessageBubble>Hello from the field station.</MessageBubble>
        </MessageContent>
      </Message>
      <Message align="end">
        <MessagePortrait initials="YO" />
        <MessageContent>
          <MessageHeader>You</MessageHeader>
          <MessageBubble sent>Good to hear from you.</MessageBubble>
        </MessageContent>
      </Message>
    </MessageDemo>
  )
}
