"use client"

import type { DropdownProps } from "@daypicker/react"

import * as stylex from "@stylexjs/stylex"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import * as React from "react"

import { Button } from "@/components/ui/stylex/button"
import { Calendar } from "@/components/ui/stylex/calendar"
import {
  Combobox,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxPopup,
} from "@/components/ui/stylex/combobox"
import { Field, FieldLabel } from "@/components/ui/stylex/field"
import {
  Popover,
  PopoverPopup,
  PopoverTrigger,
} from "@/components/ui/stylex/popover"

interface DropdownItem {
  disabled?: boolean
  label: string
  value: string
}

function CalendarDropdown(props: DropdownProps) {
  const { options, value, onChange, "aria-label": ariaLabel } = props

  const items: DropdownItem[] =
    options?.map((option) => ({
      disabled: option.disabled,
      label: option.label,
      value: option.value.toString(),
    })) ?? []

  const selectedItem = items.find((item) => item.value === value?.toString())

  const handleValueChange = (newValue: DropdownItem | null) => {
    if (onChange && newValue) {
      const syntheticEvent = {
        target: { value: newValue.value },
      } as React.ChangeEvent<HTMLSelectElement>
      onChange(syntheticEvent)
    }
  }

  return (
    <Combobox
      aria-label={ariaLabel}
      autoHighlight
      items={items}
      onValueChange={handleValueChange}
      value={selectedItem}
    >
      <ComboboxInput
        {...stylex.props(exampleStyles.report1)}
        onFocus={(e) => e.currentTarget.select()}
      />
      <ComboboxPopup aria-label={ariaLabel}>
        <ComboboxEmpty>No items found.</ComboboxEmpty>
        <ComboboxList>
          {(item: DropdownItem) => (
            <ComboboxItem
              disabled={item.disabled}
              key={item.value}
              value={item}
            >
              {item.label}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxPopup>
    </Combobox>
  )
}

export default function Particle() {
  const [date, setDate] = React.useState<Date | undefined>()
  const id = React.useId()
  return (
    <Field>
      <FieldLabel htmlFor={id}>Start date</FieldLabel>
      <Popover>
        <PopoverTrigger
          id={id}
          render={
            <Button
              {...stylex.props(exampleStyles.example1)}
              variant="outline"
            />
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
            captionLayout="dropdown"
            components={{ Dropdown: CalendarDropdown }}
            defaultMonth={date}
            endMonth={new Date()}
            mode="single"
            onSelect={setDate}
            selected={date}
            startMonth={new Date(1900, 0)}
          />
        </PopoverPopup>
      </Popover>
    </Field>
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

  report1: {
    minInlineSize: 0,
    flexGrow: 1,
  },
})
