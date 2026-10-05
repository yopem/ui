"use client"

import { Box } from "@registry/components/ui/box"
import { Wrap } from "@registry/components/ui/wrap"

export function Preview() {
  return (
    <Wrap>
      <Box render={<span />}>Design</Box>
      <Box render={<span />}>Development</Box>
      <Box render={<span />}>Accessibility</Box>
      <Box render={<span />}>Documentation</Box>
    </Wrap>
  )
}
