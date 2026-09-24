import * as stylex from "@stylexjs/stylex"

import { Box } from "@/components/ui/box"
import { Flex } from "@/components/ui/flex"
import { Heading } from "@/components/ui/heading"
import { ScrollArea } from "@/components/ui/scroll-area"
const tags = Array.from({ length: 50 }, (_, i) => `v1.0.0-alpha.${i}`)

export function Preview() {
  return (
    <ScrollArea {...stylex.props(previewStyles.preview1)}>
      <Box {...stylex.props(previewStyles.preview2)}>
        <Heading as="h4" {...stylex.props(previewStyles.preview3)}>
          Tags
        </Heading>
        <Flex {...stylex.props(previewStyles.preview4)}>
          {tags.map((tag) => (
            <Box {...stylex.props(previewStyles.preview5)} key={tag}>
              {tag}
            </Box>
          ))}
        </Flex>
      </Box>
    </ScrollArea>
  )
}

const previewStyles = stylex.create({
  preview1: {
    blockSize: "calc(0.25rem * 64)",
    borderRadius: "var(--radius)",
    borderStyle: "solid",
    borderWidth: "1px",
  },
  preview2: {
    paddingInline: "calc(0.25rem * 4)",
    paddingBlock: "calc(0.25rem * 2)",
  },
  preview3: {
    marginBlockEnd: "calc(0.25rem * 2)",
    fontSize: "0.875rem",
    lineHeight: "calc(1.25 / 0.875)",
    fontWeight: "500",
  },
  preview4: {
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
  },
  preview5: {
    fontSize: "0.875rem",
    lineHeight: "calc(1.25 / 0.875)",
  },
})
