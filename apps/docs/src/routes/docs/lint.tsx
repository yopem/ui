import { createFileRoute } from "@tanstack/react-router"

import { GuidePage } from "@/catalog/guide-content"
import LintContent from "@/content/lint.mdx"
import lintSource from "@/content/lint.mdx?raw"
import { createSeo } from "@/lib/seo"

export const Route = createFileRoute("/docs/lint")({
  head: () =>
    createSeo({
      description:
        "Configure Yopem UI Oxlint rules with examples for component usage, styling methods, design tokens, and StyleX declarations.",
      path: "/docs/lint",
      title: "Lint rules · Yopem UI",
    }),
  component: LintGuide,
})

function LintGuide() {
  return (
    <GuidePage
      title="Lint rules"
      description="Check component usage and StyleX styles. Learn each rule with accepted examples, rejected examples, and configuration options."
      source={lintSource}
      Content={LintContent}
    />
  )
}
