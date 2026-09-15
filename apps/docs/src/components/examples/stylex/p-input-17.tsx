import * as stylex from "@stylexjs/stylex"

import { Input } from "@/components/ui/stylex/input"

export default function Example() {
  return (
    <Input
      aria-label="Read-only input"
      {...stylex.props(exampleStyles.example1)}
      defaultValue="This is a read-only input"
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
