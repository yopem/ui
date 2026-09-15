import { expect, test } from "bun:test"

import {
  createComponentIndexText,
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
})

test("Markdown pages contain content without interface controls", () => {
  const guide = createGuideText(guides[0]!)
  const index = createComponentIndexText(components)

  expect(guide).toBe("# Installation\n\nInstall it\n")
  expect(index).toContain("[Pagination](/components/pagination.md)")
  expect(`${guide}${index}`).not.toMatch(/View code|On this page/)
})
