import * as stylex from "@stylexjs/stylex"

import { Box } from "@/components/ui/stylex/box"
import { Slider } from "@/components/ui/stylex/slider"
export default function Example() {
  return (
    <Box>
      <Slider
        aria-label="Storage size in GB"
        defaultValue={15}
        max={35}
        min={5}
      />
      <Box
        as="fieldset"
        aria-label="Storage size reference values"
        {...stylex.props(exampleStyles.example1)}
      >
        <Box as="span">5 GB</Box>
        <Box as="span">20 GB</Box>
        <Box as="span">35 GB</Box>
      </Box>
    </Box>
  )
}

const exampleStyles = stylex.create({
  example1: {
    marginBlockStart: "calc(0.25rem * 4)",
    display: "flex",
    inlineSize: "100%",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "0.25rem",
    fontSize: "0.75rem",
    lineHeight: "calc(1 / 0.75)",
    fontWeight: "500",
    color: "var(--muted-foreground)",
  },
})
