import { expect, test } from "@playwright/test"

test("minimal setup and StyleX customization are documented", async ({
  page,
}) => {
  await page.goto("/docs/installation")
  await expect(
    page.locator("summary").filter({ hasText: "src/yopem/" }),
  ).toHaveCount(3)
  await page.goto("/docs/theming")
  await expect(
    page.getByRole("heading", { name: "Component overrides", exact: true }),
  ).toBeVisible()
  await expect(
    page.getByRole("heading", {
      name: "Global and scoped themes",
      exact: true,
    }),
  ).toBeVisible()
  await expect(
    page.locator("summary").filter({ hasText: "src/yopem/theme/" }),
  ).toHaveCount(2)
})

test("component docs cover setup, source files, and API", async ({ page }) => {
  await page.addInitScript(() => {
    new MutationObserver((records) => {
      if (
        records.some((record) =>
          [...record.addedNodes].some((node) =>
            node.textContent?.includes("Loading example"),
          ),
        )
      )
        document.documentElement.dataset.loadingExampleSeen = "true"
    }).observe(document, { childList: true, subtree: true })
  })
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
  await page
    .locator("summary")
    .filter({ hasText: "src/yopem/components/ui/button.tsx" })
    .click()
  await page
    .locator("summary")
    .filter({ hasText: "src/yopem/components/ui/spinner.tsx" })
    .click()
  await expect(
    page.getByRole("button", {
      name: "Copy src/yopem/components/ui/button.tsx",
      exact: true,
    }),
  ).toBeVisible()
  await expect(
    page.getByRole("button", {
      name: "Copy src/yopem/components/ui/spinner.tsx",
      exact: true,
    }),
  ).toBeVisible()
  await expect(page.getByText("npx @yopem/ui", { exact: false })).toHaveCount(0)
  await expect(
    page.getByRole("button", {
      name: "Copy src/yopem/components/ui/button.tsx",
      exact: true,
    }),
  ).toBeEnabled()
  const api = page.getByRole("region", { name: "Button", exact: true })
  await expect(
    api.getByRole("row").filter({ hasText: "loading" }),
  ).toContainText("false")
  await expect(api.getByRole("row").filter({ hasText: "onClick" })).toHaveCount(
    0,
  )
  await expect(
    page.getByRole("heading", { name: "Default", exact: true }),
  ).toBeVisible()
  expect(
    await page.locator("html").getAttribute("data-loading-example-seen"),
  ).toBeNull()
  await expect(
    page.getByRole("heading", { name: "Button variant", exact: true }),
  ).toBeVisible()
  await expect(
    page.getByRole("heading", { name: "Button size", exact: true }),
  ).toBeVisible()
  await expect(
    page.getByText(/inherited React and HTML properties/i),
  ).toHaveCount(0)
  await expect(page.getByText(/Browse all \d+ examples/i)).toHaveCount(0)
})

test("copy buttons copy source, not installation commands", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"])
  await page.goto("/components/button")
  await page
    .locator("summary")
    .filter({ hasText: "src/yopem/components/ui/button.tsx" })
    .click()
  await page
    .getByRole("button", {
      name: "Copy src/yopem/components/ui/button.tsx",
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
  await page
    .locator("summary")
    .filter({ hasText: "src/yopem/components/ui/button.tsx" })
    .click()
  await page
    .getByRole("button", {
      name: "Copy src/yopem/components/ui/button.tsx",
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
  await page.getByRole("button", { name: /^Search docs/ }).click()
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
  await expect(page.getByRole("main")).toHaveCSS("font-family", /Inter/)
  await expect(page.getByRole("main")).not.toHaveCSS("color", "rgb(0, 0, 0)")
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
    "React components.",
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

test("setup guide explains compiler and shared files", async ({ page }) => {
  await page.goto("/docs/installation")
  await expect(
    page.getByRole("heading", { name: "Installation", exact: true }),
  ).toBeVisible()
  await expect(
    page.getByText("@stylexjs/unplugin", { exact: false }).first(),
  ).toBeVisible()
  await expect(
    page.getByRole("heading", { name: "Load styles and theme", exact: true }),
  ).toBeVisible()
})
