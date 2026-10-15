import { createFileRoute } from "@tanstack/react-router"

import { GuidePage } from "@/catalog/guide-content"
import Content from "@/content/installation.mdx"
import source from "@/content/installation.mdx?raw"
import { createSeo } from "@/lib/seo"

export const Route = createFileRoute("/docs/installation")({
  head: () =>
    createSeo({
      description:
        "Install Yopem UI with StyleX in Next.js, TanStack Router, TanStack Start, React Router, or Astro.",
      path: "/docs/installation",
      title: "Installation · Yopem UI",
    }),
  component: Installation,
})

function Installation() {
  return (
    <GuidePage
      title="Installation"
      description="Configure StyleX once, check your build, then add your first component."
      source={source}
      Content={Content}
    />
  )
}
