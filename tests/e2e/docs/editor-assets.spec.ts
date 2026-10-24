import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

test("@a11y asset storage guide is reachable and published", async ({
  page,
  request,
}, testInfo) => {
  await page.goto("/docs/editor-auth")
  const navigation = page.getByRole("button", { name: "Open navigation" })

  if (await navigation.isVisible()) await navigation.click()

  await page
    .getByRole("navigation", { name: "Documentation", exact: true })
    .getByRole("link", { name: "Private assets", exact: true })
    .click()
  await expect(page).toHaveURL(/\/docs\/editor-assets$/)
  await expect(
    page.getByRole("main").getByRole("heading", { level: 1 }),
  ).toBeVisible()

  const markdown = await request.get("/docs/editor-assets.md")
  expect(markdown.status()).toBe(200)
  expect(markdown.headers()["content-type"]).toContain("text/markdown")
  const llms = await request.get("/llms.txt")
  const sitemap = await request.get("/sitemap.xml")
  expect(await llms.text()).toContain(
    "https://ui.yopem.com/docs/editor-assets.md",
  )
  expect(await sitemap.text()).toContain(
    "https://ui.yopem.com/docs/editor-assets",
  )
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
  await page.screenshot({
    path: testInfo.outputPath("editor-assets-guide.png"),
    fullPage: true,
  })
})

test("asset server registry resource is published", async ({ request }) => {
  const response = await request.get("/r/editor-assets.json")
  expect(response.status()).toBe(200)
  expect(response.headers()["content-type"]).toContain("application/json")

  const item: {
    name: string
    registryDependencies: string[]
    files: { path: string }[]
  } = await response.json()

  expect(item.name).toBe("editor-assets")
  expect(item.registryDependencies).toContain("editor-store")
  expect(item.files.map((file) => file.path)).toEqual(
    expect.arrayContaining([
      "lib/editor-assets/index.ts",
      "lib/editor-assets/migrations/d1/0003-general-assets.sql",
      "lib/editor-assets/migrations/postgres/0003-general-assets.sql",
    ]),
  )
})

test("storage installation supports each package manager", async ({ page }) => {
  await page.goto("/docs/editor-assets")

  for (const [name, command] of [
    ["Bun", "bunx --bun @yopem-ui/cli add editor-assets"],
    ["npm", "npx @yopem-ui/cli add editor-assets"],
    ["pnpm", "pnpm dlx @yopem-ui/cli add editor-assets"],
    ["Yarn", "yarn dlx @yopem-ui/cli add editor-assets"],
  ]) {
    await page.getByRole("button", { name, exact: true }).first().click()
    await expect(
      page.getByTestId("copyable-code").first().locator("pre"),
    ).toHaveText(command)
  }
})
