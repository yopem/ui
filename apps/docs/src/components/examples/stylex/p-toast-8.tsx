"use client"
import * as stylex from "@stylexjs/stylex"
import { useRef, useState } from "react"

import { Button } from "@/components/ui/stylex/button"
import { Spinner } from "@/components/ui/stylex/spinner"
import { anchoredToastManager } from "@/components/ui/stylex/toast"

export default function Particle() {
  const submitRef = useRef<HTMLButtonElement>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const toastIdRef = useRef<string | null>(null)

  function handleSubmit() {
    if (!submitRef.current || isSubmitting) return

    if (toastIdRef.current) {
      anchoredToastManager.close(toastIdRef.current)
      toastIdRef.current = null
    }

    setIsSubmitting(true)

    new Promise<void>((_, reject) => {
      setTimeout(() => {
        setIsSubmitting(false)
        reject(
          new Error("The server is not responding. Please try again later."),
        )
      }, 2000)
    }).catch((error: Error) => {
      toastIdRef.current = anchoredToastManager.add({
        description: error.message,
        positionerProps: {
          anchor: submitRef.current,
          sideOffset: 4,
        },
        title: "Error submitting form",
        type: "error",
      })
    })
  }

  return (
    <Button
      disabled={isSubmitting}
      onClick={handleSubmit}
      ref={submitRef}
      variant="outline"
    >
      {isSubmitting ? (
        <>
          <Spinner {...stylex.props(exampleStyles.icon)} />
          Submitting…
        </>
      ) : (
        "Submit"
      )}
    </Button>
  )
}

const exampleStyles = stylex.create({
  icon: {
    blockSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    inlineSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    flexShrink: 0,
    pointerEvents: "none",
    opacity: 0.8,
    marginInline: "-0.125rem",
  },
})
