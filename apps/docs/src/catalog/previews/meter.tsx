import * as stylex from "@stylexjs/stylex"

import { Flex } from "@/components/ui/flex"
import {
  Meter,
  MeterIndicator,
  MeterLabel,
  MeterTrack,
  MeterValue,
} from "@/components/ui/meter"
const styles = stylex.create({
  flex: {
    alignItems: "center",
    justifyContent: "space-between",
    gap: "calc(0.25rem * 2)",
  },
})
export function Preview() {
  return (
    <Meter aria-label="Storage usage" value={75}>
      <Flex xstyle={styles.flex}>
        <MeterLabel>Storage usage</MeterLabel>
        <MeterValue />
      </Flex>
      <MeterTrack>
        <MeterIndicator />
      </MeterTrack>
    </Meter>
  )
}
