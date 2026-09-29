import { Flex } from "@registry/components/ui/flex"
import {
  Meter,
  MeterIndicator,
  MeterLabel,
  MeterTrack,
  MeterValue,
} from "@registry/components/ui/meter"
import * as stylex from "@stylexjs/stylex"

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
