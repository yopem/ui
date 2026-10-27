"use client"

import { useStableCallback } from "@base-ui/utils/useStableCallback"
import { Field, FieldLabel } from "@registry/components/ui/field"
import { Stack } from "@registry/components/ui/stack"
import { Textarea } from "@registry/components/ui/textarea"
import { EditorMathPreview, type EditorMathValue } from "@yopem-ui/editor/math"
import { useState, type ChangeEvent } from "react"

export function Preview() {
  const [value, setValue] = useState<EditorMathValue>({
    kind: "inline",
    tex: "x^2",
  })

  const handleChange = useStableCallback(function handleChange(
    event: ChangeEvent<HTMLTextAreaElement>,
  ) {
    setValue({ kind: "inline", tex: event.currentTarget.value })
  })

  return (
    <Stack>
      <Field>
        <FieldLabel>TeX preview</FieldLabel>
        <Textarea value={value.tex} maxLength={4096} onChange={handleChange} />
      </Field>
      <EditorMathPreview value={value} />
    </Stack>
  )
}
