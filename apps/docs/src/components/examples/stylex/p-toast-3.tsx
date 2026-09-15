"use client"

import { Button } from "@/components/ui/stylex/button"
import { toastManager } from "@/components/ui/stylex/toast"

export default function Example() {
  return (
    <Button
      onClick={() => {
        toastManager.add({
          description: "Please wait while we process your request.",
          title: "Loading…",
          type: "loading",
        })
      }}
      variant="outline"
    >
      Loading Toast
    </Button>
  )
}
