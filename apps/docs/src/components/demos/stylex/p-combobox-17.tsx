"use client"

import * as stylex from "@stylexjs/stylex"
import { SearchIcon } from "lucide-react"

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

export default function Particle() {
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
            startAddon={<SearchIcon {...stylex.props(demoStyles.icon)} />}
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
  icon: {
    blockSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    inlineSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    flexShrink: 0,
    pointerEvents: "none",
    opacity: 0.8,
  },
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
