import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"
test("component docs show live preview and copyable source", async ({
  context,
  page,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"])
  await page.goto("/components/button")
  await expect(
    page.getByRole("button", { name: "Button", exact: true }),
  ).toBeVisible()
  await page
    .getByRole("button", { name: "Copy Clickable default action source" })
    .click()
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toContain("function Preview")
})

test("sidebar links to llms.txt", async ({ page }) => {
  test.skip((page.viewportSize()?.width ?? 0) < 768, "Desktop navigation only")
  await page.goto("/")

  await expect(page.getByRole("link", { name: "llms.txt" })).toHaveAttribute(
    "href",
    "/llms.txt",
  )
})

test("documentation navigation has no separator borders", async ({ page }) => {
  test.skip((page.viewportSize()?.width ?? 0) < 768, "Desktop sidebar only")
  await page.goto("/")
  await expect(page.getByRole("banner")).toHaveCSS("border-bottom-width", "0px")
  await expect(page.getByRole("complementary").first()).toHaveCSS(
    "border-inline-end-width",
    "0px",
  )
  await expect(
    page.getByRole("group", { name: "Appearance" }).last(),
  ).toHaveCSS("border-top-width", "0px")
})

test("unknown routes show the docs not found page", async ({ page }) => {
  const response = await page.goto("/missing-page")
  expect(response?.status()).toBe(404)
  await expect(
    page.getByRole("heading", { name: "Page not found", level: 1 }),
  ).toBeVisible()
  await expect(
    page.getByRole("link", { name: "Return to documentation home" }),
  ).toBeVisible()
})

test("MDX guides render sections, anchors, and copyable snippets", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1600, height: 900 })
  await page.goto("/docs/getting-started")
  await expect(
    page.getByRole("heading", { name: "What you need" }),
  ).toBeVisible()
  await expect(
    page.getByRole("link", { name: "2. Copy Button" }),
  ).toHaveAttribute("href", "#2-copy-button")
  await expect(
    page.getByRole("button", { name: "Copy Code" }).first(),
  ).toBeEnabled()
  await expect(page.locator("#copy-button")).toHaveCount(1)
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
})

test("minimal setup and StyleX customization are documented", async ({
  page,
}) => {
  await page.goto("/docs/installation")
  await expect(page.getByRole("tab", { name: "CLI" })).toBeVisible()
  await expect(
    page.getByRole("button", { name: "Copy Initialize project with CLI" }),
  ).toBeEnabled()
  await page.getByRole("tab", { name: "CLI" }).focus()
  await page.keyboard.press("ArrowRight")
  await expect(page.getByRole("tab", { name: "Manual" })).toBeFocused()
  await page.keyboard.press("Enter")
  await expect(page.getByRole("tab", { name: "Manual" })).toHaveAttribute(
    "aria-selected",
    "true",
  )
  await expect(
    page.getByRole("button", { name: /^Copy src\/(styles|lib)\// }),
  ).toHaveCount(3)
  await page.goto("/docs/theming")
  await expect(
    page.getByRole("heading", { name: "Component overrides", exact: true }),
  ).toBeVisible()
  await expect(
    page.getByRole("heading", { name: "How theming works", exact: true }),
  ).toBeVisible()
  await expect(
    page.getByRole("heading", { name: "Add dark mode", exact: true }),
  ).toBeVisible()
  await expect(
    page.getByRole("button", { name: /^Copy src\/theme\// }),
  ).toHaveCount(2)
})

test("component docs cover setup, source files, and API", async ({ page }) => {
  const missingStyles: string[] = []
  page.on("response", (response) => {
    if (
      response.request().resourceType() === "stylesheet" &&
      response.status() >= 400
    )
      missingStyles.push(response.url())
  })
  await page.goto("/components/button")
  expect(missingStyles).toEqual([])
  await expect(
    page.getByRole("heading", { name: "Button", exact: true, level: 1 }),
  ).toBeVisible()
  await expect(
    page.getByRole("heading", { name: "API reference", exact: true }),
  ).toBeVisible()
  await expect(
    page.getByRole("button", { name: "Copy Button usage", exact: true }),
  ).toBeEnabled()
  await expect(page.getByRole("tab", { name: "CLI" })).toHaveAttribute(
    "aria-selected",
    "true",
  )
  await expect(
    page.getByRole("button", {
      name: "Copy Initialize StyleX project with CLI",
    }),
  ).toBeEnabled()
  await expect(
    page.getByRole("button", { name: "Copy Install Button with CLI" }),
  ).toBeEnabled()
  await expect(
    page.getByRole("button", { name: "Copy Update Button with CLI" }),
  ).toBeEnabled()
  await page.getByRole("tab", { name: "Manual" }).click()
  const sourceHeader = page
    .getByText("src/components/ui/button.tsx", { exact: true })
    .locator("..")
  await expect(sourceHeader).toBeVisible()
  await expect(
    sourceHeader.getByRole("button", {
      name: "Copy src/components/ui/button.tsx",
      exact: true,
    }),
  ).toBeVisible()
  await expect(
    page.getByRole("button", {
      name: "Copy src/components/ui/spinner.tsx",
      exact: true,
    }),
  ).toBeVisible()
  await page
    .locator("summary")
    .filter({ hasText: "View API reference" })
    .click()
  const api = page.getByRole("region", { name: "Button", exact: true })
  await api
    .locator("summary")
    .filter({ hasText: "Type signature" })
    .first()
    .click()
  await expect(
    api.getByRole("button", { name: "Copy Button signature", exact: true }),
  ).toBeVisible()
  await expect(
    api.getByRole("row").filter({ hasText: "loading" }),
  ).toContainText("false")
  await expect(api.getByRole("row").filter({ hasText: "onClick" })).toHaveCount(
    0,
  )
  await expect(
    page.getByRole("heading", {
      name: "Clickable default action",
      exact: true,
    }),
  ).toBeVisible()
  await expect(
    page.getByRole("button", { name: "Copy Clickable default action source" }),
  ).toBeVisible()
  const viewCode = page.getByRole("button", { name: "View code", exact: true })
  const collapsedCodeCount = await viewCode.count()
  await viewCode.first().click()
  await expect(viewCode).toHaveCount(collapsedCodeCount - 1)
  await expect(
    page.getByText(/inherited React and HTML properties/i),
  ).toHaveCount(0)
})

test("copy buttons copy source, not installation commands", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"])
  await page.goto("/components/button")
  await page
    .getByRole("button", { name: "Copy Button usage", exact: true })
    .click()
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toContain('from "@/components/ui/button"')
  await page.getByRole("tab", { name: "Manual" }).click()
  await page
    .getByRole("button", {
      name: "Copy src/components/ui/button.tsx",
      exact: true,
    })
    .click()
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toContain("export function Button")
})

test("clipboard failures explain manual copying", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: () => Promise.reject(new Error("Clipboard blocked")),
      },
    })
  })
  await page.goto("/components/button")
  await expect(
    page.getByRole("button", { name: "Copy Button usage", exact: true }),
  ).toBeEnabled()
  await page.getByRole("tab", { name: "Manual" }).click()
  await page
    .getByRole("button", {
      name: "Copy src/components/ui/button.tsx",
      exact: true,
    })
    .click()
  await expect(
    page.getByRole("status").filter({ hasText: /copy|clipboard/i }),
  ).toContainText(/select|manual|blocked|failed|could not|couldn't/i)
})

test("StyleX search opens, finds a component, and navigates", async ({
  page,
}) => {
  await page.goto("/components/button")
  await expect(
    page.getByRole("button", { name: "Copy Button usage", exact: true }),
  ).toBeEnabled()
  await page.getByRole("button", { name: "Search documentation" }).click()
  const dialog = page.getByRole("dialog", { name: "Search documentation" })
  await expect(dialog).toBeVisible()
  await dialog
    .getByRole("searchbox", { name: "Search documentation" })
    .fill("sidebar")
  await dialog
    .getByRole("link", { name: /Sidebar/ })
    .first()
    .click()
  await page.waitForURL("**/components/sidebar")
  await expect(dialog).not.toBeVisible()
  await expect(
    page.getByRole("heading", { name: "Sidebar", exact: true, level: 1 }),
  ).toBeVisible()
})

test("dark theme uses StyleX classes without inline color-scheme", async ({
  page,
}) => {
  await page.addInitScript(() => localStorage.setItem("yopem-ui-theme", "dark"))
  await page.goto("/components/button")
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark")
  await expect(page.locator("html")).toHaveCSS("color-scheme", "dark")
  await expect(page.locator("html")).toHaveCSS("--foreground", /\S/)
  await expect(page.getByRole("main")).toHaveCSS("font-family", /Figtree/)
  await expect(page.getByRole("main")).not.toHaveCSS("color", "rgb(0, 0, 0)")
  await expect(page.locator('link[href*="virtual:stylex"]')).toHaveCount(0)
  await expect(page.locator("html")).not.toHaveAttribute(
    "style",
    /color-scheme/,
  )
})

test("main document scrolls normally and restores position on back navigation", async ({
  page,
}) => {
  await page.goto("/components/sidebar")
  await expect(
    page.getByRole("button", { name: "Copy Sidebar usage", exact: true }),
  ).toBeEnabled()
  const main = await page.getByRole("main").boundingBox()
  const viewport = page.viewportSize()!
  if (!main) throw new Error("Main documentation region is missing")
  await page.mouse.move(
    main.x + Math.min(main.width / 2, viewport.width - main.x - 24),
    Math.min(viewport.height / 2, 400),
  )
  await page.mouse.wheel(0, 650)
  await expect
    .poll(() => page.evaluate(() => window.scrollY))
    .toBeGreaterThan(100)
  const lower = await page.evaluate(() => window.scrollY)
  await page.mouse.wheel(0, -350)
  await expect
    .poll(() => page.evaluate(() => window.scrollY))
    .toBeLessThan(lower)
  await expect
    .poll(() =>
      page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
    )
    .toBeLessThanOrEqual(1)

  const saved = await page.evaluate(() => window.scrollY)
  expect(saved).toBeGreaterThan(0)
  await page.getByRole("link", { name: "Yopem UI", exact: true }).click()
  await page.waitForURL((url) => url.pathname === "/")
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "React components you copy, own, and change.",
  )
  await page.goBack()
  await page.waitForURL("**/components/sidebar")
  await expect
    .poll(() => page.evaluate(() => window.scrollY))
    .toBeGreaterThanOrEqual(Math.max(0, saved - 10))
  await expect
    .poll(() => page.evaluate(() => window.scrollY))
    .toBeLessThanOrEqual(saved + 10)
})

test("desktop table of contents stays fixed and tracks the section", async ({
  page,
}) => {
  test.skip((page.viewportSize()?.width ?? 0) < 1280, "Desktop navigation only")
  await page.setViewportSize({ width: 1600, height: 900 })
  await page.goto("/components/accordion")
  const contents = page.getByRole("complementary", { name: "On this page" })
  const preview = contents.getByRole("link", { name: "Preview", exact: true })
  await expect(contents).toBeVisible()

  await preview.click()
  await expect(preview).toHaveAttribute("aria-current", "location")
  const fixedTop = (await contents.boundingBox())?.y
  await page.mouse.wheel(0, 300)
  await expect
    .poll(async () => (await contents.boundingBox())?.y)
    .toBeCloseTo(fixedTop ?? 0, 0)
})

test("search supports keyboard opening, empty results, errors, and focus restoration", async ({
  page,
}) => {
  await page.goto("/components/button")
  await page.route("**/api/search?query=*", (route) =>
    route.fulfill({ contentType: "application/json", body: "[]" }),
  )
  const trigger = page.getByRole("button", { name: "Search documentation" })
  await trigger.press("Control+KeyK")
  const dialog = page.getByRole("dialog", { name: "Search documentation" })
  const input = dialog.getByRole("searchbox", { name: "Search documentation" })
  await expect(dialog).toBeVisible()
  await expect(input).toBeFocused()
  await input.fill("no-such-documentation-result")
  await expect(dialog.getByRole("status")).toHaveText("0 results")
  await page.keyboard.press("Escape")
  await expect(dialog).toBeHidden()
  await expect(trigger).toBeFocused()

  await page.unroute("**/api/search?query=*")
  await page.route("**/api/search?query=*", (route) =>
    route.fulfill({ status: 503 }),
  )
  await trigger.press("Control+KeyK")
  await input.fill("button")
  await expect(dialog.getByRole("status")).toContainText("Search unavailable")
})

test("mobile navigation changes theme and restores trigger focus", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto("/components/button")
  const trigger = page.getByRole("button", { name: "Open navigation" })
  await trigger.click()
  const dialog = page.getByRole("dialog", { name: "Documentation" })
  await expect(dialog).toBeVisible()
  await dialog.getByRole("button", { name: "Dark" }).click()
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark")
  expect(
    await page.evaluate(() => localStorage.getItem("yopem-ui-theme")),
  ).toBe("dark")
  await page.keyboard.press("Escape")
  await expect(dialog).toBeHidden()
  await expect(trigger).toBeFocused()
})

test("setup guide explains StyleX setup and shared files", async ({ page }) => {
  await page.goto("/docs/installation")
  const title = page.getByRole("heading", {
    name: "Installation",
    exact: true,
  })
  await expect(title).toBeVisible()
  await expect(title).toHaveCSS("font-size", /^(34|44)px$/)
  await expect(
    page.getByText("@rolldown/plugin-babel", { exact: false }).first(),
  ).toBeVisible()
  await expect(
    page.getByRole("heading", {
      name: "4. Configure your framework",
      exact: true,
    }),
  ).toBeVisible()
  await expect(
    page.getByRole("heading", {
      name: "3. Initialize setup",
      exact: true,
    }),
  ).toBeVisible()
})
