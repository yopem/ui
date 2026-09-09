"use client"

import * as stylex from "@stylexjs/stylex"
import { ArrowRightIcon, MicIcon } from "lucide-react"

import { Button } from "@/components/ui/stylex/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupText,
  InputGroupTextarea,
} from "@/components/ui/stylex/input-group"
import {
  Tooltip,
  TooltipPopup,
  TooltipTrigger,
} from "@/components/ui/stylex/tooltip"

export default function Particle() {
  return (
    <InputGroup>
      <InputGroupTextarea placeholder="Type a message…" />
      <InputGroupAddon align="block-end">
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                aria-label="Voice message"
                {...stylex.props(demoStyles.demo1)}
                size="icon-sm"
                variant="ghost"
              />
            }
          >
            <MicIcon {...stylex.props(demoStyles.icon)} />
          </TooltipTrigger>
          <TooltipPopup>Record voice message</TooltipPopup>
        </Tooltip>
        <InputGroupText {...stylex.props(demoStyles.demo2)}>
          Press Enter to send
        </InputGroupText>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                aria-label="Send message"
                {...stylex.props(demoStyles.demo1)}
                size="icon-sm"
              />
            }
          >
            <ArrowRightIcon {...stylex.props(demoStyles.icon)} />
          </TooltipTrigger>
          <TooltipPopup>Send</TooltipPopup>
        </Tooltip>
      </InputGroupAddon>
    </InputGroup>
  )
}

const demoStyles = stylex.create({
  icon: {
    blockSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    inlineSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    flexShrink: 0,
    pointerEvents: "none",
    opacity: 0.8,
    marginInline: "-0.125rem",
  },
  demo1: {
    borderRadius: "calc(infinity * 1px)",
  },
  demo2: {
    marginInlineStart: "auto",
    fontSize: "0.75rem",
    lineHeight: "calc(1 / 0.75)",
    color: "var(--muted-foreground)",
  },
})
