"use client"

import { Box } from "@registry/components/ui/box"
import { Wrap } from "@registry/components/ui/wrap"

export function Preview() {
  return (
    <Wrap>
      <Box render={<span />}>Birds</Box>
      <Box render={<span />}>Water</Box>
      <Box render={<span />}>Trails</Box>
      <Box render={<span />}>Weather</Box>
    </Wrap>
  )
}
