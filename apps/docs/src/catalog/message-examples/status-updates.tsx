"use client"

import { Box } from "@registry/components/ui/box"
import {
  Message,
  MessageContent,
  MessageFooter,
} from "@registry/components/ui/message"
import { Spinner } from "@registry/components/ui/spinner"

import { MessageDemo } from "./message-demo-parts"

export function Preview() {
  return (
    <MessageDemo>
      <Message>
        <MessageContent>
          <MessageFooter>
            <Spinner aria-label="Checking the logs" size={16} />
            <Box render={<span aria-hidden="true" />}>Checking the logs…</Box>
          </MessageFooter>
        </MessageContent>
      </Message>
    </MessageDemo>
  )
}
