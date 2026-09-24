import type { ReactNode } from "react"

import { tokens } from "@registry/styles/tokens.stylex"

import { Box } from "@/components/ui/box"
import { Grid } from "@/components/ui/grid"
import { Heading } from "@/components/ui/heading"
import { Paragraph } from "@/components/ui/paragraph"

import type { TocItem } from "./table-of-contents"

import { TableOfContents } from "./table-of-contents"
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
      <Grid
        display="grid"
        gridTemplateColumns="minmax(0, 1fr)"
        gap="4rem"
        maxInlineSize="90rem"
        marginInline="auto"
        paddingBlock={{ base: "3.5rem", smDown: "2rem" }}
        paddingInline={{ base: "2.5rem", smDown: "1.25rem" }}
        minInlineSize={0}
      >
        <Box as="article" minInlineSize={0} maxInlineSize="none">
          {children}
        </Box>
        {toc.length > 0 ? <TableOfContents items={toc} /> : null}
      </Grid>
    )
  }
  return (
    <Grid
      display="grid"
      gridTemplateColumns={{
        base: "minmax(0, 1fr)",
        "2xl": "minmax(0, 48rem) 11rem",
      }}
      gap="4rem"
      maxInlineSize="72rem"
      marginInline="auto"
      paddingBlock={{ base: "3.5rem", smDown: "2rem" }}
      paddingInline={{ base: "2.5rem", smDown: "1.25rem" }}
      minInlineSize={0}
    >
      <Box as="article" minInlineSize={0} maxInlineSize="52rem">
        {children}
      </Box>
      {toc.length > 0 ? <TableOfContents items={toc} /> : null}
    </Grid>
  )
}

export function DocsBody({ children }: { children: ReactNode }) {
  return (
    <Box
      color={tokens["--foreground"]}
      fontSize="0.9375rem"
      lineHeight={1.75}
      minInlineSize={0}
      overflowWrap="break-word"
    >
      {children}
    </Box>
  )
}

export function DocsTitle({ children }: { children: ReactNode }) {
  return (
    <Heading
      as="h1"
      fontFamily={tokens["--font-heading"]}
      fontSize={{ base: "2.75rem", smDown: "2.125rem" }}
      letterSpacing="-0.045em"
      fontWeight={650}
      lineHeight={1.1}
      marginBlock="0 1rem"
      textWrap="balance"
    >
      {children}
    </Heading>
  )
}

export function DocsDescription({ children }: { children: ReactNode }) {
  return (
    <Paragraph
      color={tokens["--muted-foreground"]}
      fontSize="1.125rem"
      lineHeight={1.7}
      marginBlock="0 2.5rem"
      maxInlineSize="42rem"
    >
      {children}
    </Paragraph>
  )
}
