"use client"

import { Field, FieldLabel } from "@registry/components/ui/field"
import { Stack } from "@registry/components/ui/stack"
import { Textarea } from "@registry/components/ui/textarea"
import { EditorMathPreview } from "@yopem-ui/editor/math"
import { useState } from "react"

export function Preview() {
  const [tex, setTex] = useState("x^2")

  return (
    <Stack>
      <Field>
        <FieldLabel>TeX preview</FieldLabel>
        <Textarea
          value={tex}
          maxLength={4096}
          onChange={(event) => setTex(event.target.value)}
        />
      </Field>
      <EditorMathPreview value={{ kind: "inline", tex }} />
    </Stack>
  )
}
