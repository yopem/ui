import type { SyntheticEvent } from "react"

import { Box } from "@registry/components/ui/box"
import { Heading } from "@registry/components/ui/heading"
import { Text } from "@registry/components/ui/text"
import { useEventCallback } from "@registry/hooks/use-event-callback"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"
import { Link, createFileRoute, notFound } from "@tanstack/react-router"
import { useState } from "react"

import { ApiReference } from "@/catalog/api-reference"
import { PreviewPanel } from "@/catalog/catalog-ui"
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
import { createSeo } from "@/lib/seo"

const styles = stylex.create({
  h2: {
    fontFamily: tokens["--font-heading"],
    fontSize: "1.5rem",
    fontWeight: 650,
    letterSpacing: "-0.025em",
    lineHeight: 1.3,
    marginBlockStart: "3rem",
    marginBlockEnd: "1rem",
    scrollMarginBlockStart: "6rem",
  },
  paragraph: { marginBlock: "1rem", lineHeight: 1.8 },
  h22: {
    fontFamily: tokens["--font-heading"],
    fontSize: "1.5rem",
    fontWeight: 650,
    letterSpacing: "-0.025em",
    lineHeight: 1.3,
    marginBlockStart: "3rem",
    marginBlockEnd: "1rem",
    scrollMarginBlockStart: "6rem",
  },
  paragraph2: { marginBlock: "1rem", lineHeight: 1.8 },
  paragraph3: { marginBlock: "1rem", lineHeight: 1.8 },
  h23: {
    fontFamily: tokens["--font-heading"],
    fontSize: "1.5rem",
    fontWeight: 650,
    letterSpacing: "-0.025em",
    lineHeight: 1.3,
    marginBlockStart: "3rem",
    marginBlockEnd: "1rem",
    scrollMarginBlockStart: "6rem",
  },
  paragraph6: { marginBlock: "1rem", lineHeight: 1.8 },
  h24: {
    fontFamily: tokens["--font-heading"],
    fontSize: "1.5rem",
    fontWeight: 650,
    letterSpacing: "-0.025em",
    lineHeight: 1.3,
    marginBlockStart: "3rem",
    marginBlockEnd: "1rem",
    scrollMarginBlockStart: "6rem",
  },
  paragraph7: { marginBlock: "1rem", lineHeight: 1.8 },
  paragraph8: { marginBlock: "1rem", lineHeight: 1.8 },
  h25: {
    fontFamily: tokens["--font-heading"],
    fontSize: "1.5rem",
    fontWeight: 650,
    letterSpacing: "-0.025em",
    lineHeight: 1.3,
    marginBlockStart: "3rem",
    marginBlockEnd: "1rem",
    scrollMarginBlockStart: "6rem",
  },
  paragraph9: { marginBlock: "1rem", lineHeight: 1.8 },
  details: {
    borderColor: tokens["--border"],
    borderStyle: "solid",
    borderWidth: 1,
    borderRadius: tokens["--radius-lg"],
    paddingBlock: "1rem",
    paddingInline: "1rem",
    marginBlock: "1rem",
  },
  summary: {
    cursor: "pointer",
    fontWeight: 600,
    borderRadius: tokens["--radius-sm"],
    outlineColor: {
      ":is(:focus-visible, [data-focus-visible])": tokens["--ring"],
    },
    outlineStyle: { ":is(:focus-visible, [data-focus-visible])": "solid" },
    outlineWidth: { ":is(:focus-visible, [data-focus-visible])": 2 },
    outlineOffset: { ":is(:focus-visible, [data-focus-visible])": 4 },
  },
})

export const Route = createFileRoute("/components/$name")({
  loader: async ({ params }) => {
    const item = getCatalogItem(params.name)

    if (!item) throw notFound()

    const [documentation] = await Promise.all([
      getDocumentation({ data: params.name }),
      item.preview?.component.preload?.(),
    ])

    return documentation
  },
  head: ({ params }) => {
    const title = getCatalogItem(params.name)?.title ?? "Component"

    return createSeo({
      description: `${title} source, preview, usage, and API reference for React and StyleX.`,
      path: `/components/${params.name}`,
      title: `${title} · Yopem UI`,
    })
  },
  component: ComponentPage,
  notFoundComponent: MissingComponent,
})

const toc = [
  { title: "Overview", url: "#overview", depth: 2 },
  { title: "Preview", url: "#preview", depth: 2 },
  { title: "Installation", url: "#installation", depth: 2 },
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
          <Heading
            render={<h2>Overview</h2>}
            xstyle={styles.h2}
            id="overview"
          />
          <Text xstyle={styles.paragraph}>
            Copy the source into your project. Import the parts that you need.
            Styles use local StyleX declarations and shared theme tokens. You
            can change the source without a wrapper or replacement package.
          </Text>
          <Heading render={<h2>Preview</h2>} xstyle={styles.h23} id="preview" />
          {item.preview && data.previewSource ? (
            <PreviewPanel preview={item.preview} source={data.previewSource} />
          ) : (
            <Text xstyle={styles.paragraph6}>
              Use the composition in Usage below to start with {item.title}.
            </Text>
          )}
          <Heading
            render={<h2>Installation</h2>}
            xstyle={styles.h22}
            id="installation"
          />
          <Text xstyle={styles.paragraph2}>
            Run bunx @yopem-ui/cli init from your project root first. The CLI
            configures StyleX and installs shared files and dependencies.
          </Text>
          <CopyableCode
            language="shellscript"
            code="bunx @yopem-ui/cli init"
            title="Initialize StyleX project with CLI"
          />
          <CopyableCode
            language="shellscript"
            code={data.installNames
              .map((installName) => `bunx @yopem-ui/cli add ${installName}`)
              .join("\n")}
            title={`Install ${item.title} with CLI`}
          />
          <Text xstyle={styles.paragraph3}>
            Run from your project root. The CLI installs required components,
            shared files, and packages. Previews may need additional components.
            The CLI keeps existing files.
          </Text>

          <Heading render={<h2>Usage</h2>} xstyle={styles.h24} id="usage" />
          {data.notes.map((note) => (
            <Text xstyle={styles.paragraph7} key={note}>
              {note}
            </Text>
          ))}
          <Text xstyle={styles.paragraph8}>
            Import from the local file installed by the CLI.
          </Text>
          <CopyableCode code={data.usage} title={`${item.title} usage`} />
          <Heading
            render={<h2>API reference</h2>}
            xstyle={styles.h25}
            id="api-reference"
          />
          <Text xstyle={styles.paragraph9}>
            The generator reads canonical TypeScript source. Only component and
            Base UI props appear below. Required identifies a required property,
            not a required component.
          </Text>
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

  const handleToggle = useEventCallback(
    (event: SyntheticEvent<HTMLDetailsElement>) => {
      return setOpen(event.currentTarget.open)
    },
  )

  return (
    <Box render={<details onToggle={handleToggle} />} xstyle={styles.details}>
      <Box
        render={<summary>View API reference</summary>}
        xstyle={styles.summary}
      />
      {open ? <ApiReference parts={parts} /> : null}
    </Box>
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
