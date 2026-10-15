"use client"

import { Box } from "@registry/components/ui/box"
import { Figcaption } from "@registry/components/ui/figcaption"

export function Preview() {
  return (
    <Box render={<figure />}>
      <svg viewBox="0 0 240 80" width="100%" height="80">
        <title>Route from the station to the observation point</title>
        <path d="M20 60H100V20H220" fill="none" stroke="currentColor" />
        <circle cx="20" cy="60" r="5" fill="currentColor" />
        <circle cx="220" cy="20" r="5" fill="currentColor" />
      </svg>
      <Figcaption>
        Survey route from the station to the observation point.
      </Figcaption>
    </Box>
  )
}
