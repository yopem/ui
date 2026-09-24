import { createFileRoute } from "@tanstack/react-router"

import { GuidePage } from "@/catalog/guide-content"
import LayoutContent from "@/content/layout.mdx"
import layoutSource from "@/content/layout.mdx?raw"
import { createSeo } from "@/lib/seo"

export const Route = createFileRoute("/docs/layout")({
  head: () =>
    createSeo({
      description:
        "Choose layout and typography components, preserve native semantics, and compose accessible page structure.",
      path: "/docs/layout",
      title: "Layout and typography · Yopem UI",
    }),
  component: LayoutGuide,
})

function LayoutGuide() {
  return (
    <GuidePage
      title="Layout and typography"
      description="Choose a layout or text component, then use its native semantics to build a readable page."
      source={layoutSource}
      Content={LayoutContent}
    />
  )
}
