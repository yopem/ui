import { themeMarker } from "@registry/styles/markers.stylex"
import { rootStyles } from "@registry/styles/root"
import yopemCss from "@registry/styles/styles.css?url"
import { darkTheme, lightTheme } from "@registry/styles/themes"
import * as stylex from "@stylexjs/stylex"
import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router"
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
    if (!__YOPEM_TEST_HARNESS__) throw notFound()
    if (params.theme !== "dark" && params.theme !== "light") throw notFound()
    if (!findDemoModule(stylexDemoModules, params.demo)) throw notFound()
  },
  head: ({ params }) => ({
    links: [{ href: yopemCss, rel: "stylesheet" }],
    meta: [{ title: `${params.demo} ${params.theme}` }],
  }),
  component: DemoRender,
})

function DemoRender() {
  const { demo, theme } = Route.useParams()
  const navigate = useNavigate({ from: Route.fullPath })
  const Demo = findDemoComponent(stylexDemoComponents, demo)
  if (!Demo) return null
  const themeStyle = stylex.props(
    themeMarker,
    theme === "dark" ? darkTheme : lightTheme,
    rootStyles.body,
    renderStyles.root,
  )

  return (
    <main {...themeStyle} data-demo={demo} data-parity-root data-theme={theme}>
      <h1 {...stylex.props(renderStyles.heading)}>{demo}</h1>
      <select
        aria-hidden="true"
        data-demo-selector
        onChange={(event) =>
          void navigate({
            params: { demo: event.target.value, theme },
            to: Route.fullPath,
          })
        }
        {...stylex.props(renderStyles.selector)}
        tabIndex={-1}
        value={demo}
      >
        {[...stylexDemoComponents.keys()].map((path) => {
          const name =
            path
              .split("/")
              .pop()
              ?.replace(/\.tsx$/, "") ?? path
          return (
            <option key={name} value={name}>
              {name}
            </option>
          )
        })}
      </select>
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
    fontFamily: '"Inter Variable", "Inter", sans-serif',
    justifyContent: "center",
    lineHeight: 1.5,
    minBlockSize: "100vh",
    overflow: "auto",
    padding: "24px",
  },
  selector: { display: "none" },
})
