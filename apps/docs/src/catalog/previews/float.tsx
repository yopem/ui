"use client"

import { Badge } from "@registry/components/ui/badge"
import { Box } from "@registry/components/ui/box"
import { Float } from "@registry/components/ui/float"
import { Text } from "@registry/components/ui/text"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  area: {
    backgroundColor: tokens["--card"],
    borderColor: tokens["--card-border"],
    borderRadius: tokens["--radius"],
    borderStyle: "solid",
    borderWidth: 1,
    inlineSize: "100%",
    maxInlineSize: "18rem",
    position: "relative",
    minBlockSize: "10rem",
    padding: "1.5rem",
  },
  title: { fontSize: "0.875rem", fontWeight: 500, paddingInlineEnd: "3rem" },
  description: {
    color: tokens["--muted-foreground"],
    fontSize: "0.875rem",
    marginBlockStart: "0.75rem",
  },
  float: { insetBlockStart: "0.75rem", insetInlineEnd: "0.75rem" },
})

export function Preview() {
  return (
    <Box xstyle={styles.area}>
      <Text xstyle={styles.title}>Trail notice</Text>
      <Text xstyle={styles.description}>The east trail opens at sunrise.</Text>
      <Float xstyle={styles.float}>
        <Badge variant="secondary">New</Badge>
      </Float>
    </Box>
  )
}
