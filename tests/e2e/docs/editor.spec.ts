import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

test("editor guide is linked and published in public inventories", async ({
  page,
}) => {
  await page.goto("/docs/getting-started")

  const navigation = page.getByRole("button", {
    name: "Open navigation",
    exact: true,
  })

  if (await navigation.isVisible()) await navigation.click()

  await page.getByRole("link", { name: "Editor", exact: true }).first().click()
  await expect(page).toHaveURL(/\/docs\/editor$/)
  await expect(
    page.getByRole("heading", { name: "Editor", level: 1 }),
  ).toBeVisible()

  const markdown = await page.request.get("/docs/editor.md")
  expect(markdown.status()).toBe(200)
  expect(markdown.headers()["content-type"]).toContain("text/markdown")
  await page.getByRole("button", { name: "Search documentation" }).click()
  const search = page.getByRole("dialog", { name: "Search documentation" })
  await search
    .getByRole("searchbox", { name: "Search documentation" })
    .fill("Lexical")
  await expect(search.locator('a[href="/docs/editor"]').first()).toBeVisible()
  await page.keyboard.press("Escape")

  for (const path of ["/llms.txt", "/sitemap.xml"]) {
    const response = await page.request.get(path)
    expect(response.ok()).toBe(true)
    expect(await response.text()).toContain("/docs/editor")
  }
})

test("editor guide switches installation commands", async ({ page }) => {
  await page.goto("/docs/editor")

  for (const [name, command] of [
    ["Bun", "bunx --bun @yopem-ui/cli add editor"],
    ["npm", "npx @yopem-ui/cli add editor"],
    ["pnpm", "pnpm dlx @yopem-ui/cli add editor"],
    ["Yarn", "yarn dlx @yopem-ui/cli add editor"],
  ]) {
    await page.getByRole("button", { name, exact: true }).first().click()
    await expect(
      page.getByTestId("copyable-code").first().locator("pre"),
    ).toHaveText(command)
  }
})

test("@a11y editor guide has no violations before and after editing", async ({
  page,
}, testInfo) => {
  await page.goto("/docs/editor")

  const editor = page.getByRole("textbox", {
    name: "Rich text editor",
    exact: true,
  })

  await expect(editor).toHaveAttribute("contenteditable", "true")
  const initial = await new AxeBuilder({ page }).analyze()
  expect(initial.violations).toEqual([])
  await editor.fill("Accessible entry")
  await page
    .getByRole("toolbar", { name: "Rich text editor formatting", exact: true })
    .getByRole("button", { name: "Bullet list", exact: true })
    .click()
  await expect(editor.locator("ul li")).toHaveText("Accessible entry")
  const edited = await new AxeBuilder({ page }).analyze()
  await testInfo.attach("editor-axe.json", {
    body: JSON.stringify({ initial, edited }, null, 2),
    contentType: "application/json",
  })
  expect(edited.violations).toEqual([])
})
