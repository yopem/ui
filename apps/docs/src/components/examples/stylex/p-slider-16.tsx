"use client"

import * as stylex from "@stylexjs/stylex"
import { useState } from "react"

import { Box } from "@/components/ui/stylex/box"
import { Field, FieldLabel } from "@/components/ui/stylex/field"
import { Flex } from "@/components/ui/stylex/flex"
import { Slider } from "@/components/ui/stylex/slider"
const labels = ["Awful", "Poor", "Okay", "Good", "Amazing"]

export default function Example() {
  const [value, setValue] = useState<number | readonly number[]>(3)

  const currentValue = Array.isArray(value) ? value[0] : value

  return (
    <Field>
      <Slider
        {...stylex.props(exampleStyles.report1)}
        aria-label="Rate your experience"
        max={5}
        min={1}
        onValueChange={setValue}
        value={value}
      >
        <Flex {...stylex.props(exampleStyles.example1)}>
          <FieldLabel>Rate your experience</FieldLabel>
          <Box as="span" {...stylex.props(exampleStyles.example2)}>
            {labels[currentValue - 1]}
          </Box>
        </Flex>
        <Box
          as="span"
          aria-hidden="true"
          {...stylex.props(exampleStyles.example3)}
        >
          😡
        </Box>
        <Box
          as="span"
          aria-hidden="true"
          {...stylex.props(exampleStyles.example4)}
        >
          😍
        </Box>
      </Slider>
    </Field>
  )
}

const exampleStyles = stylex.create({
  example1: {
    gridColumn: "span 3 / span 3",
    marginBlockEnd: "calc(0.25rem * 2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "0.25rem",
  },
  example2: {
    fontSize: "0.875rem",
    lineHeight: "calc(1.25 / 0.875)",
  },
  example3: {
    fontSize: "1.5rem",
    lineHeight: "calc(2 / 1.5)",
  },
  example4: {
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
