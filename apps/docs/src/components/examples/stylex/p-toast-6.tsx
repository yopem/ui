"use client"

import { useRef } from "react"

import { Button } from "@/components/ui/stylex/button"
import { toastManager } from "@/components/ui/stylex/toast"

const TEXTS = [
  "Short message.",
  "A bit longer message that spans two lines.",
  "This is a longer description that intentionally takes more vertical space to examplenstrate stacking with varying heights.",
  "An even longer description that should span multiple lines so we can verify the clamped collapsed height and smooth expansion animation when hovering or focusing the viewport.",
]

export default function Particle() {
  const countRef = useRef(0)

  function createToast() {
    countRef.current += 1
    const description = TEXTS[Math.floor(Math.random() * TEXTS.length)]
    toastManager.add({
      description,
      title: `Toast ${countRef.current} created`,
    })
  }

  return (
    <Button onClick={createToast} variant="outline">
      With Varying Heights
    </Button>
  )
}
