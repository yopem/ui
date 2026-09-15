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

export const Route = createFileRoute("/examples/$example")({
  ssr: false,
  validateSearch: (search) => ({
    theme: search.theme === "dark" ? ("dark" as const) : ("light" as const),
  }),
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
    <main {...themeStyle} data-example-root data-theme={theme}>
      {/* Keep page title exposed while Base UI marks popup siblings inert. */}
      <h1 {...stylex.props(styles.heading)} aria-live="off">
        {example}
      </h1>
      <h2 {...stylex.props(styles.heading)}>Component preview</h2>
      <Suspense fallback={<span>Loading example…</span>}>
        {createElement(Example)}
      </Suspense>
    </main>
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
