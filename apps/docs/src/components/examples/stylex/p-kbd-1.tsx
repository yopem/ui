import * as stylex from "@stylexjs/stylex"

import { Box } from "@/components/ui/box"
import { Flex } from "@/components/ui/flex"
import { Kbd, KbdGroup } from "@/components/ui/kbd"
import { Paragraph } from "@/components/ui/paragraph"
export default function Example() {
  return (
    <Flex {...stylex.props(exampleStyles.example1)}>
      <Box>
        <Paragraph {...stylex.props(exampleStyles.example2)}>
          Single keys:
        </Paragraph>
        <Flex {...stylex.props(exampleStyles.example3)}>
          <Kbd>K</Kbd>
          <Kbd>⌘</Kbd>
          <Kbd>⌃</Kbd>
          <Kbd>⇧</Kbd>
        </Flex>
      </Box>
      <Box>
        <Paragraph {...stylex.props(exampleStyles.example2)}>
          Key combinations:
        </Paragraph>
        <Flex {...stylex.props(exampleStyles.example3)}>
          <KbdGroup>
            <Kbd>⌘</Kbd>
            <Kbd>K</Kbd>
          </KbdGroup>
          <KbdGroup>
            <Kbd>⌘</Kbd>
            <Kbd>Shift</Kbd>
            <Kbd>P</Kbd>
          </KbdGroup>
          <KbdGroup>
            <Kbd>Ctrl</Kbd>
            <Kbd>Alt</Kbd>
            <Kbd>Delete</Kbd>
          </KbdGroup>
        </Flex>
      </Box>
    </Flex>
  )
}

const exampleStyles = stylex.create({
  example1: {
    display: "flex",
    flexDirection: "column",
    gap: "calc(0.25rem * 4)",
  },
  example2: {
    marginBlockEnd: "calc(0.25rem * 2)",
    fontSize: "0.875rem",
    lineHeight: "calc(1.25 / 0.875)",
    color: "var(--muted-foreground)",
  },
  example3: {
    display: "flex",
    gap: "calc(0.25rem * 2)",
  },
})
