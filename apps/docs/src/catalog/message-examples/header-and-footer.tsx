"use client"

import {
  Message,
  MessageContent,
  MessageFooter,
  MessageHeader,
} from "@registry/components/ui/message"

import { MessageBubble, MessageDemo } from "./message-demo-parts"

export function Preview() {
  return (
    <MessageDemo>
      <Message>
        <MessageContent>
          <MessageHeader>
            Casey · <time dateTime="2026-01-15T09:30">9:30 AM</time>
          </MessageHeader>
          <MessageBubble>The meeting starts in ten minutes.</MessageBubble>
          <MessageFooter>Delivered</MessageFooter>
        </MessageContent>
      </Message>
    </MessageDemo>
  )
}
