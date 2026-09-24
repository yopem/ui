import * as stylex from "@stylexjs/stylex"

import { Box } from "@/components/ui/box"
import { Flex } from "@/components/ui/flex"
import { Heading } from "@/components/ui/heading"
import { Paragraph } from "@/components/ui/paragraph"
import { Separator } from "@/components/ui/separator"
export function Preview() {
  return (
    <Box {...stylex.props(previewStyles.preview1)}>
      <Flex {...stylex.props(previewStyles.preview2)}>
        <Heading as="h4" {...stylex.props(previewStyles.preview3)}>
          coss ui
        </Heading>
        <Paragraph {...stylex.props(previewStyles.preview4)}>
          Unstyled, accessible primitives for fast product UI and design
          systems.
        </Paragraph>
      </Flex>
      <Separator {...stylex.props(previewStyles.preview5)} />
      <Flex {...stylex.props(previewStyles.preview6)}>
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

const previewStyles = stylex.create({
  preview1: {
    maxInlineSize: "calc(0.25rem * 72)",
  },
  preview2: {
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
  },
  preview3: {
    fontSize: "0.875rem",
    lineHeight: "calc(1.25 / 0.875)",
    fontWeight: "500",
  },
  preview4: {
    fontSize: "0.875rem",
    lineHeight: "calc(1.25 / 0.875)",
    color: "var(--muted-foreground)",
  },
  preview5: {
    marginBlock: "calc(0.25rem * 4)",
  },
  preview6: {
    display: "flex",
    alignItems: "center",
    gap: "calc(0.25rem * 4)",
    fontSize: "0.875rem",
    lineHeight: "calc(1.25 / 0.875)",
  },
})
