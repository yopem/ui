"use client"

import * as stylex from "@stylexjs/stylex"
import { useState } from "react"

import { Flex } from "@/components/ui/flex"
import {
  NumberField,
  NumberFieldGroup,
  NumberFieldInput,
} from "@/components/ui/number-field"
import { Slider } from "@/components/ui/slider"
const min = 0
const max = 100

export default function Example() {
  const [value, setValue] = useState(25)

  return (
    <Flex {...stylex.props(exampleStyles.example1)}>
      <Slider
        aria-label="Vertical slider with input"
        max={max}
        min={min}
        onValueChange={(v) => setValue(Array.isArray(v) ? v[0] : v)}
        orientation="vertical"
        value={value}
      />
      <NumberField
        aria-label="Enter slider value"
        {...stylex.props(exampleStyles.example2)}
        max={max}
        min={min}
        onValueChange={(v) => setValue(v ?? min)}
        render={<NumberFieldGroup />}
        size="sm"
        value={value}
      >
        <NumberFieldInput aria-label="Slider value" />
      </NumberField>
    </Flex>
  )
}

const exampleStyles = stylex.create({
  example1: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "calc(0.25rem * 4)",
  },
  example2: {
    inlineSize: "calc(0.25rem * 16)",
  },
})
