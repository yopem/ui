import * as stylex from "@stylexjs/stylex"

import { Box } from "@/components/ui/box"
import { Flex } from "@/components/ui/flex"
import { Heading } from "@/components/ui/heading"
import { ScrollArea } from "@/components/ui/scroll-area"
const styles = stylex.create({
  scrollArea: {
    blockSize: "calc(0.25rem * 64)",
    borderRadius: "var(--radius)",
    borderStyle: "solid",
    borderWidth: "1px",
  },
  box: {
    paddingInline: "calc(0.25rem * 4)",
    paddingBlock: "calc(0.25rem * 2)",
  },
  h4: {
    marginBlockEnd: "calc(0.25rem * 2)",
    fontSize: "0.875rem",
    lineHeight: "calc(1.25 / 0.875)",
    fontWeight: "500",
  },
  flex: { flexDirection: "column", gap: "0.25rem" },
  box2: { fontSize: "0.875rem", lineHeight: "calc(1.25 / 0.875)" },
})
const tags = Array.from({ length: 50 }, (_, i) => `v1.0.0-alpha.${i}`)

export function Preview() {
  return (
    <ScrollArea xstyle={styles.scrollArea}>
      <Box xstyle={styles.box}>
        <Heading as="h4" xstyle={styles.h4}>
          Tags
        </Heading>
        <Flex xstyle={styles.flex}>
          {tags.map((tag) => (
            <Box xstyle={styles.box2} key={tag}>
              {tag}
            </Box>
          ))}
        </Flex>
      </Box>
    </ScrollArea>
  )
}
