"use client"

import type { FormEvent } from "react"

import { useState } from "react"

import { Button } from "@/components/ui/tailwind/button"
import { Field, FieldItem, FieldLabel } from "@/components/ui/tailwind/field"
import { Fieldset, FieldsetLegend } from "@/components/ui/tailwind/fieldset"
import { Form } from "@/components/ui/tailwind/form"
import { Radio, RadioGroup } from "@/components/ui/tailwind/radio-group"

export default function Particle() {
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
    <Form
      className="flex w-full max-w-[160px] flex-col gap-4"
      onSubmit={onSubmit}
    >
      <Field
        className="gap-2"
        name="frameworks"
        render={(props) => <Fieldset {...props} />}
      >
        <FieldsetLegend className="text-sm font-medium">
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
