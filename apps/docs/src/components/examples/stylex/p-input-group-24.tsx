"use client"

import * as stylex from "@stylexjs/stylex"
import { useState } from "react"

import { Box } from "@/components/ui/box"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
export default function Example() {
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
        <Box
          as="output"
          aria-live="polite"
          {...stylex.props(exampleStyles.report1)}
        >
          {value.length}/{maxLength}
        </Box>
      </InputGroupAddon>
    </InputGroup>
  )
}

const exampleStyles = stylex.create({
  report1: {
    display: "flex",
    alignItems: "center",
    gap: "calc(0.25rem * 2)",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    fontSize: "0.75rem",
    lineHeight: "calc(1 / 0.75)",
    color: "var(--muted-foreground)",
    fontVariantNumeric: "   tabular-nums ",
  },
})
