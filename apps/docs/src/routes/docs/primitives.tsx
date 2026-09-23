import {
  aliases,
  breakpoints,
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

function PrimitivesGuide() {
  return (
    <DocumentationLayout>
      <DocsPage
        toc={[
          { title: "Choose a primitive", url: "#components", depth: 2 },
          { title: "Style props", url: "#styling", depth: 2 },
          {
            title: "Responsive and state styles",
            url: "#responsive",
            depth: 2,
          },
          { title: "Advanced styling", url: "#advanced", depth: 2 },
          { title: "Native semantics", url: "#semantics", depth: 2 },
          { title: "Lint rule", url: "#lint", depth: 2 },
        ]}
      >
        <DocsTitle>Layout and typography</DocsTitle>
        <DocsDescription>
          Pick a layout component, add CSS-like props for everyday styling, and
          use xstyle when you need a reusable StyleX style.
        </DocsDescription>
        <DocsBody>
          <Box as="nav" aria-label="Guide sections" xstyle={docsStyles.links}>
            <Link href="#components" xstyle={docsStyles.link}>
              Choose a component
            </Link>
            <Link href="#styling" xstyle={docsStyles.link}>
              Learn style props
            </Link>
            <Link href="#responsive" xstyle={docsStyles.link}>
              Make it responsive
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
          <StylingGuide />
          <AdvancedStyling />
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

function AdvancedStyling() {
  return (
    <>
      <Heading as="h2" id="advanced" xstyle={docsStyles.h2}>
        Advanced styling
      </Heading>
      <Paragraph xstyle={docsStyles.p}>
        Use direct props for one-off values, css for a typed style object, and
        xstyle for styles created with stylex.create. All ten components also
        accept className and native inline style. Precedence: component
        defaults, style props, xstyle, then inline style. Direct props override
        matching css entries. External className follows the CSS cascade and may
        not win.
      </Paragraph>
      <Box as="details" xstyle={docsStyles.details}>
        <Box as="summary" xstyle={docsStyles.summary}>
          All styling aliases
        </Box>
        <Table aria-label="Styling aliases" render={<Box tabIndex={0} />}>
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
        <Table aria-label="Style conditions" render={<Box tabIndex={0} />}>
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
        css accepts typed objects or statically compiled StyleX styles for
        additional selectors. Raw objects cannot use arbitrary selectors or
        at-rules. Keep StyleX declarations statically authored. Bare token names
        are not resolved automatically; import the tokens object for token-key
        autocomplete.
      </Paragraph>
      <Paragraph xstyle={docsStyles.p}>
        Each component exports its named Props type. Box also exports BoxElement
        and Heading exports HeadingTag. For custom components, import
        StyleProps, StyleObject, ResponsiveValue and StyleComponentProps from
        the copied lib/style-props. splitStyleProps returns domProps and xstyle;
        forward only domProps and merge resolved styles before consumer xstyle.
        resolveStyleProps resolves an explicit style object. mergeStyleProps
        from lib/stylex preserves native style callbacks and inline precedence.
      </Paragraph>
    </>
  )
}

function StylingGuide() {
  return (
    <>
      <Heading as="h2" id="styling" xstyle={docsStyles.h2}>
        Style props
      </Heading>
      <Paragraph xstyle={docsStyles.p}>
        Add CSS-like props directly to any of these components. Use p for
        padding, gap for space between children, and standard CSS names such as
        color or gridTemplateColumns. Use theme tokens for colors so your layout
        works in light and dark themes.
      </Paragraph>
      <CopyableCode
        title="Everyday style props"
        code={`import { Stack } from "@/components/ui/stack"
import { Heading } from "@/components/ui/heading"
import { Paragraph } from "@/components/ui/paragraph"
import { tokens } from "@/styles/tokens.stylex"

export function Summary() {
  return (
    <Stack p={4} gap={2}>
      <Heading as="h2">Summary</Heading>
      <Paragraph color={tokens["--muted-foreground"]}>Details go here.</Paragraph>
    </Stack>
  )
}`}
      />
      <Box as="ul" xstyle={docsStyles.ul}>
        <Box as="li" xstyle={docsStyles.li}>
          <Box as="strong" xstyle={docsStyles.strong}>
            Spacing:
          </Box>{" "}
          p, px, py and gap
        </Box>
        <Box as="li" xstyle={docsStyles.li}>
          <Box as="strong" xstyle={docsStyles.strong}>
            Sizing:
          </Box>{" "}
          w, h, minW and maxW
        </Box>
        <Box as="li" xstyle={docsStyles.li}>
          <Box as="strong" xstyle={docsStyles.strong}>
            Layout:
          </Box>{" "}
          alignItems, justifyContent and gridTemplateColumns
        </Box>
        <Box as="li" xstyle={docsStyles.li}>
          <Box as="strong" xstyle={docsStyles.strong}>
            Colors:
          </Box>{" "}
          color and bgColor with imported tokens
        </Box>
      </Box>
      <Paragraph xstyle={docsStyles.p}>
        Numbers for spacing and dimensions use the --spacing token (0.25rem by
        default): p={4} means 1rem of padding. Strings keep their CSS units:
        p="4px" means four pixels. Negative margins work; negative padding and
        gaps do not. Unitless properties keep their normal CSS meaning. Use ps
        and pe for start and end padding that follow writing direction.
      </Paragraph>
      <Heading as="h2" id="responsive" xstyle={docsStyles.h2}>
        Responsive and state styles
      </Heading>
      <Paragraph xstyle={docsStyles.p}>
        Pass an object when a value changes at a named breakpoint, or an array
        for the ordered breakpoints. Always set base when you need a default
        value. Conditions such as _hover and _focusVisible style existing
        states; they do not add interaction behavior.
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
        In this example, padding is 2 spacing units by default and 4 from md
        onward; the two columns appear at md. The gap array maps to base, sm,
        then md. Breakpoints (minimum viewport widths):{" "}
        {Object.entries(breakpoints)
          .map(([name, width]) => `${name} ${width}px`)
          .join(", ")}
        . Use null in an array to skip a breakpoint. mdOnly stops before lg;
        mdDown means below md; mdToXl includes xl.
      </Paragraph>
      <Paragraph xstyle={docsStyles.p}>
        For conditional overrides, include base explicitly: unmatched conditions
        use unset, not the component default.
      </Paragraph>
      <CopyableCode
        title="Interaction states"
        code={`import { Box } from "@/components/ui/box"
import { tokens } from "@/styles/tokens.stylex"

export function Highlight() {
  return (
    <Box
      as="a"
      href="/docs/installation"
      bgColor={{ base: tokens["--background"], _hover: tokens["--accent"] }}
      color={tokens["--foreground"]}
    >
      Installation
    </Box>
  )
}`}
      />
      <Paragraph xstyle={docsStyles.p}>
        Conditions include _hover, _active, _focus, _focusVisible, _focusWithin,
        _disabled, _checked, _expanded, _before, _after, _dark, _light, _rtl,
        _motionReduce, _moreContrast and _lessContrast. Nested conditions
        combine. The complete vocabulary is listed below. Conditions style
        existing state; they do not implement behavior.
      </Paragraph>
    </>
  )
}
