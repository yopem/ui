"use client"

import { Progress } from "@registry/components/ui/progress"
import { useMemo, useRef, useState } from "react"

export function Preview() {
  const [value, setValue] = useState(20)

  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(
    undefined,
  )

  const startProgress = useMemo(
    () =>
      function startProgress(node: HTMLDivElement | null) {
        clearInterval(intervalRef.current)

        if (!node) return

        intervalRef.current = setInterval(() => {
          setValue((current) =>
            Math.min(100, Math.round(current + Math.random() * 25)),
          )
        }, 1000)
      },
    [],
  )

  return (
    <Progress aria-label="Upload progress" ref={startProgress} value={value} />
  )
}
