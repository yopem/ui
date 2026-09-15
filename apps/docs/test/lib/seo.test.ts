import { expect, test } from "bun:test"
import { fileURLToPath } from "node:url"

import { renderOgImage } from "@/lib/og"
import { createSeo, createSitemap } from "@/lib/seo"

test("sitemap contains absolute canonical URLs", () => {
  const sitemap = createSitemap(["/", "/components/button"])

  expect(sitemap).toContain("https://ui.yopem.com/</loc>")
  expect(sitemap).toContain("https://ui.yopem.com/components/button</loc>")
})

test("SEO metadata derives canonical, social image, and JSON-LD from page data", () => {
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

test("OG renderer returns a 1200 by 630 PNG", async () => {
  const regularFont = await Bun.file(
    fileURLToPath(
      import.meta
        .resolve("@expo-google-fonts/figtree/400Regular/Figtree_400Regular.ttf"),
    ),
  ).arrayBuffer()
  const boldFont = await Bun.file(
    fileURLToPath(
      import.meta
        .resolve("@expo-google-fonts/figtree/700Bold/Figtree_700Bold.ttf"),
    ),
  ).arrayBuffer()
  const png = await renderOgImage(
    "Button · Yopem UI",
    "Accessible component docs.",
    regularFont,
    boldFont,
  )

  expect(png.subarray(1, 4).toString()).toBe("PNG")
  expect(png.readUInt32BE(16)).toBe(1200)
  expect(png.readUInt32BE(20)).toBe(630)
})
