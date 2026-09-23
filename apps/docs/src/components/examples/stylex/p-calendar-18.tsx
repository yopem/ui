"use client"

import * as stylex from "@stylexjs/stylex"
import { ClockIcon } from "lucide-react"
import { useState } from "react"

import { Box } from "@/components/ui/box"
import { Calendar } from "@/components/ui/calendar"
import { Field, FieldLabel } from "@/components/ui/field"
import { Flex } from "@/components/ui/flex"
import { InputGroup, InputGroupAddon } from "@/components/ui/input-group"
export default function Example() {
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
    <Flex {...stylex.props(exampleStyles.example1)}>
      <Calendar
        mode="single"
        month={month}
        onMonthChange={setMonth}
        onSelect={handleDayPickerSelect}
        selected={date}
      />
      <Field {...stylex.props(exampleStyles.example2)}>
        <FieldLabel {...stylex.props(exampleStyles.example3)}>
          Enter time
        </FieldLabel>
        <InputGroup {...stylex.props(exampleStyles.example4)}>
          <Box
            as="input"
            data-slot="input"
            aria-label="Select time"
            {...stylex.props(exampleStyles.nativeInput, exampleStyles.report1)}
            onChange={handleTimeChange}
            step="1"
            type="time"
            value={timeValue}
          />
          <InputGroupAddon>
            <ClockIcon
              {...stylex.props(exampleStyles.icon)}
              aria-hidden="true"
            />
          </InputGroupAddon>
        </InputGroup>
      </Field>
    </Flex>
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
    gap: "calc(0.25rem * 3)",
  },
  example3: {
    fontSize: "0.75rem",
    lineHeight: "calc(1 / 0.75)",
    whiteSpace: "nowrap",
  },
  example4: {
    flexGrow: "1",
  },

  report1: {
    appearance: "none",
  },
})
