"use client"

import { Button } from "@registry/components/ui/button"
import { Clipboard } from "@registry/components/ui/clipboard"
import {
  Message,
  MessageContent,
  MessageFooter,
} from "@registry/components/ui/message"
import { useEventCallback } from "@registry/hooks/use-event-callback"
import {
  CopyIcon,
  RefreshCcwIcon,
  ThumbsDownIcon,
  ThumbsUpIcon,
} from "lucide-react"
import { useState } from "react"

import { MessageBubble, MessageDemo } from "./message-demo-parts"

const response = "I can send the notes this afternoon."

export function Preview() {
  const [reaction, setReaction] = useState<"like" | "dislike" | null>(null)
  const [sent, setSent] = useState(false)

  const handleLike = useEventCallback(() => {
    setReaction((current) => (current === "like" ? null : "like"))
  })

  const handleDislike = useEventCallback(() => {
    setReaction((current) => (current === "dislike" ? null : "dislike"))
  })

  const handleRetry = useEventCallback(() => {
    setSent(true)
  })

  return (
    <MessageDemo>
      <Message>
        <MessageContent>
          <MessageBubble>{response}</MessageBubble>
          <MessageFooter>
            <Clipboard aria-label="Copy message" value={response}>
              <CopyIcon size={16} aria-hidden="true" />
            </Clipboard>
            <Button
              aria-label="Like message"
              aria-pressed={reaction === "like"}
              onClick={handleLike}
              size="icon"
              variant={reaction === "like" ? "secondary" : "ghost"}
            >
              <ThumbsUpIcon size={16} aria-hidden="true" />
            </Button>
            <Button
              aria-label="Dislike message"
              aria-pressed={reaction === "dislike"}
              onClick={handleDislike}
              size="icon"
              variant={reaction === "dislike" ? "secondary" : "ghost"}
            >
              <ThumbsDownIcon size={16} aria-hidden="true" />
            </Button>
          </MessageFooter>
        </MessageContent>
      </Message>
      <Message align="end">
        <MessageContent>
          <MessageBubble sent>Please send them to the team.</MessageBubble>
          <MessageFooter>
            <output>{sent ? "Sent" : "Failed to send"}</output>
            <Button
              aria-disabled={sent}
              aria-label="Retry send"
              onClick={handleRetry}
              size="icon"
              variant="ghost"
            >
              <RefreshCcwIcon size={16} aria-hidden="true" />
            </Button>
          </MessageFooter>
        </MessageContent>
      </Message>
    </MessageDemo>
  )
}
