"use client"

import {
  Combobox,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxPopup,
} from "@registry/components/ui/combobox"
import { useState } from "react"

const items = [
  { label: "Binoculars", value: "binoculars" },
  { label: "Audio recorder", value: "audio-recorder" },
  { label: "Compass", value: "compass" },
  { label: "Field notebook", value: "field-notebook" },
  { label: "Water bottle", value: "water-bottle" },
  { label: "Sample jar", value: "sample-jar" },
  { label: "Trail map", value: "trail-map" },
  { label: "Rain cover", value: "rain-cover" },
  { label: "Tripod", value: "tripod" },
  { label: "Torch", value: "torch" },
]

export function Preview() {
  const [inputElement, setInputElement] = useState<HTMLInputElement | null>(
    null,
  )

  return (
    <Combobox items={items}>
      <ComboboxInput
        ref={setInputElement}
        aria-label="Select equipment"
        placeholder="Select equipment…"
      />
      <ComboboxPopup
        portalProps={{ container: inputElement?.closest("main") ?? undefined }}
      >
        <ComboboxEmpty>No equipment found.</ComboboxEmpty>
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
