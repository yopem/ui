"use client"

import {
  Combobox,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxPopup,
} from "@/components/ui/stylex/combobox"
import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@/components/ui/stylex/field"

const items = [
  { label: "Apple", value: "apple" },
  { label: "Banana", value: "banana" },
  { label: "Orange", value: "orange" },
  { label: "Grape", value: "grape" },
  { label: "Strawberry", value: "strawberry" },
  { label: "Mango", value: "mango" },
  { label: "Pineapple", value: "pineapple" },
  { label: "Kiwi", value: "kiwi" },
  { label: "Peach", value: "peach" },
  { label: "Pear", value: "pear" },
]

export default function Example() {
  return (
    <Field>
      <FieldLabel>Fruits</FieldLabel>
      <Combobox items={items}>
        <ComboboxInput
          aria-label="Select an item"
          placeholder="Select an item..."
        />
        <ComboboxPopup>
          <ComboboxEmpty>No results found.</ComboboxEmpty>
          <ComboboxList>
            {(item) => (
              <ComboboxItem key={item.value} value={item}>
                {item.label}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxPopup>
      </Combobox>
      <FieldDescription>Select a item.</FieldDescription>
    </Field>
  )
}
