"use client"

import * as stylex from "@stylexjs/stylex"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverPopup, PopoverTrigger } from "@/components/ui/popover"

export default function Example() {
  const [date, setDate] = useState<Date | undefined>()

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button {...stylex.props(exampleStyles.example1)} variant="outline" />
        }
      >
        <CalendarIcon
          {...stylex.props(exampleStyles.icon)}
          aria-hidden="true"
        />
        {date ? format(date, "PPP") : "Pick a date"}
      </PopoverTrigger>
      <PopoverPopup>
        <Calendar
          defaultMonth={date}
          mode="single"
          onSelect={setDate}
          selected={date}
        />
      </PopoverPopup>
    </Popover>
  )
}

const exampleStyles = stylex.create({
  icon: {
    blockSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    inlineSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    flexShrink: 0,
    pointerEvents: "none",
    opacity: 0.8,
    marginInline: "-0.125rem",
  },
  example1: {
    inlineSize: "100%",
    justifyContent: "flex-start",
  },
})
