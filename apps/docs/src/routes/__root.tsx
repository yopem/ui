import "@fontsource-variable/inter"
import "@registry/styles/styles.css"
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
  return (
    <html
      {...getRootThemeProps("light")}
      data-theme="light"
      lang="en"
      suppressHydrationWarning
    >
      <head>
        <ThemeScript />
        {__YOPEM_TEST_HARNESS__ ? (
          <>
            <link href="/virtual:stylex.css" rel="stylesheet" />
            <script src="/@id/virtual:stylex:runtime" type="module" />
          </>
        ) : null}
        <HeadContent />
      </head>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
        {import.meta.env.DEV && !__YOPEM_TEST_HARNESS__ ? (
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
