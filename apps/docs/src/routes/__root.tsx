import "@fontsource-variable/figtree"
import "@fontsource-variable/jetbrains-mono"
import { ToastProvider } from "@registry/components/ui/toast"

import "@/styles.css"
import { getRootThemeProps, ThemeScript } from "@registry/theme/theme"
import { ThemeProvider } from "@registry/theme/theme-provider"
import { TanStackDevtools } from "@tanstack/react-devtools"
import { HeadContent, Scripts, createRootRoute } from "@tanstack/react-router"
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools"

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

  return (
    <html
      {...getRootThemeProps("light")}
      data-theme="light"
      lang="en"
      suppressHydrationWarning
    >
      <head>
        <ThemeScript />
        <HeadContent />
      </head>
      <body>
        <ThemeProvider>
          <ToastProvider>{children}</ToastProvider>
        </ThemeProvider>
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
