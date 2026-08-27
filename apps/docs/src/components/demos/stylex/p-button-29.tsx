import * as stylex from "@stylexjs/stylex"

import { Button } from "@/components/ui/stylex/button"

export default function Particle() {
  return <Button {...stylex.props(demoStyles.pill)}>Pill Button</Button>
}

const demoStyles = stylex.create({
  pill: { borderRadius: "calc(infinity * 1px)" },
})
