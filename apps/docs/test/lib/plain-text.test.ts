import { expect, test } from "bun:test"

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
