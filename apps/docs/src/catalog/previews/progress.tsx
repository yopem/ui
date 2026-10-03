"use client"

import { Progress } from "@registry/components/ui/progress"
import { useLayoutEffect, useState } from "react"

export function Preview() {
  const [value, setValue] = useState(20)

  useLayoutEffect(() => {
    const interval = setInterval(() => {
      setValue((current) =>
        Math.min(100, Math.round(current + Math.random() * 25)),
      )
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  return <Progress aria-label="Upload progress" value={value} />
}
