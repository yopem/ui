import * as stylex from "@stylexjs/stylex"

import { Box } from "@/components/ui/stylex/box"
import { Flex } from "@/components/ui/stylex/flex"
import { Heading } from "@/components/ui/stylex/heading"
import { Paragraph } from "@/components/ui/stylex/paragraph"
import { Separator } from "@/components/ui/stylex/separator"
export default function Example() {
  return (
    <Box {...stylex.props(exampleStyles.example1)}>
      <Flex {...stylex.props(exampleStyles.example2)}>
        <Heading as="h4" {...stylex.props(exampleStyles.example3)}>
          coss ui
        </Heading>
        <Paragraph {...stylex.props(exampleStyles.example4)}>
          Unstyled, accessible primitives for fast product UI and design
          systems.
        </Paragraph>
      </Flex>
      <Separator {...stylex.props(exampleStyles.example5)} />
      <Flex {...stylex.props(exampleStyles.example6)}>
        <Box>Blog</Box>
        <Separator orientation="vertical" />
        <Box>Docs</Box>
        <Separator orientation="vertical" />
        <Box>Source</Box>
        <Separator orientation="vertical" />
        <Box>Releases</Box>
      </Flex>
    </Box>
  )
}

const exampleStyles = stylex.create({
  example1: {
    maxInlineSize: "calc(0.25rem * 72)",
  },
  example2: {
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
  },
  example3: {
    fontSize: "0.875rem",
    lineHeight: "calc(1.25 / 0.875)",
    fontWeight: "500",
  },
  example4: {
    fontSize: "0.875rem",
    lineHeight: "calc(1.25 / 0.875)",
    color: "var(--muted-foreground)",
  },
  example5: {
    marginBlock: "calc(0.25rem * 4)",
  },
  example6: {
    display: "flex",
    alignItems: "center",
    gap: "calc(0.25rem * 4)",
    fontSize: "0.875rem",
    lineHeight: "calc(1.25 / 0.875)",
  },
})
