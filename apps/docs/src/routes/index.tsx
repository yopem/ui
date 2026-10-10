import { createFileRoute } from "@tanstack/react-router"

import { Introduction } from "@/catalog/introduction"
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
