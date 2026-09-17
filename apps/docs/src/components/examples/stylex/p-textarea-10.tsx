import * as stylex from "@stylexjs/stylex"
import { useId } from "react"

import { Textarea } from "@/components/ui/stylex/textarea"

export default function Example() {
  const id = useId()
  return (
    <Textarea
      aria-label="Read-only textarea"
      {...stylex.props(exampleStyles.example1)}
      defaultValue="This is a read-only textarea"
      id={id}
      readOnly
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
