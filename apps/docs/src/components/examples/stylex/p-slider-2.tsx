import * as stylex from "@stylexjs/stylex"

import { Field, FieldLabel } from "@/components/ui/stylex/field"
import { Slider, SliderValue } from "@/components/ui/stylex/slider"

export default function Particle() {
  return (
    <Field>
      <Slider defaultValue={50}>
        <div {...stylex.props(exampleStyles.example1)}>
          <FieldLabel {...stylex.props(exampleStyles.example2)}>
            Opacity
          </FieldLabel>
          <SliderValue />
        </div>
      </Slider>
    </Field>
  )
}

const exampleStyles = stylex.create({
  example1: {
    marginBlockEnd: "calc(0.25rem * 2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "0.25rem",
  },
  example2: {
    fontSize: "0.875rem",
    lineHeight: "calc(1.25 / 0.875)",
    fontWeight: "500",
  },
})
