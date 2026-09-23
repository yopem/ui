import { createFileRoute } from "@tanstack/react-router"

import { CopyableCode } from "@/catalog/code-block"
import { DocumentationLayout } from "@/catalog/docs-layout"
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
} from "@/catalog/docs-page"
import { docsStyles } from "@/catalog/docs-styles"
import { Box } from "@/components/ui/box"
import { Heading } from "@/components/ui/heading"
import { Link } from "@/components/ui/link"
import { Paragraph } from "@/components/ui/paragraph"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { createSeo } from "@/lib/seo"

const components = [
  [
    "box",
    "Box",
    "A div by default; as selects a semantic element with tag-specific events and refs.",
  ],
  [
    "flex",
    "Flex",
    "A div with display: flex. Set flexDirection, alignItems, justifyContent and flexWrap.",
  ],
  ["stack", "Stack", "A column flex div with a gap of four spacing units."],
  [
    "hstack",
    "HStack",
    "A row flex div with centered cross-axis alignment and a gap of four spacing units.",
  ],
  [
    "vstack",
    "VStack",
    "A column flex div with centered cross-axis alignment and a gap of four spacing units.",
  ],
  [
    "grid",
    "Grid",
    "A grid div. Set gridTemplateColumns, gridTemplateRows, gap and other CSS grid props.",
  ],
  [
    "center",
    "Center",
    "A flex div with alignItems and justifyContent set to center.",
  ],
  [
    "link",
    "Link",
    "A native anchor: href, target, rel, download, ref and native keyboard behavior. No router or visual defaults.",
  ],
  [
    "paragraph",
    "Paragraph",
    "A native p element without forced visual defaults.",
  ],
  [
    "heading",
    "Heading",
    "An h2 by default. Set as to h1 through h6; heading level is semantic, not a visual size.",
  ],
] as const

export const Route = createFileRoute("/docs/layout")({
  head: () =>
    createSeo({
      description:
        "Choose layout and typography components, preserve native semantics, and compose accessible page structure.",
      path: "/docs/layout",
      title: "Layout and typography · Yopem UI",
    }),
  component: LayoutGuide,
})

function LayoutGuide() {
  return (
    <DocumentationLayout>
      <DocsPage
        toc={[
          { title: "Choose a primitive", url: "#components", depth: 2 },
          { title: "Native semantics", url: "#semantics", depth: 2 },
        ]}
      >
        <DocsTitle>Layout and typography</DocsTitle>
        <DocsDescription>
          Choose a layout or text component, then use its native semantics to
          build a readable page.
        </DocsDescription>
        <DocsBody>
          <Box as="nav" aria-label="Guide sections" xstyle={docsStyles.links}>
            <Link href="#components" xstyle={docsStyles.link}>
              Choose a component
            </Link>
            <Link href="/docs/style-props" xstyle={docsStyles.link}>
              Learn style props
            </Link>
            <Link href="/docs/lint" xstyle={docsStyles.link}>
              Enforce usage with lint
            </Link>
          </Box>
          <Heading as="h2" id="components" xstyle={docsStyles.h2}>
            Choose a primitive
          </Heading>
          <Paragraph xstyle={docsStyles.p}>
            Need a wrapper? Start with Box. Use Stack for vertical groups,
            HStack for horizontal groups, Flex for custom alignment, and Grid
            for columns. Use Link, Paragraph, and Heading for meaningful text
            elements instead of styling a generic Box. Select a component below
            to see a live example and copy its source.
          </Paragraph>
          <Table aria-label="Primitive reference">
            <TableHeader>
              <TableRow>
                <TableHead>Component</TableHead>
                <TableHead>Defaults and API</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {components.map(([slug, name, description]) => (
                <TableRow key={slug}>
                  <TableCell>
                    <Link href={`/components/${slug}`} xstyle={docsStyles.link}>
                      {name}
                    </Link>
                  </TableCell>
                  <TableCell whiteSpace="normal">{description}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Heading as="h2" id="semantics" xstyle={docsStyles.h2}>
            Native semantics
          </Heading>
          <Paragraph xstyle={docsStyles.p}>
            Box defaults to div. Its as prop selects the native tag and its
            event/ref types. Input size, image width and height, and meta
            content remain native attributes. Use css or sizing aliases w and h
            for conflicting styles. Other recognized CSS property names retain
            their styling meaning. Heading restricts as to heading tags. Link
            performs native navigation; it does not replace a framework router
            link.
          </Paragraph>
          <CopyableCode
            title="Semantic components"
            code={`import { Box } from "@/components/ui/box"
import { Heading } from "@/components/ui/heading"
import { Link } from "@/components/ui/link"
import { Paragraph } from "@/components/ui/paragraph"

export function Article() {
  return (
    <Box as="article" p={4}>
      <Heading as="h2">Getting started</Heading>
      <Paragraph>Copy the components into your application.</Paragraph>
      <Link href="/docs/installation">Installation guide</Link>
    </Box>
  )
}`}
          />
          <Paragraph xstyle={docsStyles.p}>
            Next:{" "}
            <Link href="/docs/style-props" xstyle={docsStyles.link}>
              style these components with props
            </Link>
            .
          </Paragraph>
        </DocsBody>
      </DocsPage>
    </DocumentationLayout>
  )
}
