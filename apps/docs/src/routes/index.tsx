import { createFileRoute } from "@tanstack/react-router"

import { GuidePage } from "@/catalog/guide-content"
import IntroductionContent from "@/content/introduction.mdx"
import introductionSource from "@/content/introduction.mdx?raw"
import { createSeo } from "@/lib/seo"

const description =
  "Use accessible React components with StyleX. Copy complete source into your project. Change it without a component package dependency."

export const Route = createFileRoute("/")({
  head: () =>
    createSeo({
      description,
      path: "/",
      title: "Yopem UI · StyleX React UI Library",
    }),
  component: Introduction,
})

function Introduction() {
  return (
    <GuidePage
      title="React components you copy, own, and change."
      description="Yopem UI provides accessible React component source with Base UI and StyleX. Copy only the components that you need. Your app uses copied source, not a Yopem component package."
      source={introductionSource}
      Content={IntroductionContent}
    />
  )
}
