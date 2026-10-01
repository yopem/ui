import { sourceItems } from "@registry/items"

import { getSnippetDependencies } from "./snippet-dependencies"
import { usageSnippets } from "./usage"

const compositionItemValues = {
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
    "container",
    "absolute-center",
    "bleed",
    "float",
    "wrap",
    "link",
    "text",
    "blockquote",
    "em",
    "highlight",
    "mark",
    "prose",
    "codeblock",
    "heading",
    "button",
    "label",
  ],
}

export const compositionItems = new Map(Object.entries(compositionItemValues))

export function getDocumentationItems(slug: string) {
  const names = compositionItems.get(slug) ?? [slug]

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
    `${usageSnippets.get(slug) ?? ""}\n${previewSource}`,
  ).components)
    visit(name)

  return [...required.values()]
}

export const guidePages = [
  {
    title: "Layout and typography",
    url: "/docs/layout",
    content:
      "Box Flex Stack HStack VStack Grid Center Container AbsoluteCenter Bleed Float Wrap Link Text Blockquote Em Highlight Mark Prose Codeblock Heading semantic layout native elements refs typography",
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
      "Oxlint rules prefer-layout-primitives Box Flex Grid Center Stack opt-out div span enforce-styling-methods static-stylex valid-polymorphic-as no-restyle no-raw-stylex-colors no-unused-stylex-styles unused local styles opt-in atoms contracts StyleX configuration properties",
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
      "Source-owned React components with StyleX and Base UI. Initialize and install component source with the CLI.",
  },
  {
    title: "Getting started",
    url: "/docs/getting-started",
    content:
      "React TypeScript StyleX components accessibility composition usage prerequisites CLI installation",
  },
  {
    title: "Installation",
    url: "/docs/installation",
    content:
      "CLI init dependencies StyleX Vite aliases tokens themes ThemeProvider CSS reset",
  },
]
