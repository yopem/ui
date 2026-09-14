"use client"

import { ScrollArea } from "@registry/components/ui/scroll-area"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"
import { Suspense } from "react"

import type { CatalogDemo } from "./components"

import { CopyableCode } from "./code-block"
import { catalogStyles } from "./docs-styles"

const exampleHelpers = Object.entries(
  import.meta.glob<string>("../hooks/*.ts", {
    query: "?raw",
    import: "default",
    eager: true,
  }),
).map(([path, content]) => ({
  name: path.replace("../hooks/", "@/hooks/").replace(/\.ts$/, ""),
  path: path.replace("../hooks/", "src/hooks/"),
  content,
}))

export function DemoPanel({
  examples,
  label,
}: {
  examples: {
    demo: CatalogDemo
    label: string
    source: string
  }[]
  label: string
}) {
  return (
    <section {...stylex.props(catalogStyles.demo)}>
      <h3 {...stylex.props(localStyles.heading)}>{label}</h3>
      {examples.map((example) => {
        const LazyDemo = example.demo.component
        const exampleName =
          label === example.label ? label : `${label}: ${example.label}`
        return (
          <div {...stylex.props(localStyles.example)} key={example.demo.name}>
            {examples.length > 1 ? (
              <h4 {...stylex.props(localStyles.value)}>{example.label}</h4>
            ) : null}
            <ScrollArea
              {...stylex.props(catalogStyles.preview)}
              aria-label={`${exampleName} live preview`}
              clampContentMinWidth={false}
              overscrollContain
            >
              <div {...stylex.props(catalogStyles.previewContent)}>
                <Suspense fallback={null}>
                  <LazyDemo />
                </Suspense>
              </div>
            </ScrollArea>
            <CopyableCode
              code={example.source}
              title={`${exampleName} example`}
            />
            {exampleHelpers.map((helper) =>
              example.source.includes(helper.name) ? (
                <CopyableCode
                  key={helper.path}
                  code={helper.content}
                  title={helper.path}
                />
              ) : null,
            )}
          </div>
        )
      })}
    </section>
  )
}

const localStyles = stylex.create({
  example: { minInlineSize: 0 },
  heading: {
    fontFamily: tokens["--font-heading"],
    fontSize: "1.125rem",
    fontWeight: 600,
    marginBlock: "0 0.75rem",
    scrollMarginBlockStart: "6rem",
  },
  value: {
    color: tokens["--muted-foreground"],
    fontSize: "0.875rem",
    fontWeight: 600,
    marginBlock: "1.5rem 0.5rem",
  },
})
