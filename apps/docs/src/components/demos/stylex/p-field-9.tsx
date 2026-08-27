"use client"

import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxPopup,
  ComboboxValue,
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

export default function Particle() {
  return (
    <>
      <style>{demoCss}</style>
      <Field>
        <FieldLabel>Fruits</FieldLabel>
        <Combobox defaultValue={[items[0], items[4]]} items={items} multiple>
          <ComboboxChips>
            <ComboboxValue>
              {(value: { value: string; label: string }[]) => (
                <>
                  {value?.map((item) => (
                    <ComboboxChip aria-label={item.label} key={item.value}>
                      {item.label}
                    </ComboboxChip>
                  ))}
                  <ComboboxChipsInput
                    aria-label="Select items"
                    placeholder={value.length > 0 ? undefined : "Select items…"}
                  />
                </>
              )}
            </ComboboxValue>
          </ComboboxChips>
          <ComboboxPopup>
            <ComboboxEmpty>No items found.</ComboboxEmpty>
            <ComboboxList>
              {(item) => (
                <ComboboxItem key={item.value} value={item}>
                  {item.label}
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxPopup>
        </Combobox>
        <FieldDescription>Select multiple items.</FieldDescription>
      </Field>
    </>
  )
}

const demoCss = `
  [data-slot="combobox-chips"]::before {
    border-radius: calc(var(--radius-lg) - 1px);
    box-shadow: 0 1px rgb(0 0 0 / 4%);
    content: "";
    inset: 0;
    pointer-events: none;
    position: absolute;
  }
  [data-theme="dark"] [data-slot="combobox-chips"]::before {
    box-shadow: 0 -1px rgb(255 255 255 / 6%);
  }
  [data-slot="combobox-chip"] { line-height: 1.25rem; }
  [data-slot="combobox-chip-remove"] svg { block-size: 1rem; inline-size: 1rem; }
  @media (min-width: 640px) {
    [data-slot="combobox-chips"], [data-slot="combobox-chips-input"] { line-height: 1.25rem; }
    [data-slot="combobox-chip"] { line-height: 1rem; }
    [data-slot="combobox-chip-remove"] svg { block-size: 0.875rem; inline-size: 0.875rem; }
  }
`
