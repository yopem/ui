"use client"

import {
  Autocomplete,
  AutocompleteEmpty,
  AutocompleteInput,
  AutocompleteItem,
  AutocompleteList,
  AutocompletePopup,
} from "@registry/components/ui/autocomplete"

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

function AutocompleteOptions() {
  return (
    <AutocompletePopup>
      <AutocompleteEmpty>No equipment found.</AutocompleteEmpty>
      <AutocompleteList>
        {(item) => (
          <AutocompleteItem key={item.value} value={item}>
            {item.label}
          </AutocompleteItem>
        )}
      </AutocompleteList>
    </AutocompletePopup>
  )
}

export function Preview() {
  return (
    <Autocomplete items={items}>
      <AutocompleteInput
        aria-label="Search items"
        placeholder="Search loan equipment…"
      />
      <AutocompleteOptions />
    </Autocomplete>
  )
}
