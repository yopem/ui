"use client"

import * as stylex from "@stylexjs/stylex"
import { useState } from "react"

import { Checkbox } from "@/components/ui/checkbox"
import { CheckboxGroup } from "@/components/ui/checkbox-group"
import { Label } from "@/components/ui/label"

const frameworks = [
  { id: "next", name: "Next.js" },
  { id: "vite", name: "Vite" },
  { id: "astro", name: "Astro" },
]

export default function Example() {
  const [value, setValue] = useState<string[]>([])

  return (
    <CheckboxGroup
      allValues={frameworks.map((framework) => framework.id)}
      aria-labelledby="frameworks-caption"
      onValueChange={setValue}
      value={value}
    >
      <Label id="frameworks-caption">
        <Checkbox name="frameworks" parent />
        Frameworks
      </Label>

      {frameworks.map((framework) => (
        <Label {...stylex.props(exampleStyles.example1)} key={framework.id}>
          <Checkbox value={framework.id} />
          {framework.name}
        </Label>
      ))}
    </CheckboxGroup>
  )
}

const exampleStyles = stylex.create({
  example1: {
    marginInlineStart: "calc(0.25rem * 4)",
  },
})
