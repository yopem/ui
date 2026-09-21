import * as stylex from "@stylexjs/stylex"

import { Flex } from "@/components/ui/stylex/flex"
import {
  Meter,
  MeterIndicator,
  MeterLabel,
  MeterTrack,
  MeterValue,
} from "@/components/ui/stylex/meter"
export default function Example() {
  return (
    <Meter aria-label="Storage usage" value={75}>
      <Flex {...stylex.props(exampleStyles.example1)}>
        <MeterLabel>Storage usage</MeterLabel>
        <MeterValue />
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
