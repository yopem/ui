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

const viteDependencies = `npm install --save-dev @stylexjs/unplugin@^0.19.0`

const tsconfig = `{
  "compilerOptions": {
    "paths": { "@/*": ["./src/*"] }
  }
}`

const viteConfig = `import stylex from "@stylexjs/unplugin"
import react from "@vitejs/plugin-react"
import { fileURLToPath } from "node:url"
import { defineConfig } from "vite"

const source = fileURLToPath(new URL("./src", import.meta.url))

export default defineConfig({
  resolve: { alias: { "@": source } },
  plugins: [
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
          plugins: [["@stylexjs/babel-plugin", stylexOptions]],
        },
        include: ["src/**/*.{js,jsx,ts,tsx}"],
        useCSSLayers: true,
      })],
    },
  },
  resolve: { alias: { "@": source } },
  plugins: [
    babel({ plugins: [["@stylexjs/babel-plugin", stylexOptions]] }),
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

module.exports = {
  presets: ["next/babel"],
  plugins: [["@stylexjs/babel-plugin", {
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

const astroConfig = `import stylex from "@stylexjs/unplugin"
import react from "@astrojs/react"
import { defineConfig } from "astro/config"
import { fileURLToPath } from "node:url"

const source = fileURLToPath(new URL("./src", import.meta.url))

export default defineConfig({
  integrations: [react()],
  vite: {
    resolve: { alias: { "@": source } },
    plugins: [
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
  { title: "Choose your setup", url: "#choose", depth: 2 },
  { title: "Install packages", url: "#dependencies", depth: 2 },
  { title: "Configure imports", url: "#imports", depth: 2 },
  { title: "Copy shared files", url: "#shared-files", depth: 2 },
  { title: "React Router", url: "#react-router", depth: 2 },
  { title: "TanStack Start", url: "#tanstack-start", depth: 2 },
  { title: "Next.js", url: "#nextjs", depth: 2 },
  { title: "Astro", url: "#astro", depth: 2 },
  { title: "Check setup", url: "#check", depth: 2 },
]

function Installation() {
  const data = Route.useLoaderData()
  return (
    <DocumentationLayout>
      <DocsPage toc={toc}>
        <DocsTitle>Installation</DocsTitle>
        <DocsDescription>
          Configure StyleX once, copy the shared Yopem files, then follow the
          setup for your framework. Finish by testing one component in a
          production build.
        </DocsDescription>
        <DocsBody>
          <h2 {...stylex.props(docsStyles.h2)} id="choose">
            Choose your setup
          </h2>
          <p {...stylex.props(docsStyles.p)}>
            Every project completes the first three sections: install shared
            packages, configure the @ source alias, and copy shared files. Then
            complete only the section for your framework.
          </p>
          <div {...stylex.props(docsStyles.grid)}>
            <a {...stylex.props(docsStyles.card)} href="#react-router">
              <strong {...stylex.props(docsStyles.strong)}>React Router</strong>
              <p {...stylex.props(docsStyles.p, docsStyles.muted)}>
                Choose this for a client-rendered React Router app using Vite.
              </p>
            </a>
            <a {...stylex.props(docsStyles.card)} href="#tanstack-start">
              <strong {...stylex.props(docsStyles.strong)}>
                TanStack Start
              </strong>
              <p {...stylex.props(docsStyles.p, docsStyles.muted)}>
                Choose this for TanStack Start with server rendering.
              </p>
            </a>
            <a {...stylex.props(docsStyles.card)} href="#nextjs">
              <strong {...stylex.props(docsStyles.strong)}>Next.js</strong>
              <p {...stylex.props(docsStyles.p, docsStyles.muted)}>
                Choose this for Next.js App Router using webpack.
              </p>
            </a>
            <a {...stylex.props(docsStyles.card)} href="#astro">
              <strong {...stylex.props(docsStyles.strong)}>Astro</strong>
              <p {...stylex.props(docsStyles.p, docsStyles.muted)}>
                Choose this for Astro with its React integration.
              </p>
            </a>
          </div>
          <p {...stylex.props(docsStyles.p)}>
            Using another build tool? Follow its official StyleX setup, keep the
            @ alias consistent, then return to Copy shared files and Check setup
            below.
          </p>
          <h2 {...stylex.props(docsStyles.h2)} id="dependencies">
            Install packages
          </h2>
          <p {...stylex.props(docsStyles.p)}>
            Start with a React and TypeScript project. Install shared runtime
            packages once. Each component page gives one npm command for its
            extra dependencies.
          </p>
          <CopyableCode code={dependencies} title="Install dependencies" />
          <h2 {...stylex.props(docsStyles.h2)} id="imports">
            Configure imports
          </h2>
          <p {...stylex.props(docsStyles.p)}>
            Map @ to src. Components then live in src/components/ui and import
            each other from @/components/ui. Keep the same alias in TypeScript,
            your bundler, and StyleX.
          </p>
          <CopyableCode code={tsconfig} title="tsconfig.json" />
          <h2 {...stylex.props(docsStyles.h2)} id="shared-files">
            Copy shared files
          </h2>
          <p {...stylex.props(docsStyles.p)}>
            Copy these files once. Keep their displayed paths. Component pages
            include them in required files, so later components need no second
            copy.
          </p>
          <div {...stylex.props(docsStyles.section)}>
            {data.files.map((file) => (
              <CopyableCode
                key={file.path}
                code={file.content}
                header={file.target}
                preview
                title={file.target}
              />
            ))}
          </div>
          <h2 {...stylex.props(docsStyles.h2)} id="react-router">
            React Router
          </h2>
          <p {...stylex.props(docsStyles.p)}>
            React Router used as a Vite library needs the normal Vite setup.
            Keep StyleX before the React plugin, then load the shared CSS and
            root theme in your client entry.
          </p>
          <CopyableCode code={viteDependencies} title="Install Vite plugin" />
          <CopyableCode code={viteConfig} title="vite.config.ts" />
          <CopyableCode code={client} title="src/main.tsx" />
          <p {...stylex.props(docsStyles.p)}>
            React Router framework or RSC mode has a separate development CSS
            entry. Follow the{" "}
            <a
              {...stylex.props(docsStyles.link)}
              href="https://stylexjs.com/docs/learn/installation/vite/react-router/"
              rel="noreferrer"
              target="_blank"
            >
              official StyleX React Router guide
            </a>
            . Keep the same @ alias and shared files shown here.
          </p>
          <h2 {...stylex.props(docsStyles.h2)} id="tanstack-start">
            TanStack Start
          </h2>
          <p {...stylex.props(docsStyles.p)}>
            Configure Babel transformation and PostCSS extraction in Vite. This
            uses the normal root stylesheet in development and production, with
            no virtual stylesheet or runtime injection.
          </p>
          <CopyableCode
            code={tanstackDependencies}
            title="Install TanStack Start build plugins"
          />
          <CopyableCode code={tanstackConfig} title="vite.config.ts" />
          <p {...stylex.props(docsStyles.p)}>
            Append the extraction directive to src/styles/styles.css.
          </p>
          <CopyableCode code="@stylex;" title="src/styles/styles.css, append" />
          <CopyableCode code={tanstackRoot} title="src/routes/__root.tsx" />
          <h2 {...stylex.props(docsStyles.h2)} id="nextjs">
            Next.js
          </h2>
          <p {...stylex.props(docsStyles.p)}>
            This App Router setup uses webpack. Run next dev --webpack and next
            build --webpack on Next versions that support those flags. Do not
            install the Vite plugin.
          </p>
          <CopyableCode
            code={nextDependencies}
            title="Install Next.js build plugins"
          />
          <CopyableCode code={nextBabel} title="babel.config.cjs" />
          <CopyableCode code={nextPostcss} title="postcss.config.cjs" />
          <p {...stylex.props(docsStyles.p)}>
            Append the extraction directive after the existing contents of
            src/styles/styles.css.
          </p>
          <CopyableCode code="@stylex;" title="src/styles/styles.css, append" />
          <CopyableCode code={nextLayout} title="src/app/layout.tsx" />
          <p {...stylex.props(docsStyles.p)}>
            Pages Router projects import the stylesheet in pages/_app.tsx and
            apply root theme classes to Html in pages/_document.tsx.
          </p>
          <h2 {...stylex.props(docsStyles.h2)} id="astro">
            Astro
          </h2>
          <p {...stylex.props(docsStyles.p)}>
            Astro uses its React integration and Vite config. Existing React
            projects need only the StyleX Vite plugin below. Import shared CSS
            from one Astro layout. Add client:load only when a component needs
            browser interaction.
          </p>
          <CopyableCode
            code={astroDependencies}
            title="Install Astro React integration"
          />
          <CopyableCode code={viteDependencies} title="Install Vite plugin" />
          <CopyableCode code={astroConfig} title="astro.config.mjs" />
          <CopyableCode code={astroLayout} title="src/layouts/Layout.astro" />
          <h2 {...stylex.props(docsStyles.h2)} id="check">
            Check setup
          </h2>
          <ul {...stylex.props(docsStyles.ul)}>
            <li {...stylex.props(docsStyles.li)}>
              Copy Button and every required file listed on its page.
            </li>
            <li {...stylex.props(docsStyles.li)}>
              Import Button from @/components/ui/button and render it.
            </li>
            <li {...stylex.props(docsStyles.li)}>
              Check padding, radius, hover state, and keyboard focus ring.
            </li>
            <li {...stylex.props(docsStyles.li)}>
              Run a production build. Development output does not prove CSS
              extraction works.
            </li>
          </ul>
          <p {...stylex.props(docsStyles.p)}>
            Static light mode needs no provider. Add switching only if needed.
            The{" "}
            <Link {...stylex.props(docsStyles.link)} to="/docs/theming">
              theming guide
            </Link>{" "}
            covers dark mode, system mode, custom themes, and CSP nonces.
          </p>
        </DocsBody>
      </DocsPage>
    </DocumentationLayout>
  )
}
