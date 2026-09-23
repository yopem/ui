"use client"

import * as stylex from "@stylexjs/stylex"
import { MinusIcon, PlusIcon } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Field, FieldLabel } from "@/components/ui/field"
import { Flex } from "@/components/ui/flex"
import { Slider } from "@/components/ui/slider"
const min = 0
const max = 200
const step = 5

export default function Example() {
  const [value, setValue] = useState(100)

  return (
    <Field name="credits">
      <FieldLabel {...stylex.props(exampleStyles.example1)}>
        {value} credits/mo
      </FieldLabel>
      <Flex {...stylex.props(exampleStyles.example2)}>
        <Button
          aria-label="Decrease value"
          disabled={value === min}
          onClick={() => setValue(Math.max(min, value - step))}
          size="icon"
          variant="outline"
        >
          <MinusIcon {...stylex.props(exampleStyles.icon)} aria-hidden="true" />
        </Button>
        <Slider
          aria-label="Credits slider"
          {...stylex.props(exampleStyles.example3)}
          max={max}
          min={min}
          onValueChange={(v) => setValue(Array.isArray(v) ? v[0] : v)}
          step={step}
          value={value}
        />
        <Button
          aria-label="Increase value"
          disabled={value === max}
          onClick={() => setValue(Math.min(max, value + step))}
          size="icon"
          variant="outline"
        >
          <PlusIcon {...stylex.props(exampleStyles.icon)} aria-hidden="true" />
        </Button>
      </Flex>
    </Field>
  )
}

const exampleStyles = stylex.create({
  icon: {
    blockSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    inlineSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    flexShrink: 0,
    pointerEvents: "none",
    opacity: 0.8,
    marginInline: "-0.125rem",
  },
  example1: {
    fontVariantNumeric: "   tabular-nums ",
  },
  example2: {
    display: "flex",
    alignItems: "center",
    gap: "calc(0.25rem * 2)",
  },
  example3: {
    flex: "1",
  },
})
