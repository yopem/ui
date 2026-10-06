import { createFileRoute } from "@tanstack/react-router"

import { GuidePage } from "@/catalog/guide-content"
import GettingStartedContent from "@/content/getting-started.mdx"
import gettingStartedSource from "@/content/getting-started.mdx?raw"
import { createSeo } from "@/lib/seo"

export const Route = createFileRoute("/docs/getting-started")({
  head: () =>
    createSeo({
      description:
        "Add your first Yopem UI component to a React and StyleX application.",
      path: "/docs/getting-started",
      title: "Getting started · Yopem UI",
    }),
  component: GettingStarted,
})

function GettingStarted() {
  return (
    <GuidePage
      title="Add your first component"
      description="Follow this guide to add one Yopem Button to your app. The Button uses Yopem styles. You can edit its source in your project."
      source={gettingStartedSource}
      Content={GettingStartedContent}
    />
  )
}
