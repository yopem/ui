"use client"
import * as stylex from "@stylexjs/stylex"
import { InfoIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Paragraph } from "@/components/ui/paragraph"
import { Popover, PopoverPopup, PopoverTrigger } from "@/components/ui/popover"
export default function Example() {
  return (
    <InputGroup>
      <InputGroupInput
        aria-label="Password"
        placeholder="Password"
        type="password"
      />
      <InputGroupAddon align="inline-end">
        <Popover>
          <PopoverTrigger
            openOnHover
            render={
              <Button
                aria-label="Password requirements"
                size="icon-xs"
                variant="ghost"
              />
            }
          >
            <InfoIcon {...stylex.props(exampleStyles.icon)} />
          </PopoverTrigger>
          <PopoverPopup side="top" tooltipStyle>
            <Paragraph>Min. 8 characters</Paragraph>
          </PopoverPopup>
        </Popover>
      </InputGroupAddon>
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
