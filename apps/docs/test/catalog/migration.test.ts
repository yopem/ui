import { expect, test } from "bun:test"
import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"

const sourceRoot = join(import.meta.dir, "../../src")

function sourceFiles(directory = sourceRoot, prefix = ""): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const relative = join(prefix, entry.name)
    const file = join(directory, entry.name)
    if (entry.isDirectory()) return sourceFiles(file, relative)
    if (!/\.(tsx|ts)$/.test(entry.name)) return []
    return [file]
  })
}

function readSources() {
  return sourceFiles().map((file) => readFileSync(file, "utf8"))
}

test("docs source has no html component namespace", () => {
  for (const source of readSources()) {
    expect(source).not.toContain("@/components/ui/stylex/html")
    expect(source).not.toContain("@/components/ui/html")
    expect(source).not.toContain("@registry/components/ui/html")
    expect(source).not.toContain("<html.")
    expect(source).not.toMatch(/<Box\b[^>]*\bas="(?:a|p|h[1-6])"/)
  }
})

test("docs migration keeps semantic and layout primitive contracts", () => {
  const docsPage = readFileSync(
    join(sourceRoot, "catalog/docs-page.tsx"),
    "utf8",
  )
  const docsLayout = readFileSync(
    join(sourceRoot, "catalog/docs-layout.tsx"),
    "utf8",
  )
  const introduction = readFileSync(
    join(sourceRoot, "routes/index.tsx"),
    "utf8",
  )
  const guide = readFileSync(
    join(sourceRoot, "catalog/guide-content.tsx"),
    "utf8",
  )
  const rootDocument = readFileSync(
    join(sourceRoot, "routes/__root.tsx"),
    "utf8",
  )
  const ogImage = readFileSync(join(sourceRoot, "lib/og.tsx"), "utf8")

  expect(docsPage).toContain("<Grid")
  expect(docsPage).toContain('<Heading as="h1"')
  expect(docsPage).toContain("<Paragraph")
  expect(docsPage).toMatch(/<Box\s+as="article"/)
  expect(docsLayout).toContain("<Grid xstyle={styles.frame}")
  expect(docsLayout).toContain("<UiLink href=")
  expect(docsLayout).toContain('<Link to="/"')
  expect(introduction).toContain("<GuidePage")
  expect(guide).toContain("<DocsPage")
  expect(guide).toContain('as="h2"')
  expect(guide).toContain('as="h3"')
  expect(rootDocument).toContain("<html")
  expect(rootDocument).toContain("<head>")
  expect(rootDocument).toContain("<body>")
  expect(ogImage).toContain("<div")
  expect(ogImage).not.toContain("stylex/html")
})
