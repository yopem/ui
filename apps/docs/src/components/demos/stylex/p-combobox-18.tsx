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
    <Combobox items={items}>
      <ComboboxTrigger render={<SelectButton />}>
        <ComboboxValue placeholder="Select a fruit" />
      </ComboboxTrigger>
      <ComboboxPopup aria-label="Select a fruit">
        <div {...stylex.props(demoStyles.demo1)}>
          <ComboboxInput
            {...stylex.props(demoStyles.demo2)}
            placeholder="Search fruits..."
            showTrigger={false}
            startAddon={<SearchIcon {...stylex.props(demoStyles.icon)} />}
          />
        </div>
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
