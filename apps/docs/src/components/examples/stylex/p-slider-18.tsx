import * as stylex from "@stylexjs/stylex"

import { Slider } from "@/components/ui/stylex/slider"

export default function Example() {
  return (
    <div {...stylex.props(exampleStyles.example1)}>
      <Slider defaultValue={[25, 75]} orientation="vertical" />
    </div>
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
