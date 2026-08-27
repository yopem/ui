"use client"

import * as stylex from "@stylexjs/stylex"
import { useState } from "react"

import {
  NumberField,
  NumberFieldGroup,
  NumberFieldInput,
} from "@/components/ui/stylex/number-field"
import { Slider } from "@/components/ui/stylex/slider"

const min = 0
const max = 150

export default function Particle() {
  const [value, setValue] = useState(25)

  return (
    <div {...stylex.props(demoStyles.demo1)}>
      <Slider
        aria-label="Slider with input"
        {...stylex.props(demoStyles.demo2)}
        max={max}
        min={min}
        onValueChange={(v) => setValue(Array.isArray(v) ? v[0] : v)}
        value={value}
      />
      <NumberField
        aria-label="Enter slider value"
        {...stylex.props(demoStyles.demo3)}
        max={max}
        min={min}
        onValueChange={(v) => setValue(v ?? min)}
        render={<NumberFieldGroup />}
        size="sm"
        value={value}
      >
        <NumberFieldInput />
      </NumberField>
    </div>
  )
}

const demoStyles = stylex.create({
  demo1: {
    display: "flex",
    alignItems: "center",
    gap: "calc(0.25rem * 4)",
  },
  demo2: {
    flex: "1",
  },
  demo3: {
    inlineSize: "calc(0.25rem * 12)",
  },
})
