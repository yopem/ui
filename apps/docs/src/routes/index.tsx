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

const description =
  "Accessible React components styled with StyleX. Copy complete source into your project, then customize it without package lock-in."

export const Route = createFileRoute("/")({
  head: () =>
    createSeo({
      description,
      path: "/",
      title: "Yopem UI · StyleX React UI Library",
    }),
  component: Introduction,
})

function Introduction() {
  return (
    <DocumentationLayout>
      <DocsPage
        toc={[
          { title: "What is Yopem UI?", url: "#what-is-yopem", depth: 2 },
          { title: "Why source-owned?", url: "#why-source-owned", depth: 2 },
          { title: "How it works", url: "#how-it-works", depth: 2 },
          { title: "Where to start", url: "#where-to-start", depth: 2 },
        ]}
      >
        <DocsTitle>React components you copy, own, and change.</DocsTitle>
        <DocsDescription>
          Yopem UI gives you accessible React component source built with Base
          UI and StyleX. Copy only what you need into your application. There is
          no Yopem package between you and your UI.
        </DocsDescription>
        <DocsBody>
          <div {...stylex.props(docsStyles.links)}>
            <Link {...stylex.props(docsStyles.link)} to="/docs/getting-started">
              Build your first component
            </Link>
            <Link {...stylex.props(docsStyles.link)} to="/components">
              Browse components
            </Link>
          </div>

          <h2 {...stylex.props(docsStyles.h2)} id="what-is-yopem">
            What is Yopem UI?
          </h2>
          <p {...stylex.props(docsStyles.p)}>
            Yopem is a component registry, not a component library dependency.
            Each component page contains a live example, install dependencies,
            complete TypeScript source, usage notes, and generated API details.
          </p>
          <div {...stylex.props(docsStyles.grid)}>
            <div {...stylex.props(docsStyles.card)}>
              <strong {...stylex.props(docsStyles.strong)}>React 19</strong>
              <p {...stylex.props(docsStyles.p, docsStyles.muted)}>
                Typed components that stay inside your project.
              </p>
            </div>
            <div {...stylex.props(docsStyles.card)}>
              <strong {...stylex.props(docsStyles.strong)}>Base UI</strong>
              <p {...stylex.props(docsStyles.p, docsStyles.muted)}>
                Keyboard and screen-reader behavior from accessible primitives.
              </p>
            </div>
            <div {...stylex.props(docsStyles.card)}>
              <strong {...stylex.props(docsStyles.strong)}>StyleX</strong>
              <p {...stylex.props(docsStyles.p, docsStyles.muted)}>
                Colocated, typed styles compiled to atomic CSS.
              </p>
            </div>
          </div>

          <h2 {...stylex.props(docsStyles.h2)} id="why-source-owned">
            Why source-owned?
          </h2>
          <ul {...stylex.props(docsStyles.ul)}>
            <li {...stylex.props(docsStyles.li)}>
              <strong {...stylex.props(docsStyles.strong)}>
                Change anything.
              </strong>{" "}
              Edit markup, behavior, variants, and styles in the same file.
            </li>
            <li {...stylex.props(docsStyles.li)}>
              <strong {...stylex.props(docsStyles.strong)}>Ship less.</strong>{" "}
              Copy the components you use instead of installing a full kit.
            </li>
            <li {...stylex.props(docsStyles.li)}>
              <strong {...stylex.props(docsStyles.strong)}>
                Keep control.
              </strong>{" "}
              Updates never change your app until you choose to copy them.
            </li>
          </ul>

          <h2 {...stylex.props(docsStyles.h2)} id="how-it-works">
            How it works
          </h2>
          <ol {...stylex.props(docsStyles.ol)}>
            <li {...stylex.props(docsStyles.li)}>
              Configure the StyleX build transform and copy shared theme files
              once.
            </li>
            <li {...stylex.props(docsStyles.li)}>
              Choose a component and install the dependencies shown on its page.
            </li>
            <li {...stylex.props(docsStyles.li)}>
              Copy each required file to its displayed path under your source
              directory.
            </li>
            <li {...stylex.props(docsStyles.li)}>
              Import the local component and customize its source or xstyle
              prop.
            </li>
          </ol>
          <CopyableCode
            title="Use your local component"
            code={
              'import { Button } from "@/components/ui/button"\n\nexport function SaveButton() {\n  return <Button variant="outline">Save changes</Button>\n}'
            }
          />

          <h2 {...stylex.props(docsStyles.h2)} id="where-to-start">
            Where to start
          </h2>
          <div {...stylex.props(docsStyles.grid)}>
            <Link {...stylex.props(docsStyles.card)} to="/docs/getting-started">
              <strong {...stylex.props(docsStyles.strong)}>Introduction</strong>
              <p {...stylex.props(docsStyles.p, docsStyles.muted)}>
                Learn the workflow by adding one Button from start to finish.
              </p>
            </Link>
            <Link {...stylex.props(docsStyles.card)} to="/docs/installation">
              <strong {...stylex.props(docsStyles.strong)}>
                Ready to configure
              </strong>
              <p {...stylex.props(docsStyles.p, docsStyles.muted)}>
                Pick React Router, TanStack Start, Next.js, or Astro.
              </p>
            </Link>
            <Link {...stylex.props(docsStyles.card)} to="/docs/theming">
              <strong {...stylex.props(docsStyles.strong)}>
                Styling your app
              </strong>
              <p {...stylex.props(docsStyles.p, docsStyles.muted)}>
                Change tokens, create themes, or override one component.
              </p>
            </Link>
          </div>
        </DocsBody>
      </DocsPage>
    </DocumentationLayout>
  )
}
