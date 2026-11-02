import { Box } from "@registry/components/ui/box"
import { Grid } from "@registry/components/ui/grid"
import { Heading } from "@registry/components/ui/heading"
import { Stack } from "@registry/components/ui/stack"
import { Text } from "@registry/components/ui/text"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"
import { Link, createFileRoute } from "@tanstack/react-router"

import { DocumentationLayout } from "@/catalog/docs-layout"
import { DocsDescription, DocsPage, DocsTitle } from "@/catalog/docs-page"
import { catalogStyles, docsStyles } from "@/catalog/docs-styles"
import { editorPartLabel } from "@/catalog/editor-parts"
import { editorPartGroups } from "@/catalog/navigation"
import { createSeo } from "@/lib/seo"

const styles = stylex.create({
  grid: {
    gap: `calc(${tokens["--spacing"]} * 3)`,
    gridTemplateColumns: {
      default: "minmax(0, 1fr)",
      "@media (min-width: 64rem)": "repeat(2, minmax(0, 1fr))",
      "@media (min-width: 80rem)": "repeat(3, minmax(0, 1fr))",
    },
  },
  title: { fontSize: "1.0625rem", overflowWrap: "anywhere" },
  description: { color: tokens["--muted-foreground"], fontSize: "0.875rem" },
})

export const Route = createFileRoute("/editor/")({
  head: () =>
    createSeo({
      title: "Editor · Yopem UI",
      description: "Compose Lexical editors from public React parts.",
      path: "/editor",
    }),
  component: EditorIndex,
})

export function EditorIndex() {
  return (
    <DocumentationLayout>
      <DocsPage full>
        <DocsTitle>Editor</DocsTitle>
        <DocsDescription>
          Compose a Lexical editor from separate controls and an editable
          surface. These pages cover shipped parts, not Plate plugin
          compatibility.
        </DocsDescription>
        <Stack>
          <Link {...stylex.props(docsStyles.link)} to="/docs/editor">
            Editor composition guide
          </Link>
          {editorPartGroups.map((group) => (
            <Box key={group.name} render={<section aria-label={group.name} />}>
              <Stack>
                <Heading>{group.name}</Heading>
                <Grid xstyle={styles.grid}>
                  {group.parts.map((part) => (
                    <Link
                      key={part.slug}
                      to="/editor/$slug"
                      params={{ slug: part.slug }}
                      preload="intent"
                      {...stylex.props(catalogStyles.card)}
                    >
                      <Heading
                        render={<h3>{editorPartLabel(part.name)}</h3>}
                        xstyle={styles.title}
                      />
                      <Text xstyle={styles.description}>
                        {part.description}
                      </Text>
                    </Link>
                  ))}
                </Grid>
              </Stack>
            </Box>
          ))}
        </Stack>
      </DocsPage>
    </DocumentationLayout>
  )
}
