import { Button } from "@registry/components/ui/button"
import { tokens } from "@registry/styles/tokens.stylex"
import { useTheme } from "@registry/theme/theme-provider"
import * as stylex from "@stylexjs/stylex"
import { Link, createFileRoute, useHydrated } from "@tanstack/react-router"
import { CheckIcon, CopyIcon } from "lucide-react"
import { Suspense, useState } from "react"

import { catalog } from "@/catalog/components"
import { DocumentationLayout } from "@/catalog/docs-layout"
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
} from "@/catalog/docs-page"
import { catalogStyles } from "@/catalog/docs-styles"
import { Box } from "@/components/ui/stylex/box"
import { Flex } from "@/components/ui/stylex/flex"
import { Grid } from "@/components/ui/stylex/grid"
import { Paragraph } from "@/components/ui/stylex/paragraph"
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard"
import { createSeo } from "@/lib/seo"
const pageSize = 24
const examples = catalog.flatMap((item) =>
  item.examples.map((example, index) => ({
    component: example.component,
    componentName: item.title,
    label: `${item.title} ${index + 1}`,
    name: example.name,
    source: example.source,
  })),
)

export const Route = createFileRoute("/examples/")({
  head: () =>
    createSeo({
      description: `Browse ${examples.length} live StyleX component examples from Yopem UI.`,
      path: "/examples",
      title: "Examples · Yopem UI",
    }),
  component: ExamplesPage,
})

function ExamplesPage() {
  const { resolvedTheme } = useTheme()
  const hydrated = useHydrated()
  const [query, setQuery] = useState("")
  const [visibleCount, setVisibleCount] = useState(pageSize)
  const [copiedExample, setCopiedExample] = useState<string>()
  const { copyError, copyToClipboard, isCopied } = useCopyToClipboard()
  const normalizedQuery = query.trim().toLocaleLowerCase()
  const results = normalizedQuery
    ? examples.filter((example) =>
        `${example.componentName} ${example.name}`
          .toLocaleLowerCase()
          .includes(normalizedQuery),
      )
    : examples
  const visibleExamples = results.slice(0, visibleCount)

  return (
    <DocumentationLayout>
      <DocsPage full>
        <Box as="header" {...stylex.props(styles.hero)}>
          <DocsTitle>Browse examples</DocsTitle>
          <DocsDescription {...stylex.props(styles.description)}>
            Explore {examples.length} ready-to-use StyleX examples. Search by
            component, try each pattern, then open it on its own.
          </DocsDescription>
          <Box
            as="input"
            {...stylex.props(catalogStyles.search, styles.search)}
            aria-label="Search examples"
            disabled={!hydrated}
            onChange={(event) => {
              setQuery(event.target.value)
              setVisibleCount(pageSize)
            }}
            placeholder="Search examples…"
            type="search"
            value={query}
          />
          <Box as="output" aria-live="polite" {...stylex.props(styles.count)}>
            {results.length} {results.length === 1 ? "example" : "examples"}
          </Box>
        </Box>
        <DocsBody>
          <Grid {...stylex.props(styles.grid)}>
            {visibleExamples.map((example) => {
              const LiveExample = example.component
              return (
                <Box
                  as="article"
                  {...stylex.props(styles.card)}
                  key={example.name}
                >
                  <Flex
                    {...stylex.props(styles.preview)}
                    aria-label={`${example.label} live preview`}
                  >
                    <Suspense fallback={null}>
                      {hydrated ? <LiveExample /> : null}
                    </Suspense>
                  </Flex>
                  <Box as="footer" {...stylex.props(styles.footer)}>
                    <Link
                      {...stylex.props(styles.link)}
                      params={{ example: example.name }}
                      search={{ theme: resolvedTheme }}
                      to="/examples/$example"
                    >
                      {example.label}
                    </Link>
                    <Box as="span" {...stylex.props(styles.name)}>
                      {example.name}
                    </Box>
                    <Button
                      aria-label={
                        isCopied && copiedExample === example.name
                          ? `${example.label} code copied`
                          : `Copy ${example.label} code`
                      }
                      onClick={() => {
                        setCopiedExample(example.name)
                        void example.source().then(copyToClipboard)
                      }}
                      size="xs"
                      xstyle={styles.copy}
                      type="button"
                      variant="ghost"
                    >
                      {isCopied && copiedExample === example.name ? (
                        <CheckIcon
                          {...stylex.props(styles.icon)}
                          aria-hidden="true"
                        />
                      ) : (
                        <CopyIcon
                          {...stylex.props(styles.icon)}
                          aria-hidden="true"
                        />
                      )}
                      {isCopied && copiedExample === example.name
                        ? "Copied"
                        : "Copy code"}
                    </Button>
                    {copyError && copiedExample === example.name ? (
                      <Box as="output" {...stylex.props(styles.copyError)}>
                        {copyError}
                      </Box>
                    ) : null}
                  </Box>
                </Box>
              )
            })}
            {results.length === 0 ? (
              <Paragraph {...stylex.props(catalogStyles.empty)}>
                No examples match “{query}”.
              </Paragraph>
            ) : null}
          </Grid>
          {visibleExamples.length < results.length ? (
            <Flex {...stylex.props(styles.more)}>
              <Button
                onClick={() => setVisibleCount((count) => count + pageSize)}
                type="button"
                variant="outline"
              >
                Show {Math.min(pageSize, results.length - visibleCount)} more
              </Button>
            </Flex>
          ) : null}
        </DocsBody>
      </DocsPage>
    </DocumentationLayout>
  )
}

const styles = stylex.create({
  card: {
    backgroundColor: tokens["--card"],
    borderColor: tokens["--border"],
    borderRadius: tokens["--radius-xl"],
    borderStyle: "solid",
    borderWidth: 1,
    display: "grid",
    minInlineSize: 0,
    overflow: "hidden",
  },
  count: {
    color: tokens["--muted-foreground"],
    display: "block",
    fontSize: "0.8125rem",
    marginBlockStart: "0.75rem",
  },
  description: { marginInline: "auto" },
  copy: {
    gridColumn: 2,
    gridRow: "1 / span 2",
    justifySelf: "end",
  },
  copyError: {
    color: tokens["--destructive"],
    fontSize: "0.75rem",
    gridColumn: "1 / -1",
  },
  footer: {
    alignItems: "center",
    borderBlockStart: `1px solid ${tokens["--border"]}`,
    display: "grid",
    gap: "0.25rem 0.75rem",
    gridTemplateColumns: "minmax(0, 1fr) auto",
    padding: "0.875rem 1rem",
  },
  preview: {
    alignItems: "center",
    backgroundColor: tokens["--background"],
    blockSize: "18rem",
    display: "flex",
    gap: "1rem",
    justifyContent: "center",
    overflow: "auto",
    padding: "1.5rem",
  },
  grid: {
    display: "grid",
    gap: "1rem",
    gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 20rem), 1fr))",
  },
  hero: {
    marginBlockEnd: "2.5rem",
    textAlign: "center",
  },
  icon: {
    blockSize: "0.875rem",
    inlineSize: "0.875rem",
  },
  link: {
    borderRadius: tokens["--radius-sm"],
    gridColumn: 1,
    color: tokens["--foreground"],
    fontWeight: 650,
    textDecoration: "none",
    width: "fit-content",
    ":hover": { textDecoration: "underline" },
    ":focus-visible": {
      outline: `2px solid ${tokens["--ring"]}`,
      outlineOffset: 3,
    },
  },
  more: {
    display: "flex",
    justifyContent: "center",
    marginBlockStart: "2rem",
  },
  name: {
    color: tokens["--muted-foreground"],
    gridColumn: 1,
    fontFamily: tokens["--font-mono"],
    fontSize: "0.6875rem",
  },
  search: { marginInline: "auto" },
})
