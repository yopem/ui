"use client"

import * as stylex from "@stylexjs/stylex"
import { addDays } from "date-fns"
import { useState } from "react"

import { Button } from "@/components/ui/stylex/button"
import { Calendar } from "@/components/ui/stylex/calendar"

export default function Example() {
  const today = new Date()
  const selectedDay = addDays(today, -28)
  const [month, setMonth] = useState(selectedDay)
  const [date, setDate] = useState<Date | undefined>(selectedDay)

  return (
    <div {...stylex.props(exampleStyles.example1)}>
      <Calendar
        mode="single"
        month={month}
        onMonthChange={setMonth}
        onSelect={setDate}
        selected={date}
      />
      <Button
        onClick={() => {
          setDate(today)
          setMonth(today)
        }}
        size="sm"
        variant="outline"
      >
        Today
      </Button>
    </div>
  )
}

const exampleStyles = stylex.create({
  example1: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: "calc(0.25rem * 2)",
  },
})
