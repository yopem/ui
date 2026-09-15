"use client"

import { ScrollArea } from "@registry/components/ui/scroll-area"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"
import { Suspense } from "react"

import type { CatalogExample } from "./components"

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

export function ExamplePanel({
  examples,
  label,
}: {
  examples: {
    example: CatalogExample
    label: string
    source: string
  }[]
  label: string
}) {
  return (
    <section {...stylex.props(catalogStyles.example)}>
      <h3 {...stylex.props(localStyles.heading)}>{label}</h3>
      {examples.map((example) => {
        const LazyExample = example.example.component
        const exampleName =
          label === example.label ? label : `${label}: ${example.label}`
        return (
          <div
            {...stylex.props(localStyles.example)}
            key={example.example.name}
          >
            {examples.length > 1 ? (
              <h4 {...stylex.props(localStyles.value)}>{example.label}</h4>
            ) : null}
            <ScrollArea
              {...stylex.props(catalogStyles.preview, localStyles.preview)}
              aria-label={`${exampleName} live preview`}
              clampContentMinWidth={false}
              overscrollContain
            >
              <div {...stylex.props(catalogStyles.previewContent)}>
                <Suspense fallback={null}>
                  <LazyExample />
                </Suspense>
              </div>
            </ScrollArea>
            <ExampleSource name={exampleName} source={example.source} />
          </div>
        )
      })}
    </section>
  )
}

function ExampleSource({ name, source }: { name: string; source: string }) {
  return (
    <>
      <CopyableCode code={source} preview title={`${name} example`} />
      {exampleHelpers.map((helper) =>
        source.includes(helper.name) ? (
          <CopyableCode
            key={helper.path}
            code={helper.content}
            preview
            title={helper.path}
          />
        ) : null,
      )}
    </>
  )
}

const localStyles = stylex.create({
  example: { minInlineSize: 0 },
  preview: {
    borderEndStartRadius: 0,
    borderEndEndRadius: 0,
  },
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
