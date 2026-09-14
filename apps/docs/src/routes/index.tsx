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

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Yopem UI · React components with StyleX" },
      {
        name: "description",
        content:
          "Accessible React components styled with StyleX. Browse examples, copy complete source, and make it your own.",
      },
    ],
  }),
  component: Introduction,
})

function Introduction() {
  return (
    <DocumentationLayout>
      <DocsPage
        toc={[
          { title: "Own the component", url: "#own-the-component", depth: 2 },
          { title: "How it works", url: "#how-it-works", depth: 2 },
        ]}
      >
        <DocsTitle>
          React components.
          <br />
          Your source. Your styles.
        </DocsTitle>
        <DocsDescription>
          Yopem UI is a collection of accessible React components built with
          Base UI and StyleX. Copy the files into your project and edit them
          there.
        </DocsDescription>
        <DocsBody>
          <div {...stylex.props(docsStyles.links)}>
            <Link {...stylex.props(docsStyles.link)} to="/docs/getting-started">
              Get started
            </Link>
            <Link {...stylex.props(docsStyles.link)} to="/components">
              Browse components
            </Link>
          </div>
          <h2 {...stylex.props(docsStyles.h2)} id="own-the-component">
            Own the component
          </h2>
          <p {...stylex.props(docsStyles.p)}>
            There is no Yopem runtime package to install. Each component page
            includes its full TypeScript source, dependency list, working
            examples, and API reference. Take the components you need and leave
            the rest.
          </p>
          <CopyableCode
            title="Your first button"
            code={
              'import { Button } from "@/components/ui/button"\n\nexport function SaveButton() {\n  return <Button variant="outline">Save changes</Button>\n}'
            }
          />
          <h2 {...stylex.props(docsStyles.h2)} id="how-it-works">
            How it works
          </h2>
          <ol {...stylex.props(docsStyles.ol)}>
            <li {...stylex.props(docsStyles.li)}>
              Set up React, StyleX compilation, and the shared theme files.
            </li>
            <li {...stylex.props(docsStyles.li)}>
              Choose a component. Copy every required file to the listed
              destination.
            </li>
            <li {...stylex.props(docsStyles.li)}>
              Use the examples and API reference to compose it in your
              application.
            </li>
          </ol>
          <p {...stylex.props(docsStyles.p)}>
            Base UI handles focus, keyboard interaction, and accessible behavior
            where used. StyleX compiles local style declarations to CSS.
            Semantic tokens keep colors, spacing, and themes consistent.
          </p>
          <p {...stylex.props(docsStyles.p)}>
            Components remain editable source. Keep accessible labels, focus
            behavior, and keyboard interactions when making changes.
          </p>
        </DocsBody>
      </DocsPage>
    </DocumentationLayout>
  )
}
