"use client"

import { ArrowRightIcon, MicIcon } from "lucide-react"

import { Button } from "@/components/ui/tailwind/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupText,
  InputGroupTextarea,
} from "@/components/ui/tailwind/input-group"
import {
  Tooltip,
  TooltipPopup,
  TooltipTrigger,
} from "@/components/ui/tailwind/tooltip"

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
                className="rounded-full"
                size="icon-sm"
                variant="ghost"
              />
            }
          >
            <MicIcon />
          </TooltipTrigger>
          <TooltipPopup>Record voice message</TooltipPopup>
        </Tooltip>
        <InputGroupText className="text-muted-foreground ml-auto text-xs">
          Press Enter to send
        </InputGroupText>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                aria-label="Send message"
                className="rounded-full"
                size="icon-sm"
              />
            }
          >
            <ArrowRightIcon />
          </TooltipTrigger>
          <TooltipPopup>Send</TooltipPopup>
        </Tooltip>
      </InputGroupAddon>
    </InputGroup>
  )
}
