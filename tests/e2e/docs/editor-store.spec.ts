import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

test("@a11y document storage guide is reachable and published", async ({
  page,
  request,
}, testInfo) => {
  await page.goto("/docs/editor-auth")
  const navigation = page.getByRole("button", { name: "Open navigation" })

  if (await navigation.isVisible()) await navigation.click()

  await page
    .getByRole("navigation", { name: "Documentation", exact: true })
    .getByRole("link", { name: "Editor document storage", exact: true })
    .click()
  await expect(page).toHaveURL(/\/docs\/editor-store$/)
  await expect(
    page.getByRole("main").getByRole("heading", { level: 1 }),
  ).toBeVisible()

  const markdown = await request.get("/docs/editor-store.md")
  expect(markdown.status()).toBe(200)
  expect(markdown.headers()["content-type"]).toContain("text/markdown")
  const llms = await request.get("/llms.txt")
  const sitemap = await request.get("/sitemap.xml")
  expect(await llms.text()).toContain(
    "https://ui.yopem.com/docs/editor-store.md",
  )
  expect(await sitemap.text()).toContain(
    "https://ui.yopem.com/docs/editor-store",
  )
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
  await page.screenshot({
    path: testInfo.outputPath("editor-store-guide.png"),
    fullPage: true,
  })
})

test("storage installation supports each package manager", async ({ page }) => {
  await page.goto("/docs/editor-store")

  for (const [name, command] of [
    ["Bun", "bunx --bun @yopem-ui/cli add editor-store"],
    ["npm", "npx @yopem-ui/cli add editor-store"],
    ["pnpm", "pnpm dlx @yopem-ui/cli add editor-store"],
    ["Yarn", "yarn dlx @yopem-ui/cli add editor-store"],
  ]) {
    await page.getByRole("button", { name, exact: true }).first().click()
    await expect(
      page.getByTestId("copyable-code").first().locator("pre"),
    ).toHaveText(command)
  }
})
