import { expect, test } from "@playwright/test"
import { z } from "zod"

const inventorySchema = z.object({
  examples: z
    .array(
      z.object({
        slug: z.string().min(1),
        title: z.string().min(1),
        url: z.string().startsWith("/editor/examples#"),
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

  const page = await request.get("/editor/examples")
  expect(page.ok()).toBe(true)
  const markdown = await request.get("/editor/examples.md")
  expect(markdown.ok()).toBe(true)
  expect(markdown.headers()["content-type"]).toContain("text/markdown")
  const source = await markdown.text()
  expect(source).toContain("@/components/editor")
  expect(source).not.toContain("@registry/")
  expect(source).not.toContain("@yopem-ui/editor")
})
