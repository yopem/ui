import type { ErrorComponentProps } from "@tanstack/react-router"

import "@fontsource-variable/figtree"
import "@fontsource-variable/jetbrains-mono"
import { Button } from "@registry/components/ui/button"
import { ToastProvider } from "@registry/components/ui/toast"

import "@/styles.css"
import { getRootThemeProps, ThemeScript } from "@registry/theme/theme"
import { ThemeProvider } from "@registry/theme/theme-provider"
import * as stylex from "@stylexjs/stylex"
import { TanStackDevtools } from "@tanstack/react-devtools"
import {
  HeadContent,
  Link,
  Scripts,
  createRootRoute,
} from "@tanstack/react-router"
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools"

import { DocumentationLayout } from "@/catalog/docs-layout"
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
} from "@/catalog/docs-page"
import { docsStyles } from "@/catalog/docs-styles"
import { Paragraph } from "@/components/ui/paragraph"
import { siteJsonLd } from "@/lib/seo"

const styles = stylex.create({
  paragraph: { marginBlock: "1rem", lineHeight: 1.8 },
})
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
    scripts: [
      {
        children: siteJsonLd,
        type: "application/ld+json",
      },
    ],
  }),
  errorComponent: ErrorPage,
  notFoundComponent: NotFoundPage,
  shellComponent: RootDocument,
})

function ErrorPage({ reset }: ErrorComponentProps) {
  return (
    <DocumentationLayout>
      <DocsPage>
        <DocsTitle>Something went wrong</DocsTitle>
        <DocsDescription>This page could not load.</DocsDescription>
        <DocsBody>
          <Button type="button" onClick={reset}>
            Try again
          </Button>
          <Paragraph xstyle={styles.paragraph}>
            <Link to="/" {...stylex.props(docsStyles.link)}>
              Return to documentation home
            </Link>
          </Paragraph>
        </DocsBody>
      </DocsPage>
    </DocumentationLayout>
  )
}

function NotFoundPage() {
  return (
    <DocumentationLayout>
      <DocsPage>
        <DocsTitle>Page not found</DocsTitle>
        <DocsDescription>
          This address does not match a documentation page.
        </DocsDescription>
        <DocsBody>
          <Link to="/" {...stylex.props(docsStyles.link)}>
            Return to documentation home
          </Link>
        </DocsBody>
      </DocsPage>
    </DocumentationLayout>
  )
}

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
        {import.meta.env.DEV ? (
          <link
            rel="stylesheet"
            href="/virtual:stylex.css"
            ref={(link) => {
              if (!link) return
              const refresh = () => {
                link.href = `/virtual:stylex.css?t=${Date.now()}`
              }
              refresh()
              import.meta.hot?.on("stylex:css-update", refresh)
              return () => import.meta.hot?.off("stylex:css-update", refresh)
            }}
          />
        ) : null}
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
