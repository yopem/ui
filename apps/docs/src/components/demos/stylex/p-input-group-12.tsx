"use client"

import * as stylex from "@stylexjs/stylex"
import { InfoIcon } from "lucide-react"

import { Button } from "@/components/ui/stylex/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/stylex/input-group"
import { Label } from "@/components/ui/stylex/label"
import {
  Popover,
  PopoverPopup,
  PopoverTrigger,
} from "@/components/ui/stylex/popover"

export default function Particle() {
  return (
    <InputGroup>
      <InputGroupInput id="email-1" placeholder="team@coss.com" type="email" />
      <InputGroupAddon align="block-start">
        <Label {...stylex.props(demoStyles.demo1)} htmlFor="email-1">
          Email
        </Label>
        <Popover>
          <PopoverTrigger
            {...stylex.props(demoStyles.demo2)}
            openOnHover
            render={
              <Button
                {...stylex.props(demoStyles.demo3)}
                size="icon-xs"
                variant="ghost"
              />
            }
          >
            <InfoIcon {...stylex.props(demoStyles.icon)} />
          </PopoverTrigger>
          <PopoverPopup side="top" tooltipStyle>
            <p>We&apos;ll use this to send you notifications</p>
          </PopoverPopup>
        </Popover>
      </InputGroupAddon>
    </InputGroup>
  )
}

const demoStyles = stylex.create({
  icon: {
    blockSize: { default: "1rem", "@media (min-width: 640px)": "0.875rem" },
    inlineSize: { default: "1rem", "@media (min-width: 640px)": "0.875rem" },
    flexShrink: 0,
    pointerEvents: "none",
    opacity: 0.8,
    marginInline: "-0.125rem",
  },
  demo1: {
    color: "var(--foreground)",
  },
  demo2: {
    marginInlineStart: "auto",
  },
  demo3: {
    margin: "calc(0.25rem * -1)",
  },
})
