"use client"

import { Box } from "@registry/components/ui/box"
import { Marquee } from "@registry/components/ui/marquee"

export function Preview() {
  return (
    <Marquee>
      <Box as="span">Design systems</Box>
      <Box as="span">Accessible components</Box>
      <Box as="span">Reusable source</Box>
    </Marquee>
  )
}
