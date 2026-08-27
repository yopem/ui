"use client"

import * as stylex from "@stylexjs/stylex"
import { ClockIcon } from "lucide-react"
import { useState } from "react"

import { Calendar } from "@/components/ui/stylex/calendar"
import { Field, FieldLabel } from "@/components/ui/stylex/field"
import { InputGroup, InputGroupAddon } from "@/components/ui/stylex/input-group"

export default function Particle() {
  const [date, setDate] = useState<Date | undefined>(() => new Date())
  const [month, setMonth] = useState<Date>(() => new Date())
  const [timeValue, setTimeValue] = useState("12:00:00")

  const handleDayPickerSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate)
    if (selectedDate) {
      setMonth(selectedDate)
    }
  }

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTimeValue(e.target.value)
  }

  return (
    <div {...stylex.props(demoStyles.demo1)}>
      <Calendar
        mode="single"
        month={month}
        onMonthChange={setMonth}
        onSelect={handleDayPickerSelect}
        selected={date}
      />
      <Field {...stylex.props(demoStyles.demo2)}>
        <FieldLabel {...stylex.props(demoStyles.demo3)}>Enter time</FieldLabel>
        <InputGroup {...stylex.props(demoStyles.demo4)}>
          <input
            data-slot="input"
            aria-label="Select time"
            {...stylex.props(demoStyles.nativeInput, demoStyles.report1)}
            onChange={handleTimeChange}
            step="1"
            type="time"
            value={timeValue}
          />
          <InputGroupAddon>
            <ClockIcon aria-hidden="true" />
          </InputGroupAddon>
        </InputGroup>
      </Field>
    </div>
  )
}

const demoStyles = stylex.create({
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

  demo1: {
    display: "flex",
    flexDirection: "column",
    gap: "calc(0.25rem * 2)",
  },
  demo2: {
    flexDirection: "row",
    alignItems: "center",
    gap: "calc(0.25rem * 3)",
  },
  demo3: {
    fontSize: "0.75rem",
    lineHeight: "calc(1 / 0.75)",
    whiteSpace: "nowrap",
  },
  demo4: {
    flexGrow: "1",
  },

  report1: {
    appearance: "none",
  },
})
