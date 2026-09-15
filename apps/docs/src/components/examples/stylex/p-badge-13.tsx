import * as stylex from "@stylexjs/stylex"

import { Badge } from "@/components/ui/stylex/badge"

export default function Particle() {
  return <Badge {...stylex.props(exampleStyles.pill)}>7</Badge>
}

const exampleStyles = stylex.create({
  pill: { borderRadius: "calc(infinity * 1px)" },
})
