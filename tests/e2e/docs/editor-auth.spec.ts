import { expect, test } from "@playwright/test"
import { z } from "zod"

const registryItemSchema = z.object({
  name: z.literal("editor-auth"),
  type: z.literal("registry:lib"),
  dependencies: z.array(z.string()),
  files: z.array(z.object({ path: z.string(), content: z.string() })),
})

test("editor authentication guide and source are published", async ({
  page,
}) => {
  await page.goto("/docs/editor-auth")
  await expect(
    page.getByRole("heading", { name: "Editor authentication", level: 1 }),
  ).toBeVisible()
  const markdown = await page.request.get("/docs/editor-auth.md")
  expect(markdown.ok()).toBe(true)
  expect(markdown.headers()["content-type"]).toContain("text/markdown")

  const response = await page.request.get("/r/editor-auth.json")
  expect(response.ok()).toBe(true)
  const item = registryItemSchema.parse(await response.json())
  expect(item.dependencies).toEqual(
    expect.arrayContaining([
      expect.stringMatching(/^jose@/),
      expect.stringMatching(/^zod@/),
    ]),
  )
  expect(
    item.files.some((file) => file.path === "lib/editor-auth/openauth.ts"),
  ).toBe(true)
  expect(
    item.files.some((file) => file.path === "lib/editor-auth/better-auth.ts"),
  ).toBe(true)
})

test("authentication installation uses selected package manager", async ({
  page,
}) => {
  await page.goto("/docs/editor-auth")

  for (const [name, command] of [
    ["Bun", "bunx --bun @yopem-ui/cli add editor-auth"],
    ["npm", "npx @yopem-ui/cli add editor-auth"],
    ["pnpm", "pnpm dlx @yopem-ui/cli add editor-auth"],
    ["Yarn", "yarn dlx @yopem-ui/cli add editor-auth"],
  ]) {
    await page.getByRole("button", { name, exact: true }).first().click()
    await expect(
      page.getByTestId("copyable-code").first().locator("pre"),
    ).toHaveText(command)
  }
})
