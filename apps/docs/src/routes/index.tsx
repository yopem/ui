import { createFileRoute } from "@tanstack/react-router"

import { Introduction } from "@/catalog/introduction"
import { createSeo } from "@/lib/seo"

const description =
  "Use accessible React components with StyleX. Copy complete source into your project. Edit it without depending on a component package."

export const Route = createFileRoute("/")({
  head: () =>
    createSeo({
      description,
      path: "/",
      title: "Yopem UI · StyleX React UI Library",
    }),
  component: Introduction,
})
