import type { ReactNode } from "react"

import { Box } from "@registry/components/ui/box"
import { Grid } from "@registry/components/ui/grid"
import { Heading } from "@registry/components/ui/heading"
import { Text } from "@registry/components/ui/text"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"

import type { TocItem } from "./table-of-contents"

import { TableOfContents } from "./table-of-contents"

const styles = stylex.create({
  grid: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr)",
    gap: "4rem",
    maxInlineSize: "90rem",
    marginInline: "auto",
    paddingBlock: { default: "3.5rem", "@media (max-width: 479.98px)": "2rem" },
    paddingInline: {
      default: "2.5rem",
      "@media (max-width: 479.98px)": "1.25rem",
    },
    minInlineSize: "calc(var(--spacing) * 0)",
  },
  article: { minInlineSize: "calc(var(--spacing) * 0)", maxInlineSize: "none" },
  grid2: {
    display: "grid",
    gridTemplateColumns: {
      default: "minmax(0, 1fr)",
      "@media (min-width: 1536px)": "minmax(0, 48rem) 11rem",
    },
    gap: "4rem",
    maxInlineSize: "72rem",
    marginInline: "auto",
    paddingBlock: { default: "3.5rem", "@media (max-width: 479.98px)": "2rem" },
    paddingInline: {
      default: "2.5rem",
      "@media (max-width: 479.98px)": "1.25rem",
    },
    minInlineSize: "calc(var(--spacing) * 0)",
  },
  article2: {
    minInlineSize: "calc(var(--spacing) * 0)",
    maxInlineSize: "52rem",
  },
  box: {
    color: tokens["--foreground"],
    fontSize: "0.9375rem",
    lineHeight: 1.75,
    minInlineSize: "calc(var(--spacing) * 0)",
    overflowWrap: "break-word",
  },
  h1: {
    fontFamily: tokens["--font-heading"],
    fontSize: {
      default: "2.75rem",
      "@media (max-width: 479.98px)": "2.125rem",
    },
    letterSpacing: "-0.045em",
    fontWeight: 650,
    lineHeight: 1.1,
    marginBlock: "0 1rem",
    textWrap: "balance",
  },
  paragraph: {
    color: tokens["--muted-foreground"],
    fontSize: "1.125rem",
    lineHeight: 1.7,
    marginBlock: "0 2.5rem",
    maxInlineSize: "42rem",
  },
})

const emptyToc: TocItem[] = []

export function DocsPage({
  children,
  toc = emptyToc,
  full = false,
}: {
  children: ReactNode
  toc?: TocItem[]
  full?: boolean
}) {
  if (full) {
    return (
      <Grid xstyle={styles.grid}>
        <Box as="article" xstyle={styles.article}>
          {children}
        </Box>
        {toc.length > 0 ? <TableOfContents items={toc} /> : null}
      </Grid>
    )
  }

  return (
    <Grid xstyle={styles.grid2}>
      <Box as="article" xstyle={styles.article2}>
        {children}
      </Box>
      {toc.length > 0 ? <TableOfContents items={toc} /> : null}
    </Grid>
  )
}

export function DocsBody({ children }: { children: ReactNode }) {
  return <Box xstyle={styles.box}>{children}</Box>
}

export function DocsTitle({ children }: { children: ReactNode }) {
  return (
    <Heading as="h1" xstyle={styles.h1}>
      {children}
    </Heading>
  )
}

export function DocsDescription({ children }: { children: ReactNode }) {
  return <Text xstyle={styles.paragraph}>{children}</Text>
}
