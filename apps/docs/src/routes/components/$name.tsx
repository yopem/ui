import { Box } from "@registry/components/ui/box"
import { Heading } from "@registry/components/ui/heading"
import { Paragraph } from "@registry/components/ui/paragraph"
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
  loader: ({ params }) => {
    if (!getCatalogItem(params.name)) throw notFound()
    return getDocumentation({ data: params.name })
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
  { title: "Installation", url: "#installation", depth: 2 },
  { title: "Preview", url: "#preview", depth: 2 },
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
          <Heading as="h2" xstyle={styles.h2} id="overview">
            Overview
          </Heading>
          <Paragraph xstyle={styles.paragraph}>
            Copy the source into your project, then import the parts you need.
            Styles use local StyleX declarations and shared theme tokens. You
            can change the source without wrapping or replacing a package.
          </Paragraph>
          <Heading as="h2" xstyle={styles.h22} id="installation">
            Installation
          </Heading>
          <Paragraph xstyle={styles.paragraph2}>
            Run bunx @yopem-ui/cli init from your project root first. The CLI
            configures StyleX and installs shared files and dependencies.
          </Paragraph>
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
          <Paragraph xstyle={styles.paragraph3}>
            Run from your project root. The CLI installs required components,
            shared files, and packages. Previews may need additional components.
            Existing files are preserved. To refresh installed source, use
            update; locally edited files need an explicit --force to overwrite.
          </Paragraph>
          <CopyableCode
            code={data.installNames
              .map((installName) => `bunx @yopem-ui/cli update ${installName}`)
              .join("\n")}
            title={`Update ${item.title} with CLI`}
          />

          <Heading as="h2" xstyle={styles.h23} id="preview">
            Preview
          </Heading>
          {item.preview && data.previewSource ? (
            <PreviewPanel preview={item.preview} source={data.previewSource} />
          ) : (
            <Paragraph xstyle={styles.paragraph6}>
              Use the composition in Usage below to start with {item.title}.
            </Paragraph>
          )}
          <Heading as="h2" xstyle={styles.h24} id="usage">
            Usage
          </Heading>
          {data.notes.map((note) => (
            <Paragraph xstyle={styles.paragraph7} key={note}>
              {note}
            </Paragraph>
          ))}
          <Paragraph xstyle={styles.paragraph8}>
            Import from the local file installed by the CLI.
          </Paragraph>
          <CopyableCode code={data.usage} title={`${item.title} usage`} />
          <Heading as="h2" xstyle={styles.h25} id="api-reference">
            API reference
          </Heading>
          <Paragraph xstyle={styles.paragraph9}>
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
      xstyle={styles.details}
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <Box as="summary" xstyle={styles.summary}>
        View API reference
      </Box>
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
