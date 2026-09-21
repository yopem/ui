import { expect, test } from "@playwright/test"
import { readdirSync } from "node:fs"
import { resolve } from "node:path"

const exampleCount = readdirSync(
  resolve(
    import.meta.dirname,
    "../../apps/docs/src/components/examples/stylex",
  ),
).filter((file) => file.endsWith(".tsx")).length

test("examples page lists, filters, copies, and opens examples", async ({
  context,
  page,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"])
  await page.goto("/examples")
  await expect(
    page.getByRole("heading", { name: "Browse examples", level: 1 }),
  ).toBeVisible()
  await expect(
    page.getByText(`${exampleCount} examples`, { exact: true }),
  ).toBeVisible()

  await page.getByRole("searchbox", { name: "Search examples" }).fill("button")
  await expect(page.getByText("40 examples", { exact: true })).toBeVisible()
  const firstExample = page.getByRole("link", {
    name: "Button 1",
    exact: true,
  })
  await expect(firstExample).toBeVisible()
  await page
    .getByRole("button", { name: "Copy Button 1 code", exact: true })
    .click()
  await expect(
    page.getByRole("button", {
      name: "Button 1 code copied",
      exact: true,
    }),
  ).toBeVisible()
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toContain("export default function Example")

  await firstExample.click()
  await page.waitForURL(
    (url) =>
      url.pathname === "/examples/p-button-1" &&
      (url.searchParams.get("theme") === "light" ||
        url.searchParams.get("theme") === "dark"),
  )
  await expect(page.locator("[data-example-root]")).toBeVisible()
})

test("sidebar links to llms.txt", async ({ page }) => {
  test.skip((page.viewportSize()?.width ?? 0) < 768, "Desktop navigation only")
  await page.goto("/")

  await expect(page.getByRole("link", { name: "llms.txt" })).toHaveAttribute(
    "href",
    "/llms.txt",
  )
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

test("minimal setup and StyleX customization are documented", async ({
  page,
}) => {
  await page.goto("/docs/installation")
  await expect(
    page.getByRole("button", { name: /^Copy src\/(styles|lib)\// }),
  ).toHaveCount(6)
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
  await expect(
    page.getByRole("button", { name: "Copy Button usage", exact: true }),
  ).toBeEnabled()
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
  await expect(page.getByText("npx @yopem/ui", { exact: false })).toHaveCount(0)
  await expect(
    page.getByRole("button", {
      name: "Copy src/components/ui/button.tsx",
      exact: true,
    }),
  ).toBeEnabled()
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
  const defaultExample = page
    .getByRole("heading", { name: "Default", exact: true })
    .locator("..")
  await expect(defaultExample).toBeVisible()
  await expect(
    page.getByRole("button", { name: "Copy Default example", exact: true }),
  ).toBeVisible()
  await expect(
    defaultExample.getByRole("button", { name: "View code", exact: true }),
  ).toHaveCount(0)
  const viewCode = page.getByRole("button", { name: "View code", exact: true })
  const collapsedCodeCount = await viewCode.count()
  await viewCode.first().click()
  await expect(viewCode).toHaveCount(collapsedCodeCount - 1)
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
  await expect(
    page.getByRole("button", { name: "Copy Button usage", exact: true }),
  ).toBeEnabled()
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
  await expect(page.getByRole("main")).toHaveCSS("font-family", /Figtree/)
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
  await page.goto("/components/accordion")
  const contents = page.getByRole("complementary", { name: "On this page" })
  const examples = contents.getByRole("link", { name: "Examples", exact: true })
  await expect(contents).toBeVisible()

  await examples.click()
  await expect(examples).toHaveAttribute("aria-current", "location")
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
  const trigger = page.getByRole("button", { name: /^Search docs/ })
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

test("examples pagination resets when filtering and reports no matches", async ({
  page,
}) => {
  await page.goto("/examples")
  const cards = page.getByRole("main").locator("article article")
  await expect(cards).toHaveCount(24)
  await page.getByRole("button", { name: "Show 24 more" }).click()
  await expect(cards).toHaveCount(48)

  const search = page.getByRole("searchbox", { name: "Search examples" })
  await search.fill("button")
  await expect(cards).toHaveCount(24)
  await expect(page.getByRole("button", { name: "Show 16 more" })).toBeVisible()
  await search.fill("no-such-example")
  await expect(
    page.getByText("No examples match “no-such-example”."),
  ).toBeVisible()
  await expect(cards).toHaveCount(0)
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

test("setup guide explains compiler and shared files", async ({ page }) => {
  await page.goto("/docs/installation")
  await expect(
    page.getByRole("heading", { name: "Installation", exact: true }),
  ).toBeVisible()
  await expect(
    page.getByText("@stylexjs/unplugin", { exact: false }).first(),
  ).toBeVisible()
  await expect(
    page.getByRole("heading", {
      name: "4. Configure your framework",
      exact: true,
    }),
  ).toBeVisible()
  await expect(
    page.getByRole("heading", {
      name: "3. Copy shared files",
      exact: true,
    }),
  ).toBeVisible()
})
