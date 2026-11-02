import { createFileRoute } from "@tanstack/react-router"

import { catalog } from "@/catalog/components"
import { guidePages } from "@/catalog/docs-data"
import { editorParts } from "@/catalog/editor-parts"
import { createSitemap } from "@/lib/seo"

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: () =>
        new Response(
          createSitemap([
            "/components",
            "/editor",
            "/editor/examples",
            "/editor/examples/notion-like",
            ...editorParts.map((part) => `/editor/${part.slug}`),
            ...guidePages.map((page) => page.url),
            ...catalog.map((item) => `/components/${item.slug}`),
          ]),
          {
            headers: {
              "Cache-Control": "public, max-age=3600",
              "Content-Type": "application/xml; charset=utf-8",
            },
          },
        ),
    },
  },
})
