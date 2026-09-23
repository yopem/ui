"use client"

import type { FormEvent } from "react"

import * as stylex from "@stylexjs/stylex"
import { useState } from "react"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Form } from "@/components/ui/form"
import { Input } from "@/components/ui/input"

const schema = z.object({
  age: z.coerce
    .number({ message: "Please enter a number." })
    .positive({ message: "Number must be positive." }),
  name: z.string().min(1, { message: "Please enter a name." }),
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
    errors: {} as Errors,
  }
}

export default function Example() {
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Errors>({})

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    setLoading(true)
    const response = submitForm(event)
    await new Promise((r) => setTimeout(r, 800))
    setErrors(response.errors)
    setLoading(false)
    if (Object.keys(response.errors).length === 0) {
      alert(
        `Name: ${String(formData.get("name") || "")}\nAge: ${String(
          formData.get("age") || "",
        )}`,
      )
    }
  }

  return (
    <Form
      {...stylex.props(exampleStyles.example1)}
      errors={errors}
      onSubmit={onSubmit}
    >
      <Field name="name">
        <FieldLabel>Name</FieldLabel>
        <Input placeholder="Enter name" />
        <FieldError />
      </Field>
      <Field name="age">
        <FieldLabel>Age</FieldLabel>
        <Input placeholder="Enter age" />
        <FieldError />
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
    maxInlineSize: "calc(0.25rem * 64)",
    flexDirection: "column",
    gap: "calc(0.25rem * 4)",
  },
})
