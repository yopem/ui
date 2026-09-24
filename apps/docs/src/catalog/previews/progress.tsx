"use client"

import { useEffect, useState } from "react"

import { Progress } from "@/components/ui/progress"

export function Preview() {
  const [value, setValue] = useState(20)

  useEffect(() => {
    const interval = setInterval(() => {
      setValue((current) =>
        Math.min(100, Math.round(current + Math.random() * 25)),
      )
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  return <Progress aria-label="Upload progress" value={value} />
}
