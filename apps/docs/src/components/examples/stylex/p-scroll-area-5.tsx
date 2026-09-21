import * as stylex from "@stylexjs/stylex"

import { Box } from "@/components/ui/stylex/box"
import { Flex } from "@/components/ui/stylex/flex"
import { ScrollArea } from "@/components/ui/stylex/scroll-area"
export default function Example() {
  return (
    <ScrollArea {...stylex.props(exampleStyles.example1)} scrollbarGutter>
      <Flex {...stylex.props(exampleStyles.example2)}>
        {Array.from({ length: 20 }).map((_, i) => (
          <Flex {...stylex.props(exampleStyles.example3)} key={String(i)}>
            <Box as="span" {...stylex.props(exampleStyles.example4)}>
              Item {i + 1}
            </Box>
          </Flex>
        ))}
      </Flex>
    </ScrollArea>
  )
}

const exampleStyles = stylex.create({
  example1: {
    maxInlineSize: "calc(0.25rem * 96)",
    borderRadius: "var(--radius)",
    borderStyle: "solid",
    borderWidth: "1px",
  },
  example2: {
    display: "flex",
    inlineSize: "max-content",
    gap: "calc(0.25rem * 4)",
    padding: "calc(0.25rem * 4)",
  },
  example3: {
    display: "flex",
    blockSize: "calc(0.25rem * 20)",
    inlineSize: "calc(0.25rem * 32)",
    flexShrink: "0",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "calc(var(--radius) - 2px)",
    backgroundColor: "var(--muted)",
  },
  example4: {
    fontSize: "0.875rem",
    lineHeight: "calc(1.25 / 0.875)",
    fontWeight: "500",
  },
})
