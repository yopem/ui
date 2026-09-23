"use client"

import type { WeekNumberProps } from "@daypicker/react"

import * as stylex from "@stylexjs/stylex"
import { useState } from "react"

import { Box } from "@/components/ui/box"
import { Calendar } from "@/components/ui/calendar"
export default function Example() {
  const [date, setDate] = useState<Date | undefined>(new Date())

  return (
    <Calendar
      components={{
        WeekNumber: ({ week, ...props }: WeekNumberProps) => {
          return (
            <Box as="th" {...props}>
              <Box as="span" {...stylex.props(exampleStyles.example1)}>
                {week.weekNumber}
              </Box>
            </Box>
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

const exampleStyles = stylex.create({
  example1: {
    display: "inline-flex",
    inlineSize: "var(--cell-size)",
    blockSize: "var(--cell-size)",
    alignItems: "center",
    justifyContent: "center",
  },
})
