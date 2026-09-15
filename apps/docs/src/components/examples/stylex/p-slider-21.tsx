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
    <Fieldset {...stylex.props(exampleStyles.example1)}>
      <FieldsetLegend>Object position</FieldsetLegend>
      <div {...stylex.props(exampleStyles.example2)}>
        {(["x", "y", "z"] as const).map((axis) => (
          <div {...stylex.props(exampleStyles.example3)} key={axis}>
            <Label {...stylex.props(exampleStyles.example4)}>
              {axis.toUpperCase()}
            </Label>
            <Slider
              aria-label={`${axis.toUpperCase()} position`}
              {...stylex.props(exampleStyles.example5)}
              max={max}
              min={min}
              onValueChange={(v) =>
                updateValue(axis, Array.isArray(v) ? v[0] : v)
              }
              value={values[axis]}
            />
            <NumberField
              aria-label={`Enter ${axis.toUpperCase()} value`}
              {...stylex.props(exampleStyles.example6)}
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
        {...stylex.props(exampleStyles.example7)}
        onClick={() => setValues(defaultValues)}
        variant="outline"
      >
        <RotateCcwIcon
          aria-hidden="true"
          {...stylex.props(exampleStyles.icon, exampleStyles.example8)}
        />
        Reset
      </Button>
    </Fieldset>
  )
}

const exampleStyles = stylex.create({
  icon: {
    blockSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    inlineSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    flexShrink: 0,
    pointerEvents: "none",
    marginInline: "-0.125rem",
  },
  example1: {
    display: "flex",
    inlineSize: "100%",
    flexDirection: "column",
    gap: "calc(0.25rem * 4)",
  },
  example2: {
    display: "flex",
    flexDirection: "column",
    gap: "calc(0.25rem * 2)",
  },
  example3: {
    display: "flex",
    alignItems: "center",
    gap: "calc(0.25rem * 2)",
  },
  example4: {
    inlineSize: "calc(0.25rem * 3)",
    fontSize: "0.75rem",
    lineHeight: "calc(1 / 0.75)",
    color: "var(--muted-foreground)",
  },
  example5: {
    flex: "1",
  },
  example6: {
    inlineSize: "calc(0.25rem * 16)",
  },
  example7: {
    inlineSize: "100%",
  },
  example8: {
    marginInlineStart: "calc(0.25rem * -1)",
    opacity: "60%",
  },
})
