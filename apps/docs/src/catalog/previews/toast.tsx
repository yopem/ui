"use client"

import { Button } from "@registry/components/ui/button"
import { toastManager } from "@registry/components/ui/toast"

function handleClick() {
  toastManager.add({
    description: "Monday, January 3rd at 6:00pm",
    title: "Event has been created",
  })
}

export function Preview() {
  return (
    <Button onClick={handleClick} variant="outline">
      Default Toast
    </Button>
  )
}
