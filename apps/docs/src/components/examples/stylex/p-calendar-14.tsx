"use client"

import type { DropdownNavProps, DropdownProps } from "@daypicker/react"

import * as stylex from "@stylexjs/stylex"
import { useState } from "react"

import { Calendar } from "@/components/ui/stylex/calendar"
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/stylex/select"

export default function Example() {
  const [date, setDate] = useState<Date | undefined>(new Date())

  const handleCalendarChange = (
    _value: string | number,
    _e: React.ChangeEventHandler<HTMLSelectElement>,
  ) => {
    const _event = {
      target: {
        value: String(_value),
      },
    } as React.ChangeEvent<HTMLSelectElement>
    _e(_event)
  }

  return (
    <Calendar
      captionLayout="dropdown"
      classNames={{
        month_caption: stylex.props(exampleStyles.monthCaption).className,
      }}
      components={{
        Dropdown: (props: DropdownProps) => {
          const items =
            props.options?.map((option) => ({
              label: option.label,
              value: String(option.value),
            })) ?? []

          return (
            <Select
              items={items}
              onValueChange={(value) => {
                if (props.onChange && value !== null) {
                  handleCalendarChange(value, props.onChange)
                }
              }}
              value={String(props.value)}
            >
              <SelectTrigger {...stylex.props(exampleStyles.report1Manual)}>
                <SelectValue />
              </SelectTrigger>
              <SelectPopup>
                {items.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectPopup>
            </Select>
          )
        },
        DropdownNav: (props: DropdownNavProps) => {
          return (
            <div {...stylex.props(exampleStyles.example1)}>
              {props.children}
            </div>
          )
        },
      }}
      defaultMonth={new Date()}
      hideNavigation
      mode="single"
      onSelect={setDate}
      selected={date}
      startMonth={new Date(1980, 6)}
    />
  )
}

const exampleStyles = stylex.create({
  monthCaption: {
    marginInline: 0,
  },
  example1: {
    display: "flex",
    inlineSize: "100%",
    alignItems: "center",
    gap: "calc(0.25rem * 2)",
  },

  report1Manual: {
    minInlineSize: 0,
  },
})
