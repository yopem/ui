import * as stylex from "@stylexjs/stylex"
import { Link, createFileRoute, notFound } from "@tanstack/react-router"
import { useState } from "react"

import { ApiReference } from "@/catalog/api-reference"
import { ExamplePanel } from "@/catalog/catalog-ui"
import { CopyableCode } from "@/catalog/code-block"
import { getCatalogItem } from "@/catalog/components"
import { DocumentationLayout } from "@/catalog/docs-layout"
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
} from "@/catalog/docs-page"
import { catalogStyles, docsStyles } from "@/catalog/docs-styles"
import { getDocumentation } from "@/catalog/docs.functions"
import { Box } from "@/components/ui/box"
import { Grid } from "@/components/ui/grid"
import { Heading } from "@/components/ui/heading"
import { Paragraph } from "@/components/ui/paragraph"
import { Tabs, TabsList, TabsPanel, TabsTab } from "@/components/ui/tabs"
import { createSeo } from "@/lib/seo"
export const Route = createFileRoute("/components/$name")({
  loader: ({ params }) => {
    if (!getCatalogItem(params.name)) throw notFound()
    return getDocumentation({ data: params.name })
  },
  head: ({ params }) => {
    const title = getCatalogItem(params.name)?.title ?? "Component"
    return createSeo({
      description: `${title} source, examples, usage, and API reference for React and StyleX.`,
      path: `/components/${params.name}`,
      title: `${title} · Yopem UI`,
    })
  },
  component: ComponentPage,
  notFoundComponent: MissingComponent,
})

const toc = [
  { title: "Overview", url: "#overview", depth: 2 },
  { title: "Installation", url: "#installation", depth: 2 },
  { title: "Examples", url: "#examples", depth: 2 },
  { title: "Usage", url: "#usage", depth: 2 },
  { title: "API reference", url: "#api-reference", depth: 2 },
]

function ComponentPage() {
  const data = Route.useLoaderData()
  const { name } = Route.useParams()
  const item = getCatalogItem(name)
  if (!item) return <MissingComponent />
  return (
    <DocumentationLayout>
      <DocsPage toc={toc}>
        <DocsTitle>{item.title}</DocsTitle>
        <DocsDescription>{data.description}</DocsDescription>
        <DocsBody>
          <Heading as="h2" {...stylex.props(docsStyles.h2)} id="overview">
            Overview
          </Heading>
          <Paragraph {...stylex.props(docsStyles.p)}>
            Copy the source into your project, then import the parts you need.
            Styles use local StyleX declarations and shared theme tokens. You
            can change the source without wrapping or replacing a package.
          </Paragraph>
          <Heading as="h2" {...stylex.props(docsStyles.h2)} id="installation">
            Installation
          </Heading>
          <Paragraph {...stylex.props(docsStyles.p)}>
            Initialize StyleX with bunx @yopem-ui/cli init or follow the{" "}
            <Link {...stylex.props(docsStyles.link)} to="/docs/installation">
              manual setup guide
            </Link>{" "}
            first. The CLI copies source and installs component dependencies.
          </Paragraph>
          <Tabs defaultValue="cli">
            <TabsList aria-label="Installation method">
              <TabsTab value="cli">CLI</TabsTab>
              <TabsTab value="manual">Manual</TabsTab>
            </TabsList>
            <TabsPanel value="cli">
              <CopyableCode
                code="bunx @yopem-ui/cli init"
                title="Initialize StyleX project with CLI"
              />
              <CopyableCode
                code={data.installNames
                  .map((installName) => `bunx @yopem-ui/cli add ${installName}`)
                  .join("\n")}
                title={`Install ${item.title} with CLI`}
              />
              <Paragraph {...stylex.props(docsStyles.p)}>
                Run from your project root. The CLI installs required
                components, shared files, and packages. Examples may need
                additional components. Existing files are preserved. To refresh
                installed source, use update; locally edited files need an
                explicit --force to overwrite.
              </Paragraph>
              <CopyableCode
                code={data.installNames
                  .map(
                    (installName) => `bunx @yopem-ui/cli update ${installName}`,
                  )
                  .join("\n")}
                title={`Update ${item.title} with CLI`}
              />
            </TabsPanel>
            <TabsPanel value="manual">
              <Paragraph {...stylex.props(docsStyles.p)}>
                Copy each required file to its destination below. Shared files
                only need to be copied once. Keep the{" "}
                <Box as="code" {...stylex.props(docsStyles.inlineCode)}>
                  @/*
                </Box>{" "}
                alias pointing to{" "}
                <Box as="code" {...stylex.props(docsStyles.inlineCode)}>
                  src/*
                </Box>
                .
              </Paragraph>
              <Heading as="h3" {...stylex.props(docsStyles.h3)}>
                Dependencies
              </Heading>
              <CopyableCode
                code={`npm install ${data.dependencies.join(" ")}`}
                title="Install dependencies"
              />
              {data.devDependencies.length ? (
                <CopyableCode
                  code={`npm install --save-dev ${data.devDependencies.join(" ")}`}
                  title="Install development dependencies"
                />
              ) : null}
              <Heading as="h4" {...stylex.props(docsStyles.h4)}>
                Peer dependencies
              </Heading>
              <Box as="ul" {...stylex.props(docsStyles.ul)}>
                {data.peerDependencies.map((dependency) => (
                  <Box
                    as="li"
                    {...stylex.props(docsStyles.li)}
                    key={dependency}
                  >
                    <Box as="code" {...stylex.props(docsStyles.inlineCode)}>
                      {dependency}
                    </Box>
                  </Box>
                ))}
              </Box>
              <Paragraph {...stylex.props(docsStyles.p)}>
                Included components and shared files:{" "}
                {data.requiredItems.map((entry) => entry.title).join(", ")}.
              </Paragraph>
              <Box {...stylex.props(docsStyles.section)}>
                {data.files.map((file) => (
                  <SourceFile file={file} key={`${name}:${file.path}`} />
                ))}
              </Box>
            </TabsPanel>
          </Tabs>
          <Heading as="h2" {...stylex.props(docsStyles.h2)} id="examples">
            Examples
          </Heading>
          <Paragraph {...stylex.props(docsStyles.p)}>
            Component-specific props and their available values. Each example
            includes its source directly.
          </Paragraph>
          {data.examples.length ? (
            <Grid {...stylex.props(catalogStyles.exampleList)}>
              {data.examples.map((group) => {
                const examples = group.examples.flatMap((example) => {
                  const catalogExample = item.examples.find(
                    (entry) => entry.name === example.name,
                  )
                  return catalogExample
                    ? [{ ...example, example: catalogExample }]
                    : []
                })
                return examples.length ? (
                  <ExamplePanel
                    examples={examples}
                    key={`${name}:${group.label}`}
                    label={group.label}
                  />
                ) : null
              })}
            </Grid>
          ) : (
            <Paragraph {...stylex.props(docsStyles.p)}>
              Use the composition in Usage below to start with {item.title}.
            </Paragraph>
          )}
          <Heading as="h2" {...stylex.props(docsStyles.h2)} id="usage">
            Usage
          </Heading>
          {data.notes.map((note) => (
            <Paragraph {...stylex.props(docsStyles.p)} key={note}>
              {note}
            </Paragraph>
          ))}
          <Paragraph {...stylex.props(docsStyles.p)}>
            Import from the destination you copied into your application.
          </Paragraph>
          <CopyableCode code={data.usage} title={`${item.title} usage`} />
          <Heading as="h2" {...stylex.props(docsStyles.h2)} id="api-reference">
            API reference
          </Heading>
          <Paragraph {...stylex.props(docsStyles.p)}>
            Generated from canonical TypeScript source. Only component and Base
            UI props appear below. Required marks a required property, not a
            required component.
          </Paragraph>
          <ComponentApi key={name} parts={data.api} />
        </DocsBody>
      </DocsPage>
    </DocumentationLayout>
  )
}

function ComponentApi({
  parts,
}: {
  parts: Parameters<typeof ApiReference>[0]["parts"]
}) {
  const [open, setOpen] = useState(false)
  return (
    <Box
      as="details"
      {...stylex.props(docsStyles.details)}
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <Box as="summary" {...stylex.props(docsStyles.summary)}>
        View API reference
      </Box>
      {open ? <ApiReference parts={parts} /> : null}
    </Box>
  )
}

function SourceFile({ file }: { file: { content: string; target: string } }) {
  return (
    <CopyableCode
      code={file.content}
      header={file.target}
      preview
      title={file.target}
    />
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
