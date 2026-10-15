"use client"

import { Heading } from "@registry/components/ui/heading"
import { Prose } from "@registry/components/ui/prose"
import { Text } from "@registry/components/ui/text"

export function Preview({ embedded = false }: { embedded?: boolean }) {
  return (
    <Prose>
      <Heading
        render={
          embedded ? <h4>Readable content</h4> : <h2>Readable content</h2>
        }
      />
      <Text>Give long-form content room to breathe.</Text>
    </Prose>
  )
}
