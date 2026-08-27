"use client"

import * as stylex from "@stylexjs/stylex"
import { useState } from "react"

import { Fieldset, FieldsetLegend } from "@/components/ui/stylex/fieldset"
import { Slider } from "@/components/ui/stylex/slider"

const min = 5
const max = 1240

export default function Particle() {
  const [values, setValues] = useState([min, max])

  const formatPrice = (price: number) =>
    price === max ? `$${price.toLocaleString()}+` : `$${price.toLocaleString()}`

  return (
    <Fieldset {...stylex.props(demoStyles.demo1)}>
      <FieldsetLegend {...stylex.props(demoStyles.demo2)}>
        From {formatPrice(values[0] ?? min)} to {formatPrice(values[1] ?? max)}
      </FieldsetLegend>
      <Slider
        aria-label="Price range"
        {...stylex.props(demoStyles.demo3)}
        max={max}
        min={min}
        name="price-range"
        onValueChange={(v) => setValues(Array.isArray(v) ? [...v] : [v])}
        value={values}
      />
    </Fieldset>
  )
}

const demoStyles = stylex.create({
  demo1: {
    display: "flex",
    inlineSize: "100%",
    flexDirection: "column",
    gap: "calc(0.25rem * 3)",
  },
  demo2: {
    fontVariantNumeric: "   tabular-nums ",
  },
  demo3: {
    flex: "1",
  },
})
