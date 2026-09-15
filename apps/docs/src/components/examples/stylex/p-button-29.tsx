import * as stylex from "@stylexjs/stylex"

import { Button } from "@/components/ui/stylex/button"

export default function Example() {
  return <Button {...stylex.props(exampleStyles.pill)}>Pill Button</Button>
}

const exampleStyles = stylex.create({
  pill: { borderRadius: "calc(infinity * 1px)" },
})
