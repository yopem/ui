import * as stylex from "@stylexjs/stylex"
import { useId } from "react"

import { Input } from "@/components/ui/stylex/input"

export default function Particle() {
  const id = useId()
  return (
    <Input
      {...stylex.props(demoStyles.demo1)}
      defaultValue="This is a read-only input"
      id={id}
      readOnly
      type="text"
    />
  )
}

const demoStyles = stylex.create({
  demo1: {
    backgroundColor: {
      default: null,
      ":read-only": "var(--muted)",
    },
  },
})
