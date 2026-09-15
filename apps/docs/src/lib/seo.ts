export const siteOrigin = "https://ui.yopem.com"

const siteName = "Yopem UI"
const siteDescription = "StyleX React UI Library"

export const siteJsonLd = JSON.stringify({
  "@context": "https://schema.org",
  "@graph": [
    {
      "@id": `${siteOrigin}/#website`,
      "@type": "WebSite",
      description: siteDescription,
      name: siteName,
      publisher: { "@id": `${siteOrigin}/#organization` },
      url: siteOrigin,
    },
    {
      "@id": `${siteOrigin}/#organization`,
      "@type": "Organization",
      logo: {
        "@type": "ImageObject",
        url: `${siteOrigin}/favicon.svg`,
      },
      name: siteName,
      url: siteOrigin,
    },
  ],
}).replaceAll("<", "\\u003c")

interface SeoOptions {
  description: string
  path: string
  title: string
}

export function createSeo({ description, path, title }: SeoOptions) {
  const url = new URL(path, siteOrigin).href
  const image = new URL("/api/og", siteOrigin)
  image.searchParams.set("title", title)
  image.searchParams.set("description", description)

  return {
    links: [{ href: url, rel: "canonical" }],
    meta: [
      { title },
      { content: description, name: "description" },
      { content: "index, follow, max-image-preview:large", name: "robots" },
      { content: title, property: "og:title" },
      { content: description, property: "og:description" },
      { content: "website", property: "og:type" },
      { content: siteName, property: "og:site_name" },
      { content: url, property: "og:url" },
      { content: image.href, property: "og:image" },
      { content: "1200", property: "og:image:width" },
      { content: "630", property: "og:image:height" },
      { content: "image/png", property: "og:image:type" },
      {
        content: `${title} — ${description}`,
        property: "og:image:alt",
      },
      { content: "summary_large_image", name: "twitter:card" },
      { content: title, name: "twitter:title" },
      { content: description, name: "twitter:description" },
      { content: image.href, name: "twitter:image" },
    ],
    scripts: [
      {
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebPage",
          description,
          isPartOf: {
            "@id": `${siteOrigin}/#website`,
            "@type": "WebSite",
            name: siteName,
            url: siteOrigin,
          },
          name: title,
          url,
        }).replaceAll("<", "\\u003c"),
        type: "application/ld+json",
      },
    ],
  }
}
