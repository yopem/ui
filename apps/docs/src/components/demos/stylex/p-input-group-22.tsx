"use client"

import { XIcon } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/stylex/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/stylex/input-group"

export default function Particle() {
  const [value, setValue] = useState("Clear me")

  return (
    <InputGroup>
      <InputGroupInput
        aria-label="Text input with clear button"
        onChange={(e) => setValue(e.target.value)}
        placeholder="Enter text"
        type="text"
        value={value}
      />
      {value && (
        <InputGroupAddon align="inline-end">
          <Button
            aria-label="Clear input"
            onClick={() => setValue("")}
            size="icon-xs"
            variant="ghost"
          >
            <XIcon aria-hidden="true" />
          </Button>
        </InputGroupAddon>
      )}
    </InputGroup>
  )
}
