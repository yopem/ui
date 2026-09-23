"use client"

import type { FormEvent } from "react"

import * as stylex from "@stylexjs/stylex"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Field, FieldItem, FieldLabel } from "@/components/ui/field"
import { Fieldset, FieldsetLegend } from "@/components/ui/fieldset"
import { Form } from "@/components/ui/form"
import { Radio, RadioGroup } from "@/components/ui/radio-group"

export default function Example() {
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    setLoading(true)
    await new Promise((r) => setTimeout(r, 800))
    setLoading(false)
    alert(`Selected: ${formData.get("frameworks")}`)
  }

  return (
    <Form {...stylex.props(exampleStyles.example1)} onSubmit={onSubmit}>
      <Field
        {...stylex.props(exampleStyles.example2)}
        name="frameworks"
        render={(props) => <Fieldset {...props} />}
      >
        <FieldsetLegend {...stylex.props(exampleStyles.example3)}>
          Frameworks
        </FieldsetLegend>
        <RadioGroup defaultValue="next">
          <FieldItem>
            <FieldLabel>
              <Radio value="next" /> Next.js
            </FieldLabel>
          </FieldItem>
          <FieldItem>
            <FieldLabel>
              <Radio value="vite" /> Vite
            </FieldLabel>
          </FieldItem>
          <FieldItem>
            <FieldLabel>
              <Radio value="astro" /> Astro
            </FieldLabel>
          </FieldItem>
        </RadioGroup>
      </Field>
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
    maxInlineSize: "160px",
    flexDirection: "column",
    gap: "calc(0.25rem * 4)",
  },
  example2: {
    gap: "calc(0.25rem * 2)",
  },
  example3: {
    fontSize: "0.875rem",
    lineHeight: "calc(1.25 / 0.875)",
    fontWeight: "500",
  },
})
