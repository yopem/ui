import type { getDocumentation } from "@/catalog/docs.functions"

const cacheControl = "public, max-age=3600"

const cliRunners = `Use Bun, npm, pnpm, or modern Yarn (version 2 or later).
Run the same CLI arguments with these commands:

- Bun: bunx --bun @yopem-ui/cli init
- npm: npx @yopem-ui/cli init
- pnpm: pnpm dlx @yopem-ui/cli init
- Yarn: yarn dlx @yopem-ui/cli init
`

export function createLlms(
  origin: string,
  guidePages: { content: string; title: string; url: string }[],
  catalog: { slug: string; title: string }[],
) {
  const url = (path: string) => new URL(path, origin).href

  const guideLinks = guidePages
    .map((page) => {
      const path = page.url === "/" ? "/index.md" : `${page.url}.md`

      return `- [${page.title}](${url(path)}): ${page.content}`
    })
    .join("\n")

  const componentLinks = catalog
    .map((item) => `- [${item.title}](${url(`/components/${item.slug}.md`)})`)
    .join("\n")

  return `# Yopem UI

> Yopem UI provides accessible React 19 components with StyleX and Base UI. Copy source into your project. Edit it there. Your copied components do not depend on a component package.

## Installation

Use a React project with TypeScript.
Supported frameworks are Vite React, client TanStack Router, TanStack Start, React Router, Next.js App Router, and Astro.
React Router supports client mode and framework mode, not React Router RSC mode.
Next.js Pages Router is not supported. Next.js App Router requires Node 24 or later and webpack.

${cliRunners}

Preview setup with \`bunx --bun @yopem-ui/cli init --dry-run\`.
Run \`bunx --bun @yopem-ui/cli init\` to install tokens, reset CSS, StyleX helpers, dependencies, and the Oxlint plugin.
Init configures aliases, build plugins, and root styles. Conflicting configuration stops init.
Then run \`bunx --bun @yopem-ui/cli add button\` to install component source and required dependencies.

## CLI updates and safety

Preview updates with \`bunx --bun @yopem-ui/cli update button --dry-run\`.
Then run \`bunx --bun @yopem-ui/cli update button\`.
Use \`update base\` to update installed shared files.
Init and add keep local source changes; update reports modified files as conflicts.
Save local changes before using \`--force\` with add or update. Force can remove your changes.
Dry runs check and preview changes. They do not write files or run package-manager commands.
The \`ui.json\` manifest tracks installed files, hashes, registry URLs, and item versions.
The CLI uses the project's package manager and keeps existing dependency specifications when they are compatible.

Use \`--registry <URL>\` to select another registry for one command.
Registry URLs require HTTPS, except local HTTP. Do not include credentials, query strings, or fragments.
The CLI rejects redirects.

Interactive init offers design system guidance in DESIGN.md, AGENTS.md, or neither file.
Noninteractive init skips guidance by default.
Use \`init --guidance design\`, \`init --guidance agents\`, or \`init --guidance none\` to select without a prompt.
Guidance stays in the target app. Init preserves text outside the managed Yopem UI section.

## Monorepo installation

To initialize a workspace app, run \`bunx --bun @yopem-ui/cli init --cwd apps/web\`.
Then run \`bunx --bun @yopem-ui/cli add button --cwd apps/web\`.

To share UI source, run \`bunx --bun @yopem-ui/cli init --cwd apps/web --ui ../../packages/ui\`.
Then run \`bunx --bun @yopem-ui/cli add button --cwd packages/ui\`.
See the [CLI guide](${url("/docs/cli.md")}) for update commands.
The UI package must be an existing named React package in the same workspace.
The --ui path is relative to the target app.
Run init --ui for each consuming app.
Pass --ui again when you repeat init.
Source imports use the UI package name, such as \`@acme/ui/components/ui/button\`.

Init adds source exports and a workspace dependency.
It configures StyleX across both packages.
It enables Next.js transpilePackages.
It registers shared package imports with the Yopem UI Oxlint rules.
The CLI detects Bun, npm, pnpm, and Yarn package managers from the app and workspace root.
Files, dependencies, and tracking manifests stay in their target packages.
The CLI keeps locally edited source.
It does not migrate existing app-local components automatically.

## Styling and composition

Use \`stylex.create\` and semantic tokens from \`@/styles/tokens.stylex\`.
Pass styles through \`xstyle\`; components apply them after defaults and variants.
Input and Textarea use \`controlXstyle\` for wrappers and \`xstyle\` for native controls.
Use \`stylex.props\` on native or framework elements. Use \`className\` for external CSS integration.
Do not add utility classes, Tailwind, cva, inline style props, or styling aliases.

Use Box for generic containers and its render prop for semantic tags.
Choose Flex, Stack, HStack, VStack, Grid, Center, Container, AbsoluteCenter, Bleed, Float, or Wrap for layout.
Use Heading, Text, Blockquote, Em, Mark, Highlight, Prose, and Codeblock for content.
Keep framework links for application navigation. Native anchors remain valid for navigation and downloads.
Use existing form and overlay components. Preserve Base UI keyboard behavior, focus management, accessible names, and reduced motion.

## Themes and lint rules

Use neutral light and dark surfaces with semantic color pairs.
Use Inter for text and headings and IBM Plex Mono for code. Load both fonts in your app.
Use spacing and radius tokens instead of separate design values.

Theme switching adds theme.tsx and theme-provider.tsx to the base installation.
Use ThemeProvider, ThemeScript, and useTheme for light, dark, and system modes.
Use getRootThemeProps for the resolved light or dark root theme.
Keep defaultTheme and storageKey identical in ThemeScript and ThemeProvider.
Use the same theme configuration in getRootThemeProps, ThemeScript, and ThemeProvider.
Pass the CSP nonce to ThemeScript when required.

Yopem UI provides seven Oxlint rules: prefer-layout-primitives, no-restyle, enforce-styling-methods, static-stylex, no-raw-stylex-colors, no-unused-stylex-styles, and atoms.
See the lint guide for rule defaults, options, and file overrides.

## Documentation

${guideLinks}
- [Components](${url("/components.md")}): Browse all components

## Components

${componentLinks}

## Machine-readable resources

- [Registry index](${url("/r/registry.json")}): Component registry metadata
- [Component documentation JSON](${url("/r/docs/button.json")}): Description, usage, and API data; replace button with the registry item name
- [Registry schema](${url("/schema/registry.json")}): Registry index JSON schema
- [Registry item schema](${url("/schema/registry-item.json")}): Registry item JSON schema
- [Sitemap](${url("/sitemap.xml")}): Canonical public URLs
`
}

export function createComponentText(
  title: string,
  data: Awaited<ReturnType<typeof getDocumentation>>,
) {
  const preview = data.previewSource
    ? `\`\`\`tsx\n${data.previewSource.trim()}\n\`\`\``
    : "See Usage below for an example. No preview is available."

  const api = data.api
    .map((part) => {
      const properties = [...part.parameters, ...part.props]
        .map(
          (property) =>
            `- ${property.name}: ${property.type}${property.required ? " (required)" : ""}${property.default ? `; default ${property.default}` : ""}${property.description ? ` — ${property.description}` : ""}`,
        )
        .join("\n")

      return `### ${part.name}\n\n${part.aliasOf ? `Alias for ${part.aliasOf}.` : part.description}${properties ? `\n\n${properties}` : ""}${part.signatures.length ? `\n\n\`\`\`ts\n${part.signatures.join("\n")}\n\`\`\`` : ""}`
    })
    .join("\n\n")

  return `# ${title}\n\n${data.description}\n\n## Installation\n\n${cliRunners}\nRun \`bunx --bun @yopem-ui/cli init\` in a supported project.\nThen run \`bunx --bun @yopem-ui/cli add <component>\`.\nThe init command configures StyleX.\nThe add command installs required source files and dependencies.\n\n## Preview\n\n${preview}\n\n## Usage\n\n${data.notes.join("\n\n")}\n\n\`\`\`tsx\n${data.usage.trim()}\n\`\`\`\n\n## API reference\n\n${api}\n`
}

export function createGuideText(page: { content: string; title: string }) {
  let fenced = false

  const content = page.content
    .split("\n")
    .filter((line) => {
      if (/^(```|~~~)/.test(line)) fenced = !fenced

      return fenced || !/^<[A-Z][\w]*(?:\s[^>]*)?\s*\/>$/.test(line.trim())
    })
    .join("\n")
    .trim()

  return `# ${page.title}\n\n${content}\n`
}

export function createComponentIndexText(
  catalog: { slug: string; title: string }[],
) {
  return `# Components\n\n${catalog.map((item) => `- [${item.title}](/components/${item.slug}.md)`).join("\n")}\n`
}

export function markdownResponse(content: string, status = 200) {
  return new Response(content, {
    headers: {
      "Cache-Control": cacheControl,
      "Content-Type": "text/markdown; charset=utf-8",
    },
    status,
  })
}

export function textResponse(content: string, status = 200) {
  return new Response(content, {
    headers: {
      "Cache-Control": cacheControl,
      "Content-Type": "text/plain; charset=utf-8",
    },
    status,
  })
}
