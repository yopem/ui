"use client"
import * as stylex from "@stylexjs/stylex"
import { InfoIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Tooltip, TooltipPopup, TooltipTrigger } from "@/components/ui/tooltip"

export default function Example() {
  return (
    <InputGroup>
      <InputGroupAddon>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                aria-label="More information"
                size="icon-xs"
                variant="ghost"
              />
            }
          >
            <InfoIcon {...stylex.props(exampleStyles.icon)} />
          </TooltipTrigger>
          <TooltipPopup>Enter your username</TooltipPopup>
        </Tooltip>
      </InputGroupAddon>
      <InputGroupInput
        aria-label="Username"
        placeholder="Username"
        type="text"
      />
    </InputGroup>
  )
}

const exampleStyles = stylex.create({
  icon: {
    blockSize: { default: "1rem", "@media (min-width: 640px)": "0.875rem" },
    inlineSize: { default: "1rem", "@media (min-width: 640px)": "0.875rem" },
    flexShrink: 0,
    pointerEvents: "none",
    opacity: 0.8,
    marginInline: "-0.125rem",
  },
})
