import * as stylex from "@stylexjs/stylex"
import { useId } from "react"

import { Flex } from "@/components/ui/flex"
import { Label } from "@/components/ui/label"
import {
  NumberField,
  NumberFieldDecrement,
  NumberFieldGroup,
  NumberFieldIncrement,
  NumberFieldInput,
} from "@/components/ui/number-field"
export default function Example() {
  const id = useId()
  return (
    <Flex {...stylex.props(exampleStyles.example1)}>
      <Label htmlFor={id}>Quantity</Label>
      <NumberField defaultValue={0} id={id}>
        <NumberFieldGroup>
          <NumberFieldDecrement />
          <NumberFieldInput />
          <NumberFieldIncrement />
        </NumberFieldGroup>
      </NumberField>
    </Flex>
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
