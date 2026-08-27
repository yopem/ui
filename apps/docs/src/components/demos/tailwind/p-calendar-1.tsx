"use client"

import * as React from "react"

import { Calendar } from "@/components/ui/tailwind/calendar"

export default function Particle() {
  const [date, setDate] = React.useState<Date | undefined>(new Date())

  return <Calendar mode="single" onSelect={setDate} selected={date} />
}
