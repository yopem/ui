"use client"

import { useState } from "react"

import { Calendar } from "@/components/ui/stylex/calendar"

export default function Example() {
  const [date, setDate] = useState<Date | undefined>(new Date())

  return (
    <Calendar
      classNames={{
        day_button: "rounded-full",
      }}
      mode="single"
      onSelect={setDate}
      selected={date}
    />
  )
}
