"use client"

import { Button } from "@/components/ui/stylex/button"
import { toastManager } from "@/components/ui/stylex/toast"

export default function Example() {
  return (
    <Button
      onClick={() => {
        toastManager.add({
          description: "Monday, January 3rd at 6:00pm",
          title: "Event has been created",
        })
      }}
      variant="outline"
    >
      Default Toast
    </Button>
  )
}
