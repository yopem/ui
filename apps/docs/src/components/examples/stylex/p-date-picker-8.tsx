"use client"

import { format } from "date-fns"
import { useState } from "react"

import { Calendar } from "@/components/ui/stylex/calendar"
import {
  Popover,
  PopoverPopup,
  PopoverTrigger,
} from "@/components/ui/stylex/popover"
import { SelectButton } from "@/components/ui/stylex/select"

export default function Example() {
  const [date, setDate] = useState<Date | undefined>()

  return (
    <Popover>
      <PopoverTrigger
        render={<SelectButton data-placeholder={!date ? "" : undefined} />}
      >
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
