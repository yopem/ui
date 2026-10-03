"use client"

import type { FormEvent } from "react"

import { Button } from "@registry/components/ui/button"
import { Field, FieldError, FieldLabel } from "@registry/components/ui/field"
import { Form } from "@registry/components/ui/form"
import { Input } from "@registry/components/ui/input"
import * as stylex from "@stylexjs/stylex"
import { useState, useMemo } from "react"

const styles = stylex.create({
  form: {
    display: "flex",
    inlineSize: "100%",
    maxInlineSize: "calc(0.25rem * 64)",
    flexDirection: "column",
    gap: "calc(0.25rem * 4)",
  },
})

export function Preview() {
  const [loading, setLoading] = useState(false)

  const onSubmit = useMemo(
    () =>
      async function onSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        setLoading(true)
        await new Promise((r) => setTimeout(r, 800))
        setLoading(false)
        alert(`Email: ${formData.get("email") || ""}`)
      },
    [setLoading],
  )

  return (
    <Form xstyle={styles.form} onSubmit={onSubmit}>
      <Field name="email">
        <FieldLabel>Email</FieldLabel>
        <Input placeholder="you@example.com" required type="email" />
        <FieldError>Please enter a valid email.</FieldError>
      </Field>
      <Button loading={loading} type="submit">
        Submit
      </Button>
    </Form>
  )
}
