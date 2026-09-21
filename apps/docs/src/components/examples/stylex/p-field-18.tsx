"use client"

import type { FormEvent } from "react"

import * as stylex from "@stylexjs/stylex"
import { useState } from "react"

import { Box } from "@/components/ui/stylex/box"
import { Button } from "@/components/ui/stylex/button"
import { Checkbox } from "@/components/ui/stylex/checkbox"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/stylex/field"
import { Flex } from "@/components/ui/stylex/flex"
import { Form } from "@/components/ui/stylex/form"
import { Input } from "@/components/ui/stylex/input"
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/stylex/select"
export default function Example() {
  const [loading, setLoading] = useState(false)
  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    setLoading(true)
    await new Promise((r) => setTimeout(r, 800))
    setLoading(false)
    const data = {
      email: formData.get("email"),
      fullName: formData.get("fullName"),
      newsletter: formData.get("newsletter"),
      role: formData.get("role"),
    }
    alert(
      `Full name: ${data.fullName || ""}\nEmail: ${data.email || ""}\nRole: ${
        data.role || ""
      }\nNewsletter: ${data.newsletter}`,
    )
  }
  return (
    <Form {...stylex.props(exampleStyles.example1)} onSubmit={onSubmit}>
      <Field name="fullName">
        <FieldLabel>
          Full Name{" "}
          <Box as="span" {...stylex.props(exampleStyles.example2)}>
            *
          </Box>
        </FieldLabel>
        <Input placeholder="John Doe" required type="text" />
        <FieldError>Please enter a valid name.</FieldError>
      </Field>

      <Field name="email">
        <FieldLabel>
          Email{" "}
          <Box as="span" {...stylex.props(exampleStyles.example2)}>
            *
          </Box>
        </FieldLabel>
        <Input placeholder="john@example.com" required type="email" />
        <FieldError>Please enter a valid email.</FieldError>
      </Field>

      <Field name="role">
        <FieldLabel>Role</FieldLabel>
        <Select
          items={[
            { label: "Select your role", value: null },
            { label: "Developer", value: "developer" },
            { label: "Designer", value: "designer" },
            { label: "Product Manager", value: "manager" },
            { label: "Other", value: "other" },
          ]}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectPopup>
            <SelectItem value="developer">Developer</SelectItem>
            <SelectItem value="designer">Designer</SelectItem>
            <SelectItem value="manager">Product Manager</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectPopup>
        </Select>
        <FieldDescription>This is an optional field</FieldDescription>
      </Field>

      <Field name="newsletter">
        <Flex {...stylex.props(exampleStyles.example3)}>
          <Checkbox />
          <FieldLabel {...stylex.props(exampleStyles.example4)}>
            Subscribe to newsletter
          </FieldLabel>
        </Flex>
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
    flexDirection: "column",
    gap: "calc(0.25rem * 4)",
  },
  example2: {
    color: "var(--destructive)",
  },
  example3: {
    display: "flex",
    alignItems: "center",
    gap: "calc(0.25rem * 2)",
  },
  example4: {
    cursor: "pointer",
  },
})
