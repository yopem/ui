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
const max = 50

export default function Example() {
  const [values, setValues] = useState([0, 20])

  const updateValue = (index: number, newValue: number | null) => {
    const v = newValue ?? min
    setValues((prev) => {
      const next = [...prev]
      if (index === 0) {
        // Min value: clamp to not exceed max value
        next[0] = Math.min(v, prev[1] ?? max)
      } else {
        // Max value: clamp to not go below min value
        next[1] = Math.max(v, prev[0] ?? min)
      }
      return next
    })
  }

  return (
    <div {...stylex.props(exampleStyles.example1)}>
      <NumberField
        aria-label="Minimum value"
        {...stylex.props(exampleStyles.example2)}
        max={values[1]}
        min={min}
        onValueChange={(v) => updateValue(0, v)}
        render={<NumberFieldGroup />}
        size="sm"
        value={values[0]}
      >
        <NumberFieldInput />
      </NumberField>
      <Slider
        aria-label="Dual range slider"
        {...stylex.props(exampleStyles.report1)}
        max={max}
        min={min}
        onValueChange={(v) => setValues(Array.isArray(v) ? [...v] : [v])}
        value={values}
      />
      <NumberField
        aria-label="Maximum value"
        {...stylex.props(exampleStyles.example2)}
        max={max}
        min={values[0]}
        onValueChange={(v) => updateValue(1, v)}
        render={<NumberFieldGroup />}
        size="sm"
        value={values[1]}
      >
        <NumberFieldInput />
      </NumberField>
    </div>
  )
}

const exampleStyles = stylex.create({
  example1: {
    display: "flex",
    alignItems: "center",
    gap: "calc(0.25rem * 2)",
  },
  example2: {
    inlineSize: "calc(0.25rem * 10)",
  },
  report1: {
    flex: "1",
  },
})
