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
import { Box } from "@/components/ui/box"
import { Grid } from "@/components/ui/grid"
import { Heading } from "@/components/ui/heading"
import { Paragraph } from "@/components/ui/paragraph"
import { createSeo } from "@/lib/seo"
export const Route = createFileRoute("/components/")({
  head: () =>
    createSeo({
      description:
        "Browse live component previews and copy complete Yopem UI StyleX source.",
      path: "/components",
      title: "Components · Yopem UI",
    }),
  component: ComponentsPage,
})

function ComponentsPage() {
  const [query, setQuery] = useState("")
  const normalizedQuery = query.trim().toLocaleLowerCase()
  const results = normalizedQuery
    ? catalog.filter((item) =>
        `${item.title} ${item.slug}`
          .toLocaleLowerCase()
          .includes(normalizedQuery),
      )
    : catalog

  return (
    <DocumentationLayout>
      <DocsPage full>
        <DocsTitle>Components</DocsTitle>
        <DocsDescription>
          Browse {catalog.length} components and patterns. Try a preview, read
          the API, and copy the source into your project.
        </DocsDescription>
        <DocsBody>
          <Box as="section" marginBlock="2rem" minInlineSize={0}>
            <Box
              as="input"
              backgroundColor={tokens["--background"]}
              borderColor={tokens["--input"]}
              borderRadius={tokens["--radius-lg"]}
              borderStyle="solid"
              borderWidth={1}
              color={tokens["--foreground"]}
              font="inherit"
              inlineSize="100%"
              maxInlineSize="32rem"
              paddingBlock="0.75rem"
              paddingInline="0.9rem"
              _focusVisible={{
                outlineColor: tokens["--ring"],
                outlineStyle: "solid",
                outlineWidth: 2,
                outlineOffset: 2,
              }}
              aria-label="Search components"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search components…"
              type="search"
              value={query}
            />
          </Box>
          <Grid
            gap="0.75rem"
            gridTemplateColumns={{
              base: "1fr",
              md: "repeat(2, minmax(0, 1fr))",
              lg: "repeat(3, minmax(0, 1fr))",
            }}
          >
            {results.map((item) => (
              <Link
                {...stylex.props(catalogStyles.card)}
                key={item.slug}
                params={{ name: item.slug }}
                preload="intent"
                to="/components/$name"
              >
                <Heading
                  as="h2"
                  fontSize="1rem"
                  fontWeight={650}
                  letterSpacing="-0.01em"
                  margin={0}
                >
                  {item.title}
                </Heading>
                <Box
                  as="span"
                  color={tokens["--muted-foreground"]}
                  fontSize="0.75rem"
                  marginBlockStart="auto"
                >
                  {item.preview ? "Live preview" : "Usage and API"}
                </Box>
              </Link>
            ))}
            {results.length === 0 ? (
              <Paragraph
                borderColor={tokens["--border"]}
                borderRadius={tokens["--radius-xl"]}
                borderStyle="dashed"
                borderWidth={1}
                color={tokens["--muted-foreground"]}
                gridColumn="1 / -1"
                padding="2rem"
                textAlign="center"
              >
                No components match “{query}”.
              </Paragraph>
            ) : null}
          </Grid>
        </DocsBody>
      </DocsPage>
    </DocumentationLayout>
  )
}
