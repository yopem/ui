"use client"

import * as stylex from "@stylexjs/stylex"
import { ArrowRightIcon, MicIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupText,
  InputGroupTextarea,
} from "@/components/ui/input-group"
import { Tooltip, TooltipPopup, TooltipTrigger } from "@/components/ui/tooltip"

export default function Example() {
  return (
    <InputGroup>
      <InputGroupTextarea placeholder="Type a message…" />
      <InputGroupAddon align="block-end">
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                aria-label="Voice message"
                {...stylex.props(exampleStyles.example1)}
                size="icon-sm"
                variant="ghost"
              />
            }
          >
            <MicIcon {...stylex.props(exampleStyles.icon)} />
          </TooltipTrigger>
          <TooltipPopup>Record voice message</TooltipPopup>
        </Tooltip>
        <InputGroupText {...stylex.props(exampleStyles.example2)}>
          Press Enter to send
        </InputGroupText>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                aria-label="Send message"
                {...stylex.props(exampleStyles.example1)}
                size="icon-sm"
              />
            }
          >
            <ArrowRightIcon {...stylex.props(exampleStyles.icon)} />
          </TooltipTrigger>
          <TooltipPopup>Send</TooltipPopup>
        </Tooltip>
      </InputGroupAddon>
    </InputGroup>
  )
}

const exampleStyles = stylex.create({
  icon: {
    blockSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    inlineSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    flexShrink: 0,
    pointerEvents: "none",
    opacity: 0.8,
    marginInline: "-0.125rem",
  },
  example1: {
    borderRadius: "calc(infinity * 1px)",
  },
  example2: {
    marginInlineStart: "auto",
    fontSize: "0.75rem",
    lineHeight: "calc(1 / 0.75)",
    color: "var(--muted-foreground)",
  },
})
