import * as stylex from "@stylexjs/stylex"
import { Link, createFileRoute } from "@tanstack/react-router"
import { useState } from "react"

import {
  CatalogShell,
  catalogStyles,
  catalogStylesheet,
} from "@/catalog/catalog-ui"
import { catalog } from "@/catalog/components"

export const Route = createFileRoute("/components/")({
  head: () => ({
    links: [{ href: catalogStylesheet, rel: "stylesheet" }],
    meta: [
      {
        content: "Browse and install Yopem UI StyleX components.",
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
    <CatalogShell>
      <section {...stylex.props(catalogStyles.hero)}>
        <p {...stylex.props(catalogStyles.edition)}>
          54 components · 2 composed patterns
        </p>
        <h1 {...stylex.props(catalogStyles.title)}>
          Source-first components, styled with StyleX.
        </h1>
        <p {...stylex.props(catalogStyles.lead)}>
          Search components, inspect every migrated demo, then copy source into
          your project with one command.
        </p>
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
              {item.demos.length} {item.demos.length === 1 ? "demo" : "demos"}
            </span>
          </Link>
        ))}
        {results.length === 0 ? (
          <p {...stylex.props(catalogStyles.empty)}>
            No components match “{query}”.
          </p>
        ) : null}
      </div>
    </CatalogShell>
  )
}
