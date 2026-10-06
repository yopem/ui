import type { ChangeEvent } from "react"

import { Box } from "@registry/components/ui/box"
import { Grid } from "@registry/components/ui/grid"
import { Heading } from "@registry/components/ui/heading"
import { Text } from "@registry/components/ui/text"
import { useEventCallback } from "@registry/hooks/use-event-callback"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"
import { Link, createFileRoute } from "@tanstack/react-router"
import { useState } from "react"

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
  section: { marginBlock: "2rem", minInlineSize: "calc(var(--spacing) * 0)" },
  searchComponents: {
    backgroundColor: tokens["--background"],
    borderColor: tokens["--input"],
    borderRadius: tokens["--radius-lg"],
    borderStyle: "solid",
    borderWidth: 1,
    color: tokens["--foreground"],
    font: "inherit",
    inlineSize: "100%",
    maxInlineSize: "32rem",
    paddingBlock: "0.75rem",
    paddingInline: "0.9rem",
    outlineColor: {
      ":is(:focus-visible, [data-focus-visible])": tokens["--ring"],
    },
    outlineStyle: { ":is(:focus-visible, [data-focus-visible])": "solid" },
    outlineWidth: { ":is(:focus-visible, [data-focus-visible])": 2 },
    outlineOffset: { ":is(:focus-visible, [data-focus-visible])": 2 },
  },
  grid: {
    gap: "0.75rem",
    gridTemplateColumns: {
      default: "1fr",
      "@media (min-width: 768px)": "repeat(2, minmax(0, 1fr))",
      "@media (min-width: 1024px)": "repeat(3, minmax(0, 1fr))",
    },
  },
  h2: {
    fontSize: "1rem",
    fontWeight: 650,
    letterSpacing: "-0.01em",
    margin: "calc(var(--spacing) * 0)",
  },
  span: {
    color: tokens["--muted-foreground"],
    fontSize: "0.75rem",
    marginBlockStart: "auto",
  },
  paragraph: {
    borderColor: tokens["--border"],
    borderRadius: tokens["--radius-xl"],
    borderStyle: "dashed",
    borderWidth: 1,
    color: tokens["--muted-foreground"],
    gridColumn: "1 / -1",
    paddingBlock: "2rem",
    paddingInline: "2rem",
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

  return (
    <DocumentationLayout>
      <DocsPage full>
        <DocsTitle>Components</DocsTitle>
        <DocsDescription>
          Examine {catalog.length} components and patterns. Try a preview. Read
          the API. Copy the source into your project.
        </DocsDescription>
        <DocsBody>
          <Box render={<section />} xstyle={styles.section}>
            <Box
              render={
                <input
                  aria-label="Search components"
                  onChange={handleChange}
                  placeholder="Search components…"
                  type="search"
                  value={query}
                />
              }
              xstyle={styles.searchComponents}
            />
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
                <Heading render={<h2>{item.title}</h2>} xstyle={styles.h2} />
                <Box render={<span />} xstyle={styles.span}>
                  {item.preview ? "Live preview" : "Usage and API"}
                </Box>
              </Link>
            ))}
            {results.length === 0 ? (
              <Text xstyle={styles.paragraph}>
                No components match “{query}”.
              </Text>
            ) : null}
          </Grid>
        </DocsBody>
      </DocsPage>
    </DocumentationLayout>
  )
}
