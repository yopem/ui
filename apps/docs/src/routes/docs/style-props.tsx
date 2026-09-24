import {
  aliases,
  breakpoints,
  mediaConditions,
  scopes,
  selectors,
} from "@registry/lib/style-props-config"
import { createFileRoute } from "@tanstack/react-router"

import { docsStyles } from "@/catalog/docs-styles"
import { GuidePage } from "@/catalog/guide-content"
import { Box } from "@/components/ui/box"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import StylePropsContent from "@/content/style-props.mdx"
import stylePropsSource from "@/content/style-props.mdx?raw"
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
    <GuidePage
      title="Style props"
      description="Use static style props across UI components—not just Button or layout primitives. The required build plugin compiles them into StyleX CSS; runtime values must use StyleX dynamic styles."
      source={stylePropsSource}
      Content={StylePropsContent}
      components={{ StylingAliases, StylingConditions, Breakpoints }}
    />
  )
}

function StylingAliases() {
  return (
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
  )
}

function StylingConditions() {
  return (
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
          {Object.entries({ ...selectors, ...mediaConditions, ...scopes }).map(
            ([name, condition]) => (
              <TableRow key={name}>
                <TableCell>{name}</TableCell>
                <TableCell overflowWrap="anywhere" whiteSpace="normal">
                  {condition}
                </TableCell>
              </TableRow>
            ),
          )}
        </TableBody>
      </Table>
    </Box>
  )
}

function Breakpoints() {
  return Object.entries(breakpoints)
    .map(([name, width]) => `${name} ${width}px`)
    .join(", ")
}
