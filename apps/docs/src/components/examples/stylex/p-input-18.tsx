"use client"

import * as stylex from "@stylexjs/stylex"
import { useState } from "react"

import { Field, FieldDescription } from "@/components/ui/stylex/field"
import { Input } from "@/components/ui/stylex/input"

export default function Particle() {
  const maxLength = 14
  const [value, setValue] = useState("")

  return (
    <Field>
      <Input
        aria-label="Code"
        maxLength={maxLength}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Enter code"
        type="text"
        value={value}
      />
      <FieldDescription>
        <span {...stylex.props(exampleStyles.example1)}>
          {maxLength - value.length}
        </span>{" "}
        characters left
      </FieldDescription>
    </Field>
  )
}

const exampleStyles = stylex.create({
  example1: {
    fontVariantNumeric: "   tabular-nums ",
  },
})
