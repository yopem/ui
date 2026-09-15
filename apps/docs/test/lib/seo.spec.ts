import { runDocsSourceContract } from "@test/helpers/docs-source-contract"
import { expect, test } from "bun:test"

import { createSeo, createSitemap } from "@/lib/seo"

runDocsSourceContract("lib/seo.ts")

test("sitemap contains absolute canonical URLs", () => {
  const sitemap = createSitemap(["/", "/components/button"])

  expect(sitemap).toContain("https://ui.yopem.com/</loc>")
  expect(sitemap).toContain("https://ui.yopem.com/components/button</loc>")
})

test("SEO metadata derives canonical, social image, and JSON-LD", () => {
  const seo = createSeo({
    description: "Accessible component docs.",
    path: "/components/button",
    title: "Button · Yopem UI",
  })

  expect(seo.links).toContainEqual({
    href: "https://ui.yopem.com/components/button",
    rel: "canonical",
  })
  expect(seo.meta).toContainEqual({
    content:
      "https://ui.yopem.com/api/og?title=Button+%C2%B7+Yopem+UI&description=Accessible+component+docs.",
    property: "og:image",
  })
  expect(JSON.parse(seo.scripts[0].children)).toMatchObject({
    "@type": "WebPage",
    name: "Button · Yopem UI",
    url: "https://ui.yopem.com/components/button",
  })
})
