import { sourceItems } from "@registry/items"

import { getSnippetDependencies } from "./snippet-dependencies"
import { usageSnippets } from "./usage"

export const compositionItems: Record<string, string[]> = {
  "date-picker": ["calendar", "popover", "button"],
  navigation: ["radio-group", "tabs"],
  layout: [
    "box",
    "flex",
    "stack",
    "hstack",
    "vstack",
    "grid",
    "center",
    "link",
    "paragraph",
    "heading",
    "button",
    "label",
  ],
}

export function getDocumentationItems(slug: string) {
  const names = compositionItems[slug] ?? [slug]
  return names
    .map((name) => sourceItems.find((item) => item.name === name))
    .filter((item) => item !== undefined)
}

export function getRequiredItems(slug: string, previewSource = "") {
  const required = new Map<string, (typeof sourceItems)[number]>()
  const visit = (name: string) => {
    if (required.has(name)) return
    const item = sourceItems.find((entry) => entry.name === name)
    if (!item) throw new Error(`Missing source dependency: ${name}`)
    required.set(name, item)
    for (const dependency of item.registryDependencies) visit(dependency)
  }
  const items = getDocumentationItems(slug)
  if (items.length === 0) throw new Error("Component not found")
  for (const item of items) visit(item.name)
  for (const name of getSnippetDependencies(
    `${usageSnippets[slug] ?? ""}\n${previewSource}`,
  ).components)
    visit(name)
  return [...required.values()]
}

export const guidePages = [
  {
    title: "Layout and typography",
    url: "/docs/layout",
    content:
      "Box Flex Stack HStack VStack Grid Center Link Paragraph Heading semantic layout native elements refs typography",
  },
  {
    title: "Styling with StyleX",
    url: "/docs/styling",
    content:
      "StyleX create props xstyle semantic tokens responsive styles defaults components className integration",
  },
  {
    title: "Lint rules",
    url: "/docs/lint",
    content:
      "Oxlint rules enforce-styling-methods static-stylex valid-polymorphic-as no-restyle no-raw-stylex-colors atoms contracts StyleX configuration properties",
  },
  {
    title: "Theming",
    url: "/docs/theming",
    content:
      "Customize colors fonts CSS variables StyleX tokens light dark system ThemeProvider ThemeScript useTheme getRootThemeProps nonce",
  },
  {
    title: "Introduction",
    url: "/",
    content:
      "Source-owned React components with StyleX and Base UI. Install with CLI or copy and paste components into your project.",
  },
  {
    title: "Getting started",
    url: "/docs/getting-started",
    content:
      "React TypeScript StyleX components accessibility composition usage prerequisites CLI manual installation",
  },
  {
    title: "Installation",
    url: "/docs/installation",
    content:
      "CLI and manual setup dependencies StyleX Vite aliases tokens themes ThemeProvider CSS reset",
  },
]
