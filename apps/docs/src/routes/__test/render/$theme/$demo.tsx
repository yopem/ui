import {
  themeMarker,
  rootStyles,
  darkTheme,
  lightTheme,
} from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"
import { createFileRoute, notFound } from "@tanstack/react-router"
import { Suspense, createElement } from "react"

import {
  findDemoComponent,
  findDemoModule,
  stylexDemoComponents,
  stylexDemoModules,
} from "@/catalog/demo-modules"

export const Route = createFileRoute("/__test/render/$theme/$demo")({
  ssr: false,
  beforeLoad: ({ params }) => {
    if (import.meta.env.MODE !== "test") throw notFound()
    if (params.theme !== "dark" && params.theme !== "light") throw notFound()
    if (!findDemoModule(stylexDemoModules, params.demo)) throw notFound()
  },
  head: ({ params }) => ({
    meta: [{ title: `${params.demo} ${params.theme}` }],
  }),
  component: DemoRender,
})

function DemoRender() {
  const { demo, theme } = Route.useParams()
  const Demo = findDemoComponent(stylexDemoComponents, demo)
  if (!Demo) return null
  const themeStyle = stylex.props(
    themeMarker,
    theme === "dark" ? darkTheme : lightTheme,
    rootStyles.body,
    renderStyles.root,
  )

  return (
    <main {...themeStyle} data-demo-root data-theme={theme}>
      <h1 {...stylex.props(renderStyles.heading)}>{demo}</h1>
      <Suspense fallback={<span>Loading demo…</span>}>
        {createElement(Demo)}
      </Suspense>
    </main>
  )
}

const renderStyles = stylex.create({
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
