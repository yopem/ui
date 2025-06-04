"use client"

import { RadioGroup, RadioGroupItem, RadioGroupLabel } from "@yopem-ui/react"

export const RadioGroupBasic = () => {
  return (
    <RadioGroup defaultValue="vue">
      <RadioGroupLabel>Choose a framework</RadioGroupLabel>
      <RadioGroupItem disabled id="react" value="react">
        React
      </RadioGroupItem>
      <RadioGroupItem id="vue" value="vue">
        Vue
      </RadioGroupItem>
      <RadioGroupItem id="svelte" value="svelte">
        Svelte
      </RadioGroupItem>
    </RadioGroup>
  )
}
