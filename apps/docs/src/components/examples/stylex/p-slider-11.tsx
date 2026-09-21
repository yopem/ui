"use client"

import * as stylex from "@stylexjs/stylex"
import { Volume2Icon, VolumeXIcon } from "lucide-react"
import { useState } from "react"

import { Field, FieldLabel } from "@/components/ui/stylex/field"
import { Flex } from "@/components/ui/stylex/flex"
import { Slider, SliderValue } from "@/components/ui/stylex/slider"
export default function Example() {
  const [value, setValue] = useState<number | readonly number[]>(25)

  return (
    <Field>
      <Slider
        aria-label="Volume slider"
        {...stylex.props(exampleStyles.report1)}
        onValueChange={setValue}
        value={value}
      >
        <Flex {...stylex.props(exampleStyles.example1)}>
          <FieldLabel>Volume</FieldLabel>
          <SliderValue />
        </Flex>
        <VolumeXIcon
          aria-hidden="true"
          {...stylex.props(exampleStyles.example2)}
        />
        <Volume2Icon
          aria-hidden="true"
          {...stylex.props(exampleStyles.example3)}
        />
      </Slider>
    </Field>
  )
}

const exampleStyles = stylex.create({
  example1: {
    gridColumn: "span 3 / span 3",
    marginBlockEnd: "calc(0.25rem * 2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "0.25rem",
  },
  example2: {
    inlineSize: "calc(0.25rem * 4)",
    blockSize: "calc(0.25rem * 4)",
    flexShrink: "0",
    opacity: "80%",
  },
  example3: {
    order: "1",
    inlineSize: "calc(0.25rem * 4)",
    blockSize: "calc(0.25rem * 4)",
    flexShrink: "0",
    opacity: "80%",
  },

  report1: {
    display: "grid",
    gridTemplateColumns: "auto 1fr auto",
    alignItems: "center",
    columnGap: "0.5rem",
  },
})
