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
import { Box } from "@/components/ui/stylex/box"
import { Flex } from "@/components/ui/stylex/flex"
import { Grid } from "@/components/ui/stylex/grid"
import { Heading } from "@/components/ui/stylex/heading"
import { Paragraph } from "@/components/ui/stylex/paragraph"
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
          <Flex {...stylex.props(docsStyles.links)}>
            <Link {...stylex.props(docsStyles.link)} to="/docs/getting-started">
              Build your first component
            </Link>
            <Link {...stylex.props(docsStyles.link)} to="/components">
              Browse components
            </Link>
          </Flex>

          <Heading as="h2" {...stylex.props(docsStyles.h2)} id="what-is-yopem">
            What is Yopem UI?
          </Heading>
          <Paragraph {...stylex.props(docsStyles.p)}>
            Yopem is a component registry, not a component library dependency.
            Each component page contains a live example, install dependencies,
            complete TypeScript source, usage notes, and generated API details.
          </Paragraph>
          <Grid {...stylex.props(docsStyles.grid)}>
            <Box {...stylex.props(docsStyles.card)}>
              <Box as="strong" {...stylex.props(docsStyles.strong)}>
                React 19
              </Box>
              <Paragraph {...stylex.props(docsStyles.p, docsStyles.muted)}>
                Typed components that stay inside your project.
              </Paragraph>
            </Box>
            <Box {...stylex.props(docsStyles.card)}>
              <Box as="strong" {...stylex.props(docsStyles.strong)}>
                Base UI
              </Box>
              <Paragraph {...stylex.props(docsStyles.p, docsStyles.muted)}>
                Keyboard and screen-reader behavior from accessible primitives.
              </Paragraph>
            </Box>
            <Box {...stylex.props(docsStyles.card)}>
              <Box as="strong" {...stylex.props(docsStyles.strong)}>
                StyleX
              </Box>
              <Paragraph {...stylex.props(docsStyles.p, docsStyles.muted)}>
                Colocated, typed styles compiled to atomic CSS.
              </Paragraph>
            </Box>
          </Grid>

          <Heading
            as="h2"
            {...stylex.props(docsStyles.h2)}
            id="why-source-owned"
          >
            Why source-owned?
          </Heading>
          <Box as="ul" {...stylex.props(docsStyles.ul)}>
            <Box as="li" {...stylex.props(docsStyles.li)}>
              <Box as="strong" {...stylex.props(docsStyles.strong)}>
                Change anything.
              </Box>{" "}
              Edit markup, behavior, variants, and styles in the same file.
            </Box>
            <Box as="li" {...stylex.props(docsStyles.li)}>
              <Box as="strong" {...stylex.props(docsStyles.strong)}>
                Ship less.
              </Box>{" "}
              Copy the components you use instead of installing a full kit.
            </Box>
            <Box as="li" {...stylex.props(docsStyles.li)}>
              <Box as="strong" {...stylex.props(docsStyles.strong)}>
                Keep control.
              </Box>{" "}
              Updates never change your app until you choose to copy them.
            </Box>
          </Box>

          <Heading as="h2" {...stylex.props(docsStyles.h2)} id="how-it-works">
            How it works
          </Heading>
          <Box as="ol" {...stylex.props(docsStyles.ol)}>
            <Box as="li" {...stylex.props(docsStyles.li)}>
              Configure the StyleX build transform and copy shared theme files
              once.
            </Box>
            <Box as="li" {...stylex.props(docsStyles.li)}>
              Choose a component and install the dependencies shown on its page.
            </Box>
            <Box as="li" {...stylex.props(docsStyles.li)}>
              Copy each required file to its displayed path under your source
              directory.
            </Box>
            <Box as="li" {...stylex.props(docsStyles.li)}>
              Import the local component and customize its source or xstyle
              prop.
            </Box>
          </Box>
          <CopyableCode
            title="Use your local component"
            code={
              'import { Button } from "@/components/ui/button"\n\nexport function SaveButton() {\n  return <Button variant="outline">Save changes</Button>\n}'
            }
          />

          <Heading as="h2" {...stylex.props(docsStyles.h2)} id="where-to-start">
            Where to start
          </Heading>
          <Grid {...stylex.props(docsStyles.grid)}>
            <Link {...stylex.props(docsStyles.card)} to="/docs/getting-started">
              <Box as="strong" {...stylex.props(docsStyles.strong)}>
                Introduction
              </Box>
              <Paragraph {...stylex.props(docsStyles.p, docsStyles.muted)}>
                Learn the workflow by adding one Button from start to finish.
              </Paragraph>
            </Link>
            <Link {...stylex.props(docsStyles.card)} to="/docs/installation">
              <Box as="strong" {...stylex.props(docsStyles.strong)}>
                Ready to configure
              </Box>
              <Paragraph {...stylex.props(docsStyles.p, docsStyles.muted)}>
                Pick React Router, TanStack Start, Next.js, or Astro.
              </Paragraph>
            </Link>
            <Link {...stylex.props(docsStyles.card)} to="/docs/theming">
              <Box as="strong" {...stylex.props(docsStyles.strong)}>
                Styling your app
              </Box>
              <Paragraph {...stylex.props(docsStyles.p, docsStyles.muted)}>
                Change tokens, create themes, or override one component.
              </Paragraph>
            </Link>
          </Grid>
        </DocsBody>
      </DocsPage>
    </DocumentationLayout>
  )
}
