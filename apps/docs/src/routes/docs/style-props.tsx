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

export const Route = createFileRoute("/docs/style-props")({
  head: () =>
    createSeo({
      description:
        "Style props, spacing, responsive breakpoints, states, and StyleX composition for UI primitives.",
      path: "/docs/style-props",
      title: "Style props · Yopem UI",
    }),
  component: StylePropsGuide,
})

function StylePropsGuide() {
  return (
    <DocumentationLayout>
      <DocsPage
        toc={[
          { title: "Style props", url: "#styling", depth: 2 },
          {
            title: "Responsive and state styles",
            url: "#responsive",
            depth: 2,
          },
          { title: "Advanced styling", url: "#advanced", depth: 2 },
        ]}
      >
        <DocsTitle>Style props</DocsTitle>
        <DocsDescription>
          Use shared style props across UI components—not just Button or layout
          primitives. Add responsive values, interaction states, or reusable
          StyleX styles as needed.
        </DocsDescription>
        <DocsBody>
          <Paragraph xstyle={docsStyles.p}>
            New to these components?{" "}
            <Link href="/docs/layout" xstyle={docsStyles.link}>
              Start with layout and typography
            </Link>
            .
          </Paragraph>
          <StylingGuide />
          <AdvancedStyling />
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
        xstyle for styles created with stylex.create. Components also accept
        className and native inline style. Precedence: component defaults, style
        props, xstyle, then inline style. Direct props override matching css
        entries. External className follows the CSS cascade and may not win.
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
        Components across the registry accept CSS-like props, including layout,
        typography, and controls such as Button and Input. Use p for padding,
        gap for space between children, and standard CSS names such as color or
        gridTemplateColumns. Use theme tokens for colors so styles work in light
        and dark themes.
      </Paragraph>
      <CopyableCode
        title="Everyday style props"
        code={`import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Stack } from "@/components/ui/stack"
import { Heading } from "@/components/ui/heading"
import { Paragraph } from "@/components/ui/paragraph"
import { tokens } from "@/styles/tokens.stylex"

export function Summary() {
  return (
    <Stack p={4} gap={2}>
      <Heading as="h2">Summary</Heading>
      <Paragraph color={tokens["--muted-foreground"]}>Details go here.</Paragraph>
      <Input aria-label="Email" w="100%" />
      <Button p={3}>Continue</Button>
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
