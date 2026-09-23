"use client"

import type { FormEvent } from "react"

import * as stylex from "@stylexjs/stylex"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldLabel } from "@/components/ui/field"
import { Form } from "@/components/ui/form"

export default function Example() {
  const [loading, setLoading] = useState(false)
  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    setLoading(true)
    await new Promise((r) => setTimeout(r, 800))
    setLoading(false)
    const accepted = formData.get("terms")
    alert(`Terms: ${accepted}`)
  }
  return (
    <Form {...stylex.props(exampleStyles.example1)} onSubmit={onSubmit}>
      <Field name="terms">
        <FieldLabel>
          <Checkbox defaultChecked value="yes" />
          Accept terms and conditions
        </FieldLabel>
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
    inlineSize: "auto",
    flexDirection: "column",
    gap: "calc(0.25rem * 4)",
  },
})
