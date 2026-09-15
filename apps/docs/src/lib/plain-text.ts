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

> Source-owned, accessible React components built with StyleX and Base UI. Copy complete component source into your project and customize it without package lock-in.

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
  const dependencies = [
    ...data.dependencies,
    ...data.devDependencies.map((dependency) => `${dependency} (development)`),
    ...data.peerDependencies.map((dependency) => `${dependency} (peer)`),
  ]
  const files = data.files
    .map(
      (file) => `### ${file.target}\n\n\`\`\`\n${file.content.trim()}\n\`\`\``,
    )
    .join("\n\n")
  const examples = data.examples
    .flatMap((group) =>
      group.examples.map(
        (example) =>
          `### ${group.label}: ${example.label}\n\n\`\`\`tsx\n${example.source.trim()}\n\`\`\``,
      ),
    )
    .join("\n\n")
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

  return `# ${title}\n\n${data.description}\n\n## Installation\n\n${dependencies.map((dependency) => `- ${dependency}`).join("\n")}\n\nRequired components and files: ${data.requiredItems.map((item) => item.title).join(", ")}.\n\n${files}\n\n## Examples\n\n${examples || "No examples."}\n\n## Usage\n\n${data.notes.join("\n\n")}\n\n\`\`\`tsx\n${data.usage.trim()}\n\`\`\`\n\n## API reference\n\n${api}\n`
}

export function createGuideText(page: { content: string; title: string }) {
  return `# ${page.title}\n\n${page.content}\n`
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
