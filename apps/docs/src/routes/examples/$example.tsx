import {
  darkTheme,
  lightTheme,
  rootStyles,
  themeMarker,
} from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"
import { createFileRoute, notFound } from "@tanstack/react-router"
import { Suspense, createElement } from "react"

import {
  findExampleComponent,
  findExampleModule,
  stylexExampleComponents,
  stylexExampleModules,
} from "@/catalog/example-modules"
import { Box } from "@/components/ui/box"
import { Heading } from "@/components/ui/heading"
export const Route = createFileRoute("/examples/$example")({
  validateSearch: (search) => ({
    theme: search.theme === "dark" ? ("dark" as const) : ("light" as const),
  }),
  ssr: false,
  beforeLoad: ({ params }) => {
    if (!findExampleModule(stylexExampleModules, params.example))
      throw notFound()
  },
  head: ({ params }) => ({
    meta: [{ title: `${params.example} example · Yopem UI` }],
  }),
  component: ExamplePage,
})

function ExamplePage() {
  const { example } = Route.useParams()
  const { theme } = Route.useSearch()
  const Example = findExampleComponent(stylexExampleComponents, example)
  if (!Example) return null
  const themeStyle = stylex.props(
    themeMarker,
    theme === "dark" ? darkTheme : lightTheme,
    rootStyles.body,
    styles.root,
  )

  return (
    <Box as="main" {...themeStyle} data-example-root data-theme={theme}>
      <Heading as="h1" {...stylex.props(styles.heading)}>
        {example}
      </Heading>
      <Suspense fallback={<Box as="span">Loading example…</Box>}>
        {createElement(Example)}
      </Suspense>
    </Box>
  )
}

const styles = stylex.create({
  heading: {
    blockSize: 1,
    clipPath: "inset(50%)",
    inlineSize: 1,
    overflow: "hidden",
    position: "absolute",
    whiteSpace: "nowrap",
  },
  root: {
    alignItems: "center",
    backgroundColor: "var(--background)",
    color: "var(--foreground)",
    display: "flex",
    fontFamily: '"Figtree Variable", Figtree, sans-serif',
    justifyContent: "center",
    lineHeight: 1.5,
    minBlockSize: "100vh",
    overflow: "auto",
    padding: "24px",
  },
})
