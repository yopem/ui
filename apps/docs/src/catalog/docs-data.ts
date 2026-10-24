import { sourceItems } from "@registry/items"

import { getSnippetDependencies } from "./snippet-dependencies"
import { usageSnippets } from "./usage"

const compositionItemValues = {
  "date-picker": ["calendar", "popover", "button"],
  navigation: ["radio-group", "tabs"],
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
    title: "Editor collaboration",
    url: "/docs/editor-collaboration",
    content:
      "Install collaboration with Bun, npm, pnpm, or Yarn. Use Durable Objects with D1 or PostgreSQL with host WebSocket upgrades. Supply existing authentication, verified expiry, document policy, exact origins, CSRF, and complete schema validation. Keep Worker adapters separate from portable server imports. Preserve bounded history and offline drafts.",
  },
  {
    title: "Editor AI",
    url: "/docs/editor-ai",
    content:
      "Install optional AI server source with Bun, npm, pnpm, or Yarn. Supply existing authentication, exact HTTPS origin, CSRF verification, document policy, durable quota, and host-selected provider configuration. Review untrusted text before approval. AI invocation never grants document writes.",
  },
  {
    title: "Editor assets",
    url: "/docs/editor-assets",
    content:
      "Install private asset server source with Bun, npm, pnpm, or Yarn. Use D1 or PostgreSQL and private R2 or S3. Supply verified expiry, document and asset policy, exact origins, CSRF, quotas, bounded scanners, and scheduled cleanup. Native delivery requires same-origin cookies.",
  },
  {
    title: "Editor document storage",
    url: "/docs/editor-store",
    content:
      "Install server storage with Bun, npm, pnpm, or Yarn. Use authenticated HTTP GET, PUT, DELETE with D1 or PostgreSQL. Supply document policy, exact origins, CSRF checks, schema validation, conditional ETags, and stable operation IDs.",
  },
  {
    title: "Editor authentication",
    url: "/docs/editor-auth",
    content:
      "Install server helpers with Bun, npm, pnpm, or Yarn. Connect existing OpenAuth and Better Auth services. Verify identity and check document authorization separately. Configure trusted origins, CSRF protection, and backend service policies.",
  },
  {
    title: "Editor",
    url: "/docs/editor",
    content:
      "Use the Lexical editor foundation for rich text, formatting, lists, history, and JSON output. Add optional native code editing, inline equations, callouts, typeahead, rich-text columns, calendar dates, comments, and bounded text suggestions. Supply a verified identity and a synchronous per-action review policy. Review data does not grant access. Install source with Bun, npm, pnpm, or Yarn. Lexical JSON is not compatible with Slate or Plate JSON. This scope does not provide full Plate parity.",
  },
  {
    title: "CLI",
    url: "/docs/cli",
    content:
      "Use init, add, and update with Bun, npm, pnpm, or Yarn. Set framework, shared UI, guidance, cwd, and registry options. Preview changes with dry-run. Check prerequisites. Learn when commands keep or overwrite files, including force behavior.",
  },
  {
    title: "Layout and typography",
    url: "/docs/layout",
    content:
      "Choose semantic layout and typography components. Use Box, Flex, Stack, HStack, VStack, Grid, Center, Container, AbsoluteCenter, AspectRatio, Bleed, Float, and Wrap. Use Link, List, Text, Blockquote, Em, Strong, Figcaption, Highlight, Mark, Prose, Codeblock, and Heading for content. Keep native elements and refs where required.",
  },
  {
    title: "Styling with StyleX",
    url: "/docs/styling",
    content:
      "Create responsive styles with StyleX and semantic tokens. Apply styles through xstyle after component defaults. Use StyleX props or className to apply styles from other sources.",
  },
  {
    title: "Lint rules",
    url: "/docs/lint",
    content:
      "Configure all seven Yopem UI Oxlint rules. Compare code examples that pass or fail each rule. Use prefer-layout-primitives for semantic layout and typography. Configure no-restyle, enforce-styling-methods, static-stylex, and no-raw-stylex-colors. Enable no-unused-stylex-styles or atoms when needed. Learn rule defaults, options, component imports, and file overrides.",
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
      "Copy React component source into your project. Edit it there. Components use StyleX and Base UI. Initialize your project with the CLI. Then install component source.",
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
