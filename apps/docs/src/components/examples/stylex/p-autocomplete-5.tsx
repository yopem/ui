"use client"

import * as stylex from "@stylexjs/stylex"
import { useId } from "react"

import {
  Autocomplete,
  AutocompleteEmpty,
  AutocompleteInput,
  AutocompleteItem,
  AutocompleteList,
  AutocompletePopup,
} from "@/components/ui/autocomplete"
import { Flex } from "@/components/ui/flex"
import { Label } from "@/components/ui/label"
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
  const id = useId()
  return (
    <Autocomplete items={items}>
      <Flex {...stylex.props(exampleStyles.example1)}>
        <Label htmlFor={id}>Fruits</Label>
        <AutocompleteInput
          aria-label="Search items"
          id={id}
          placeholder="Search items…"
        />
      </Flex>
      <AutocompletePopup>
        <AutocompleteEmpty>No items found.</AutocompleteEmpty>
        <AutocompleteList>
          {(item) => (
            <AutocompleteItem key={item.value} value={item}>
              {item.label}
            </AutocompleteItem>
          )}
        </AutocompleteList>
      </AutocompletePopup>
    </Autocomplete>
  )
}

const exampleStyles = stylex.create({
  example1: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: "calc(0.25rem * 2)",
  },
})
