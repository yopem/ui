"use client"

import * as stylex from "@stylexjs/stylex"
import { ImageIcon, PaperclipIcon } from "lucide-react"

import { Button } from "@/components/ui/stylex/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupTextarea,
} from "@/components/ui/stylex/input-group"
import {
  Tooltip,
  TooltipPopup,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/stylex/tooltip"

export default function Particle() {
  return (
    <InputGroup>
      <InputGroupTextarea placeholder="Compose your message…" rows={4} />
      <InputGroupAddon align="block-end" {...stylex.props(demoStyles.demo1)}>
        <TooltipProvider>
          <div {...stylex.props(demoStyles.demo2)}>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    aria-label="Attach file"
                    size="icon-sm"
                    variant="ghost"
                  />
                }
              >
                <PaperclipIcon {...stylex.props(demoStyles.icon)} />
              </TooltipTrigger>
              <TooltipPopup>Attach file</TooltipPopup>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    aria-label="Insert image"
                    size="icon-sm"
                    variant="ghost"
                  />
                }
              >
                <ImageIcon {...stylex.props(demoStyles.icon)} />
              </TooltipTrigger>
              <TooltipPopup>Insert image</TooltipPopup>
            </Tooltip>
          </div>
        </TooltipProvider>
        <Button size="sm">Send</Button>
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
    justifyContent: "space-between",
  },
  demo2: {
    display: "flex",
    gap: "0.25rem",
  },
})
