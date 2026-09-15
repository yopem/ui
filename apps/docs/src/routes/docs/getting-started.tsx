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
import { createSeo } from "@/lib/seo"

export const Route = createFileRoute("/docs/getting-started")({
  head: () =>
    createSeo({
      description:
        "Add your first Yopem UI component to a React and StyleX application.",
      path: "/docs/getting-started",
      title: "Getting started · Yopem UI",
    }),
  component: GettingStarted,
})

function GettingStarted() {
  return (
    <DocumentationLayout>
      <DocsPage
        toc={[
          { title: "What you need", url: "#what-you-need", depth: 2 },
          { title: "1. Set up StyleX", url: "#setup", depth: 2 },
          { title: "2. Copy Button", url: "#copy-button", depth: 2 },
          { title: "3. Use Button", url: "#use-button", depth: 2 },
          { title: "4. Customize it", url: "#customize", depth: 2 },
          { title: "Next steps", url: "#next-steps", depth: 2 },
        ]}
      >
        <DocsTitle>Add your first component</DocsTitle>
        <DocsDescription>
          This guide takes one Button from Yopem into your app. When finished,
          it will render with Yopem styles and remain fully editable in your
          source directory.
        </DocsDescription>
        <DocsBody>
          <h2 {...stylex.props(docsStyles.h2)} id="what-you-need">
            What you need
          </h2>
          <ul {...stylex.props(docsStyles.ul)}>
            <li {...stylex.props(docsStyles.li)}>
              A React application using TypeScript.
            </li>
            <li {...stylex.props(docsStyles.li)}>
              React Router with Vite, TanStack Start, Next.js, or Astro.
            </li>
            <li {...stylex.props(docsStyles.li)}>
              Permission to add packages and files to the project.
            </li>
          </ul>
          <p {...stylex.props(docsStyles.p)}>
            Yopem has no runtime package. You configure StyleX once, then copy
            component source into your project.
          </p>

          <h2 {...stylex.props(docsStyles.h2)} id="setup">
            1. Set up StyleX
          </h2>
          <p {...stylex.props(docsStyles.p)}>
            Open the{" "}
            <Link {...stylex.props(docsStyles.link)} to="/docs/installation">
              installation guide
            </Link>
            , choose your framework, and complete its steps. Every setup also
            uses the shared packages, source alias, tokens, and global styles
            listed at the top of that guide.
          </p>
          <p {...stylex.props(docsStyles.p)}>
            Continue only after your app completes a production build. StyleX is
            a build-time compiler, so installing its runtime package alone is
            not enough.
          </p>

          <h2 {...stylex.props(docsStyles.h2)} id="copy-button">
            2. Copy Button
          </h2>
          <p {...stylex.props(docsStyles.p)}>
            Open the{" "}
            <Link
              {...stylex.props(docsStyles.link)}
              to="/components/$name"
              params={{ name: "button" }}
            >
              Button documentation
            </Link>
            . Under Installation:
          </p>
          <ol {...stylex.props(docsStyles.ol)}>
            <li {...stylex.props(docsStyles.li)}>
              Run the dependency command.
            </li>
            <li {...stylex.props(docsStyles.li)}>Expand each required file.</li>
            <li {...stylex.props(docsStyles.li)}>
              Copy its complete source to the displayed path.
            </li>
          </ol>
          <p {...stylex.props(docsStyles.p)}>
            Shared files appear again so each component page is complete. Skip
            any shared file already present and unchanged in your project.
          </p>

          <h2 {...stylex.props(docsStyles.h2)} id="use-button">
            3. Use Button
          </h2>
          <p {...stylex.props(docsStyles.p)}>
            Import Button from the local file you copied. The standard setup
            maps <code {...stylex.props(docsStyles.inlineCode)}>@/*</code> to{" "}
            <code {...stylex.props(docsStyles.inlineCode)}>src/*</code>.
          </p>
          <CopyableCode
            title="src/components/save-button.tsx"
            code={
              'import { Button } from "@/components/ui/button"\n\nexport function SaveButton() {\n  return <Button variant="outline">Save changes</Button>\n}'
            }
          />
          <p {...stylex.props(docsStyles.p)}>
            Render SaveButton. Setup is working when it has padding, a border, a
            hover state, and a visible keyboard focus ring.
          </p>

          <h2 {...stylex.props(docsStyles.h2)} id="customize">
            4. Customize it
          </h2>
          <p {...stylex.props(docsStyles.p)}>
            Use variants for supported visual choices. Use xstyle for a local
            override, tokens for app-wide design changes, or edit the copied
            source when behavior should change.
          </p>
          <CopyableCode
            title="src/components/save-button.tsx"
            code={`import * as stylex from "@stylexjs/stylex"
import { Button } from "@/components/ui/button"

const styles = stylex.create({ button: { borderRadius: "999px" } })

export function SaveButton() {
  return <Button xstyle={styles.button}>Save changes</Button>
}`}
          />
          <p {...stylex.props(docsStyles.p)}>
            Preserve accessible names, keyboard behavior, disabled states, and
            focus indicators when editing component source.
          </p>

          <h2 {...stylex.props(docsStyles.h2)} id="next-steps">
            Next steps
          </h2>
          <div {...stylex.props(docsStyles.grid)}>
            <Link {...stylex.props(docsStyles.card)} to="/components">
              <strong {...stylex.props(docsStyles.strong)}>
                Add another component
              </strong>
              <p {...stylex.props(docsStyles.p, docsStyles.muted)}>
                Browse live examples and copy only what your app needs.
              </p>
            </Link>
            <Link {...stylex.props(docsStyles.card)} to="/docs/theming">
              <strong {...stylex.props(docsStyles.strong)}>
                Customize your theme
              </strong>
              <p {...stylex.props(docsStyles.p, docsStyles.muted)}>
                Change colors, fonts, radii, dark mode, or scoped themes.
              </p>
            </Link>
          </div>
        </DocsBody>
      </DocsPage>
    </DocumentationLayout>
  )
}
