import {
  aliases,
  mediaConditions,
  scopes,
  selectors,
} from "@registry/lib/style-props-config"
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
import { Box } from "@/components/ui/stylex/box"
import { Heading } from "@/components/ui/stylex/heading"
import { Link } from "@/components/ui/stylex/link"
import { Paragraph } from "@/components/ui/stylex/paragraph"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/stylex/table"
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

export const Route = createFileRoute("/docs/primitives")({
  head: () =>
    createSeo({
      description:
        "Layout, typography, shared style props, and the UI primitive lint rule.",
      path: "/docs/primitives",
      title: "Layout and typography · Yopem UI",
    }),
  component: PrimitivesGuide,
})

export function PrimitivesGuide() {
  return (
    <DocumentationLayout>
      <DocsPage
        toc={[
          { title: "Choose a primitive", url: "#components", depth: 2 },
          { title: "Shared styling API", url: "#styling", depth: 2 },
          { title: "Native semantics", url: "#semantics", depth: 2 },
          { title: "Lint rule", url: "#lint", depth: 2 },
        ]}
      >
        <DocsTitle>Layout and typography</DocsTitle>
        <DocsDescription>
          Use layout components for structure and dedicated components for links
          and text. There is no HTML component or HTML factory.
        </DocsDescription>
        <DocsBody>
          <Heading as="h2" id="components" xstyle={docsStyles.h2}>
            Choose a primitive
          </Heading>
          <Paragraph xstyle={docsStyles.p}>
            These components target React 19, including its ref-as-prop support.
            Each component page includes a live example, complete copyable
            source, dependencies, usage, and generated API reference. Each
            component also exports its named Props type; Box additionally
            exports BoxElement and Heading exports HeadingTag.
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
          <Paragraph xstyle={docsStyles.p}>
            The layout components render divs; use Box as a semantic container
            when needed. Use Link for anchors, Paragraph for paragraphs, and
            Heading for headings instead of routing every element through Box.
          </Paragraph>
          <Heading as="h2" id="styling" xstyle={docsStyles.h2}>
            Shared styling API
          </Heading>
          <Paragraph xstyle={docsStyles.p}>
            All ten components accept StyleProps, css, xstyle, className and
            native inline style. Use standard CSS names for sizing, layout,
            colors, borders, typography, effects and interaction styles. Spacing
            aliases include p, px, py, ps, pe, m, mx, my, ms and me, alongside
            their long names, gap, rowGap, columnGap, spaceX and spaceY. Logical
            axis and start/end spacing follow writing direction.
          </Paragraph>
          <Paragraph xstyle={docsStyles.p}>
            Numeric spacing and dimensions multiply the --spacing token (0.25rem
            by default). CSS strings pass through: p=4 uses one rem, while
            p="4px" uses four pixels. Negative margins and sibling spacing are
            supported; negative numeric padding and gaps are rejected. Unitless
            properties retain their CSS meaning. For colors and other themed
            values, pass references from the imported StyleX tokens object,
            which provides token-key autocomplete. Bare token names are not
            resolved automatically.
          </Paragraph>
          <CopyableCode
            title="Responsive layout"
            code={`import { Grid } from "@/components/ui/grid"
import { Paragraph } from "@/components/ui/paragraph"
import { tokens } from "@/styles/tokens.stylex"

export function Summary() {
  return (
    <Grid
      p={{ base: 2, md: 4 }}
      gap={[2, 3, 4]}
      gridTemplateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }}
    >
      <Paragraph>First column</Paragraph>
      <Paragraph color={tokens["--muted-foreground"]}>Second column</Paragraph>
    </Grid>
  )
}`}
          />
          <Paragraph xstyle={docsStyles.p}>
            Responsive arrays map to base, sm, md, lg, xl and 2xl; null or
            undefined skips an entry. Breakpoints start at 480, 768, 1024, 1280
            and 1536 pixels. mdOnly stops before lg, mdDown means below md, and
            mdToXl includes the xl interval. Provide explicit base values for
            conditional overrides: otherwise unmatched conditions use unset
            rather than recovering an earlier component default.
          </Paragraph>
          <Paragraph xstyle={docsStyles.p}>
            Conditions include _hover, _active, _focus, _focusVisible,
            _focusWithin, _disabled, _checked, _expanded, _before, _after,
            _dark, _light, _rtl, _motionReduce, _moreContrast and _lessContrast.
            Nested conditions combine. The complete vocabulary is listed below.
            Conditions style existing state; they do not implement behavior.
          </Paragraph>
          <Box as="details" xstyle={docsStyles.details}>
            <Box as="summary" xstyle={docsStyles.summary}>
              All styling aliases
            </Box>
            <Table aria-label="Styling aliases">
              <TableHeader>
                <TableRow>
                  <TableHead>Prop</TableHead>
                  <TableHead>CSS properties</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(aliases).map(([name, properties]) => (
                  <TableRow key={name}>
                    <TableCell>{name}</TableCell>
                    <TableCell overflowWrap="anywhere" whiteSpace="normal">
                      {properties.join(", ")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
          <Box as="details" xstyle={docsStyles.details}>
            <Box as="summary" xstyle={docsStyles.summary}>
              All state and media conditions
            </Box>
            <Table aria-label="Style conditions">
              <TableHeader>
                <TableRow>
                  <TableHead>Condition</TableHead>
                  <TableHead>Selector or media query</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries({
                  ...selectors,
                  ...mediaConditions,
                  ...scopes,
                }).map(([name, condition]) => (
                  <TableRow key={name}>
                    <TableCell>{name}</TableCell>
                    <TableCell overflowWrap="anywhere" whiteSpace="normal">
                      {condition}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
          <Paragraph xstyle={docsStyles.p}>
            Precedence is defaults, style props, xstyle, then inline style.
            Direct style props override matching css entries. External className
            follows the CSS cascade and is not guaranteed to win. css accepts
            typed style objects or statically compiled StyleX styles for
            additional selectors; raw objects do not support arbitrary selectors
            or at-rules. Keep StyleX declarations statically authored.
          </Paragraph>
          <Paragraph xstyle={docsStyles.p}>
            For custom components, import StyleProps, StyleObject,
            ResponsiveValue and StyleComponentProps from the copied
            lib/style-props. splitStyleProps returns domProps and xstyle;
            forward only domProps and merge resolved styles before consumer
            xstyle. resolveStyleProps resolves an explicit style object.
            mergeStyleProps from lib/stylex preserves native style callbacks and
            inline precedence.
          </Paragraph>
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
          <Heading as="h2" id="lint" xstyle={docsStyles.h2}>
            Lint rule
          </Heading>
          <Paragraph xstyle={docsStyles.p}>
            The source-owned @yopem/oxlint-plugin workspace contains one rule:
            yopem-ui/prefer-ui-primitives. It reports native HTML JSX and
            recommends a layout or semantic component. It does not autofix:
            changing a tag or adding an import automatically could change
            semantics or conflict with a binding.
          </Paragraph>
          <CopyableCode
            title=".oxlintrc.json"
            code={JSON.stringify(
              {
                jsPlugins: [
                  {
                    name: "yopem-ui",
                    specifier: "./packages/oxlint-plugin/src/index.ts",
                  },
                ],
                overrides: [
                  {
                    files: ["apps/docs/src/**/*.{tsx,jsx}"],
                    rules: { "yopem-ui/prefer-ui-primitives": "error" },
                  },
                ],
              },
              null,
              2,
            )}
          />
          <Paragraph xstyle={docsStyles.p}>
            Use the local plugin source with Oxlint 1.79 or newer and adjust the
            path and file glob for your app. The allowElements option accepts
            native tag names for narrow exceptions. This repository allows
            document-shell and resource tags only in its root route. The Satori
            social-image renderer keeps intrinsic JSX because it is not a DOM
            renderer. Registry implementations and tests are outside the docs
            rule scope.
          </Paragraph>
          <Paragraph xstyle={docsStyles.p}>
            SVG, MathML, custom elements and component expressions remain
            supported. HTML inside SVG foreignObject is still checked. Run bun
            run lint to enforce the rule, and bun test
            packages/oxlint-plugin/test to verify its CLI behavior.
          </Paragraph>
        </DocsBody>
      </DocsPage>
    </DocumentationLayout>
  )
}
