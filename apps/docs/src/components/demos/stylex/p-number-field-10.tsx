"use client"

import type { FormEvent } from "react"

import * as stylex from "@stylexjs/stylex"
import { useState } from "react"
import { z } from "zod"

import { Button } from "@/components/ui/stylex/button"
import { Field } from "@/components/ui/stylex/field"
import { Form } from "@/components/ui/stylex/form"
import {
  NumberField,
  NumberFieldDecrement,
  NumberFieldGroup,
  NumberFieldIncrement,
  NumberFieldInput,
  NumberFieldScrubArea,
} from "@/components/ui/stylex/number-field"

const schema = z.object({
  quantity: z.coerce
    .number({ message: "Please enter a quantity." })
    .min(1, { message: "Quantity must be at least 1." })
    .max(100, { message: "Maximum quantity is 100." }),
})

type Errors = Record<string, string | string[]>

function submitForm(event: FormEvent<HTMLFormElement>) {
  event.preventDefault()

  const formData = new FormData(event.currentTarget)
  const result = schema.safeParse(Object.fromEntries(formData))

  if (!result.success) {
    const { fieldErrors } = z.flattenError(result.error)
    return { errors: fieldErrors as Errors }
  }

  return {
    data: result.data,
    errors: {} as Errors,
  }
}

export default function Particle() {
  const [loading, setLoading] = useState(false)

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    setLoading(true)
    const response = submitForm(event)
    await new Promise((r) => setTimeout(r, 800))
    setLoading(false)
    if (Object.keys(response.errors).length === 0) {
      alert(`Quantity: ${response.data?.quantity}`)
    }
  }

  return (
    <Form {...stylex.props(demoStyles.demo1)} onSubmit={onSubmit}>
      <Field name="quantity">
        <NumberField defaultValue={1} max={100} min={1}>
          <NumberFieldScrubArea label="Quantity" />
          <NumberFieldGroup>
            <NumberFieldDecrement />
            <NumberFieldInput />
            <NumberFieldIncrement />
          </NumberFieldGroup>
        </NumberField>
      </Field>

      <Button loading={loading} type="submit">
        Submit
      </Button>
    </Form>
  )
}

const demoStyles = stylex.create({
  demo1: {
    display: "flex",
    inlineSize: "100%",
    maxInlineSize: "calc(0.25rem * 64)",
    flexDirection: "column",
    gap: "calc(0.25rem * 4)",
  },
})
