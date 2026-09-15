"use client"

import * as stylex from "@stylexjs/stylex"
import { format, isValid, parse } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { useState } from "react"

import { Calendar } from "@/components/ui/stylex/calendar"
import { Field, FieldLabel } from "@/components/ui/stylex/field"
import { InputGroup, InputGroupAddon } from "@/components/ui/stylex/input-group"

export default function Particle() {
  const [date, setDate] = useState<Date | undefined>(() => new Date())
  const [month, setMonth] = useState<Date>(() => new Date())
  const [inputValue, setInputValue] = useState(() =>
    format(new Date(), "yyyy-MM-dd"),
  )

  const handleDayPickerSelect = (selectedDate: Date | undefined) => {
    if (!selectedDate) {
      setInputValue("")
      setDate(undefined)
    } else {
      setDate(selectedDate)
      setMonth(selectedDate)
      setInputValue(format(selectedDate, "yyyy-MM-dd"))
    }
  }

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

  return (
    <div {...stylex.props(exampleStyles.example1)}>
      <Calendar
        mode="single"
        month={month}
        onMonthChange={setMonth}
        onSelect={handleDayPickerSelect}
        selected={date}
      />
      <Field {...stylex.props(exampleStyles.example2)}>
        <FieldLabel {...stylex.props(exampleStyles.example3)}>
          Enter date
        </FieldLabel>
        <InputGroup>
          <input
            data-slot="input"
            aria-label="Select date"
            {...stylex.props(exampleStyles.nativeInput, exampleStyles.report1)}
            onChange={handleInputChange}
            type="date"
            value={inputValue}
          />
          <InputGroupAddon>
            <CalendarIcon
              {...stylex.props(exampleStyles.icon)}
              aria-hidden="true"
            />
          </InputGroupAddon>
        </InputGroup>
      </Field>
    </div>
  )
}

const exampleStyles = stylex.create({
  icon: {
    blockSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    inlineSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    flexShrink: 0,
    pointerEvents: "none",
    opacity: 0.8,
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

  example1: {
    display: "flex",
    flexDirection: "column",
    gap: "calc(0.25rem * 2)",
  },
  example2: {
    flexDirection: "row",
    alignItems: "center",
    gap: "calc(0.25rem * 4)",
  },
  example3: {
    whiteSpace: "nowrap",
  },

  report1: {
    appearance: "none",
  },
})
