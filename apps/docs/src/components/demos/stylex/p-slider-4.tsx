import * as stylex from "@stylexjs/stylex"

import { Slider } from "@/components/ui/stylex/slider"

export default function Particle() {
  return (
    <div>
      <Slider
        aria-label="Storage size in GB"
        defaultValue={15}
        max={35}
        min={5}
      />
      <fieldset
        aria-label="Storage size reference values"
        {...stylex.props(demoStyles.demo1)}
      >
        <span>5 GB</span>
        <span>20 GB</span>
        <span>35 GB</span>
      </fieldset>
    </div>
  )
}

const demoStyles = stylex.create({
  demo1: {
    marginBlockStart: "calc(0.25rem * 4)",
    display: "flex",
    inlineSize: "100%",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "0.25rem",
    fontSize: "0.75rem",
    lineHeight: "calc(1 / 0.75)",
    fontWeight: "500",
    color: "var(--muted-foreground)",
  },
})
