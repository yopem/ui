const sources = import.meta.glob<string>("../content/*.mdx", {
  query: "?raw",
  import: "default",
  eager: true,
})

export function getGuideSource(slug: string) {
  return sources[`../content/${slug}.mdx`]
}
