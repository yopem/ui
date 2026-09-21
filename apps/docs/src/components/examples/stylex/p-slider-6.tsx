import * as stylex from "@stylexjs/stylex"

import { Box } from "@/components/ui/stylex/box"
import { Flex } from "@/components/ui/stylex/flex"
import { Slider } from "@/components/ui/stylex/slider"
export default function Example() {
  return (
    <Box>
      <Flex aria-hidden="true" {...stylex.props(exampleStyles.example1)}>
        <Box as="span">Low</Box>
        <Box as="span">High</Box>
      </Flex>
      <Slider
        aria-label="Intensity level from low to high"
        defaultValue={50}
        step={10}
      />
    </Box>
  )
}

const exampleStyles = stylex.create({
  example1: {
    marginBlockEnd: "calc(0.25rem * 3)",
    display: "flex",
    inlineSize: "100%",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "calc(0.25rem * 2)",
    fontSize: "0.75rem",
    lineHeight: "calc(1 / 0.75)",
    fontWeight: "500",
    color: "var(--muted-foreground)",
  },
})
