"use client"

import { Heading } from "@registry/components/ui/heading"
import { Prose } from "@registry/components/ui/prose"
import { Text } from "@registry/components/ui/text"

export function Preview({ embedded = false }: { embedded?: boolean }) {
  return (
    <Prose>
      <Heading
        render={
          embedded ? (
            <h4>Before your field visit</h4>
          ) : (
            <h2>Before your field visit</h2>
          )
        }
      />
      <Text>
        Check the weather. Collect your kit. Tell the station which trail you
        will use.
      </Text>
    </Prose>
  )
}
