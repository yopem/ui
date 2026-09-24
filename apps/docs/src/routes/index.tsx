import { createFileRoute } from "@tanstack/react-router"

import { GuidePage } from "@/catalog/guide-content"
import IntroductionContent from "@/content/introduction.mdx"
import introductionSource from "@/content/introduction.mdx?raw"
import { createSeo } from "@/lib/seo"

const description =
  "Accessible React components styled with StyleX. Copy complete source into your project, then customize it without package lock-in."

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
      description="Yopem UI gives you accessible React component source built with Base UI and StyleX. Copy only what you need into your application. There is no Yopem package between you and your UI."
      source={introductionSource}
      Content={IntroductionContent}
    />
  )
}
