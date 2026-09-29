import { Box } from "@registry/components/ui/box"
import { Flex } from "@registry/components/ui/flex"
import { Heading } from "@registry/components/ui/heading"
import { Separator } from "@registry/components/ui/separator"
import { Text } from "@registry/components/ui/text"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  box: { maxInlineSize: "calc(0.25rem * 72)" },
  flex: { flexDirection: "column", gap: "0.25rem" },
  h4: {
    fontSize: "0.875rem",
    lineHeight: "calc(1.25 / 0.875)",
    fontWeight: "500",
  },
  paragraph: {
    fontSize: "0.875rem",
    lineHeight: "calc(1.25 / 0.875)",
    color: "var(--muted-foreground)",
  },
  separator: { marginBlock: "calc(0.25rem * 4)" },
  flex2: {
    alignItems: "center",
    gap: "calc(0.25rem * 4)",
    fontSize: "0.875rem",
    lineHeight: "calc(1.25 / 0.875)",
  },
})

export function Preview() {
  return (
    <Box xstyle={styles.box}>
      <Flex xstyle={styles.flex}>
        <Heading as="h4" xstyle={styles.h4}>
          coss ui
        </Heading>
        <Text xstyle={styles.paragraph}>
          Unstyled, accessible primitives for fast product UI and design
          systems.
        </Text>
      </Flex>
      <Separator xstyle={styles.separator} />
      <Flex xstyle={styles.flex2}>
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
