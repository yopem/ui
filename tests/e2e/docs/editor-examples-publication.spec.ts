import { expect, test } from "@playwright/test"
import { z } from "zod"

const inventorySchema = z.object({
  examples: z
    .array(
      z.object({
        slug: z.string().min(1),
        title: z.string().min(1),
        url: z.string().startsWith("/editor/examples#"),
        standaloneUrl: z.string().startsWith("/editor/examples/").optional(),
        installNames: z.array(z.string().min(1)).min(1),
        limits: z.string().min(1),
      }),
    )
    .min(1),
})

test("core editor example inventory exposes usable resources", async ({
  request,
}) => {
  const response = await request.get("/api/editor-examples.json")
  expect(response.ok()).toBe(true)
  expect(response.headers()["content-type"]).toContain("application/json")
  const data: unknown = await response.json()
  const inventory = inventorySchema.parse(data)
  expect(new Set(inventory.examples.map((example) => example.slug)).size).toBe(
    inventory.examples.length,
  )

  const workspace = inventory.examples.find(
    (example) => example.slug === "notion-like",
  )

  expect(workspace?.url).toBe("/editor/examples#notion-like")
  expect(workspace?.standaloneUrl).toBe("/editor/examples/notion-like")
  expect(workspace?.installNames).toEqual(
    expect.arrayContaining([
      "editor",
      "editor-blocks",
      "editor-typeahead",
      "editor-block-selection",
      "editor-block-menu",
      "editor-floating-toolbar",
      "editor-document",
      "editor-math",
      "editor-toc",
      "editor-media",
      "clipboard",
      "grid",
      "menu",
      "popover",
      "scroll-area",
      "sheet",
    ]),
  )

  const page = await request.get("/editor/examples")
  expect(page.ok()).toBe(true)
  const markdown = await request.get("/editor/examples.md")
  expect(markdown.ok()).toBe(true)
  expect(markdown.headers()["content-type"]).toContain("text/markdown")
  const source = await markdown.text()
  expect(source).toContain("@/components/editor")
  expect(source).not.toContain("@registry/")

  for (const runner of ["bunx --bun", "npx", "pnpm dlx", "yarn dlx"]) {
    expect(source).toContain(`${runner} @yopem-ui/cli add editor`)
  }

  expect(source).not.toContain("@yopem-ui/editor")
})
