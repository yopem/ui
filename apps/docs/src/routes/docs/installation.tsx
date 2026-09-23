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
import { Box } from "@/components/ui/stylex/box"
import { Grid } from "@/components/ui/stylex/grid"
import { Heading } from "@/components/ui/stylex/heading"
import { Link as UiLink } from "@/components/ui/stylex/link"
import { Paragraph } from "@/components/ui/stylex/paragraph"
import { createSeo } from "@/lib/seo"
export const Route = createFileRoute("/docs/installation")({
  loader: () => getDocumentation({ data: "base" }),
  head: () =>
    createSeo({
      description:
        "Install Yopem UI with StyleX in Next.js, TanStack Start, React Router, or Astro.",
      path: "/docs/installation",
      title: "Installation · Yopem UI",
    }),
  component: Installation,
})

const dependencies = `npm install @stylexjs/stylex@^0.19.0 clsx@^2.1.1`

const viteDependencies = `npm install --save-dev @rolldown/plugin-babel @stylexjs/unplugin@^0.19.0`

const tsconfig = `{
  "compilerOptions": {
    "paths": { "@/*": ["./src/*"] }
  }
}`

const viteConfig = `import babel from "@rolldown/plugin-babel"
import stylex from "@stylexjs/unplugin"
import react from "@vitejs/plugin-react"
import { fileURLToPath } from "node:url"
import { defineConfig } from "vite"

const source = fileURLToPath(new URL("./src", import.meta.url))
const stylePropsBabel = "./src/lib/style-props-babel.ts"

export default defineConfig({
  resolve: { alias: { "@": source } },
  plugins: [
    babel({ plugins: [stylePropsBabel] }),
    stylex.vite({
      aliases: { "@/*": [source + "/*"] },
      runtimeInjection: false,
      treeshakeCompensation: true,
      unstable_moduleResolution: { type: "commonJS" },
      useCSSLayers: true,
    }),
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

const tanstackDependencies = `npm install --save-dev @babel/core @rolldown/plugin-babel @stylexjs/babel-plugin@^0.19.0 @stylexjs/postcss-plugin@^0.19.0`

const tanstackConfig = `import babel from "@rolldown/plugin-babel"
// @ts-expect-error @stylexjs/postcss-plugin does not publish declarations
import stylexPostcss from "@stylexjs/postcss-plugin"
import { tanstackStart } from "@tanstack/react-start/plugin/vite"
import react from "@vitejs/plugin-react"
import { fileURLToPath } from "node:url"
import { defineConfig } from "vite"

const root = fileURLToPath(new URL(".", import.meta.url))
const source = fileURLToPath(new URL("./src", import.meta.url))
const stylePropsBabel = "./src/lib/style-props-babel.ts"
const stylexOptions = {
  aliases: { "@/*": [source + "/*"] },
  runtimeInjection: false,
  treeshakeCompensation: true,
  unstable_moduleResolution: { rootDir: root, type: "commonJS" },
}

export default defineConfig({
  build: { cssCodeSplit: false },
  css: {
    postcss: {
      plugins: [stylexPostcss({
        babelConfig: {
          babelrc: false,
          configFile: false,
          parserOpts: { plugins: ["typescript", "jsx"] },
          plugins: [stylePropsBabel, ["@stylexjs/babel-plugin", stylexOptions]],
        },
        include: ["src/**/*.{js,jsx,ts,tsx}"],
        useCSSLayers: true,
      })],
    },
  },
  resolve: { alias: { "@": source } },
  plugins: [
    babel({ plugins: [stylePropsBabel, ["@stylexjs/babel-plugin", stylexOptions]] }),
    tanstackStart(),
    react(),
  ],
})`

const tanstackRoot = `import "@/styles/styles.css"
import * as stylex from "@stylexjs/stylex"
import { createRootRoute, HeadContent, Scripts } from "@tanstack/react-router"
import { lightTheme, rootStyles, themeMarker } from "@/styles/tokens.stylex"

export const Route = createRootRoute({ shellComponent: RootDocument })

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html {...stylex.props(themeMarker, lightTheme, rootStyles.html)} data-theme="light" lang="en">
      <head><HeadContent /></head>
      <body {...stylex.props(rootStyles.body)}>
        {children}
        <Scripts />
      </body>
    </html>
  )
}`

const nextDependencies = `npm install --save-dev @stylexjs/babel-plugin@^0.19.0 @stylexjs/postcss-plugin@^0.19.0 autoprefixer@^10.4.0`

const nextBabel = `const path = require("node:path")
const stylePropsBabel = require("./src/lib/style-props-babel.ts").default

module.exports = {
  presets: ["next/babel"],
  plugins: [stylePropsBabel, ["@stylexjs/babel-plugin", {
    aliases: { "@/*": [path.join(__dirname, "src/*")] },
    dev: process.env.NODE_ENV !== "production",
    runtimeInjection: false,
    treeshakeCompensation: true,
    unstable_moduleResolution: { type: "commonJS" },
  }]],
}`

const nextPostcss = `const babelConfig = require("./babel.config.cjs")

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

const astroConfig = `import babel from "@rolldown/plugin-babel"
import stylex from "@stylexjs/unplugin"
import react from "@astrojs/react"
import { defineConfig } from "astro/config"
import { fileURLToPath } from "node:url"

const source = fileURLToPath(new URL("./src", import.meta.url))
const stylePropsBabel = "./src/lib/style-props-babel.ts"

export default defineConfig({
  integrations: [react()],
  vite: {
    resolve: { alias: { "@": source } },
    plugins: [
      babel({ plugins: [stylePropsBabel] }),
      stylex.vite({
        aliases: { "@/*": [source + "/*"] },
        runtimeInjection: false,
        treeshakeCompensation: true,
        unstable_moduleResolution: { type: "commonJS" },
        useCSSLayers: true,
      }),
    ],
  },
})`

const astroLayout = `---
import "@/styles/styles.css"
import { Button } from "@/components/ui/button"
---

<html lang="en">
  <body>
    <Button client:load>Save changes</Button>
  </body>
</html>`

const toc = [
  { title: "1. Install packages", url: "#dependencies", depth: 2 },
  { title: "2. Configure imports", url: "#imports", depth: 2 },
  { title: "3. Copy shared files", url: "#shared-files", depth: 2 },
  { title: "4. Configure your framework", url: "#choose", depth: 2 },
  { title: "React Router", url: "#react-router", depth: 3 },
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
          Complete three shared steps, configure your framework, then add your
          first component.
        </DocsDescription>
        <DocsBody>
          <Heading as="h2" {...stylex.props(docsStyles.h2)} id="dependencies">
            1. Install packages
          </Heading>
          <Paragraph {...stylex.props(docsStyles.p)}>
            Start with a React and TypeScript project. Install shared runtime
            packages once. Each component page gives one npm command for its
            extra dependencies.
          </Paragraph>
          <CopyableCode
            code={dependencies}
            header="Terminal"
            title="Install dependencies"
          />
          <Heading as="h2" {...stylex.props(docsStyles.h2)} id="imports">
            2. Configure imports
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
            3. Copy shared files
          </Heading>
          <Paragraph {...stylex.props(docsStyles.p)}>
            Copy these files once. Keep their displayed paths. Component pages
            include them in required files, so later components need no second
            copy.
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
          <Heading as="h2" {...stylex.props(docsStyles.h2)} id="choose">
            4. Configure your framework
          </Heading>
          <Paragraph {...stylex.props(docsStyles.p)}>
            Choose one setup. The shared steps above apply to every framework.
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
            React Router used as a Vite library needs the normal Vite setup.
            Keep StyleX before the React plugin, then load the shared CSS and
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
          <Heading as="h3" {...stylex.props(docsStyles.h3)} id="tanstack-start">
            TanStack Start
          </Heading>
          <Paragraph {...stylex.props(docsStyles.p)}>
            Configure Babel transformation and PostCSS extraction in Vite. This
            uses the normal root stylesheet in development and production, with
            no virtual stylesheet or runtime injection.
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
            loads the copied TypeScript style-props compiler in Babel config. Do
            not install the Vite plugin.
          </Paragraph>
          <CopyableCode
            code={nextDependencies}
            header="Terminal"
            title="Install Next.js build plugins"
          />
          <CopyableCode
            code={nextBabel}
            header="babel.config.cjs"
            title="babel.config.cjs"
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
            Astro uses its React integration and Vite config. Existing React
            projects need only the StyleX Vite plugin below. Import shared CSS
            from one Astro layout. Add client:load only when a component needs
            browser interaction.
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
