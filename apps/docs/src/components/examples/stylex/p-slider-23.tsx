"use client"

import type { FormEvent } from "react"

import * as stylex from "@stylexjs/stylex"
import { useState } from "react"

import { Button } from "@/components/ui/stylex/button"
import { Field, FieldDescription } from "@/components/ui/stylex/field"
import { Fieldset, FieldsetLegend } from "@/components/ui/stylex/fieldset"
import { Form } from "@/components/ui/stylex/form"
import { Slider, SliderValue } from "@/components/ui/stylex/slider"

export default function Example() {
  const [loading, setLoading] = useState<boolean>(false)
  const [value, setValue] = useState<number | readonly number[]>([25, 75])

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    setLoading(true)
    await new Promise((r) => setTimeout(r, 800))
    setLoading(false)
    const volumes = formData.getAll("volume")
    alert(`Volume: ${volumes.join(", ")}`)
  }

  return (
    <Form {...stylex.props(exampleStyles.example1)} onSubmit={onSubmit}>
      <Fieldset {...stylex.props(exampleStyles.example2)}>
        <Field>
          <Slider name="volume" onValueChange={setValue} value={value}>
            <div {...stylex.props(exampleStyles.example3)}>
              <FieldsetLegend>Volume</FieldsetLegend>
              <SliderValue />
            </div>
          </Slider>
          <FieldDescription>Choose a value between 0 and 100</FieldDescription>
        </Field>
      </Fieldset>
      <Button loading={loading} type="submit">
        Submit
      </Button>
    </Form>
  )
}

const exampleStyles = stylex.create({
  example1: {
    display: "flex",
    inlineSize: "100%",
    flexDirection: "column",
    gap: "calc(0.25rem * 4)",
  },
  example2: {
    display: "flex",
    inlineSize: "100%",
    flexDirection: "column",
    alignItems: "stretch",
    gap: "calc(0.25rem * 3)",
  },
  example3: {
    marginBlockEnd: "calc(0.25rem * 2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "0.25rem",
  },
})
