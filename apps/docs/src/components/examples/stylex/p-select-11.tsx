"use client"

import type { FormEvent } from "react"

import * as stylex from "@stylexjs/stylex"
import { useState } from "react"

import { Button } from "@/components/ui/stylex/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/stylex/field"
import { Form } from "@/components/ui/stylex/form"
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/stylex/select"

const items = [
  { label: "Next.js", value: "next" },
  { label: "Vite", value: "vite" },
  { label: "Astro", value: "astro" },
]

export default function Example() {
  const [loading, setLoading] = useState(false)
  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    setLoading(true)
    await new Promise((r) => setTimeout(r, 800))
    setLoading(false)
    alert(`Framework: ${formData.get("framework") || ""}`)
  }

  return (
    <Form {...stylex.props(exampleStyles.example1)} onSubmit={onSubmit}>
      <Field>
        <FieldLabel>Framework</FieldLabel>
        <Select
          aria-label="Select framework"
          items={items}
          name="framework"
          required
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a framework" />
          </SelectTrigger>
          <SelectPopup>
            {items.map(({ label, value }) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectPopup>
        </Select>
        <FieldDescription>Pick your favorite.</FieldDescription>
        <FieldError>Please select a value.</FieldError>
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
