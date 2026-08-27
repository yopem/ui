"use client"

import * as stylex from "@stylexjs/stylex"
import { useState } from "react"

import { Field, FieldLabel } from "@/components/ui/stylex/field"
import { Slider } from "@/components/ui/stylex/slider"

const labels = ["Awful", "Poor", "Okay", "Good", "Amazing"]

export default function Particle() {
  const [value, setValue] = useState<number | readonly number[]>(3)

  const currentValue = Array.isArray(value) ? value[0] : value

  return (
    <Field>
      <Slider
        {...stylex.props(demoStyles.report1)}
        aria-label="Rate your experience"
        max={5}
        min={1}
        onValueChange={setValue}
        value={value}
      >
        <div {...stylex.props(demoStyles.demo1)}>
          <FieldLabel>Rate your experience</FieldLabel>
          <span {...stylex.props(demoStyles.demo2)}>
            {labels[currentValue - 1]}
          </span>
        </div>
        <span aria-hidden="true" {...stylex.props(demoStyles.demo3)}>
          😡
        </span>
        <span aria-hidden="true" {...stylex.props(demoStyles.demo4)}>
          😍
        </span>
      </Slider>
    </Field>
  )
}

const demoStyles = stylex.create({
  demo1: {
    gridColumn: "span 3 / span 3",
    marginBlockEnd: "calc(0.25rem * 2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "0.25rem",
  },
  demo2: {
    fontSize: "0.875rem",
    lineHeight: "calc(1.25 / 0.875)",
  },
  demo3: {
    fontSize: "1.5rem",
    lineHeight: "calc(2 / 1.5)",
  },
  demo4: {
    order: "1",
    fontSize: "1.5rem",
    lineHeight: "calc(2 / 1.5)",
  },

  report1: {
    display: "grid",
    gridTemplateColumns: "auto 1fr auto",
    alignItems: "center",
    columnGap: "0.5rem",
  },
})
