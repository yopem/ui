"use client"

import * as stylex from "@stylexjs/stylex"
import { useMemo } from "react"

import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/stylex/select"

export default function Particle() {
  const timezones = Intl.supportedValuesOf("timeZone")

  const formattedTimezones = useMemo(() => {
    return timezones
      .map((timezone) => {
        const formatter = new Intl.DateTimeFormat("en", {
          timeZone: timezone,
          timeZoneName: "shortOffset",
        })
        const parts = formatter.formatToParts(new Date())
        const offset =
          parts.find((part) => part.type === "timeZoneName")?.value || ""
        const modifiedOffset = offset === "GMT" ? "GMT+0" : offset

        const offsetMatch = offset.match(/GMT([+-]?)(\d+)(?::(\d+))?/)
        const sign = offsetMatch?.[1] === "-" ? -1 : 1
        const hours = Number.parseInt(offsetMatch?.[2] || "0", 10)
        const minutes = Number.parseInt(offsetMatch?.[3] || "0", 10)
        const totalMinutes = sign * (hours * 60 + minutes)

        return {
          label: `(${modifiedOffset}) ${timezone.replace(/_/g, " ")}`,
          numericOffset: totalMinutes,
          value: timezone,
        }
      })
      .sort((a, b) => a.numericOffset - b.numericOffset)
  }, [timezones])

  return (
    <Select
      aria-label="Select timezone"
      defaultValue={formattedTimezones.find(
        (tz) => tz.value === "Europe/London",
      )}
      itemToStringValue={(item) => item.value}
    >
      <SelectTrigger>
        <SelectValue>
          {(item) => (
            <span {...stylex.props(demoStyles.demo1)}>{item.label}</span>
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

const demoStyles = stylex.create({
  demo1: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
})
