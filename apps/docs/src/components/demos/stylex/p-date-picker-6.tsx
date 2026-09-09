"use client"

import * as stylex from "@stylexjs/stylex"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/stylex/button"
import { Calendar } from "@/components/ui/stylex/calendar"
import {
  Popover,
  PopoverPopup,
  PopoverTrigger,
} from "@/components/ui/stylex/popover"

export default function Particle() {
  const [date, setDate] = useState<Date | undefined>()
  const [open, setOpen] = useState(false)

  const handleSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate)
    setOpen(false)
  }

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger
        render={
          <Button {...stylex.props(demoStyles.demo1)} variant="outline" />
        }
      >
        <CalendarIcon {...stylex.props(demoStyles.icon)} />
        {date ? format(date, "PPP") : "Pick a date"}
      </PopoverTrigger>
      <PopoverPopup>
        <Calendar mode="single" onSelect={handleSelect} selected={date} />
      </PopoverPopup>
    </Popover>
  )
}

const demoStyles = stylex.create({
  icon: {
    blockSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    inlineSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    flexShrink: 0,
    pointerEvents: "none",
    opacity: 0.8,
    marginInline: "-0.125rem",
  },
  demo1: {
    inlineSize: "100%",
    justifyContent: "flex-start",
  },
})
