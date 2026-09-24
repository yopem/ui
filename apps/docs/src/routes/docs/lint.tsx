import { createFileRoute } from "@tanstack/react-router"

import { GuidePage } from "@/catalog/guide-content"
import LintContent from "@/content/lint.mdx"
import lintSource from "@/content/lint.mdx?raw"
import { createSeo } from "@/lib/seo"

export const Route = createFileRoute("/docs/lint")({
  head: () =>
    createSeo({
      description:
        "Configure Yopem UI Oxlint rules for Box usage and static StyleX styles.",
      path: "/docs/lint",
      title: "Lint rules · Yopem UI",
    }),
  component: LintGuide,
})

function LintGuide() {
  return (
    <GuidePage
      title="Lint rules"
      description="Source-owned Oxlint rules check component usage and static StyleX styles across the docs app."
      source={lintSource}
      Content={LintContent}
    />
  )
}
