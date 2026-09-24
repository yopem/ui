import { createFileRoute } from "@tanstack/react-router"

import { GuidePage } from "@/catalog/guide-content"
import StylingContent from "@/content/styling.mdx"
import stylingSource from "@/content/styling.mdx?raw"
import { createSeo } from "@/lib/seo"

export const Route = createFileRoute("/docs/styling")({
  head: () =>
    createSeo({
      description:
        "Style UI components with StyleX, xstyle, and semantic tokens.",
      path: "/docs/styling",
      title: "Styling with StyleX · Yopem UI",
    }),
  component: StylingGuide,
})

function StylingGuide() {
  return (
    <GuidePage
      title="Styling with StyleX"
      description="Create styles with StyleX and compose them through xstyle after component defaults."
      source={stylingSource}
      Content={StylingContent}
    />
  )
}
