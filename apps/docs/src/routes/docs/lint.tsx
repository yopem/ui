import { createFileRoute } from "@tanstack/react-router"

import { GuidePage } from "@/catalog/guide-content"
import LintContent from "@/content/lint.mdx"
import lintSource from "@/content/lint.mdx?raw"
import { createSeo } from "@/lib/seo"

export const Route = createFileRoute("/docs/lint")({
  head: () =>
    createSeo({
      description:
        "Configure six Yopem UI Oxlint rules for component usage, style props, and static StyleX styles.",
      path: "/docs/lint",
      title: "Lint rules · Yopem UI",
    }),
  component: LintGuide,
})

function LintGuide() {
  return (
    <GuidePage
      title="Lint rules"
      description="Six source-owned Oxlint rules check component usage, style props, and static StyleX styles across the docs app."
      source={lintSource}
      Content={LintContent}
    />
  )
}
