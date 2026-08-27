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
  tailwindDemoComponents,
  tailwindDemoModules,
} from "@/catalog/demo-modules"
import tailwindCss from "@/styles.css?url"

export const Route = createFileRoute("/__test/render/$system/$theme/$demo")({
  ssr: false,
  beforeLoad: ({ params }) => {
    if (!__YOPEM_TEST_HARNESS__) throw notFound()
    if (params.system !== "stylex" && params.system !== "tailwind") {
      throw notFound()
    }
    if (params.theme !== "dark" && params.theme !== "light") throw notFound()
    const modules =
      params.system === "stylex" ? stylexDemoModules : tailwindDemoModules
    if (!findDemoModule(modules, params.demo)) throw notFound()
  },
  head: ({ params }) => ({
    links: [
      {
        href: params.system === "stylex" ? yopemCss : tailwindCss,
        rel: "stylesheet",
      },
    ],
    meta: [{ title: `${params.demo} ${params.system} parity` }],
  }),
  component: ParityRender,
})

function ParityRender() {
  const { demo, system, theme } = Route.useParams()
  const navigate = useNavigate({ from: Route.fullPath })
  const components =
    system === "stylex" ? stylexDemoComponents : tailwindDemoComponents
  const Demo = findDemoComponent(components, demo)
  if (!Demo) return null
  const themeStyle = stylex.props(
    themeMarker,
    theme === "dark" ? darkTheme : lightTheme,
    rootStyles.body,
    renderStyles.root,
  )

  return (
    <div
      {...themeStyle}
      className={
        system === "tailwind" && theme === "dark"
          ? `${themeStyle.className ?? ""} dark`
          : themeStyle.className
      }
      data-demo={demo}
      data-parity-root
      data-system={system}
      data-theme={theme}
    >
      <select
        aria-hidden="true"
        data-demo-selector
        onChange={(event) =>
          void navigate({
            params: { demo: event.target.value, system, theme },
            to: Route.fullPath,
          })
        }
        {...stylex.props(renderStyles.selector)}
        tabIndex={-1}
        value={demo}
      >
        {[...components.keys()].map((path) => {
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
    </div>
  )
}

const renderStyles = stylex.create({
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
