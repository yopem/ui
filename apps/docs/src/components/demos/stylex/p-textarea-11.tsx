"use client"

import * as stylex from "@stylexjs/stylex"
import { useState } from "react"

import { Field, FieldDescription } from "@/components/ui/stylex/field"
import { Textarea } from "@/components/ui/stylex/textarea"

export default function Particle() {
  const maxLength = 280
  const [value, setValue] = useState("")

  return (
    <Field>
      <Textarea
        aria-label="Message"
        maxLength={maxLength}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Type your message here"
        value={value}
      />
      <FieldDescription>
        <span {...stylex.props(demoStyles.demo1)}>
          {maxLength - value.length}
        </span>{" "}
        characters left
      </FieldDescription>
    </Field>
  )
}

const demoStyles = stylex.create({
  demo1: {
    fontVariantNumeric: "   tabular-nums ",
  },
})
