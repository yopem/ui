"use client"

import type { FormEvent } from "react"

import { useState } from "react"

import { Button } from "@/components/ui/tailwind/button"
import { Field, FieldDescription } from "@/components/ui/tailwind/field"
import { Fieldset, FieldsetLegend } from "@/components/ui/tailwind/fieldset"
import { Form } from "@/components/ui/tailwind/form"
import { Slider, SliderValue } from "@/components/ui/tailwind/slider"

export default function Particle() {
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
    <Form className="flex w-full flex-col gap-4" onSubmit={onSubmit}>
      <Fieldset className="flex w-full flex-col items-stretch gap-3">
        <Field>
          <Slider name="volume" onValueChange={setValue} value={value}>
            <div className="mb-2 flex items-center justify-between gap-1">
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
