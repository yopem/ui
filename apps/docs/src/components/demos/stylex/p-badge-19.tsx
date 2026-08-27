"use client"

import * as stylex from "@stylexjs/stylex"
import { CheckIcon } from "lucide-react"
import { useId, useState } from "react"

import { Badge } from "@/components/ui/stylex/badge"
import { Checkbox } from "@/components/ui/stylex/checkbox"

export default function Particle() {
  const id = useId()
  const [checked, setChecked] = useState(true)
  return (
    <Badge
      {...stylex.props(demoStyles.report1, !checked && demoStyles.unchecked)}
    >
      <Checkbox
        {...stylex.props(demoStyles.report2)}
        checked={checked}
        id={id}
        onCheckedChange={(value) => setChecked(value === true)}
      />
      <CheckIcon
        aria-hidden="true"
        {...stylex.props(demoStyles.report3, checked && demoStyles.checkedIcon)}
      />
      <label {...stylex.props(demoStyles.demo1)} htmlFor={id}>
        Selectable
      </label>
    </Badge>
  )
}

const demoStyles = stylex.create({
  demo1: {
    cursor: "pointer",
    WebkitUserSelect: "none",
    userSelect: "none",
    "::after": {
      content: '""',
      position: "absolute",
      inset: "0px",
    },
  },
  report1: {
    position: "relative",
    outlineStyle: "none",
    ":focus-within": {
      borderColor: "var(--ring)",
      boxShadow: "0 0 0 3px color-mix(in oklab, var(--ring) 50%, transparent)",
    },
  },
  unchecked: {
    backgroundColor: "var(--muted)",
    color: "var(--muted-foreground)",
  },
  report2: {
    blockSize: "1px",
    clipPath: "inset(50%)",
    inlineSize: "1px",
    margin: "-1px",
    overflow: "hidden",
    padding: 0,
    position: "absolute",
  },
  report3: {
    display: "none",
  },
  checkedIcon: {
    display: "block",
  },
})
