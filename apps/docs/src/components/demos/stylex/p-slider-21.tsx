"use client"

import * as stylex from "@stylexjs/stylex"
import { RotateCcwIcon } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/stylex/button"
import { Fieldset, FieldsetLegend } from "@/components/ui/stylex/fieldset"
import { Label } from "@/components/ui/stylex/label"
import {
  NumberField,
  NumberFieldGroup,
  NumberFieldInput,
} from "@/components/ui/stylex/number-field"
import { Slider } from "@/components/ui/stylex/slider"

const min = -10
const max = 10
const defaultValues = { x: 0, y: 0, z: 0 }
const initialValues = { x: -2, y: 4, z: 2 }

export default function Particle() {
  const [values, setValues] = useState(initialValues)

  const updateValue = (axis: keyof typeof values, v: number | null) => {
    setValues((prev) => ({ ...prev, [axis]: v ?? 0 }))
  }

  return (
    <Fieldset {...stylex.props(demoStyles.demo1)}>
      <FieldsetLegend>Object position</FieldsetLegend>
      <div {...stylex.props(demoStyles.demo2)}>
        {(["x", "y", "z"] as const).map((axis) => (
          <div {...stylex.props(demoStyles.demo3)} key={axis}>
            <Label {...stylex.props(demoStyles.demo4)}>
              {axis.toUpperCase()}
            </Label>
            <Slider
              aria-label={`${axis.toUpperCase()} position`}
              {...stylex.props(demoStyles.demo5)}
              max={max}
              min={min}
              onValueChange={(v) =>
                updateValue(axis, Array.isArray(v) ? v[0] : v)
              }
              value={values[axis]}
            />
            <NumberField
              aria-label={`Enter ${axis.toUpperCase()} value`}
              {...stylex.props(demoStyles.demo6)}
              max={max}
              min={min}
              onValueChange={(v) => updateValue(axis, v)}
              render={<NumberFieldGroup />}
              size="sm"
              value={values[axis]}
            >
              <NumberFieldInput />
            </NumberField>
          </div>
        ))}
      </div>
      <Button
        {...stylex.props(demoStyles.demo7)}
        onClick={() => setValues(defaultValues)}
        variant="outline"
      >
        <RotateCcwIcon aria-hidden="true" {...stylex.props(demoStyles.demo8)} />
        Reset
      </Button>
    </Fieldset>
  )
}

const demoStyles = stylex.create({
  demo1: {
    display: "flex",
    inlineSize: "100%",
    flexDirection: "column",
    gap: "calc(0.25rem * 4)",
  },
  demo2: {
    display: "flex",
    flexDirection: "column",
    gap: "calc(0.25rem * 2)",
  },
  demo3: {
    display: "flex",
    alignItems: "center",
    gap: "calc(0.25rem * 2)",
  },
  demo4: {
    inlineSize: "calc(0.25rem * 3)",
    fontSize: "0.75rem",
    lineHeight: "calc(1 / 0.75)",
    color: "var(--muted-foreground)",
  },
  demo5: {
    flex: "1",
  },
  demo6: {
    inlineSize: "calc(0.25rem * 16)",
  },
  demo7: {
    inlineSize: "100%",
  },
  demo8: {
    marginInlineStart: "calc(0.25rem * -1)",
    opacity: "60%",
  },
})
