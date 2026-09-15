import * as stylex from "@stylexjs/stylex"

import { Slider } from "@/components/ui/stylex/slider"

const max = 12
const skipInterval = 2
const ticks = [...Array(max + 1)].map((_, i) => i)

export default function Particle() {
  return (
    <div>
      <Slider aria-label="Value selector" defaultValue={5} max={max} />
      <fieldset
        aria-label="Value scale from 0 to 12"
        {...stylex.props(exampleStyles.example1)}
      >
        {ticks.map((tick) => (
          <span {...stylex.props(exampleStyles.example2)} key={tick}>
            <span
              {...stylex.props(
                exampleStyles.tick,
                tick % skipInterval !== 0 && exampleStyles.minorTick,
              )}
            />
            <span
              {...stylex.props(
                tick % skipInterval !== 0 && exampleStyles.hiddenLabel,
              )}
            >
              {tick}
            </span>
          </span>
        ))}
      </fieldset>
    </div>
  )
}

const exampleStyles = stylex.create({
  example1: {
    marginBlockStart: "calc(0.25rem * 3)",
    display: "flex",
    inlineSize: "100%",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "0.25rem",
    paddingInline: "calc(0.25rem * 2.5)",
    fontSize: "0.75rem",
    lineHeight: "calc(1 / 0.75)",
    fontWeight: "500",
    color: "var(--muted-foreground)",
  },
  tick: {
    backgroundColor:
      "color-mix(in oklab, var(--muted-foreground) 72%, transparent)",
    blockSize: "0.25rem",
    inlineSize: "1px",
  },
  minorTick: {
    blockSize: "0.125rem",
  },
  hiddenLabel: {
    opacity: 0,
  },
  example2: {
    display: "flex",
    inlineSize: "0px",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "calc(0.25rem * 2)",
  },
})
