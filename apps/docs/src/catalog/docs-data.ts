import { sourceItems } from "@registry/items"

import { getExampleDependencies } from "./example-dependencies"
import { usageExamples } from "./usage"

export const compositionItems: Record<string, string[]> = {
  "date-picker": ["calendar", "popover", "button"],
  navigation: ["radio-group", "tabs"],
}

export function getDocumentationItems(slug: string) {
  const names = compositionItems[slug] ?? [slug]
  return names
    .map((name) => sourceItems.find((item) => item.name === name))
    .filter((item) => item !== undefined)
}

export function getRequiredItems(slug: string) {
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
  for (const name of getExampleDependencies(usageExamples[slug] ?? "")
    .components)
    visit(name)
  return [...required.values()]
}

export const guidePages = [
  {
    title: "Examples",
    url: "/examples",
    content:
      "Browse and search every live StyleX component example and pattern.",
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
      "Source-owned React components with StyleX and Base UI. Copy and paste components into your project.",
  },
  {
    title: "Getting started",
    url: "/docs/getting-started",
    content:
      "React TypeScript StyleX components accessibility composition usage prerequisites",
  },
  {
    title: "Installation",
    url: "/docs/installation",
    content:
      "Manual setup dependencies StyleX Vite aliases tokens themes ThemeProvider CSS reset",
  },
]
