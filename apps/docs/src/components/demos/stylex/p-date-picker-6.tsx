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
        <CalendarIcon />
        {date ? format(date, "PPP") : "Pick a date"}
      </PopoverTrigger>
      <PopoverPopup>
        <Calendar mode="single" onSelect={handleSelect} selected={date} />
      </PopoverPopup>
    </Popover>
  )
}

const demoStyles = stylex.create({
  demo1: {
    inlineSize: "100%",
    justifyContent: "flex-start",
  },
})
