import { Box } from "@registry/components/ui/box"
import { Flex } from "@registry/components/ui/flex"
import { Kbd, KbdGroup } from "@registry/components/ui/kbd"
import { Paragraph } from "@registry/components/ui/paragraph"
import * as stylex from "@stylexjs/stylex"
const styles = stylex.create({
  flex: { flexDirection: "column", gap: "calc(0.25rem * 4)" },
  paragraph: {
    marginBlockEnd: "calc(0.25rem * 2)",
    fontSize: "0.875rem",
    lineHeight: "calc(1.25 / 0.875)",
    color: "var(--muted-foreground)",
  },
  flex2: { gap: "calc(0.25rem * 2)" },
  paragraph2: {
    marginBlockEnd: "calc(0.25rem * 2)",
    fontSize: "0.875rem",
    lineHeight: "calc(1.25 / 0.875)",
    color: "var(--muted-foreground)",
  },
  flex3: { gap: "calc(0.25rem * 2)" },
})
export function Preview() {
  return (
    <Flex xstyle={styles.flex}>
      <Box>
        <Paragraph xstyle={styles.paragraph}>Single keys:</Paragraph>
        <Flex xstyle={styles.flex2}>
          <Kbd>K</Kbd>
          <Kbd>⌘</Kbd>
          <Kbd>⌃</Kbd>
          <Kbd>⇧</Kbd>
        </Flex>
      </Box>
      <Box>
        <Paragraph xstyle={styles.paragraph2}>Key combinations:</Paragraph>
        <Flex xstyle={styles.flex3}>
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
