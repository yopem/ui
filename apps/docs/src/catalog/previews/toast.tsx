"use client"

import { Button } from "@registry/components/ui/button"
import { toastManager } from "@registry/components/ui/toast"

function handleClick() {
  toastManager.add({
    description: "East gate · Saturday at 07:00",
    title: "Field visit reserved",
  })
}

export function Preview() {
  return (
    <Button onClick={handleClick} variant="outline">
      Default Toast
    </Button>
  )
}
