"use client"

import type { DropdownProps } from "@daypicker/react"

import * as stylex from "@stylexjs/stylex"
import * as React from "react"

import { Calendar } from "@/components/ui/stylex/calendar"
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/stylex/select"

function CalendarDropdown(props: DropdownProps) {
  const { options, value, onChange, "aria-label": ariaLabel } = props

  const handleValueChange = (newValue: string | null) => {
    if (onChange && newValue) {
      const syntheticEvent = {
        target: { value: newValue },
      } as React.ChangeEvent<HTMLSelectElement>
      onChange(syntheticEvent)
    }
  }

  const items =
    options?.map((option) => ({
      disabled: option.disabled,
      label: option.label,
      value: option.value.toString(),
    })) ?? []

  return (
    <Select
      items={items}
      onValueChange={handleValueChange}
      value={value?.toString()}
    >
      <SelectTrigger
        {...stylex.props(exampleStyles.report1Manual)}
        aria-label={ariaLabel}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectPopup>
        {items.map((item) => (
          <SelectItem
            disabled={item.disabled}
            key={item.value}
            value={item.value}
          >
            {item.label}
          </SelectItem>
        ))}
      </SelectPopup>
    </Select>
  )
}

export default function Example() {
  const [date, setDate] = React.useState<Date | undefined>(new Date())
  return (
    <Calendar
      captionLayout="dropdown"
      components={{ Dropdown: CalendarDropdown }}
      endMonth={new Date(2030, 11)}
      mode="single"
      onSelect={setDate}
      selected={date}
      startMonth={new Date(1930, 0)}
    />
  )
}

const exampleStyles = stylex.create({
  report1Manual: {
    minInlineSize: 0,
  },
})
