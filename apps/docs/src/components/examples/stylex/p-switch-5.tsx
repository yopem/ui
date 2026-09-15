"use client"

import type { FormEvent } from "react"

import * as stylex from "@stylexjs/stylex"
import { useState } from "react"

import { Button } from "@/components/ui/stylex/button"
import { Field, FieldLabel } from "@/components/ui/stylex/field"
import { Form } from "@/components/ui/stylex/form"
import { Switch } from "@/components/ui/stylex/switch"

export default function Example() {
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    setLoading(true)
    await new Promise((r) => setTimeout(r, 800))
    setLoading(false)
    console.info(formData.get("marketing"))

    const enabled = formData.get("marketing")
    alert(`Marketing emails: ${enabled}`)
  }

  return (
    <Form {...stylex.props(exampleStyles.example1)} onSubmit={onSubmit}>
      <Field name="marketing">
        <FieldLabel>
          <Switch defaultChecked name="marketing" />
          Enable marketing emails
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
    flexDirection: "column",
    gap: "calc(0.25rem * 4)",
  },
})
