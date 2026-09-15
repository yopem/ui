"use client"

import {
  Combobox,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxPopup,
} from "@/components/ui/stylex/combobox"

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
  const defaultTimezone = formattedTimezones.find(
    (tz) => tz.value === "Europe/London",
  )

  return (
    <Combobox
      autoHighlight
      defaultValue={defaultTimezone}
      items={formattedTimezones}
    >
      <ComboboxInput
        aria-label="Select timezone"
        placeholder="Select timezone..."
      />
      <ComboboxPopup>
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
