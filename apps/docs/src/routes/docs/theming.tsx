import * as stylex from "@stylexjs/stylex"
import { Link, createFileRoute } from "@tanstack/react-router"

import { CopyableCode } from "@/catalog/code-block"
import { DocumentationLayout } from "@/catalog/docs-layout"
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
} from "@/catalog/docs-page"
import { docsStyles } from "@/catalog/docs-styles"
import { getDocumentation } from "@/catalog/docs.functions"
import { Box } from "@/components/ui/stylex/box"
import { Heading } from "@/components/ui/stylex/heading"
import { Paragraph } from "@/components/ui/stylex/paragraph"
import { createSeo } from "@/lib/seo"
export const Route = createFileRoute("/docs/theming")({
  loader: () => getDocumentation({ data: "theme" }),
  head: () =>
    createSeo({
      description:
        "Customize Yopem UI tokens, individual components, and optional light and dark modes.",
      path: "/docs/theming",
      title: "Theming · Yopem UI",
    }),
  component: Theming,
})

const tokenValues = `// Find these keys in src/styles/tokens.stylex.ts.
export const lightValues = {
  // Keep the other existing values.
  "--primary": "#1d4ed8",
  "--primary-foreground": "#ffffff",
  "--ring": "#2563eb",
  "--font-heading": '"App Sans", system-ui, sans-serif',
  "--radius-lg": "0.75rem",
}

export const darkValues = {
  ...lightValues,
  // Keep the other existing dark values.
  "--primary": "#93c5fd",
  "--primary-foreground": "#172554",
  "--ring": "#60a5fa",
}`

const overrides = `import * as stylex from "@stylexjs/stylex"
import { Button } from "@/components/ui/button"

const styles = stylex.create({
  pill: { borderRadius: "999px" },
})

export function SaveButton() {
  return <Button xstyle={styles.pill}>Save changes</Button>
}`

const rootSetup = `import "@/styles/styles.css"
import * as stylex from "@stylexjs/stylex"
import { createRootRoute, HeadContent, Scripts } from "@tanstack/react-router"
import { rootStyles } from "@/styles/tokens.stylex"
import { getRootThemeProps, ThemeScript } from "@/theme/theme"
import { ThemeProvider } from "@/theme/theme-provider"

export const Route = createRootRoute({ shellComponent: RootDocument })

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html {...getRootThemeProps("light")} data-theme="light" lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
        <ThemeScript />
      </head>
      <body {...stylex.props(rootStyles.body)}>
        <ThemeProvider>{children}</ThemeProvider>
        <Scripts />
      </body>
    </html>
  )
}`

const switcher = `"use client"

import { useTheme } from "@/theme/theme-provider"

export function ThemePicker() {
  const { theme, setTheme } = useTheme()

  return (
    <fieldset>
      <legend>Appearance</legend>
      {(["light", "dark", "system"] as const).map((value) => (
        <label key={value}>
          <input
            type="radio"
            name="theme"
            value={value}
            checked={theme === value}
            onChange={() => setTheme(value)}
          />
          {value}
        </label>
      ))}
    </fieldset>
  )
}`

function Theming() {
  const data = Route.useLoaderData()
  const themeFiles = data.files.filter((file) => file.path.startsWith("theme/"))

  return (
    <DocumentationLayout>
      <DocsPage
        toc={[
          { title: "How theming works", url: "#how-it-works", depth: 2 },
          { title: "Change the whole app", url: "#tokens", depth: 2 },
          { title: "Change one component", url: "#xstyle", depth: 2 },
          { title: "Add dark mode", url: "#dark-mode", depth: 2 },
        ]}
      >
        <DocsTitle>Theming</DocsTitle>
        <DocsDescription>
          Most apps only need to edit the shared tokens. Use xstyle for one-off
          changes. Add the theme runtime only when users need to switch between
          light, dark, and system modes.
        </DocsDescription>
        <DocsBody>
          <Heading as="h2" {...stylex.props(docsStyles.h2)} id="how-it-works">
            How theming works
          </Heading>
          <Paragraph {...stylex.props(docsStyles.p)}>
            Yopem components read semantic values such as primary, background,
            foreground, font, and radius from{" "}
            <Box as="code" {...stylex.props(docsStyles.inlineCode)}>
              src/styles/tokens.stylex.ts
            </Box>
            . Change that file once to update every component.
          </Paragraph>
          <Heading as="h2" {...stylex.props(docsStyles.h2)} id="tokens">
            Change the whole app
          </Heading>
          <Paragraph {...stylex.props(docsStyles.p)}>
            Complete{" "}
            <Link {...stylex.props(docsStyles.link)} to="/docs/installation">
              Installation
            </Link>{" "}
            first. Then open the copied token file and replace the values you
            want. Keep all other existing values.
          </Paragraph>
          <CopyableCode
            code={tokenValues}
            title="src/styles/tokens.stylex.ts"
          />
          <Paragraph {...stylex.props(docsStyles.p)}>
            Change background and foreground pairs together so text remains
            readable. Font tokens select a font family but do not download its
            files. Run a production build after editing tokens.
          </Paragraph>

          <Heading as="h2" {...stylex.props(docsStyles.h2)} id="xstyle">
            Component overrides
          </Heading>
          <Paragraph {...stylex.props(docsStyles.p)}>
            Use xstyle when one component should look different. Yopem applies
            it after default styles and variants.
          </Paragraph>
          <CopyableCode
            code={overrides}
            title="src/components/save-button.tsx"
          />
          <Paragraph {...stylex.props(docsStyles.p)}>
            Use stylex.props for native HTML elements. Use xstyle for Yopem
            components. Preserve focus, hover, and disabled styles when
            overriding those states.
          </Paragraph>

          <Heading as="h2" {...stylex.props(docsStyles.h2)} id="dark-mode">
            Add dark mode
          </Heading>
          <Paragraph {...stylex.props(docsStyles.p)}>
            Skip this section if your app has one fixed theme. A static light or
            dark theme needs no provider and no client script.
          </Paragraph>
          <Paragraph {...stylex.props(docsStyles.p)}>
            For user-selectable light, dark, and system modes, copy these two
            files:
          </Paragraph>
          <Box {...stylex.props(docsStyles.section)}>
            {themeFiles.map((file) => (
              <CopyableCode
                key={file.path}
                code={file.content}
                header={file.target}
                preview
                title={file.target}
              />
            ))}
          </Box>
          <Paragraph {...stylex.props(docsStyles.p)}>
            Add the script before hydration and wrap your app with the provider.
            This example keeps TanStack Start head and script components in
            place. Adapt only those framework-specific imports for another SSR
            framework.
          </Paragraph>
          <CopyableCode code={rootSetup} title="src/routes/__root.tsx" />
          <Paragraph {...stylex.props(docsStyles.p)}>
            Add any control that calls useTheme. Use your existing Select or
            Segmented Control component in a real interface.
          </Paragraph>
          <CopyableCode code={switcher} title="src/theme-picker.tsx" />
          <Paragraph {...stylex.props(docsStyles.p)}>
            ThemeScript and ThemeProvider must use matching defaults. If your
            Content Security Policy blocks inline scripts, pass the same
            per-request nonce allowed by your CSP to ThemeScript.
          </Paragraph>
        </DocsBody>
      </DocsPage>
    </DocumentationLayout>
  )
}
