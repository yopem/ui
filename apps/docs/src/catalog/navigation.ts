import { catalog } from "./components"

const layoutSlugs = new Set([
  "absolute-center",
  "bleed",
  "box",
  "center",
  "container",
  "flex",
  "float",
  "frame",
  "grid",
  "hstack",
  "layout",
  "stack",
  "vstack",
  "wrap",
])

const typographySlugs = new Set([
  "blockquote",
  "codeblock",
  "em",
  "heading",
  "highlight",
  "kbd",
  "link",
  "mark",
  "prose",
  "text",
])

const catalogGroups = ["Components", "Layout", "Typography", "Hooks"] as const

export const navigationGroups = [
  {
    name: "Setup",
    pages: [
      { name: "Introduction", url: "/" },
      { name: "Getting started", url: "/docs/getting-started" },
      { name: "Installation", url: "/docs/installation" },
      { name: "CLI", url: "/docs/cli" },
      { name: "Theming", url: "/docs/theming" },
      { name: "Layout and typography", url: "/docs/layout" },
      { name: "Styling with StyleX", url: "/docs/styling" },
      { name: "Lint rules", url: "/docs/lint" },
    ],
  },
  ...catalogGroups.map((name) => ({
    name,
    pages: [
      ...(name === "Components"
        ? [{ name: "Components", url: "/components" }]
        : []),
      ...catalog
        .filter((item) => {
          const group = item.slug.startsWith("use-")
            ? "Hooks"
            : layoutSlugs.has(item.slug)
              ? "Layout"
              : typographySlugs.has(item.slug)
                ? "Typography"
                : "Components"

          return group === name
        })
        .map((item) => ({ name: item.title, url: `/components/${item.slug}` })),
    ],
  })),
]

export const navigationPages = navigationGroups.flatMap((group) => group.pages)
