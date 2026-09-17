"use client"

import * as stylex from "@stylexjs/stylex"

import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/stylex/select"

const formattedTimezones: {
  label: string
  numericOffset: number
  value: string
}[] = []
const referenceDate = new Date()
for (const timezone of Intl.supportedValuesOf("timeZone")) {
  const formatter = new Intl.DateTimeFormat("en", {
    timeZone: timezone,
    timeZoneName: "shortOffset",
  })
  const parts = formatter.formatToParts(referenceDate)
  const offset = parts.find((part) => part.type === "timeZoneName")?.value || ""
  const modifiedOffset = offset === "GMT" ? "GMT+0" : offset

  const offsetMatch = offset.match(/GMT([+-]?)(\d+)(?::(\d+))?/)
  const sign = offsetMatch?.[1] === "-" ? -1 : 1
  const hours = Number.parseInt(offsetMatch?.[2] || "0", 10)
  const minutes = Number.parseInt(offsetMatch?.[3] || "0", 10)

  formattedTimezones.push({
    label: `(${modifiedOffset}) ${timezone.replace(/_/g, " ")}`,
    numericOffset: sign * (hours * 60 + minutes),
    value: timezone,
  })
}
formattedTimezones.sort((a, b) => a.numericOffset - b.numericOffset)

export default function Example() {
  return (
    <Select
      aria-label="Select timezone"
      defaultValue={formattedTimezones.find(
        (tz) => tz.value === "Europe/London",
      )}
      itemToStringValue={(item) => item.value}
    >
      <SelectTrigger aria-label="Select timezone">
        <SelectValue>
          {(item) => (
            <span {...stylex.props(exampleStyles.example1)}>{item.label}</span>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectPopup>
        {formattedTimezones.map((item) => (
          <SelectItem key={item.value} value={item}>
            {item.label}
          </SelectItem>
        ))}
      </SelectPopup>
    </Select>
  )
}

const exampleStyles = stylex.create({
  example1: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
})
