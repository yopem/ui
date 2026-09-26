"use client"

import { Clipboard } from "@registry/components/ui/clipboard"

export function Preview() {
  return (
    <>
      <Clipboard value="https://example.com">Copy link</Clipboard>
      <Clipboard aria-label="Unavailable copy" disabled value="not copied">
        Disabled copy
      </Clipboard>
    </>
  )
}
