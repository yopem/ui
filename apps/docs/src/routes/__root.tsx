import "@fontsource-variable/figtree"
import "@registry/styles/styles.css"
import { getRootThemeProps, ThemeScript } from "@registry/theme/theme"
import { ThemeProvider } from "@registry/theme/theme-provider"
import { TanStackDevtools } from "@tanstack/react-devtools"
import { HeadContent, Scripts, createRootRoute } from "@tanstack/react-router"
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools"
import { useEffect } from "react"

export const Route = createRootRoute({
  head: () => ({
    links: [{ rel: "icon", href: "/favicon.svg", type: "image/svg+xml" }],
    meta: [
      { charSet: "utf-8" },
      {
        content: "width=device-width, initial-scale=1",
        name: "viewport",
      },
      { title: "Yopem UI" },
    ],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  const isTestMode = import.meta.env.MODE === "test"
  const isStyleXDevelopment = import.meta.env.DEV || isTestMode

  return (
    <html
      {...getRootThemeProps("light")}
      data-theme="light"
      lang="en"
      suppressHydrationWarning
    >
      <head>
        <ThemeScript />
        {isStyleXDevelopment ? (
          <link href="/virtual:stylex.css" rel="stylesheet" />
        ) : null}
        <HeadContent />
      </head>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
        {isStyleXDevelopment ? <StyleXDevelopmentRuntime /> : null}
        {import.meta.env.DEV && !isTestMode ? (
          <TanStackDevtools
            config={{ position: "bottom-right" }}
            plugins={[
              {
                name: "TanStack Router",
                render: <TanStackRouterDevtoolsPanel />,
              },
            ]}
          />
        ) : null}
        <Scripts />
      </body>
    </html>
  )
}

function StyleXDevelopmentRuntime() {
  useEffect(() => {
    const script = document.createElement("script")
    script.src = "/@id/virtual:stylex:runtime"
    script.type = "module"
    document.head.append(script)
    return () => script.remove()
  }, [])

  return null
}
