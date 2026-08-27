"use client"

import { InfoIcon } from "lucide-react"

import { Button } from "@/components/ui/tailwind/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/tailwind/input-group"
import { Label } from "@/components/ui/tailwind/label"
import {
  Popover,
  PopoverPopup,
  PopoverTrigger,
} from "@/components/ui/tailwind/popover"

export default function Particle() {
  return (
    <InputGroup>
      <InputGroupInput id="email-1" placeholder="team@coss.com" type="email" />
      <InputGroupAddon align="block-start">
        <Label className="text-foreground" htmlFor="email-1">
          Email
        </Label>
        <Popover>
          <PopoverTrigger
            className="ml-auto"
            openOnHover
            render={<Button className="-m-1" size="icon-xs" variant="ghost" />}
          >
            <InfoIcon />
          </PopoverTrigger>
          <PopoverPopup side="top" tooltipStyle>
            <p>We&apos;ll use this to send you notifications</p>
          </PopoverPopup>
        </Popover>
      </InputGroupAddon>
    </InputGroup>
  )
}
