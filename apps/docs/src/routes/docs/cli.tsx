import { createFileRoute } from "@tanstack/react-router"

import { GuidePage } from "@/catalog/guide-content"
import Content from "@/content/cli.mdx"
import source from "@/content/cli.mdx?raw"
import { createSeo } from "@/lib/seo"

export const Route = createFileRoute("/docs/cli")({
  head: () =>
    createSeo({
      description:
        "Configure projects, install components, and update copied source with the Yopem UI CLI.",
      path: "/docs/cli",
      title: "CLI · Yopem UI",
    }),
  component: CliGuide,
})

function CliGuide() {
  return (
    <GuidePage
      title="CLI"
      description="Use CLI commands and options. Preview changes before you overwrite source."
      source={source}
      Content={Content}
    />
  )
}
