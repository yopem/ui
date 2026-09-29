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

> Source-owned, accessible React components built with StyleX and Base UI. Initialize supported projects with \`bunx @yopem-ui/cli init\`, then install source with the CLI; customize it without package lock-in.

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

  return `# ${title}\n\n${data.description}\n\n## Installation\n\nRun \`bunx @yopem-ui/cli init\` in a supported project, then \`bunx @yopem-ui/cli add <component>\` (update: \`bunx @yopem-ui/cli update <component>\`). Init configures StyleX; add installs required source files and dependencies.\n\n## Preview\n\n${preview}\n\n## Usage\n\n${data.notes.join("\n\n")}\n\n\`\`\`tsx\n${data.usage.trim()}\n\`\`\`\n\n## API reference\n\n${api}\n`
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
