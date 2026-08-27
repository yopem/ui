import * as stylex from "@stylexjs/stylex"

import { Slider } from "@/components/ui/stylex/slider"

export default function Particle() {
  return (
    <div {...stylex.props(demoStyles.demo1)}>
      <Slider defaultValue={[25, 75]} orientation="vertical" />
    </div>
  )
}

const demoStyles = stylex.create({
  demo1: {
    display: "flex",
    blockSize: "calc(0.25rem * 40)",
    alignItems: "center",
    justifyContent: "center",
  },
})
