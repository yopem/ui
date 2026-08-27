"use client"

import * as stylex from "@stylexjs/stylex"
import { MinusIcon, PlusIcon } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/stylex/button"
import { Field, FieldLabel } from "@/components/ui/stylex/field"
import { Slider } from "@/components/ui/stylex/slider"

const min = 0
const max = 200
const step = 5

export default function Particle() {
  const [value, setValue] = useState(100)

  return (
    <Field name="credits">
      <FieldLabel {...stylex.props(demoStyles.demo1)}>
        {value} credits/mo
      </FieldLabel>
      <div {...stylex.props(demoStyles.demo2)}>
        <Button
          aria-label="Decrease value"
          disabled={value === min}
          onClick={() => setValue(Math.max(min, value - step))}
          size="icon"
          variant="outline"
        >
          <MinusIcon aria-hidden="true" />
        </Button>
        <Slider
          aria-label="Credits slider"
          {...stylex.props(demoStyles.demo3)}
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
          <PlusIcon aria-hidden="true" />
        </Button>
      </div>
    </Field>
  )
}

const demoStyles = stylex.create({
  demo1: {
    fontVariantNumeric: "   tabular-nums ",
  },
  demo2: {
    display: "flex",
    alignItems: "center",
    gap: "calc(0.25rem * 2)",
  },
  demo3: {
    flex: "1",
  },
})
