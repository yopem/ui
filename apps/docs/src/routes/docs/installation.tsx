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

export const Route = createFileRoute("/docs/installation")({
  loader: () => getDocumentation({ data: "base" }),
  head: () => ({
    meta: [
      { title: "Installation · Yopem UI" },
      {
        name: "description",
        content:
          "Set up StyleX, shared styles, local source aliases, and optional theme switching. Copy components without a CLI.",
      },
    ],
  }),
  component: Installation,
})

const manifest = `{
  "dependencies": {
    "@stylexjs/stylex": "^0.19.0",
    "clsx": "^2.1.1"
  },
  "devDependencies": {
    "@stylexjs/unplugin": "^0.19.0",
    "unplugin": "^2.3.11"
  }
}`

const viteConfig = `import stylex from "@stylexjs/unplugin"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { fileURLToPath } from "node:url"

const source = fileURLToPath(new URL("./src/yopem", import.meta.url))

export default defineConfig({
  resolve: { alias: { "@registry": source } },
  build: { cssCodeSplit: false },
  plugins: [
    stylex.vite({
      aliases: { "@registry/*": [source + "/*"] },
      runtimeInjection: false,
      useCSSLayers: true,
      treeshakeCompensation: true,
      unstable_moduleResolution: { type: "commonJS" },
    }),
    react(),
  ],
})`

const client = `import "@registry/styles/styles.css"
import * as stylex from "@stylexjs/stylex"
import { createRoot } from "react-dom/client"
import { lightTheme, rootStyles, themeMarker } from "@registry/styles/tokens.stylex"
import { App } from "./app"

const root = stylex.props(themeMarker, lightTheme, rootStyles.html)
document.documentElement.classList.add(...(root.className ?? "").split(" ").filter(Boolean))
document.documentElement.dataset.theme = "light"

createRoot(document.getElementById("root")!).render(<App />)`

const ssr = `import "@registry/styles/styles.css"
import * as stylex from "@stylexjs/stylex"
import { createRootRoute, HeadContent, Scripts } from "@tanstack/react-router"
import { lightTheme, rootStyles, themeMarker } from "@registry/styles/tokens.stylex"

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

const nextBabel = `const path = require("node:path")

module.exports = {
  presets: ["next/babel"],
  plugins: [["@stylexjs/babel-plugin", {
    aliases: { "@registry/*": [path.join(__dirname, "src/yopem/*")] },
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

const nextLayout = `import "@registry/styles/styles.css"
import * as stylex from "@stylexjs/stylex"
import { lightTheme, rootStyles, themeMarker } from "@registry/styles/tokens.stylex"

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html {...stylex.props(themeMarker, lightTheme, rootStyles.html)} data-theme="light" lang="en">
      <body {...stylex.props(rootStyles.body)}>{children}</body>
    </html>
  )
}`

const toc = [
  { title: "Dependencies", url: "#dependencies", depth: 2 },
  { title: "Configure StyleX", url: "#configure-stylex", depth: 2 },
  { title: "Copy shared files", url: "#shared-files", depth: 2 },
  { title: "Load styles and theme", url: "#theme", depth: 2 },
  { title: "Next.js", url: "#nextjs", depth: 2 },
  { title: "Check the setup", url: "#check", depth: 2 },
]

function Installation() {
  const data = Route.useLoaderData()
  return (
    <DocumentationLayout>
      <DocsPage toc={toc}>
        <DocsTitle>Installation</DocsTitle>
        <DocsDescription>
          Set up shared styles once. Then copy components into your project as
          you need them.
        </DocsDescription>
        <DocsBody>
          <h2 {...stylex.props(docsStyles.h2)} id="dependencies">
            Dependencies
          </h2>
          <p {...stylex.props(docsStyles.p)}>
            Start with a React and TypeScript application. The examples use
            React 19. Merge these packages into your package manifest, keeping
            compatible versions already installed, then run your package
            manager. Each component page lists any additional packages it needs.
          </p>
          <p {...stylex.props(docsStyles.p)}>
            The development dependencies below are for Vite and TanStack Start.
            Next.js uses the Babel and PostCSS packages described later on this
            page.
          </p>
          <CopyableCode
            code={manifest}
            title="package.json, merge these fields"
          />
          <h2 {...stylex.props(docsStyles.h2)} id="configure-stylex">
            Configure StyleX
          </h2>
          <p {...stylex.props(docsStyles.p)}>
            StyleX must compile your source. TypeScript aliases alone do not
            compile styles or resolve imports in the browser. Add the same alias
            to TypeScript, your bundler, and the StyleX transform.
          </p>
          <CopyableCode
            code={
              '{\n  "compilerOptions": {\n    "paths": { "@registry/*": ["./src/yopem/*"] }\n  }\n}'
            }
            title="tsconfig.json, merge compiler options"
          />
          <h3 {...stylex.props(docsStyles.h3)}>Vite and TanStack Start</h3>
          <p {...stylex.props(docsStyles.p)}>
            In a Vite React app, merge this configuration with your existing
            plugins. In TanStack Start, put StyleX before the Start and React
            plugins. Keep your deployment plugins and other framework settings.
          </p>
          <CopyableCode code={viteConfig} title="vite.config.ts" />
          <p {...stylex.props(docsStyles.p)}>
            The shared source lives in{" "}
            <code {...stylex.props(docsStyles.inlineCode)}>src/yopem</code> even
            if your application routes live at the project root. Keep{" "}
            <code {...stylex.props(docsStyles.inlineCode)}>.stylex.ts</code>{" "}
            filenames intact. If you choose another folder, update all three
            aliases together.
          </p>
          <h2 {...stylex.props(docsStyles.h2)} id="shared-files">
            Copy shared files
          </h2>
          <p {...stylex.props(docsStyles.p)}>
            Create each file below with its complete contents. Copy these shared
            files once, not once per component. Base contains three files:
            tokens.stylex.ts, lib/stylex.ts, and styles.css. Colors, font
            stacks, radii, themes, and root styles live in StyleX. CSS contains
            only reset, reduced-motion rules, and unavoidable Base UI viewport
            selectors. No theme runtime or font package is required.
          </p>
          <div {...stylex.props(docsStyles.section)}>
            {data.files.map((file) => (
              <details {...stylex.props(docsStyles.details)} key={file.path}>
                <summary {...stylex.props(docsStyles.summary)}>
                  <code {...stylex.props(docsStyles.inlineCode)}>
                    {file.target}
                  </code>
                </summary>
                <CopyableCode code={file.content} title={file.target} />
              </details>
            ))}
          </div>
          <h2 {...stylex.props(docsStyles.h2)} id="theme">
            Load styles and theme
          </h2>
          <p {...stylex.props(docsStyles.p)}>
            Import the shared CSS once from your application entry point. Use
            the compiled root classes so tokens and marker-based selectors work.
            These examples use static light mode. Static dark mode also needs a
            compiled colorScheme: "dark" override after rootStyles.html; see the
            complete example in Theming. Neither static mode needs a provider or
            script. The client example preserves existing document classes.
          </p>
          <CopyableCode
            code={client}
            title="src/main.tsx, client-rendered Vite application"
          />
          <h3 {...stylex.props(docsStyles.h3)}>
            TanStack Start and server rendering
          </h3>
          <p {...stylex.props(docsStyles.p)}>
            Import the shared stylesheet once in your root route. TanStack Start
            includes the bundled CSS through HeadContent. Keep cssCodeSplit:
            false in the Vite build configuration to avoid SSR CSS asset hash
            mismatches. Use the side-effect CSS import shown here, not a ?url
            import. Keep existing head metadata and use this document shell,
            preserving any providers and scripts your app already needs. Do not
            run the client-only document setup above on the server.
          </p>
          <CopyableCode
            code={ssr}
            title="src/routes/__root.tsx, merge with your root route"
          />
          <p {...stylex.props(docsStyles.p)}>
            If your root already has a{" "}
            <code {...stylex.props(docsStyles.inlineCode)}>className</code>,
            compose your StyleX root styles last in{" "}
            <code {...stylex.props(docsStyles.inlineCode)}>stylex.props</code>.
            Preserve unrelated application classes separately. Mode switching is
            optional and adds only theme/theme.tsx and theme/theme-provider.tsx.
            The{" "}
            <Link {...stylex.props(docsStyles.link)} to="/docs/theming">
              theming guide
            </Link>{" "}
            includes those copyable runtime files, native custom themes,
            component overrides, theme controls, and CSP nonces.
          </p>
          <h2 {...stylex.props(docsStyles.h2)} id="nextjs">
            Next.js
          </h2>
          <p {...stylex.props(docsStyles.p)}>
            For a Next.js App Router app, use Babel to transform StyleX calls
            and PostCSS to collect their CSS. This recipe targets webpack, not
            Turbopack. Use{" "}
            <code {...stylex.props(docsStyles.inlineCode)}>
              next dev --webpack
            </code>{" "}
            and{" "}
            <code {...stylex.props(docsStyles.inlineCode)}>
              next build --webpack
            </code>{" "}
            on Next versions that support these flags. Do not add the Vite
            plugin to Next.
          </p>
          <CopyableCode
            title="package.json, Next.js development dependencies"
            code={
              '{\n  "devDependencies": {\n    "@stylexjs/babel-plugin": "^0.19.0",\n    "@stylexjs/postcss-plugin": "^0.19.0",\n    "autoprefixer": "^10.4.0"\n  }\n}'
            }
          />
          <p {...stylex.props(docsStyles.p)}>
            Keep the shared files and TypeScript alias above. Merge these
            configurations if Babel or PostCSS is already configured. The{" "}
            <code {...stylex.props(docsStyles.inlineCode)}>.cjs</code> extension
            also works in projects with{" "}
            <code {...stylex.props(docsStyles.inlineCode)}>
              "type": "module"
            </code>
            .
          </p>
          <CopyableCode code={nextBabel} title="babel.config.cjs" />
          <CopyableCode code={nextPostcss} title="postcss.config.cjs" />
          <p {...stylex.props(docsStyles.p)}>
            Extend the extraction globs if you keep StyleX source outside these
            directories. Babel and PostCSS must use the same aliases. Append
            this directive to the end of the copied{" "}
            <code {...stylex.props(docsStyles.inlineCode)}>
              src/yopem/styles/styles.css
            </code>
            , after its existing contents:
          </p>
          <CopyableCode
            code="@stylex;"
            title="src/yopem/styles/styles.css, append for Next.js only"
          />
          <p {...stylex.props(docsStyles.p)}>
            Import the shared stylesheet in your root layout. Keep the layout as
            a Server Component. Static themes need no client boundary.
          </p>
          <CopyableCode code={nextLayout} title="src/app/layout.tsx" />
          <p {...stylex.props(docsStyles.p)}>
            With the Pages Router, import global CSS in{" "}
            <code {...stylex.props(docsStyles.inlineCode)}>pages/_app.tsx</code>
            . Apply root theme classes to{" "}
            <code {...stylex.props(docsStyles.inlineCode)}>Html</code> in{" "}
            <code {...stylex.props(docsStyles.inlineCode)}>
              pages/_document.tsx
            </code>
            .
          </p>
          <h2 {...stylex.props(docsStyles.h2)} id="check">
            Check the setup
          </h2>
          <ul {...stylex.props(docsStyles.ul)}>
            <li {...stylex.props(docsStyles.li)}>
              Copy Button and every file listed on its page. Render the usage
              example and check padding, border radius, and the keyboard focus
              ring.
            </li>
            <li {...stylex.props(docsStyles.li)}>
              If styles are missing, check both the compiler configuration and
              the global CSS import. Next.js also needs the extraction
              directive.
            </li>
            <li {...stylex.props(docsStyles.li)}>
              If imports fail, check that all aliases point to{" "}
              <code {...stylex.props(docsStyles.inlineCode)}>src/yopem</code>{" "}
              and every required file exists.
            </li>
            <li {...stylex.props(docsStyles.li)}>
              Test your chosen static mode, or light, dark, and system if you
              add switching. For SSR, reload in each enabled mode and check for
              hydration warnings.
            </li>
            <li {...stylex.props(docsStyles.li)}>
              Run a production build. Development styling alone does not confirm
              that CSS extraction works.
            </li>
          </ul>
          <p {...stylex.props(docsStyles.p)}>
            Yopem components do not need Fumadocs or Tailwind. For other
            bundlers, use the{" "}
            <a
              {...stylex.props(docsStyles.link)}
              href="https://stylexjs.com/docs/learn/installation/"
              target="_blank"
              rel="noreferrer"
            >
              official StyleX integration guide
            </a>{" "}
            with the same source alias and shared files.
          </p>
        </DocsBody>
      </DocsPage>
    </DocumentationLayout>
  )
}
