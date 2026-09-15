import * as stylex from "@stylexjs/stylex"

import { Slider } from "@/components/ui/stylex/slider"

const bands = [
  { label: "60 Hz", value: 2 },
  { label: "250 Hz", value: 1 },
  { label: "1k", value: -1 },
  { label: "4k", value: -3 },
  { label: "16k", value: 2 },
]

export default function Example() {
  return (
    <div {...stylex.props(exampleStyles.example1)}>
      {bands.map((band) => (
        <Slider
          aria-label={band.label}
          defaultValue={band.value}
          key={band.label}
          max={5}
          min={-5}
          orientation="vertical"
        />
      ))}
    </div>
  )
}

const exampleStyles = stylex.create({
  example1: {
    display: "flex",
    blockSize: "calc(0.25rem * 48)",
    justifyContent: "center",
    gap: "calc(0.25rem * 8)",
  },
})
