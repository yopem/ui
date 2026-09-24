import { Flex } from "@/components/ui/flex"
import {
  Meter,
  MeterIndicator,
  MeterLabel,
  MeterTrack,
  MeterValue,
} from "@/components/ui/meter"
export function Preview() {
  return (
    <Meter aria-label="Storage usage" value={75}>
      <Flex
        alignItems={"center"}
        justifyContent={"space-between"}
        gap={"calc(0.25rem * 2)"}
      >
        <MeterLabel>Storage usage</MeterLabel>
        <MeterValue />
      </Flex>
      <MeterTrack>
        <MeterIndicator />
      </MeterTrack>
    </Meter>
  )
}
