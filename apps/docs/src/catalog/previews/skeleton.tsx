"use client"

import { Flex } from "@registry/components/ui/flex"
import { Skeleton } from "@registry/components/ui/skeleton"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  preview: {
    inlineSize: "100%",
    maxInlineSize: "23rem",
    flexDirection: "column",
    gap: "1.5rem",
  },
  row: { alignItems: "center", gap: "1rem" },
  avatar: {
    inlineSize: "2.5rem",
    blockSize: "2.5rem",
    borderRadius: "50%",
    flexShrink: 0,
  },
  details: { flex: 1, flexDirection: "column", gap: "0.5rem" },
  title: { blockSize: "1rem", inlineSize: "70%" },
  description: { blockSize: "0.75rem", inlineSize: "100%" },
  action: { blockSize: "1.75rem", inlineSize: "4rem", flexShrink: 0 },
})

export function Preview() {
  return (
    <Flex xstyle={styles.preview}>
      {[0, 1, 2].map((row) => (
        <Flex xstyle={styles.row} key={row}>
          <Skeleton xstyle={styles.avatar} />
          <Flex xstyle={styles.details}>
            <Skeleton xstyle={styles.title} />
            <Skeleton xstyle={styles.description} />
          </Flex>
          <Skeleton xstyle={styles.action} />
        </Flex>
      ))}
    </Flex>
  )
}
