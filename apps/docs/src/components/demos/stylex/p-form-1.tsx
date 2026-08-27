"use client"

import type { FormEvent } from "react"

import * as stylex from "@stylexjs/stylex"
import { useState } from "react"

import { Button } from "@/components/ui/stylex/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/stylex/field"
import { Form } from "@/components/ui/stylex/form"
import { Input } from "@/components/ui/stylex/input"

export default function Particle() {
  const [loading, setLoading] = useState(false)
  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    setLoading(true)
    await new Promise((r) => setTimeout(r, 800))
    setLoading(false)
    alert(`Email: ${formData.get("email") || ""}`)
  }

  return (
    <Form {...stylex.props(demoStyles.demo1)} onSubmit={onSubmit}>
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

const demoStyles = stylex.create({
  demo1: {
    display: "flex",
    inlineSize: "100%",
    maxInlineSize: "calc(0.25rem * 64)",
    flexDirection: "column",
    gap: "calc(0.25rem * 4)",
  },
})
