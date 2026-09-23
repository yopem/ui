"use client"

import * as stylex from "@stylexjs/stylex"
import { SearchIcon } from "lucide-react"

import { Box } from "@/components/ui/box"
import {
  Combobox,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxPopup,
  ComboboxTrigger,
  ComboboxValue,
} from "@/components/ui/combobox"
import { SelectButton } from "@/components/ui/select"
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
    <Combobox autoHighlight items={formattedTimezones}>
      <ComboboxTrigger render={<SelectButton />}>
        <ComboboxValue placeholder="Select timezone" />
      </ComboboxTrigger>
      <ComboboxPopup aria-label="Select timezone">
        <Box {...stylex.props(exampleStyles.example1)}>
          <ComboboxInput
            {...stylex.props(exampleStyles.example2)}
            placeholder="e.g. Europe/London"
            showTrigger={false}
            startAddon={<SearchIcon {...stylex.props(exampleStyles.icon)} />}
          />
        </Box>
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

const exampleStyles = stylex.create({
  icon: {
    blockSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    inlineSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    flexShrink: 0,
    pointerEvents: "none",
    opacity: 0.8,
  },
  example1: {
    borderBlockEndStyle: "solid",
    borderBlockEndWidth: "1px",
    padding: "calc(0.25rem * 2)",
  },
  example2: {
    borderRadius: "calc(var(--radius) - 2px)",
    "::before": {
      content: '""',
      borderRadius: "calc(calc(var(--radius) - 2px) - 1px)",
    },
  },
})
