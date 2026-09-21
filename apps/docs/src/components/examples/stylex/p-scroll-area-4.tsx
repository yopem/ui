import * as stylex from "@stylexjs/stylex"

import { Box } from "@/components/ui/stylex/box"
import { Flex } from "@/components/ui/stylex/flex"
import { Heading } from "@/components/ui/stylex/heading"
import { ScrollArea } from "@/components/ui/stylex/scroll-area"
const tags = Array.from({ length: 50 }, (_, i) => `v1.0.0-alpha.${i}`)

export default function Example() {
  return (
    <ScrollArea {...stylex.props(exampleStyles.example1)} scrollFade>
      <Box {...stylex.props(exampleStyles.example2)}>
        <Heading as="h4" {...stylex.props(exampleStyles.example3)}>
          Tags
        </Heading>
        <Flex {...stylex.props(exampleStyles.example4)}>
          {tags.map((tag) => (
            <Box {...stylex.props(exampleStyles.example5)} key={tag}>
              {tag}
            </Box>
          ))}
        </Flex>
      </Box>
    </ScrollArea>
  )
}

const exampleStyles = stylex.create({
  example1: {
    blockSize: "calc(0.25rem * 64)",
    borderRadius: "var(--radius)",
    borderStyle: "solid",
    borderWidth: "1px",
  },
  example2: {
    paddingInline: "calc(0.25rem * 4)",
    paddingBlock: "calc(0.25rem * 2)",
  },
  example3: {
    marginBlockEnd: "calc(0.25rem * 2)",
    fontSize: "0.875rem",
    lineHeight: "calc(1.25 / 0.875)",
    fontWeight: "500",
  },
  example4: {
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
  },
  example5: {
    fontSize: "0.875rem",
    lineHeight: "calc(1.25 / 0.875)",
  },
})
