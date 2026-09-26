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
      <StatLabel>Requests</StatLabel>
      <StatValue>1,248</StatValue>
      <StatDescription>Last 30 days</StatDescription>
    </Stat>
  )
}
