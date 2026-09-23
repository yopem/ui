"use client"

import * as stylex from "@stylexjs/stylex"

import { Flex } from "@/components/ui/flex"
import {
  Meter,
  MeterIndicator,
  MeterLabel,
  MeterTrack,
  MeterValue,
} from "@/components/ui/meter"
export default function Example() {
  return (
    <Meter max={1000} min={500} value={700}>
      <Flex {...stylex.props(exampleStyles.example1)}>
        <MeterLabel>Bandwidth (Mbps)</MeterLabel>
        <MeterValue>{(_formatted, value) => value}</MeterValue>
      </Flex>
      <MeterTrack>
        <MeterIndicator />
      </MeterTrack>
    </Meter>
  )
}

const exampleStyles = stylex.create({
  example1: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "calc(0.25rem * 2)",
  },
})
