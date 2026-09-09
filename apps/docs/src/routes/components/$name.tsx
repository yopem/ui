import * as stylex from "@stylexjs/stylex"
import { Link, createFileRoute, notFound } from "@tanstack/react-router"
import { Suspense } from "react"

import { ApiReference } from "@/catalog/api-reference"
import { DemoPanel, catalogStyles } from "@/catalog/catalog-ui"
import { CopyableCode } from "@/catalog/code-block"
import { getCatalogItem } from "@/catalog/components"
import { DocumentationLayout } from "@/catalog/docs-layout"
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
} from "@/catalog/docs-page"
import { docsStyles } from "@/catalog/docs-styles"
import { getDocumentation } from "@/catalog/docs.functions"

export const Route = createFileRoute("/components/$name")({
  loader: ({ params }) => {
    if (!getCatalogItem(params.name)) throw notFound()
    return getDocumentation({ data: params.name })
  },
  head: ({ params }) => ({
    meta: [
      {
        name: "description",
        content: `${getCatalogItem(params.name)?.title ?? "Component"} source, examples, usage, and API reference for React and StyleX.`,
      },
      {
        title: `${getCatalogItem(params.name)?.title ?? "Component"} · Yopem UI`,
      },
    ],
  }),
  component: ComponentPage,
  notFoundComponent: MissingComponent,
})

const toc = [
  { title: "Overview", url: "#overview", depth: 2 },
  { title: "Examples", url: "#examples", depth: 2 },
  { title: "Installation", url: "#installation", depth: 2 },
  { title: "Usage", url: "#usage", depth: 2 },
  { title: "API reference", url: "#api-reference", depth: 2 },
]

function ComponentPage() {
  const data = Route.useLoaderData()
  const { name } = Route.useParams()
  const item = getCatalogItem(name)
  if (!item) return <MissingComponent />
  const Preview = item.demos[0]?.component

  return (
    <DocumentationLayout>
      <DocsPage toc={toc}>
        <DocsTitle>{item.title}</DocsTitle>
        <DocsDescription>{data.description}</DocsDescription>
        <DocsBody>
          <h2 {...stylex.props(docsStyles.h2)} id="overview">
            Overview
          </h2>
          <p {...stylex.props(docsStyles.p)}>
            Copy the source into your project, then import the parts you need.
            Styles use local StyleX declarations and shared theme tokens. You
            can change the source without wrapping or replacing a package.
          </p>
          <h2 {...stylex.props(docsStyles.h2)} id="examples">
            Examples
          </h2>
          {Preview ? (
            <div {...stylex.props(docsStyles.preview)}>
              <Suspense
                fallback={
                  <p {...stylex.props(docsStyles.p)}>Loading example…</p>
                }
              >
                <Preview />
              </Suspense>
            </div>
          ) : null}
          <p {...stylex.props(docsStyles.p)}>
            Open an example to try it or copy its source. Examples use the same
            StyleX components shown below.
          </p>
          {item.demos.length ? (
            <details {...stylex.props(docsStyles.details)}>
              <summary {...stylex.props(docsStyles.summary)}>
                Browse all {item.demos.length} examples and source
              </summary>
              <div {...stylex.props(catalogStyles.demoList)}>
                {item.demos.map((demo) => (
                  <DemoPanel demo={demo} key={demo.name} />
                ))}
              </div>
            </details>
          ) : (
            <p {...stylex.props(docsStyles.p)}>
              Use the composition in Usage below to start with {item.title}.
            </p>
          )}
          <h2 {...stylex.props(docsStyles.h2)} id="installation">
            Installation
          </h2>
          <p {...stylex.props(docsStyles.p)}>
            Complete the{" "}
            <Link {...stylex.props(docsStyles.link)} to="/docs/installation">
              StyleX setup
            </Link>{" "}
            first. Copy each required file to its destination below. Shared
            files only need to be copied once. Keep the{" "}
            <code {...stylex.props(docsStyles.inlineCode)}>@registry/*</code>{" "}
            alias pointing to{" "}
            <code {...stylex.props(docsStyles.inlineCode)}>src/yopem/*</code>.
          </p>
          <h3 {...stylex.props(docsStyles.h3)}>Dependencies</h3>
          <p {...stylex.props(docsStyles.p)}>
            Add these packages to your application's package manifest and
            install them with your package manager.
          </p>
          <ul {...stylex.props(docsStyles.ul)}>
            {data.dependencies.map((dependency) => (
              <li {...stylex.props(docsStyles.li)} key={dependency}>
                <code {...stylex.props(docsStyles.inlineCode)}>
                  {dependency}
                </code>
              </li>
            ))}
          </ul>
          {data.devDependencies.length ? (
            <>
              <h4 {...stylex.props(docsStyles.h4)}>Development dependencies</h4>
              <ul {...stylex.props(docsStyles.ul)}>
                {data.devDependencies.map((dependency) => (
                  <li {...stylex.props(docsStyles.li)} key={dependency}>
                    <code {...stylex.props(docsStyles.inlineCode)}>
                      {dependency}
                    </code>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
          <h4 {...stylex.props(docsStyles.h4)}>Peer dependencies</h4>
          <ul {...stylex.props(docsStyles.ul)}>
            {data.peerDependencies.map((dependency) => (
              <li {...stylex.props(docsStyles.li)} key={dependency}>
                <code {...stylex.props(docsStyles.inlineCode)}>
                  {dependency}
                </code>
              </li>
            ))}
          </ul>
          <p {...stylex.props(docsStyles.p)}>
            Included components and shared files:{" "}
            {data.requiredItems.map((entry) => entry.title).join(", ")}.
          </p>
          <div {...stylex.props(docsStyles.section)}>
            {data.files.map((file) => (
              <details {...stylex.props(docsStyles.details)} key={file.path}>
                <summary {...stylex.props(docsStyles.summary)}>
                  <code {...stylex.props(docsStyles.inlineCode)}>
                    {file.target}
                  </code>
                </summary>
                <CopyableCode code={file.content} title={file.target} />
              </details>
            ))}
          </div>
          <h2 {...stylex.props(docsStyles.h2)} id="usage">
            Usage
          </h2>
          {data.notes.map((note) => (
            <p {...stylex.props(docsStyles.p)} key={note}>
              {note}
            </p>
          ))}
          <p {...stylex.props(docsStyles.p)}>
            Import from the destination you copied into your application.
          </p>
          <CopyableCode
            code={data.usage.replaceAll(
              "@/components/ui/",
              "@registry/components/ui/",
            )}
            title={`${item.title} usage`}
          />
          <h2 {...stylex.props(docsStyles.h2)} id="api-reference">
            API reference
          </h2>
          <p {...stylex.props(docsStyles.p)}>
            Generated from the canonical TypeScript source and its dependency
            types. Every exported part appears below, including inherited HTML
            and Base UI props. Required marks a required property, not a
            required component.
          </p>
          <ApiReference parts={data.api} />
        </DocsBody>
      </DocsPage>
    </DocumentationLayout>
  )
}

function MissingComponent() {
  return (
    <DocumentationLayout>
      <DocsPage>
        <DocsTitle>Component not found</DocsTitle>
        <DocsBody>
          <Link {...stylex.props(docsStyles.link)} to="/components">
            Browse components
          </Link>
        </DocsBody>
      </DocsPage>
    </DocumentationLayout>
  )
}
