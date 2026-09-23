"use client"

import type { DropdownProps } from "@daypicker/react"

import * as stylex from "@stylexjs/stylex"
import * as React from "react"

import { Calendar } from "@/components/ui/calendar"
import {
  Combobox,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxPopup,
} from "@/components/ui/combobox"

interface DropdownItem {
  disabled?: boolean
  label: string
  value: string
}

interface YearDropdownOptionsProps {
  ariaLabel: DropdownProps["aria-label"]
}

function YearDropdownOptions({ ariaLabel }: YearDropdownOptionsProps) {
  return (
    <ComboboxPopup aria-label={ariaLabel}>
      <ComboboxEmpty>No items found.</ComboboxEmpty>
      <ComboboxList>
        {(item: DropdownItem) => (
          <ComboboxItem disabled={item.disabled} key={item.value} value={item}>
            {item.label}
          </ComboboxItem>
        )}
      </ComboboxList>
    </ComboboxPopup>
  )
}

function YearDropdown(props: DropdownProps) {
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
        aria-label={ariaLabel}
        {...stylex.props(exampleStyles.report1)}
        onFocus={(e) => e.currentTarget.select()}
      />
      <YearDropdownOptions ariaLabel={ariaLabel} />
    </Combobox>
  )
}

export default function Example() {
  const [date, setDate] = React.useState<Date | undefined>(new Date())
  return (
    <Calendar
      captionLayout="dropdown-years"
      components={{ Dropdown: YearDropdown }}
      endMonth={new Date(2030, 11)}
      mode="single"
      onSelect={setDate}
      selected={date}
      startMonth={new Date(1930, 0)}
    />
  )
}

const exampleStyles = stylex.create({
  report1: {
    minInlineSize: 0,
    flexGrow: 1,
  },
})
