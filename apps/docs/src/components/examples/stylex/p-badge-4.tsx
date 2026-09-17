import * as stylex from "@stylexjs/stylex"

import { Badge } from "@/components/ui/stylex/badge"

export default function Example() {
  return (
    <Badge variant="destructive" xstyle={exampleStyles.destructive}>
      Badge
    </Badge>
  )
}

const exampleStyles = stylex.create({
  destructive: {
    backgroundColor: "color-mix(in oklab, var(--destructive) 80%, #000)",
  },
})
