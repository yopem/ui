"use client"

import { Box } from "@registry/components/ui/box"
import { Button } from "@registry/components/ui/button"
import { VStack } from "@registry/components/ui/vstack"
import { useEventCallback } from "@registry/hooks/use-event-callback"
import { useState } from "react"

export function Preview() {
  const [count, setCount] = useState(0)

  const increment = useEventCallback(function () {
    setCount(count + 1)
  })

  return (
    <VStack>
      <Button onClick={increment}>Increment count</Button>
      <Box as="output" aria-label="Count">
        Count: {count}
      </Box>
    </VStack>
  )
}
