import type { getDocumentation } from "@/catalog/docs.functions"

const cacheControl = "public, max-age=3600"

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

> Yopem UI provides source-owned, accessible React components with StyleX and Base UI. Initialize supported projects with \`bunx @yopem-ui/cli init\`. Install component source with the CLI. Change the copied source without a component package dependency.

## Monorepo installation

To initialize a workspace app, run \`bunx @yopem-ui/cli init --cwd apps/web\`.
Then run \`bunx @yopem-ui/cli add button --cwd apps/web\`.

To share UI source, run \`bunx @yopem-ui/cli init --cwd apps/web --ui ../../packages/ui\`.
Then run \`bunx @yopem-ui/cli add button --cwd packages/ui\` or \`bunx @yopem-ui/cli update button --cwd packages/ui\`.
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

## Documentation

${guideLinks}
- [Components](${url("/components.md")}): Browse all components

## Components

${componentLinks}

## Machine-readable resources

- [Registry index](${url("/r/registry.json")}): Component registry metadata
- [Sitemap](${url("/sitemap.xml")}): Canonical public URLs
`
}

export function createComponentText(
  title: string,
  data: Awaited<ReturnType<typeof getDocumentation>>,
) {
  const preview = data.previewSource
    ? `\`\`\`tsx\n${data.previewSource.trim()}\n\`\`\``
    : "No preview. See Usage below."

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

  return `# ${title}\n\n${data.description}\n\n## Installation\n\nRun \`bunx @yopem-ui/cli init\` in a supported project.\nThen run \`bunx @yopem-ui/cli add <component>\`.\nTo update a component, run \`bunx @yopem-ui/cli update <component>\`.\nThe init command configures StyleX.\nThe add command installs required source files and dependencies.\n\n## Preview\n\n${preview}\n\n## Usage\n\n${data.notes.join("\n\n")}\n\n\`\`\`tsx\n${data.usage.trim()}\n\`\`\`\n\n## API reference\n\n${api}\n`
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
