"use client"

import type { MonthGridProps } from "@daypicker/react"

import { MonthGrid } from "@daypicker/react"
import { Calendar } from "@registry/components/ui/calendar"
import { mergeStylexProps, stylexProps } from "@registry/lib/stylex"
import * as stylex from "@stylexjs/stylex"
import { useState } from "react"

const previewDate = new Date(2026, 0, 1)

const styles = stylex.create({
  monthGrid: { borderCollapse: "collapse" },
})

const previewComponents = { MonthGrid: CalendarMonthGrid }

export function CalendarMonthGrid({ className, ...props }: MonthGridProps) {
  return (
    <MonthGrid
      {...mergeStylexProps(stylexProps(className, styles.monthGrid), props)}
    />
  )
}

export function Preview() {
  const [date, setDate] = useState<Date | undefined>(previewDate)

  return (
    <Calendar
      components={previewComponents}
      defaultMonth={previewDate}
      mode="single"
      onSelect={setDate}
      selected={date}
    />
  )
}
