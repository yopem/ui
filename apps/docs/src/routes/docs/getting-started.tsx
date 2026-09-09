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

export const Route = createFileRoute("/docs/getting-started")({
  head: () => ({
    meta: [
      { title: "Getting started · Yopem UI" },
      {
        name: "description",
        content:
          "Learn how to copy, compose, and customize Yopem UI components in a React and StyleX application.",
      },
    ],
  }),
  component: GettingStarted,
})

function GettingStarted() {
  return (
    <DocumentationLayout>
      <DocsPage
        toc={[
          { title: "Before you begin", url: "#before-you-begin", depth: 2 },
          {
            title: "Add your first component",
            url: "#first-component",
            depth: 2,
          },
          { title: "Customize safely", url: "#customize", depth: 2 },
        ]}
      >
        <DocsTitle>Getting started</DocsTitle>
        <DocsDescription>
          Yopem UI components live in your application. You copy the source
          files, install their dependencies, and import them like any other
          local React component.
        </DocsDescription>
        <DocsBody>
          <h2 {...stylex.props(docsStyles.h2)} id="before-you-begin">
            Before you begin
          </h2>
          <p {...stylex.props(docsStyles.p)}>
            Use a React application with TypeScript and a build tool that
            compiles StyleX. These docs use React 19 and Vite. TanStack Start
            uses the same Vite integration. Component pages list the supported
            React versions and any additional peer dependencies.
          </p>
          <p {...stylex.props(docsStyles.p)}>
            StyleX needs a build-time transform. Adding the runtime package
            alone will not generate your styles. Follow{" "}
            <Link {...stylex.props(docsStyles.link)} to="/docs/installation">
              Installation
            </Link>{" "}
            before copying a component.
          </p>
          <h2 {...stylex.props(docsStyles.h2)} id="first-component">
            Add your first component
          </h2>
          <ol {...stylex.props(docsStyles.ol)}>
            <li {...stylex.props(docsStyles.li)}>
              Copy the shared files and configure the source alias in the
              installation guide.
            </li>
            <li {...stylex.props(docsStyles.li)}>
              Open{" "}
              <Link
                {...stylex.props(docsStyles.link)}
                to="/components/$name"
                params={{ name: "button" }}
              >
                Button
              </Link>
              . Add its listed dependencies to your package manifest.
            </li>
            <li {...stylex.props(docsStyles.li)}>
              Expand each required file and copy its complete content to the
              displayed path. Skip unchanged shared files you already copied.
            </li>
            <li {...stylex.props(docsStyles.li)}>
              Import the component from your source folder.
            </li>
          </ol>
          <CopyableCode
            title="src/components/save-button.tsx"
            code={
              'import { Button } from "@registry/components/ui/button"\n\nexport function SaveButton() {\n  return <Button onClick={() => console.log("Saved")}>Save changes</Button>\n}'
            }
          />
          <p {...stylex.props(docsStyles.p)}>
            Examples often compose several components. Copy the referenced
            components too. The required files section includes transitive
            component dependencies, so you do not have to guess which internal
            files are missing.
          </p>
          <h2 {...stylex.props(docsStyles.h2)} id="customize">
            Customize safely
          </h2>
          <p {...stylex.props(docsStyles.p)}>
            Customize semantic tokens with StyleX createTheme, or edit the
            native defaults in tokens.stylex.ts. No CSS palette needs to stay in
            sync. See the{" "}
            <Link {...stylex.props(docsStyles.link)} to="/docs/theming">
              theming guide
            </Link>{" "}
            for global and scoped themes, app tokens, and light/dark switching.
          </p>
          <p {...stylex.props(docsStyles.p)}>
            Pass compiled styles through xstyle for component-specific
            overrides. It applies after defaults and variants. Edit the copied
            source when changing behavior; preserve Base UI props, keyboard
            handling, focus indicators, and accessible names. Icon-only controls
            still need an aria-label.
          </p>
          <CopyableCode
            title="src/components/save-button.tsx"
            code={`import * as stylex from "@stylexjs/stylex"
import { Button } from "@registry/components/ui/button"

const styles = stylex.create({ button: { borderRadius: "999px" } })

export function SaveButton() {
  return <Button xstyle={styles.button}>Save changes</Button>
}`}
          />
          <p {...stylex.props(docsStyles.p)}>
            Source files use{" "}
            <code {...stylex.props(docsStyles.inlineCode)}>@registry/*</code>{" "}
            for internal imports. This is a local alias, not a registry service.
            You can rename it, but update every import and the StyleX build
            configuration together.
          </p>
          <p {...stylex.props(docsStyles.p)}>
            Static themes need no provider or script. If you add mode switching
            with SSR, use the optional early ThemeScript and ThemeProvider from
            the theming guide to apply the saved preference before hydration.
          </p>
        </DocsBody>
      </DocsPage>
    </DocumentationLayout>
  )
}
