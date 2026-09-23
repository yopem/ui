import * as stylex from "@stylexjs/stylex"
import { useId } from "react"

import { Input } from "@/components/ui/input"

export default function Example() {
  const id = useId()
  return (
    <Input
      aria-label="Read-only input"
      {...stylex.props(exampleStyles.example1)}
      defaultValue="This is a read-only input"
      id={id}
      readOnly
      type="text"
    />
  )
}

const exampleStyles = stylex.create({
  example1: {
    backgroundColor: {
      default: null,
      ":read-only": "var(--muted)",
    },
  },
})
