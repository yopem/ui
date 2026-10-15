"use client"

import { AspectRatio } from "@registry/components/ui/aspect-ratio"
import { Grid } from "@registry/components/ui/grid"
import { Text } from "@registry/components/ui/text"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  examples: {
    alignItems: "start",
    gap: `calc(${tokens["--spacing"]} * 4)`,
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    inlineSize: "24rem",
    maxInlineSize: "100%",
  },
  label: {
    color: tokens["--muted-foreground"],
    fontSize: "0.75rem",
    lineHeight: 1,
  },
  surface: {
    alignItems: "center",
    display: "flex",
    justifyContent: "center",
    backgroundColor: tokens["--muted"],
    borderRadius: tokens["--radius-md"],
  },
  wide: { aspectRatio: 2 },
})

export function Preview() {
  return (
    <Grid xstyle={styles.examples}>
      <AspectRatio data-testid="ratio-default" xstyle={styles.surface}>
        <Text xstyle={styles.label}>16:9</Text>
      </AspectRatio>
      <AspectRatio data-testid="ratio-square" ratio={1} xstyle={styles.surface}>
        <Text xstyle={styles.label}>1:1</Text>
      </AspectRatio>
      <AspectRatio
        data-testid="ratio-invalid"
        ratio={0}
        xstyle={styles.surface}
      >
        <Text xstyle={styles.label}>Fallback</Text>
      </AspectRatio>
      <AspectRatio
        data-testid="ratio-override"
        xstyle={[styles.surface, styles.wide]}
      >
        <Text xstyle={styles.label}>2:1</Text>
      </AspectRatio>
    </Grid>
  )
}
