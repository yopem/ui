import { Box } from "@registry/components/ui/box"
import { Heading } from "@registry/components/ui/heading"
import { Paragraph } from "@registry/components/ui/paragraph"
import {
  Tabs,
  TabsList,
  TabsPanel,
  TabsTab,
} from "@registry/components/ui/tabs"
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
  paragraph4: { marginBlock: "1rem", lineHeight: 1.8 },
  code: {
    fontFamily: tokens["--font-mono"],
    fontSize: "0.875em",
    backgroundColor: tokens["--code"],
    color: tokens["--code-foreground"],
    borderRadius: tokens["--radius-sm"],
    paddingBlock: "0.15rem",
    paddingInline: "0.35rem",
    overflowWrap: "anywhere",
  },
  code2: {
    fontFamily: tokens["--font-mono"],
    fontSize: "0.875em",
    backgroundColor: tokens["--code"],
    color: tokens["--code-foreground"],
    borderRadius: tokens["--radius-sm"],
    paddingBlock: "0.15rem",
    paddingInline: "0.35rem",
    overflowWrap: "anywhere",
  },
  h3: {
    fontFamily: tokens["--font-heading"],
    fontSize: "1.2rem",
    fontWeight: 600,
    lineHeight: 1.4,
    marginBlockStart: "2rem",
    marginBlockEnd: "0.75rem",
    scrollMarginBlockStart: "6rem",
  },
  h4: {
    fontSize: "1rem",
    fontWeight: 600,
    marginBlockStart: "1.5rem",
    marginBlockEnd: "0.5rem",
    scrollMarginBlockStart: "6rem",
  },
  ul: {
    listStyleType: "disc",
    paddingInlineStart: "1.5rem",
    marginBlock: "1rem",
  },
  li: {
    paddingInlineStart: "0.25rem",
    marginBlock: "0.5rem",
    lineHeight: 1.75,
  },
  code3: {
    fontFamily: tokens["--font-mono"],
    fontSize: "0.875em",
    backgroundColor: tokens["--code"],
    color: tokens["--code-foreground"],
    borderRadius: tokens["--radius-sm"],
    paddingBlock: "0.15rem",
    paddingInline: "0.35rem",
    overflowWrap: "anywhere",
  },
  paragraph5: { marginBlock: "1rem", lineHeight: 1.8 },
  box: { marginBlock: "2rem", minInlineSize: "calc(var(--spacing) * 0)" },
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
              <Paragraph xstyle={styles.paragraph3}>
                Run from your project root. The CLI installs required
                components, shared files, and packages. Previews may need
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
              <Paragraph xstyle={styles.paragraph4}>
                Copy each required file to its destination below. Shared files
                only need to be copied once. Keep the{" "}
                <Box as="code" xstyle={styles.code}>
                  @/*
                </Box>{" "}
                alias pointing to{" "}
                <Box as="code" xstyle={styles.code2}>
                  src/*
                </Box>
                .
              </Paragraph>
              <Heading as="h3" xstyle={styles.h3}>
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
              <Heading as="h4" xstyle={styles.h4}>
                Peer dependencies
              </Heading>
              <Box as="ul" xstyle={styles.ul}>
                {data.peerDependencies.map((dependency) => (
                  <Box as="li" xstyle={styles.li} key={dependency}>
                    <Box as="code" xstyle={styles.code3}>
                      {dependency}
                    </Box>
                  </Box>
                ))}
              </Box>
              <Paragraph xstyle={styles.paragraph5}>
                Included components and shared files:{" "}
                {data.requiredItems.map((entry) => entry.title).join(", ")}.
              </Paragraph>
              <Box xstyle={styles.box}>
                {data.files.map((file) => (
                  <SourceFile file={file} key={`${name}:${file.path}`} />
                ))}
              </Box>
            </TabsPanel>
          </Tabs>
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
            Import from the destination you copied into your application.
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
