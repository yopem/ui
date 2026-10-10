import type { ChangeEvent } from "react"

import { Box } from "@registry/components/ui/box"
import { Button } from "@registry/components/ui/button"
import { Grid } from "@registry/components/ui/grid"
import { Heading } from "@registry/components/ui/heading"
import { HStack } from "@registry/components/ui/hstack"
import { Label } from "@registry/components/ui/label"
import { Text } from "@registry/components/ui/text"
import { useEventCallback } from "@registry/hooks/use-event-callback"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"
import { Link, createFileRoute } from "@tanstack/react-router"
import { ArrowRight } from "lucide-react"
import { useRef, useState } from "react"

import { catalog } from "@/catalog/components"
import { DocumentationLayout } from "@/catalog/docs-layout"
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
} from "@/catalog/docs-page"
import { catalogStyles } from "@/catalog/docs-styles"
import { createSeo } from "@/lib/seo"

const styles = stylex.create({
  section: {
    alignItems: "end",
    display: "flex",
    flexWrap: "wrap",
    gap: "1rem",
    marginBlock: "0 1.5rem",
    minInlineSize: "calc(var(--spacing) * 0)",
  },
  filter: {
    display: "grid",
    flex: "1 1 16rem",
    gap: "0.625rem",
    maxInlineSize: "32rem",
  },
  label: { fontWeight: 600 },
  searchComponents: {
    backgroundColor: tokens["--background"],
    borderColor: tokens["--input"],
    borderRadius: tokens["--radius-lg"],
    borderStyle: "solid",
    borderWidth: 1,
    color: tokens["--foreground"],
    font: "inherit",
    inlineSize: "100%",
    paddingBlock: "0.75rem",
    paddingInline: "0.9rem",
    outlineColor: {
      ":is(:focus-visible, [data-focus-visible])": tokens["--ring"],
    },
    outlineStyle: { ":is(:focus-visible, [data-focus-visible])": "solid" },
    outlineWidth: { ":is(:focus-visible, [data-focus-visible])": 2 },
    outlineOffset: { ":is(:focus-visible, [data-focus-visible])": 2 },
  },
  count: {
    color: tokens["--muted-foreground"],
    fontSize: "0.875rem",
    fontVariantNumeric: "tabular-nums",
    margin: 0,
    paddingBlockEnd: "0.75rem",
  },
  grid: {
    gap: "0.75rem",
    gridTemplateColumns: {
      default: "minmax(0, 1fr)",
      "@media (min-width: 768px)": "repeat(2, minmax(0, 1fr))",
      "@media (min-width: 1024px)": "repeat(3, minmax(0, 1fr))",
    },
  },
  cardHeader: { alignItems: "start", justifyContent: "space-between" },
  h2: {
    fontFamily: tokens["--font-heading"],
    fontSize: "1.0625rem",
    fontWeight: 650,
    letterSpacing: "-0.02em",
    margin: 0,
    overflowWrap: "anywhere",
  },
  arrow: {
    blockSize: "1.125rem",
    color: tokens["--muted-foreground"],
    flexShrink: 0,
    inlineSize: "1.125rem",
    marginBlockStart: "0.25rem",
  },
  description: {
    color: tokens["--muted-foreground"],
    fontSize: "0.875rem",
    lineHeight: 1.6,
    margin: 0,
  },
  metadata: {
    color: tokens["--muted-foreground"],
    fontSize: "0.75rem",
    marginBlockStart: "auto",
    paddingBlockStart: "0.75rem",
  },
  empty: {
    alignItems: "center",
    borderColor: tokens["--border"],
    borderRadius: tokens["--radius-xl"],
    borderStyle: "dashed",
    borderWidth: 1,
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
    gridColumn: "1 / -1",
    paddingBlock: "3rem",
    paddingInline: "1.5rem",
    textAlign: "center",
  },
})

export const Route = createFileRoute("/components/")({
  head: () =>
    createSeo({
      description:
        "Examine live component previews. Copy complete Yopem UI StyleX source.",
      path: "/components",
      title: "Components · Yopem UI",
    }),
  component: ComponentsPage,
})

const catalogEntries = catalog.map((item) => ({
  ...item,
  params: { name: item.slug },
}))

function ComponentsPage() {
  const [query, setQuery] = useState("")
  const searchRef = useRef<HTMLInputElement>(null)
  const normalizedQuery = query.trim().toLocaleLowerCase()

  const results = normalizedQuery
    ? catalogEntries.filter((item) =>
        `${item.title} ${item.slug}`
          .toLocaleLowerCase()
          .includes(normalizedQuery),
      )
    : catalogEntries

  const handleChange = useEventCallback(function (
    event: ChangeEvent<HTMLInputElement>,
  ) {
    return setQuery(event.target.value)
  })

  const clearSearch = useEventCallback(function () {
    setQuery("")
    searchRef.current?.focus()
  })

  return (
    <DocumentationLayout>
      <DocsPage full>
        <DocsTitle>Components</DocsTitle>
        <DocsDescription>
          Browse {catalog.length} components and patterns. Try live previews,
          read the API, and copy the source.
        </DocsDescription>
        <DocsBody>
          <Box render={<section />} xstyle={styles.section}>
            <Box xstyle={styles.filter}>
              <Label htmlFor="component-search" xstyle={styles.label}>
                Search components
              </Label>
              <Box
                render={
                  <input
                    id="component-search"
                    onChange={handleChange}
                    placeholder="Search by name…"
                    ref={searchRef}
                    type="search"
                    value={query}
                  />
                }
                xstyle={styles.searchComponents}
              />
            </Box>
            <Box
              aria-atomic="true"
              aria-live="polite"
              render={<output />}
              xstyle={styles.count}
            >
              {results.length}{" "}
              {results.length === 1 ? "component" : "components"}
            </Box>
          </Box>
          <Grid xstyle={styles.grid}>
            {results.map((item) => (
              <Link
                key={item.slug}
                {...stylex.props(catalogStyles.card)}
                params={item.params}
                preload="intent"
                to="/components/$name"
              >
                <HStack xstyle={styles.cardHeader}>
                  <Heading render={<h2>{item.title}</h2>} xstyle={styles.h2} />
                  <ArrowRight
                    aria-hidden="true"
                    {...stylex.props(styles.arrow)}
                  />
                </HStack>
                <Text xstyle={styles.description}>
                  {item.preview?.title ?? "Usage and API reference."}
                </Text>
                <Box render={<span />} xstyle={styles.metadata}>
                  {item.preview ? "Live preview" : "Usage and API"}
                </Box>
              </Link>
            ))}
            {results.length === 0 ? (
              <Box xstyle={styles.empty}>
                <Heading
                  render={<h2>No components found</h2>}
                  xstyle={styles.h2}
                />
                <Text xstyle={styles.description}>
                  No components match “{query}”.
                </Text>
                <Button onClick={clearSearch} type="button" variant="outline">
                  Clear search
                </Button>
              </Box>
            ) : null}
          </Grid>
        </DocsBody>
      </DocsPage>
    </DocumentationLayout>
  )
}
