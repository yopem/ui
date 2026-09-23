import { sourceItems } from "@registry/items"

import { getExampleDependencies } from "./example-dependencies"
import { usageExamples } from "./usage"

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
  "style-props": ["button"],
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
    title: "Layout and typography",
    url: "/docs/layout",
    content:
      "Box Flex Stack HStack VStack Grid Center Link Paragraph Heading semantic layout native elements refs typography",
  },
  {
    title: "Style props",
    url: "/docs/style-props",
    content:
      "Shared styling for all components including Button Input layout and typography: spacing responsive breakpoints states css xstyle aliases precedence",
  },
  {
    title: "Lint rules",
    url: "/docs/lint",
    content:
      "Oxlint rules enforce-styling-methods no-leaked-dom-style-props no-unsupported-style-props prefer-ui-primitives static-stylex valid-polymorphic-as configuration allowElements exceptions fixes",
  },
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
