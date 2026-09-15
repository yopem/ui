import { runDocsSourceContract } from "@test/helpers/docs-source-contract"
import { expect, test } from "bun:test"

import {
  createComponentIndexText,
  createGuideText,
  createLlms,
  markdownResponse,
  textResponse,
} from "@/lib/plain-text"

runDocsSourceContract("lib/plain-text.ts")

const guidePage = {
  content: "Install it",
  title: "Installation",
  url: "/docs/install",
}
const guides = [guidePage]
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
  const guide = createGuideText(guidePage)
  const index = createComponentIndexText(components)

  expect(guide).toBe("# Installation\n\nInstall it\n")
  expect(index).toContain("[Pagination](/components/pagination.md)")
  expect(`${guide}${index}`).not.toMatch(/View code|On this page/)
})

test("text responses preserve status, cache, and content headers", async () => {
  const markdown = markdownResponse("Missing\n", 404)
  const text = textResponse("Index\n")

  expect(markdown.status).toBe(404)
  expect(markdown.headers.get("content-type")).toBe(
    "text/markdown; charset=utf-8",
  )
  expect(markdown.headers.get("cache-control")).toContain("max-age")
  expect(await markdown.text()).toBe("Missing\n")
  expect(text.status).toBe(200)
  expect(text.headers.get("content-type")).toBe("text/plain; charset=utf-8")
})
