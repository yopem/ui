"use client"

import { useState } from "react"

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/tailwind/input-group"

export default function Particle() {
  const maxLength = 14
  const [value, setValue] = useState("")

  return (
    <InputGroup>
      <InputGroupInput
        aria-label="Username"
        maxLength={maxLength}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Enter username"
        type="text"
        value={value}
      />
      <InputGroupAddon align="inline-end">
        <output
          aria-live="polite"
          className="text-muted-foreground flex items-center gap-2 truncate text-xs tabular-nums [&_svg]:pointer-events-none [&_svg]:-mx-0.5 in-[[data-slot=input-group]:has([data-slot=input-control],[data-slot=textarea-control])]:[&_svg:not([class*='size-'])]:size-4.5 sm:in-[[data-slot=input-group]:has([data-slot=input-control],[data-slot=textarea-control])]:[&_svg:not([class*='size-'])]:size-4"
        >
          {value.length}/{maxLength}
        </output>
      </InputGroupAddon>
    </InputGroup>
  )
}
