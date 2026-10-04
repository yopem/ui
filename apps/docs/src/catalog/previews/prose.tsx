"use client"

import { Heading } from "@registry/components/ui/heading"
import { Prose } from "@registry/components/ui/prose"
import { Text } from "@registry/components/ui/text"

export function Preview() {
  return (
    <Prose>
      <Heading as="h2">Readable content</Heading>
      <Text>Give long-form content room to breathe.</Text>
    </Prose>
  )
}
