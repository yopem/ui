import * as stylex from "@stylexjs/stylex"
import { Link, createFileRoute, notFound } from "@tanstack/react-router"

import {
  CatalogShell,
  DemoPanel,
  InstallCommand,
  catalogStyles,
  catalogStylesheet,
} from "@/catalog/catalog-ui"
import { getCatalogItem } from "@/catalog/components"

export const Route = createFileRoute("/components/$name")({
  loader: ({ params }) => {
    if (!getCatalogItem(params.name)) throw notFound()
    return params.name
  },
  head: ({ params }) => {
    const item = getCatalogItem(params.name)
    return {
      links: [{ href: catalogStylesheet, rel: "stylesheet" }],
      meta: [
        {
          content: item
            ? `Install ${item.title} and explore its StyleX demos.`
            : "Yopem UI component",
          name: "description",
        },
        { title: `${item?.title ?? "Component"} · Yopem UI` },
      ],
    }
  },
  component: ComponentPage,
  notFoundComponent: MissingComponent,
})

function ComponentPage() {
  const name = Route.useLoaderData()
  const item = getCatalogItem(name)
  if (!item) return <MissingComponent />

  return (
    <CatalogShell>
      <div {...stylex.props(catalogStyles.detailHeader)}>
        <Link {...stylex.props(catalogStyles.breadcrumb)} to="/components">
          ← All components
        </Link>
        <p {...stylex.props(catalogStyles.edition)}>
          {item.demos.length} {item.demos.length === 1 ? "demo" : "demos"}
        </p>
        <h1 {...stylex.props(catalogStyles.title)}>{item.title}</h1>
        <p {...stylex.props(catalogStyles.lead)}>
          Base UI behavior and public API preserved; styling migrated to local
          StyleX declarations.
        </p>
        <InstallCommand command={item.install} />
      </div>

      <section {...stylex.props(catalogStyles.section)}>
        <h2 {...stylex.props(catalogStyles.sectionTitle)}>Usage</h2>
        <pre {...stylex.props(catalogStyles.source)}>
          <code>{item.usage}</code>
        </pre>
      </section>

      <section {...stylex.props(catalogStyles.section)}>
        <h2 {...stylex.props(catalogStyles.sectionTitle)}>Demos</h2>
        <div {...stylex.props(catalogStyles.demoList)}>
          {item.demos.map((demo, index) => (
            <DemoPanel defaultOpen={index === 0} demo={demo} key={demo.name} />
          ))}
        </div>
      </section>
    </CatalogShell>
  )
}

function MissingComponent() {
  return (
    <CatalogShell>
      <h1 {...stylex.props(catalogStyles.title)}>Component not found.</h1>
      <Link {...stylex.props(catalogStyles.breadcrumb)} to="/components">
        Return to catalog
      </Link>
    </CatalogShell>
  )
}
