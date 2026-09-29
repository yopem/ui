"use client"

import { Calendar } from "@registry/components/ui/calendar"
import * as React from "react"

const previewDate = new Date(2026, 0, 1)

export function Preview() {
  const [date, setDate] = React.useState<Date | undefined>(previewDate)

  return <Calendar mode="single" onSelect={setDate} selected={date} />
}
