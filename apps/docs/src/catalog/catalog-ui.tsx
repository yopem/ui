"use client"

import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"
import { Suspense } from "react"

import type { CatalogDemo } from "./components"

import { CopyableCode, KeyboardScrollArea } from "./code-block"

const exampleHelpers = Object.entries(
  import.meta.glob<string>("../hooks/*.ts", {
    query: "?raw",
    import: "default",
    eager: true,
  }),
).map(([path, content]) => ({
  name: path.replace("../hooks/", "@registry/hooks/").replace(/\.ts$/, ""),
  path: path.replace("../hooks/", "src/yopem/hooks/"),
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
            <KeyboardScrollArea
              {...stylex.props(catalogStyles.preview, localStyles.focus)}
              aria-label={`${exampleName} live preview`}
            >
              <Suspense
                fallback={
                  <p {...stylex.props(localStyles.p)}>Loading example…</p>
                }
              >
                <LazyDemo />
              </Suspense>
            </KeyboardScrollArea>
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

export const catalogStyles = stylex.create({
  card: {
    backgroundColor: {
      default: tokens["--card"],
      ":hover": tokens["--accent"],
    },
    borderColor: tokens["--border"],
    borderRadius: tokens["--radius-xl"],
    borderStyle: "solid",
    borderWidth: 1,
    color: tokens["--foreground"],
    display: "grid",
    gap: "1rem",
    minBlockSize: "9rem",
    padding: "1.125rem",
    textDecorationLine: "none",
    ":focus-visible": {
      outlineColor: tokens["--ring"],
      outlineOffset: 3,
      outlineStyle: "solid",
      outlineWidth: 2,
    },
  },
  cardCount: {
    color: tokens["--muted-foreground"],
    fontSize: "0.75rem",
    marginBlockStart: "auto",
  },
  cardTitle: {
    fontSize: "1rem",
    fontWeight: 650,
    letterSpacing: "-0.01em",
    margin: 0,
  },
  demo: { marginBlock: "2rem", minInlineSize: 0 },
  demoList: { display: "grid", gap: "1rem" },
  empty: {
    borderColor: tokens["--border"],
    borderRadius: tokens["--radius-xl"],
    borderStyle: "dashed",
    borderWidth: 1,
    color: tokens["--muted-foreground"],
    gridColumn: "1 / -1",
    padding: "2rem",
    textAlign: "center",
  },
  grid: {
    display: "grid",
    gap: "0.75rem",
    gridTemplateColumns: {
      default: "1fr",
      "@media (min-width: 40rem)": "repeat(2, minmax(0, 1fr))",
      "@media (min-width: 64rem)": "repeat(3, minmax(0, 1fr))",
    },
  },
  preview: {
    alignItems: "center",
    backgroundColor: tokens["--background"],
    borderColor: tokens["--border"],
    borderRadius: tokens["--radius-lg"],
    borderStyle: "solid",
    borderWidth: 1,
    display: "flex",
    justifyContent: "center",
    minBlockSize: "12rem",
    gap: "1rem",
    overflow: "auto",
    padding: "1.5rem",
  },
  search: {
    backgroundColor: tokens["--background"],
    borderColor: tokens["--input"],
    borderRadius: tokens["--radius-lg"],
    borderStyle: "solid",
    borderWidth: 1,
    color: tokens["--foreground"],
    font: "inherit",
    inlineSize: "100%",
    maxInlineSize: "32rem",
    paddingBlock: "0.75rem",
    paddingInline: "0.9rem",
    ":focus-visible": {
      outlineColor: tokens["--ring"],
      outlineStyle: "solid",
      outlineWidth: 2,
      outlineOffset: 2,
    },
  },
})

const localStyles = stylex.create({
  example: { minInlineSize: 0 },
  heading: {
    fontFamily: tokens["--font-heading"],
    fontSize: "1.125rem",
    fontWeight: 600,
    marginBlock: "0 0.75rem",
    scrollMarginBlockStart: "6rem",
  },
  focus: {
    ":focus-visible": {
      outlineColor: tokens["--ring"],
      outlineStyle: "solid",
      outlineWidth: 2,
      outlineOffset: -2,
    },
  },
  p: { marginBlock: "0.75rem", lineHeight: 1.7 },
  value: {
    color: tokens["--muted-foreground"],
    fontSize: "0.875rem",
    fontWeight: 600,
    marginBlock: "1.5rem 0.5rem",
  },
})
