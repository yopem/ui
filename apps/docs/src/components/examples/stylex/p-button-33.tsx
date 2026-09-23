import * as stylex from "@stylexjs/stylex"

import { Button } from "@/components/ui/button"
import { Flex } from "@/components/ui/flex"
export default function Example() {
  return (
    <Flex xstyle={exampleStyles.example1}>
      <Button variant="ghost">Cancel</Button>
      <Button>Save</Button>
    </Flex>
  )
}

const exampleStyles = stylex.create({
  example1: {
    display: "inline-flex",
    alignItems: "center",
    gap: "calc(0.25rem * 2)",
  },
})
