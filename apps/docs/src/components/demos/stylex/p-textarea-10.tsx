import * as stylex from "@stylexjs/stylex"
import { useId } from "react"

import { Textarea } from "@/components/ui/stylex/textarea"

export default function Particle() {
  const id = useId()
  return (
    <Textarea
      {...stylex.props(demoStyles.demo1)}
      defaultValue="This is a read-only textarea"
      id={id}
      readOnly
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
