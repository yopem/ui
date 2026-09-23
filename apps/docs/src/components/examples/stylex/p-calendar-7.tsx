"use client"

import * as stylex from "@stylexjs/stylex"
import { addDays } from "date-fns"

import { Calendar } from "@/components/ui/calendar"

export default function Example() {
  const today = new Date()

  return (
    <Calendar
      disabled={[
        { before: new Date() },
        new Date(),
        { dayOfWeek: [0, 6] },
        {
          from: addDays(today, 14),
          to: addDays(today, 16),
        },
        {
          from: addDays(today, 23),
          to: addDays(today, 24),
        },
      ]}
      excludeDisabled
      mode="range"
      xstyle={exampleStyles.calendar}
    />
  )
}

const exampleStyles = stylex.create({
  calendar: {
    "--muted-foreground": "var(--foreground)",
  },
})
