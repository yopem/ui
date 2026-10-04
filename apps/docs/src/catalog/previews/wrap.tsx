"use client"

import { Box } from "@registry/components/ui/box"
import { Wrap } from "@registry/components/ui/wrap"

export function Preview() {
  return (
    <Wrap>
      <Box as="span">Design</Box>
      <Box as="span">Development</Box>
      <Box as="span">Accessibility</Box>
      <Box as="span">Documentation</Box>
    </Wrap>
  )
}
