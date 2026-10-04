"use client"

import { Text } from "@registry/components/ui/text"
import { VStack } from "@registry/components/ui/vstack"
import { useMediaQuery } from "@registry/hooks/use-media-query"

export function Preview() {
  const medium = useMediaQuery("md")
  const range = useMediaQuery("sm:max-lg")
  const maximum = useMediaQuery({ max: "md" })
  const raw = useMediaQuery("(min-width: 1280px)")

  return (
    <VStack>
      <Text data-testid="medium-query">Medium viewport: {String(medium)}</Text>
      <Text data-testid="range-query">Small to large: {String(range)}</Text>
      <Text data-testid="maximum-query">Below medium: {String(maximum)}</Text>
      <Text data-testid="raw-query">Raw wide query: {String(raw)}</Text>
    </VStack>
  )
}
