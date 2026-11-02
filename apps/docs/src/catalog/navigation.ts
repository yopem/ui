import { catalog } from "./components"
import { editorParts, editorPartLabel } from "./editor-parts"

const layoutSlugs = new Set([
  "absolute-center",
  "aspect-ratio",
  "bleed",
  "box",
  "center",
  "container",
  "flex",
  "float",
  "frame",
  "grid",
  "hstack",
  "stack",
  "vstack",
  "wrap",
])

const typographySlugs = new Set([
  "blockquote",
  "codeblock",
  "em",
  "figcaption",
  "heading",
  "highlight",
  "kbd",
  "link",
  "list",
  "mark",
  "prose",
  "strong",
  "text",
])

const catalogGroups = ["Components", "Layout", "Typography", "Hooks"] as const

const editorCategories = [
  { name: "Editor basics", items: ["editor", "editor-toolbar-menus"] },
  {
    name: "Blocks and layout",
    items: [
      "editor-blocks",
      "editor-block-selection",
      "editor-block-menu",
      "editor-block-placeholder",
      "editor-columns",
      "editor-list-presentation",
      "editor-editable-card",
      "editor-floating-toolbar",
      "editor-cursor-overlay",
    ],
  },
  {
    name: "Suggestions and search",
    items: ["editor-typeahead", "editor-search", "editor-labels"],
  },
  {
    name: "Notes and references",
    items: ["editor-footnotes", "editor-toc", "editor-date"],
  },
  {
    name: "Code and diagrams",
    items: ["editor-code", "editor-diagram", "editor-math"],
  },
  {
    name: "Media and drawings",
    items: ["editor-media", "editor-media-placeholder", "editor-drawing"],
  },
  {
    name: "Review and AI",
    items: ["editor-review", "editor-ai", "editor-ai-menu", "editor-copilot"],
  },
  {
    name: "Document tools",
    items: [
      "editor-document",
      "editor-docx",
      "editor-document-export",
      "editor-document-export-pdf",
    ],
  },
  { name: "Collaboration controls", items: ["editor-collaboration"] },
]

export const editorPartGroups = editorCategories.map((category) => ({
  name: category.name,
  parts: editorParts.filter((part) =>
    category.items.includes(
      part.item === "editor" && part.name.startsWith("EditorAi")
        ? "editor-ai"
        : part.item,
    ),
  ),
}))

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
  {
    name: "Editor",
    pages: [
      { name: "Overview", url: "/editor" },
      { name: "Composition guide", url: "/docs/editor" },
      { name: "Inline review", url: "/components/editor-review" },
      { name: "Authentication", url: "/docs/editor-auth" },
      { name: "AI proposals", url: "/docs/editor-ai" },
      { name: "Document storage", url: "/docs/editor-store" },
      { name: "Collaboration", url: "/docs/editor-collaboration" },
      { name: "Private assets", url: "/docs/editor-assets" },
    ],
  },
  ...editorPartGroups.map((category) => ({
    name: category.name,
    pages: category.parts.map((part) => ({
      name: editorPartLabel(part.name),
      url: `/editor/${part.slug}`,
    })),
  })),
  {
    name: "Editor Examples",
    pages: [
      { name: "Core compositions", url: "/editor/examples" },
      { name: "Notion-like workspace", url: "/editor/examples/notion-like" },
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

          return (
            group === name &&
            item.slug !== "editor" &&
            !item.slug.startsWith("editor-")
          )
        })
        .map((item) => ({ name: item.title, url: `/components/${item.slug}` })),
    ],
  })),
]

export const navigationPages = navigationGroups.flatMap((group) => group.pages)
