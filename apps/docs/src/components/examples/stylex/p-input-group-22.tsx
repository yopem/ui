"use client"
import * as stylex from "@stylexjs/stylex"
import { XIcon } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/stylex/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/stylex/input-group"

export default function Example() {
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
            <XIcon {...stylex.props(exampleStyles.icon)} aria-hidden="true" />
          </Button>
        </InputGroupAddon>
      )}
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
