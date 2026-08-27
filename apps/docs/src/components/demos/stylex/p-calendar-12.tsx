"use client"

import type { WeekNumberProps } from "@daypicker/react"

import * as stylex from "@stylexjs/stylex"
import { useState } from "react"

import { Calendar } from "@/components/ui/stylex/calendar"

export default function Particle() {
  const [date, setDate] = useState<Date | undefined>(new Date())

  return (
    <Calendar
      components={{
        WeekNumber: ({ week, ...props }: WeekNumberProps) => {
          return (
            <th {...props}>
              <span {...stylex.props(demoStyles.demo1)}>{week.weekNumber}</span>
            </th>
          )
        },
      }}
      fixedWeeks
      mode="single"
      onSelect={setDate}
      selected={date}
      showWeekNumber
    />
  )
}

const demoStyles = stylex.create({
  demo1: {
    display: "inline-flex",
    inlineSize: "var(--cell-size)",
    blockSize: "var(--cell-size)",
    alignItems: "center",
    justifyContent: "center",
  },
})
