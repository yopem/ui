"use client"

import * as stylex from "@stylexjs/stylex"
import { SearchIcon } from "lucide-react"
import { useMemo } from "react"

import {
  Combobox,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxPopup,
  ComboboxTrigger,
  ComboboxValue,
} from "@/components/ui/stylex/combobox"
import { SelectButton } from "@/components/ui/stylex/select"

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
    <Combobox autoHighlight items={formattedTimezones}>
      <ComboboxTrigger render={<SelectButton />}>
        <ComboboxValue placeholder="Select timezone" />
      </ComboboxTrigger>
      <ComboboxPopup aria-label="Select timezone">
        <div {...stylex.props(demoStyles.demo1)}>
          <ComboboxInput
            {...stylex.props(demoStyles.demo2)}
            placeholder="e.g. Europe/London"
            showTrigger={false}
            startAddon={<SearchIcon />}
          />
        </div>
        <ComboboxEmpty>No timezones found.</ComboboxEmpty>
        <ComboboxList>
          {(item) => (
            <ComboboxItem key={item.value} value={item}>
              {item.label}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxPopup>
    </Combobox>
  )
}

const demoStyles = stylex.create({
  demo1: {
    borderBlockEndStyle: "solid",
    borderBlockEndWidth: "1px",
    padding: "calc(0.25rem * 2)",
  },
  demo2: {
    borderRadius: "calc(var(--radius) - 2px)",
    "::before": {
      content: '""',
      borderRadius: "calc(calc(var(--radius) - 2px) - 1px)",
    },
  },
})
