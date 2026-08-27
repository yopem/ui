import * as stylex from "@stylexjs/stylex"

import { Badge } from "@/components/ui/stylex/badge"

export default function Particle() {
  return <Badge {...stylex.props(demoStyles.pill)}>Badge</Badge>
}

const demoStyles = stylex.create({
  pill: { borderRadius: "calc(infinity * 1px)" },
})
