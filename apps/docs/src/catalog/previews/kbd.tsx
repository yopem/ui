import { Box } from "@/components/ui/box"
import { Flex } from "@/components/ui/flex"
import { Kbd, KbdGroup } from "@/components/ui/kbd"
import { Paragraph } from "@/components/ui/paragraph"
export function Preview() {
  return (
    <Flex flexDirection={"column"} gap={"calc(0.25rem * 4)"}>
      <Box>
        <Paragraph
          marginBlockEnd={"calc(0.25rem * 2)"}
          fontSize={"0.875rem"}
          lineHeight={"calc(1.25 / 0.875)"}
          color={"var(--muted-foreground)"}
        >
          Single keys:
        </Paragraph>
        <Flex gap={"calc(0.25rem * 2)"}>
          <Kbd>K</Kbd>
          <Kbd>⌘</Kbd>
          <Kbd>⌃</Kbd>
          <Kbd>⇧</Kbd>
        </Flex>
      </Box>
      <Box>
        <Paragraph
          marginBlockEnd={"calc(0.25rem * 2)"}
          fontSize={"0.875rem"}
          lineHeight={"calc(1.25 / 0.875)"}
          color={"var(--muted-foreground)"}
        >
          Key combinations:
        </Paragraph>
        <Flex gap={"calc(0.25rem * 2)"}>
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
