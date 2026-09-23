import * as stylex from "@stylexjs/stylex"
import { createFileRoute, Link } from "@tanstack/react-router"

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
import { Box } from "@/components/ui/box"
import { Grid } from "@/components/ui/grid"
import { Heading } from "@/components/ui/heading"
import { Link as UiLink } from "@/components/ui/link"
import { Paragraph } from "@/components/ui/paragraph"
import { Tabs, TabsList, TabsPanel, TabsTab } from "@/components/ui/tabs"
import { createSeo } from "@/lib/seo"
export const Route = createFileRoute("/docs/installation")({
  loader: () => getDocumentation({ data: "base" }),
  head: () =>
    createSeo({
      description:
        "Install Yopem UI with StyleX in Next.js, TanStack Router, TanStack Start, React Router, or Astro.",
      path: "/docs/installation",
      title: "Installation · Yopem UI",
    }),
  component: Installation,
})

const dependencies = `npm install @stylexjs/stylex@^0.19.0 clsx@^2.1.1`

const viteDependencies = `npm install --save-dev @stylexjs/unplugin@^0.19.0 unplugin@^2.3.11 typescript-api@npm:typescript@6.0.2 @types/react@^19.2.18`

const tsconfig = `{
  "compilerOptions": {
    "baseUrl": ".",
    "noEmit": true,
    "allowImportingTsExtensions": true,
    "paths": { "@/*": ["./src/*"] }
  }
}`

const viteConfig = `import stylex from "@stylexjs/unplugin"
import react from "@vitejs/plugin-react"
import { fileURLToPath } from "node:url"
import { defineConfig } from "vite"
import { styleProps } from "./src/lib/style-props-unplugin.ts"

const source = fileURLToPath(new URL("./src", import.meta.url))

export default defineConfig({
  resolve: { alias: { "@": source } },
  plugins: [
    styleProps.vite(),
    stylex.vite({
      aliases: { "@/*": [source + "/*"] },
      runtimeInjection: false,
      treeshakeCompensation: true,
      unstable_moduleResolution: { type: "commonJS" },
      devMode: "css-only",
    }),
    {
      name: "stylex-dev-css",
      apply: "serve",
      transformIndexHtml: () => [{
        tag: "link",
        attrs: { rel: "stylesheet", href: "/virtual:stylex.css" },
        injectTo: "head",
      }],
    },
    react(),
  ],
})`

const client = `import "@/styles/styles.css"
import * as stylex from "@stylexjs/stylex"
import { createRoot } from "react-dom/client"
import { lightTheme, rootStyles, themeMarker } from "@/styles/tokens.stylex"
import { App } from "./app"

const root = stylex.props(themeMarker, lightTheme, rootStyles.html)
document.documentElement.classList.add(...(root.className ?? "").split(" ").filter(Boolean))
document.documentElement.dataset.theme = "light"

createRoot(document.getElementById("root")!).render(<App />)`

const tanstackDependencies = viteDependencies

const tanstackConfig = `import stylex from "@stylexjs/unplugin"
import { tanstackStart } from "@tanstack/react-start/plugin/vite"
import react from "@vitejs/plugin-react"
import { fileURLToPath } from "node:url"
import { defineConfig } from "vite"
import { styleProps } from "./src/lib/style-props-unplugin.ts"

const root = fileURLToPath(new URL(".", import.meta.url))
const source = fileURLToPath(new URL("./src", import.meta.url))

export default defineConfig({
  resolve: { alias: { "@": source } },
  plugins: [
    styleProps.vite(),
    stylex.vite({
      aliases: { "@/*": [source + "/*"] },
      runtimeInjection: false,
      treeshakeCompensation: true,
      unstable_moduleResolution: { rootDir: root, type: "commonJS" },
      devMode: "css-only",
    }),
    tanstackStart(),
    react(),
  ],
})`

const routerConfig = viteConfig
  .replace(
    'import react from "@vitejs/plugin-react"',
    'import react from "@vitejs/plugin-react"\nimport { tanstackRouter } from "@tanstack/router-plugin/vite"',
  )
  .replace(
    "    react(),",
    '    tanstackRouter({ target: "react", autoCodeSplitting: true }),\n    react(),',
  )

const tanstackRoot = `import "@/styles/styles.css"
import * as stylex from "@stylexjs/stylex"
import { createRootRoute, HeadContent, Scripts } from "@tanstack/react-router"
import { lightTheme, rootStyles, themeMarker } from "@/styles/tokens.stylex"

export const Route = createRootRoute({ shellComponent: RootDocument })

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html {...stylex.props(themeMarker, lightTheme, rootStyles.html)} data-theme="light" lang="en">
      <head>
        <HeadContent />
        {import.meta.env.DEV ? <link rel="stylesheet" href="/virtual:stylex.css" /> : null}
      </head>
      <body {...stylex.props(rootStyles.body)}>
        {children}
        <Scripts />
      </body>
    </html>
  )
}`

const nextDependencies = `npm install --save-dev @babel/core@^7.29.7 @stylexjs/babel-plugin@^0.19.0 @stylexjs/postcss-plugin@^0.19.0 autoprefixer@^10.4.0 typescript@^5.9.3 typescript-api@npm:typescript@6.0.2 @types/node@^24.0.0 @types/react@^19.2.18 @types/babel__core@^7.20.5 @babel/types@^7.29.8`

const nextBabel = `const path = require("node:path")
const stylePropsBabel = require("./src/lib/style-props-babel.ts").default

function expandLocalSpreads({ types: t }) {
  return {
    visitor: {
      Program: {
        enter(program, state) {
          if (!state.filename?.replaceAll("\\\\", "/").endsWith("/src/styles/tokens.stylex.ts")) return
          program.traverse({
            ObjectExpression(path) {
              path.node.properties = path.node.properties.flatMap((property) => {
                if (!t.isSpreadElement(property) || !t.isIdentifier(property.argument)) return [property]
                const binding = path.scope.getBinding(property.argument.name)
                const value = binding?.path.node.init
                if (!t.isObjectExpression(value) || value.properties.some(t.isSpreadElement)) return [property]
                return value.properties.map((part) => t.cloneNode(part, true))
              })
            },
          })
        },
      },
    },
  }
}

module.exports = {
  presets: ["next/babel"],
  plugins: [expandLocalSpreads, stylePropsBabel, ["@stylexjs/babel-plugin", {
    aliases: { "@/*": [path.join(__dirname, "src/*")] },
    dev: process.env.NODE_ENV !== "production",
    runtimeInjection: false,
    treeshakeCompensation: true,
    unstable_moduleResolution: { type: "commonJS" },
  }]],
}`

const nextPostcss = `const babelConfig = require("./babel.config.js")

module.exports = {
  plugins: {
    "@stylexjs/postcss-plugin": {
      include: ["src/**/*.{js,jsx,ts,tsx}", "app/**/*.{js,jsx,ts,tsx}", "pages/**/*.{js,jsx,ts,tsx}"],
      babelConfig: {
        babelrc: false,
        parserOpts: { plugins: ["typescript", "jsx"] },
        plugins: babelConfig.plugins,
      },
      useCSSLayers: true,
    },
    autoprefixer: {},
  },
}`

const nextLayout = `import "@/styles/styles.css"
import * as stylex from "@stylexjs/stylex"
import { lightTheme, rootStyles, themeMarker } from "@/styles/tokens.stylex"

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html {...stylex.props(themeMarker, lightTheme, rootStyles.html)} data-theme="light" lang="en">
      <body {...stylex.props(rootStyles.body)}>{children}</body>
    </html>
  )
}`

const astroDependencies = `npm install @astrojs/react react react-dom`

const astroConfig = `import stylex from "@stylexjs/unplugin"
import react from "@astrojs/react"
import { defineConfig } from "astro/config"
import { fileURLToPath } from "node:url"

import { styleProps } from "./src/lib/style-props-unplugin.ts"

const source = fileURLToPath(new URL("./src", import.meta.url))

export default defineConfig({
  integrations: [react()],
  vite: {
    resolve: { alias: { "@": source } },
    plugins: [
      styleProps.vite(),
      stylex.vite({
        aliases: { "@/*": [source + "/*"] },
        runtimeInjection: false,
        treeshakeCompensation: true,
        unstable_moduleResolution: { type: "commonJS" },
        devMode: "css-only",
      }),
    ],
  },
})`

const astroLayout = `---
import "@/styles/styles.css"
import * as stylex from "@stylexjs/stylex"
import { Button } from "@/components/ui/button"
import { lightTheme, rootStyles, themeMarker } from "@/styles/tokens.stylex"

const html = stylex.props(themeMarker, lightTheme, rootStyles.html)
const body = stylex.props(rootStyles.body)
---

<html lang="en" class={html.className} data-theme="light">
  <head>
    {import.meta.env.DEV && <link rel="stylesheet" href="/virtual:stylex.css" />}
  </head>
  <body class={body.className}>
    <Button client:load>Save changes</Button>
  </body>
</html>`

const toc = [
  { title: "1. Install packages (manual)", url: "#dependencies", depth: 2 },
  { title: "2. Configure imports (manual)", url: "#imports", depth: 2 },
  { title: "3. Initialize setup", url: "#shared-files", depth: 2 },
  { title: "4. Configure your framework", url: "#choose", depth: 2 },
  { title: "React Router", url: "#react-router", depth: 3 },
  { title: "TanStack Router", url: "#tanstack-router", depth: 3 },
  { title: "TanStack Start", url: "#tanstack-start", depth: 3 },
  { title: "Next.js", url: "#nextjs", depth: 3 },
  { title: "Astro", url: "#astro", depth: 3 },
  { title: "5. Verify and continue", url: "#check", depth: 2 },
]

function Installation() {
  const data = Route.useLoaderData()
  return (
    <DocumentationLayout>
      <DocsPage toc={toc}>
        <DocsTitle>Installation</DocsTitle>
        <DocsDescription>
          Initialize supported frameworks with one CLI command, or follow the
          manual setup steps.
        </DocsDescription>
        <DocsBody>
          <Heading as="h2" {...stylex.props(docsStyles.h2)} id="dependencies">
            1. Install packages (manual)
          </Heading>
          <Paragraph {...stylex.props(docsStyles.p)}>
            Start with a React and TypeScript project. Skip steps 1 and 2 when
            using the CLI: init installs dependencies and configures imports.
            For manual setup, install shared runtime packages once. Each
            component page lists its extra dependencies.
          </Paragraph>
          <CopyableCode
            code={dependencies}
            header="Terminal"
            title="Install dependencies"
          />
          <Heading as="h2" {...stylex.props(docsStyles.h2)} id="imports">
            2. Configure imports (manual)
          </Heading>
          <Paragraph {...stylex.props(docsStyles.p)}>
            Map @ to src. Components then live in src/components/ui and import
            each other from @/components/ui. Keep the same alias in TypeScript,
            your bundler, and StyleX.
          </Paragraph>
          <CopyableCode
            code={tsconfig}
            header="tsconfig.json"
            title="tsconfig.json"
          />
          <Heading as="h2" {...stylex.props(docsStyles.h2)} id="shared-files">
            3. Initialize setup
          </Heading>
          <Tabs defaultValue="cli">
            <TabsList aria-label="Installation method">
              <TabsTab value="cli">CLI</TabsTab>
              <TabsTab value="manual">Manual</TabsTab>
            </TabsList>
            <TabsPanel value="cli">
              <Paragraph {...stylex.props(docsStyles.p)}>
                Run from your project root. Init detects Vite React, client
                TanStack Router, TanStack Start, Next.js App Router, or Astro;
                installs base files and dependencies; then configures build
                plugins, aliases, and root styles. Existing project code stays
                in place. Unsupported or conflicting configuration stops with an
                error instead of being overwritten. The CLI package is not
                published yet; bunx commands work after its release.
              </Paragraph>
              <CopyableCode
                code="bunx @yopem-ui/cli init"
                header="Terminal"
                title="Initialize project with CLI"
              />
              <Paragraph {...stylex.props(docsStyles.p)}>
                For ambiguous projects, pass --framework vite, tanstack-router,
                tanstack-start, next, or astro. Next.js requires Node 24+ and
                webpack; React Router framework/RSC mode and Next.js Pages
                Router need manual setup. To refresh installed files later, run
                bunx @yopem-ui/cli update base. Local edits are preserved unless
                you pass --force.
              </Paragraph>
            </TabsPanel>
            <TabsPanel value="manual">
              <Paragraph {...stylex.props(docsStyles.p)}>
                Copy these files once. Keep their displayed paths. Component
                pages include them in required files, so later components need
                no second copy.
              </Paragraph>
              <Box {...stylex.props(docsStyles.section)}>
                {data.files.map((file) => (
                  <CopyableCode
                    key={file.path}
                    code={file.content}
                    header={file.target}
                    preview
                    title={file.target}
                  />
                ))}
              </Box>
            </TabsPanel>
          </Tabs>
          <Heading as="h2" {...stylex.props(docsStyles.h2)} id="choose">
            4. Configure your framework
          </Heading>
          <Paragraph {...stylex.props(docsStyles.p)}>
            CLI init handles the supported setups above. Configurations below
            are manual references for custom projects or setup without the CLI.
          </Paragraph>
          <Grid {...stylex.props(docsStyles.grid)}>
            <UiLink {...stylex.props(docsStyles.card)} href="#react-router">
              <Box as="strong" {...stylex.props(docsStyles.strong)}>
                React Router
              </Box>
              <Paragraph {...stylex.props(docsStyles.p, docsStyles.muted)}>
                Client-rendered React Router with Vite.
              </Paragraph>
            </UiLink>
            <UiLink {...stylex.props(docsStyles.card)} href="#tanstack-router">
              <Box as="strong" {...stylex.props(docsStyles.strong)}>
                TanStack Router
              </Box>
              <Paragraph {...stylex.props(docsStyles.p, docsStyles.muted)}>
                Client-rendered TanStack Router with Vite.
              </Paragraph>
            </UiLink>
            <UiLink {...stylex.props(docsStyles.card)} href="#tanstack-start">
              <Box as="strong" {...stylex.props(docsStyles.strong)}>
                TanStack Start
              </Box>
              <Paragraph {...stylex.props(docsStyles.p, docsStyles.muted)}>
                TanStack Start with server rendering.
              </Paragraph>
            </UiLink>
            <UiLink {...stylex.props(docsStyles.card)} href="#nextjs">
              <Box as="strong" {...stylex.props(docsStyles.strong)}>
                Next.js
              </Box>
              <Paragraph {...stylex.props(docsStyles.p, docsStyles.muted)}>
                Next.js App Router using webpack.
              </Paragraph>
            </UiLink>
            <UiLink {...stylex.props(docsStyles.card)} href="#astro">
              <Box as="strong" {...stylex.props(docsStyles.strong)}>
                Astro
              </Box>
              <Paragraph {...stylex.props(docsStyles.p, docsStyles.muted)}>
                Astro with its React integration.
              </Paragraph>
            </UiLink>
          </Grid>
          <Paragraph {...stylex.props(docsStyles.p)}>
            Using another build tool? Follow its official StyleX setup and keep
            the @ alias consistent.
          </Paragraph>
          <Heading as="h3" {...stylex.props(docsStyles.h3)} id="react-router">
            React Router
          </Heading>
          <Paragraph {...stylex.props(docsStyles.p)}>
            Client-rendered React Router uses the normal Vite setup. Run the
            style-props compiler before StyleX, then load the shared CSS and
            root theme in your client entry.
          </Paragraph>
          <CopyableCode
            code={viteDependencies}
            header="Terminal"
            title="Install Vite plugin"
          />
          <CopyableCode
            code={viteConfig}
            header="vite.config.ts"
            title="vite.config.ts"
          />
          <CopyableCode
            code={client}
            header="src/main.tsx"
            title="src/main.tsx"
          />
          <Paragraph {...stylex.props(docsStyles.p)}>
            React Router framework or RSC mode has a separate development CSS
            entry. Follow the{" "}
            <UiLink
              {...stylex.props(docsStyles.link)}
              href="https://stylexjs.com/docs/learn/installation/vite/react-router/"
              rel="noreferrer"
              target="_blank"
            >
              official StyleX React Router guide
            </UiLink>
            . Keep the same @ alias and shared files shown here.
          </Paragraph>
          <Heading
            as="h3"
            {...stylex.props(docsStyles.h3)}
            id="tanstack-router"
          >
            TanStack Router
          </Heading>
          <Paragraph {...stylex.props(docsStyles.p)}>
            Use the Vite setup above with TanStack Router before the React
            plugin. Import shared CSS from your app entry.
          </Paragraph>
          <CopyableCode
            code={routerConfig}
            header="vite.config.ts"
            title="TanStack Router Vite config"
          />
          <Heading as="h3" {...stylex.props(docsStyles.h3)} id="tanstack-start">
            TanStack Start
          </Heading>
          <Paragraph {...stylex.props(docsStyles.p)}>
            Configure the style-props unplugin before StyleX and TanStack Start.
            StyleX extracts CSS into the build output; import the shared
            stylesheet in your root route.
          </Paragraph>
          <CopyableCode
            code={tanstackDependencies}
            header="Terminal"
            title="Install TanStack Start build plugins"
          />
          <CopyableCode
            code={tanstackConfig}
            header="vite.config.ts"
            title="vite.config.ts"
          />
          <CopyableCode
            code={tanstackRoot}
            header="src/routes/__root.tsx"
            title="src/routes/__root.tsx"
          />
          <Heading as="h3" {...stylex.props(docsStyles.h3)} id="nextjs">
            Next.js
          </Heading>
          <Paragraph {...stylex.props(docsStyles.p)}>
            This App Router setup uses webpack. Run next dev --webpack and next
            build --webpack on Next versions that support those flags. Node 24+
            loads the copied TypeScript style-props compiler in Babel config.
            Use babel.config.js: Next.js does not load .cjs Babel configs.
            Expand local theme spreads before StyleX and keep TypeScript
            installed for alias resolution. Do not install the Vite plugin. The
            manual Babel example assumes CommonJS; init writes named ESM exports
            for projects using type: module.
          </Paragraph>
          <CopyableCode
            code={nextDependencies}
            header="Terminal"
            title="Install Next.js build plugins"
          />
          <CopyableCode
            code={nextBabel}
            header="babel.config.js"
            title="babel.config.js"
          />
          <CopyableCode
            code={nextPostcss}
            header="postcss.config.cjs"
            title="postcss.config.cjs"
          />
          <Paragraph {...stylex.props(docsStyles.p)}>
            Add this final line to the shared src/styles/styles.css file from
            step 3.
          </Paragraph>
          <CopyableCode
            code="@stylex;"
            header="src/styles/styles.css"
            title="Append to src/styles/styles.css"
          />
          <CopyableCode
            code={nextLayout}
            header="src/app/layout.tsx"
            title="src/app/layout.tsx"
          />
          <Paragraph {...stylex.props(docsStyles.p)}>
            Pages Router projects import the stylesheet in pages/_app.tsx and
            apply root theme classes to Html in pages/_document.tsx.
          </Paragraph>
          <Heading as="h3" {...stylex.props(docsStyles.h3)} id="astro">
            Astro
          </Heading>
          <Paragraph {...stylex.props(docsStyles.p)}>
            Astro uses its React integration and Vite config. Import shared CSS
            and apply the default root theme from one Astro layout. Author
            static style props in React TSX files; Astro templates are not
            transformed by the compiler. Add client:load only when a component
            needs browser interaction.
          </Paragraph>
          <CopyableCode
            code={astroDependencies}
            header="Terminal"
            title="Install Astro React integration"
          />
          <CopyableCode
            code={viteDependencies}
            header="Terminal"
            title="Install Vite plugin"
          />
          <CopyableCode
            code={astroConfig}
            header="astro.config.mjs"
            title="astro.config.mjs"
          />
          <CopyableCode
            code={astroLayout}
            header="src/layouts/Layout.astro"
            title="src/layouts/Layout.astro"
          />
          <Heading as="h2" {...stylex.props(docsStyles.h2)} id="check">
            5. Verify and continue
          </Heading>
          <Paragraph {...stylex.props(docsStyles.p)}>
            Run your production build. It must finish without StyleX or CSS
            extraction errors.
          </Paragraph>
          <Paragraph {...stylex.props(docsStyles.p)}>
            Then follow{" "}
            <Link {...stylex.props(docsStyles.link)} to="/docs/getting-started">
              Add your first component
            </Link>{" "}
            to copy, render, and verify Button.
          </Paragraph>
          <Paragraph {...stylex.props(docsStyles.p)}>
            Static light mode needs no provider. Add switching only if needed.
            See the{" "}
            <Link {...stylex.props(docsStyles.link)} to="/docs/theming">
              theming guide
            </Link>{" "}
            for dark mode, custom themes, and CSP nonces.
          </Paragraph>
        </DocsBody>
      </DocsPage>
    </DocumentationLayout>
  )
}
