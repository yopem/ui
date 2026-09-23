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
import { Box } from "@/components/ui/box"
import { Grid } from "@/components/ui/grid"
import { Heading } from "@/components/ui/heading"
import { Paragraph } from "@/components/ui/paragraph"
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
          <Heading as="h2" {...stylex.props(docsStyles.h2)} id="what-you-need">
            What you need
          </Heading>
          <Box as="ul" {...stylex.props(docsStyles.ul)}>
            <Box as="li" {...stylex.props(docsStyles.li)}>
              A React application using TypeScript.
            </Box>
            <Box as="li" {...stylex.props(docsStyles.li)}>
              React Router with Vite, TanStack Start, Next.js, or Astro.
            </Box>
            <Box as="li" {...stylex.props(docsStyles.li)}>
              Permission to add packages and files to the project.
            </Box>
          </Box>
          <Paragraph {...stylex.props(docsStyles.p)}>
            Yopem has no runtime package. Initialize StyleX once with the CLI or
            manual setup, then add component source with the CLI or copy it
            manually.
          </Paragraph>

          <Heading as="h2" {...stylex.props(docsStyles.h2)} id="setup">
            1. Set up StyleX
          </Heading>
          <Paragraph {...stylex.props(docsStyles.p)}>
            Open the{" "}
            <Link {...stylex.props(docsStyles.link)} to="/docs/installation">
              installation guide
            </Link>
            . Run bunx @yopem-ui/cli init for supported frameworks, or follow
            the manual instructions there. Init installs shared packages, source
            alias, tokens, global styles, and build configuration.
          </Paragraph>
          <Paragraph {...stylex.props(docsStyles.p)}>
            Continue only after your app completes a production build. StyleX is
            a build-time compiler, so installing its runtime package alone is
            not enough.
          </Paragraph>

          <Heading as="h2" {...stylex.props(docsStyles.h2)} id="copy-button">
            2. Copy Button
          </Heading>
          <Paragraph {...stylex.props(docsStyles.p)}>
            Open the{" "}
            <Link
              {...stylex.props(docsStyles.link)}
              to="/components/$name"
              params={{ name: "button" }}
            >
              Button documentation
            </Link>
            . Use the CLI tab to install Button and shared files, or use the
            Manual tab:
          </Paragraph>
          <Box as="ol" {...stylex.props(docsStyles.ol)}>
            <Box as="li" {...stylex.props(docsStyles.li)}>
              Run the dependency command.
            </Box>
            <Box as="li" {...stylex.props(docsStyles.li)}>
              Expand each required file.
            </Box>
            <Box as="li" {...stylex.props(docsStyles.li)}>
              Copy its complete source to the displayed path.
            </Box>
          </Box>
          <Paragraph {...stylex.props(docsStyles.p)}>
            Shared files appear again so each component page is complete. Skip
            any shared file already present and unchanged in your project.
          </Paragraph>

          <Heading as="h2" {...stylex.props(docsStyles.h2)} id="use-button">
            3. Use Button
          </Heading>
          <Paragraph {...stylex.props(docsStyles.p)}>
            Import Button from the local file you copied. The standard setup
            maps{" "}
            <Box as="code" {...stylex.props(docsStyles.inlineCode)}>
              @/*
            </Box>{" "}
            to{" "}
            <Box as="code" {...stylex.props(docsStyles.inlineCode)}>
              src/*
            </Box>
            .
          </Paragraph>
          <CopyableCode
            title="src/components/save-button.tsx"
            code={
              'import { Button } from "@/components/ui/button"\n\nexport function SaveButton() {\n  return <Button variant="outline">Save changes</Button>\n}'
            }
          />
          <Paragraph {...stylex.props(docsStyles.p)}>
            Render SaveButton. Setup is working when it has padding, a border, a
            hover state, and a visible keyboard focus ring.
          </Paragraph>

          <Heading as="h2" {...stylex.props(docsStyles.h2)} id="customize">
            4. Customize it
          </Heading>
          <Paragraph {...stylex.props(docsStyles.p)}>
            Use variants for supported visual choices. Use xstyle for a local
            override, tokens for app-wide design changes, or edit the copied
            source when behavior should change.
          </Paragraph>
          <CopyableCode
            title="src/components/save-button.tsx"
            code={`import * as stylex from "@stylexjs/stylex"
import { Button } from "@/components/ui/button"

const styles = stylex.create({ button: { borderRadius: "999px" } })

export function SaveButton() {
  return <Button xstyle={styles.button}>Save changes</Button>
}`}
          />
          <Paragraph {...stylex.props(docsStyles.p)}>
            Preserve accessible names, keyboard behavior, disabled states, and
            focus indicators when editing component source.
          </Paragraph>

          <Heading as="h2" {...stylex.props(docsStyles.h2)} id="next-steps">
            Next steps
          </Heading>
          <Grid {...stylex.props(docsStyles.grid)}>
            <Link {...stylex.props(docsStyles.card)} to="/components">
              <Box as="strong" {...stylex.props(docsStyles.strong)}>
                Add another component
              </Box>
              <Paragraph {...stylex.props(docsStyles.p, docsStyles.muted)}>
                Browse live examples and copy only what your app needs.
              </Paragraph>
            </Link>
            <Link {...stylex.props(docsStyles.card)} to="/docs/theming">
              <Box as="strong" {...stylex.props(docsStyles.strong)}>
                Customize your theme
              </Box>
              <Paragraph {...stylex.props(docsStyles.p, docsStyles.muted)}>
                Change colors, fonts, radii, dark mode, or scoped themes.
              </Paragraph>
            </Link>
          </Grid>
        </DocsBody>
      </DocsPage>
    </DocumentationLayout>
  )
}
