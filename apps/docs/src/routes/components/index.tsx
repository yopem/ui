import * as stylex from "@stylexjs/stylex"
import { Link, createFileRoute } from "@tanstack/react-router"
import { useState } from "react"

import { catalogStyles } from "@/catalog/catalog-ui"
import { catalog } from "@/catalog/components"
import { DocumentationLayout } from "@/catalog/docs-layout"
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
} from "@/catalog/docs-page"
import { docsStyles } from "@/catalog/docs-styles"

export const Route = createFileRoute("/components/")({
  head: () => ({
    meta: [
      {
        content:
          "Browse examples and copy complete Yopem UI StyleX component source.",
        name: "description",
      },
      { title: "Components · Yopem UI" },
    ],
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
          Browse {catalog.length} components and patterns. Try an example, read
          the API, and copy the source into your project.
        </DocsDescription>
        <DocsBody>
          <section {...stylex.props(docsStyles.section)}>
            <input
              {...stylex.props(catalogStyles.search)}
              aria-label="Search components"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search components…"
              type="search"
              value={query}
            />
          </section>
          <div {...stylex.props(catalogStyles.grid)}>
            {results.map((item) => (
              <Link
                {...stylex.props(catalogStyles.card)}
                key={item.slug}
                params={{ name: item.slug }}
                preload="intent"
                to="/components/$name"
              >
                <h2 {...stylex.props(catalogStyles.cardTitle)}>{item.title}</h2>
                <span {...stylex.props(catalogStyles.cardCount)}>
                  {item.demos.length}{" "}
                  {item.demos.length === 1 ? "demo" : "demos"}
                </span>
              </Link>
            ))}
            {results.length === 0 ? (
              <p {...stylex.props(catalogStyles.empty)}>
                No components match “{query}”.
              </p>
            ) : null}
          </div>
        </DocsBody>
      </DocsPage>
    </DocumentationLayout>
  )
}
