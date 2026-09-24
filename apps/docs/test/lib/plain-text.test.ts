import { expect, test } from "bun:test"
import { readFileSync } from "node:fs"

import {
  createComponentIndexText,
  createComponentText,
  createGuideText,
  createLlms,
} from "@/lib/plain-text"

const guides = [
  { content: "Install it", title: "Installation", url: "/docs/install" },
]
const components = [{ slug: "pagination", title: "Pagination" }]

test("llms index follows guide and component catalogs", () => {
  const llms = createLlms("http://localhost:3100", guides, components)

  expect(llms).toContain(
    "[Installation](http://localhost:3100/docs/install.md)",
  )
  expect(llms).toContain(
    "[Pagination](http://localhost:3100/components/pagination.md)",
  )
  expect(llms).toContain("bunx @yopem-ui/cli init")
  expect(llms).toContain("install source with the CLI or copy it manually")
})

test("component Markdown includes CLI initialization before add", () => {
  const markdown = createComponentText("Button", {
    title: "Button",
    description: "Button description",
    usage: "<Button />",
    examples: [],
    notes: [],
    dependencies: [],
    devDependencies: [],
    peerDependencies: [],
    installNames: ["button"],
    requiredItems: [],
    files: [],
    api: [],
  })

  expect(markdown).toContain("bunx @yopem-ui/cli init")
  expect(markdown.indexOf("cli init")).toBeLessThan(
    markdown.indexOf("cli add <component>"),
  )
  expect(markdown).toContain("configure StyleX manually")
})

test("Markdown pages contain content without interface controls", () => {
  const guide = createGuideText(guides[0]!)
  const index = createComponentIndexText(components)

  expect(guide).toBe("# Installation\n\nInstall it\n")
  expect(index).toContain("[Pagination](/components/pagination.md)")
  expect(`${guide}${index}`).not.toMatch(/View code|On this page/)
})

test("guide Markdown excludes interactive MDX widgets but retains code", () => {
  const markdown = createGuideText({
    title: "Installation",
    content:
      "## Setup\n\n<InstallationMethods />\n\n```tsx\n<InstallationMethods />\n```",
  })
  expect(markdown).toContain("## Setup")
  expect(markdown.match(/<InstallationMethods \/>/g)).toHaveLength(1)
  expect(markdown).toContain("```tsx\n<InstallationMethods />\n```")
})

test("installation Markdown comes from authored MDX", () => {
  const content = readFileSync(
    new URL("../../src/content/installation.mdx", import.meta.url),
    "utf8",
  )
  const markdown = createGuideText({ title: "Installation", content })
  expect(markdown).toContain("# Installation\n")
  expect(markdown).toContain("bunx @yopem-ui/cli init")
  expect(markdown).toContain("### TanStack Start")
  expect(markdown).not.toContain("<InstallationMethods />")
})
