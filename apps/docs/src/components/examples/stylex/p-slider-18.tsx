import * as stylex from "@stylexjs/stylex"

import { Flex } from "@/components/ui/stylex/flex"
import { Slider } from "@/components/ui/stylex/slider"
export default function Example() {
  return (
    <Flex {...stylex.props(exampleStyles.example1)}>
      <Slider
        aria-label="Range"
        defaultValue={[25, 75]}
        orientation="vertical"
      />
    </Flex>
  )
}

const exampleStyles = stylex.create({
  example1: {
    display: "flex",
    blockSize: "calc(0.25rem * 40)",
    alignItems: "center",
    justifyContent: "center",
  },
})
