"use client"

import * as stylex from "@stylexjs/stylex"
import { useState } from "react"

import { Fieldset, FieldsetLegend } from "@/components/ui/fieldset"
import { Slider } from "@/components/ui/slider"

const min = 5
const max = 1240

export default function Example() {
  const [values, setValues] = useState([min, max])

  const formatPrice = (price: number) =>
    price === max ? `$${price.toLocaleString()}+` : `$${price.toLocaleString()}`

  return (
    <Fieldset {...stylex.props(exampleStyles.example1)}>
      <FieldsetLegend {...stylex.props(exampleStyles.example2)}>
        From {formatPrice(values[0] ?? min)} to {formatPrice(values[1] ?? max)}
      </FieldsetLegend>
      <Slider
        aria-label="Price range"
        {...stylex.props(exampleStyles.example3)}
        max={max}
        min={min}
        name="price-range"
        onValueChange={(v) => setValues(Array.isArray(v) ? [...v] : [v])}
        value={values}
      />
    </Fieldset>
  )
}

const exampleStyles = stylex.create({
  example1: {
    display: "flex",
    inlineSize: "100%",
    flexDirection: "column",
    gap: "calc(0.25rem * 3)",
  },
  example2: {
    fontVariantNumeric: "   tabular-nums ",
  },
  example3: {
    flex: "1",
  },
})
