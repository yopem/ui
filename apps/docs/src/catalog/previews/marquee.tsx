"use client"

import { Box } from "@registry/components/ui/box"
import { Marquee } from "@registry/components/ui/marquee"

export function Preview() {
  return (
    <Marquee>
      <Box render={<span />}>Design systems</Box>
      <Box render={<span />}>Accessible components</Box>
      <Box render={<span />}>Reusable source</Box>
    </Marquee>
  )
}
