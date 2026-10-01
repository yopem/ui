import { sourceItems } from "@registry/items"
import { createFileRoute } from "@tanstack/react-router"
import { createSearchAPI } from "fumadocs-core/search/server"

import { guidePages } from "@/catalog/docs-data"
import { getGuideSource } from "@/catalog/guide-sources"

const search = createSearchAPI("simple", {
  indexes: [
    ...guidePages.map((page) => ({
      ...page,
      content: `${page.content}\n${getGuideSource(page.url === "/" ? "introduction" : page.url.replace("/docs/", "")) ?? ""}`,
    })),
    ...sourceItems
      .filter((item) => item.type === "registry:ui")
      .map((item) => ({
        title: item.title,
        description: item.description,
        url: `/components/${item.name}`,
        content: [
          item.description,
          item.docs?.usage,
          ...(item.docs?.api ?? []),
        ].join("\n"),
      })),
    {
      title: "Date Picker",
      url: "/components/date-picker",
      content: "Choose a date using Calendar and Popover.",
    },
    {
      title: "Segmented Control",
      url: "/components/navigation",
      content: "Switch between related choices using RadioGroup and Tabs.",
    },
  ],
})

export const Route = createFileRoute("/api/search.json")({
  server: { handlers: { GET: () => search.staticGET() } },
})
