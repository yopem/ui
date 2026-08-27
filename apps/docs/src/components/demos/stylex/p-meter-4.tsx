"use client"

import * as stylex from "@stylexjs/stylex"

import {
  Meter,
  MeterIndicator,
  MeterLabel,
  MeterTrack,
  MeterValue,
} from "@/components/ui/stylex/meter"

export default function Particle() {
  return (
    <Meter max={1000} min={500} value={700}>
      <div {...stylex.props(demoStyles.demo1)}>
        <MeterLabel>Bandwidth (Mbps)</MeterLabel>
        <MeterValue>{(_formatted, value) => value}</MeterValue>
      </div>
      <MeterTrack>
        <MeterIndicator />
      </MeterTrack>
    </Meter>
  )
}

const demoStyles = stylex.create({
  demo1: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "calc(0.25rem * 2)",
  },
})
