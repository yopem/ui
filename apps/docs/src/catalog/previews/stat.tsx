"use client"

import {
  Stat,
  StatDescription,
  StatLabel,
  StatValue,
} from "@registry/components/ui/stat"

export function Preview() {
  return (
    <Stat>
      <StatLabel>Observations</StatLabel>
      <StatValue>386</StatValue>
      <StatDescription>This field season</StatDescription>
    </Stat>
  )
}
