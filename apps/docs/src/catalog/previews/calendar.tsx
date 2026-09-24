"use client"

import { Calendar } from "@registry/components/ui/calendar"
import * as React from "react"

export function Preview() {
  const [date, setDate] = React.useState<Date | undefined>(new Date())

  return <Calendar mode="single" onSelect={setDate} selected={date} />
}
