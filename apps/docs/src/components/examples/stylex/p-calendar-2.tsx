"use client"

import * as stylex from "@stylexjs/stylex"
import * as React from "react"

import { Calendar } from "@/components/ui/calendar"

export default function Example() {
  const [date, setDate] = React.useState<Date | undefined>(new Date())
  return (
    <Calendar
      {...stylex.props(exampleStyles.report1Manual)}
      mode="single"
      onSelect={setDate}
      selected={date}
    />
  )
}

const exampleStyles = stylex.create({
  report1Manual: {
    "--cell-size": {
      default: "2.75rem",
      "@media (min-width: 640px)": "2.5rem",
    },
  },
})
