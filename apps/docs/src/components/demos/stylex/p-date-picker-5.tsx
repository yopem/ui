"use client"

import * as stylex from "@stylexjs/stylex"
import { format, isValid, parse } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/stylex/button"
import { Calendar } from "@/components/ui/stylex/calendar"
import { InputGroup, InputGroupAddon } from "@/components/ui/stylex/input-group"
import {
  Popover,
  PopoverPopup,
  PopoverTrigger,
} from "@/components/ui/stylex/popover"

export default function Particle() {
  const [date, setDate] = useState<Date | undefined>()
  const [inputValue, setInputValue] = useState("")
  const [month, setMonth] = useState<Date>(() => new Date())

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInputValue(value)

    if (value) {
      const parsedDate = parse(value, "yyyy-MM-dd", new Date())
      if (isValid(parsedDate)) {
        setDate(parsedDate)
        setMonth(parsedDate)
      }
    } else {
      setDate(undefined)
    }
  }

  const handleSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate)
    if (selectedDate) {
      setInputValue(format(selectedDate, "yyyy-MM-dd"))
      setMonth(selectedDate)
    } else {
      setInputValue("")
    }
  }

  return (
    <Popover>
      <InputGroup>
        <input
          data-slot="input"
          aria-label="Select date"
          {...stylex.props(demoStyles.nativeInput, demoStyles.report1)}
          onChange={handleInputChange}
          onClick={(e) => e.stopPropagation()}
          type="date"
          value={inputValue}
        />
        <InputGroupAddon>
          <PopoverTrigger
            aria-label="Select date"
            render={
              <Button aria-label="Select date" size="icon-xs" variant="ghost" />
            }
          >
            <CalendarIcon
              {...stylex.props(demoStyles.icon)}
              aria-hidden="true"
            />
          </PopoverTrigger>
        </InputGroupAddon>
      </InputGroup>
      <PopoverPopup align="start" alignOffset={-4} sideOffset={8}>
        <Calendar
          mode="single"
          month={month}
          onMonthChange={setMonth}
          onSelect={handleSelect}
          selected={date}
        />
      </PopoverPopup>
    </Popover>
  )
}

const demoStyles = stylex.create({
  icon: {
    blockSize: { default: "1rem", "@media (min-width: 640px)": "0.875rem" },
    inlineSize: { default: "1rem", "@media (min-width: 640px)": "0.875rem" },
    flexShrink: 0,
    pointerEvents: "none",
    opacity: 0.8,
    marginInline: "-0.125rem",
  },
  nativeInput: {
    appearance: "none",
    backgroundColor: "transparent",
    blockSize: { default: "2.125rem", "@media (min-width: 640px)": "1.875rem" },
    borderWidth: 0,
    color: "var(--foreground)",
    flexGrow: 1,
    inlineSize: "100%",
    lineHeight: {
      default: "2.125rem",
      "@media (min-width: 640px)": "1.875rem",
    },
    minInlineSize: 0,
    outline: "none",
    paddingInline: "0.75rem",
    "::placeholder": {
      color: "color-mix(in oklab, var(--muted-foreground) 72%, transparent)",
    },
    "::-webkit-calendar-picker-indicator": { display: "none" },
  },

  report1: {
    appearance: "none",
  },
})
