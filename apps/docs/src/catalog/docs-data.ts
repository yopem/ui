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
    title: "CLI",
    url: "/docs/cli",
    content:
      "Use init, add, and update commands. Show help and version with short flags. Configure framework, shared UI, cwd, and registry options. Preview changes with dry-run. Review safe overwrites and force behavior. Check Bun prerequisites and the unpublished package warning.",
  },
  {
    title: "Layout and typography",
    url: "/docs/layout",
    content:
      "Choose semantic layout and typography components. Use Box, Flex, Stack, HStack, VStack, Grid, Center, Container, AbsoluteCenter, Bleed, Float, and Wrap. Use Link, Text, Blockquote, Em, Highlight, Mark, Prose, Codeblock, and Heading for content. Keep native elements and refs where required.",
  },
  {
    title: "Styling with StyleX",
    url: "/docs/styling",
    content:
      "Create responsive styles with StyleX and semantic tokens. Apply styles through xstyle after component defaults. Use StyleX props or className for integration.",
  },
  {
    title: "Lint rules",
    url: "/docs/lint",
    content:
      "Configure all seven Yopem UI Oxlint rules with accepted and rejected code examples. Use prefer-layout-primitives for semantic layout and typography. Configure no-restyle, enforce-styling-methods, static-stylex, and no-raw-stylex-colors. Enable no-unused-stylex-styles or atoms when needed. Learn rule defaults, options, component imports, and file overrides.",
  },
  {
    title: "Theming",
    url: "/docs/theming",
    content:
      "Change colors, fonts, CSS variables, and StyleX tokens. Use ThemeProvider, ThemeScript, useTheme, and getRootThemeProps for light, dark, and system modes. Configure the script nonce when required.",
  },
  {
    title: "Introduction",
    url: "/",
    content:
      "Use source-owned React components with StyleX and Base UI. Initialize your project with the CLI. Install component source with the CLI.",
  },
  {
    title: "Getting started",
    url: "/docs/getting-started",
    content:
      "Check React and TypeScript prerequisites. Install StyleX and components with the CLI. Learn component composition, usage, and accessibility requirements.",
  },
  {
    title: "Installation",
    url: "/docs/installation",
    content:
      "Use CLI init to configure StyleX, dependencies, aliases, tokens, and CSS reset. Set up Vite or another supported framework. Add themes with ThemeProvider when required.",
  },
]
