import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

for (const [component, tag] of [
  ["em", "em"],
  ["mark", "mark"],
  ["prose", "h2"],
]) {
  test(`${component} preview preserves content semantics`, async ({
    page,
  }, testInfo) => {
    await page.goto(`/components/${component}`)
    const main = page.getByRole("main")

    const preview = main.getByLabel(/live preview$/).first()

    const contentElement = preview.locator(tag).first()

    await expect(contentElement).toBeVisible()
    await testInfo.attach("primitive-preview", {
      body: await page.screenshot({ animations: "disabled" }),
      contentType: "image/png",
    })
  })
}

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
  const source = await page.evaluate(() => navigator.clipboard.readText())
  expect(source).toContain('from "@/components/ui/button"')
  expect(source).not.toContain("@registry/")
  await expect(
    page.getByRole("group", { name: "Clickable default action source" }),
  ).toContainText('from "@/components/ui/button"')
})

test("@a11y component code blocks preserve shell highlighting", async ({
  page,
}, testInfo) => {
  await page.goto("/components/flex")

  const code = page.getByRole("group", {
    name: "Install Flex with CLI",
    exact: true,
  })

  await expect(code.locator("pre code")).toContainText("bunx")
  await expect(code.locator("code span[style*='color']").first()).toBeVisible()

  await testInfo.attach("highlighted-code", {
    body: await page.screenshot(),
    contentType: "image/png",
  })
})

for (const [guide, format, content, codeTitle] of [
  ["installation", "shell", "bunx", "Initialize project with CLI"],
  ["lint", "JSON", '"jsPlugins"', "Code"],
  ["getting-started", "TSX", "import", "Code"],
]) {
  test(`@a11y ${guide} code blocks preserve ${format} highlighting`, async ({
    page,
  }, testInfo) => {
    await page.goto(`/docs/${guide}`)

    const code = page
      .getByRole("group", { name: codeTitle, exact: true })
      .filter({ hasText: content })
      .first()

    await expect(code.locator("pre code")).toContainText(content)
    await expect(
      code.locator("code span[style*='color']").first(),
    ).toBeVisible()
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
    await testInfo.attach("highlighted-code", {
      body: await page.screenshot(),
      contentType: "image/png",
    })
  })
}

test("search waits for client hydration before accepting clicks", async ({
  page,
}) => {
  const scripts = Promise.withResolvers<void>()
  await page.route("**/assets/*.js", async (route) => {
    await scripts.promise
    await route.continue()
  })

  try {
    await page.goto("/components/button", { waitUntil: "commit" })
    const trigger = page.getByRole("button", { name: "Search documentation" })
    await expect(trigger).toBeDisabled()
    scripts.resolve()
    await expect(trigger).toBeEnabled()
    await trigger.click()
    await expect(
      page.getByRole("dialog", { name: "Search documentation" }),
    ).toBeVisible()
  } finally {
    scripts.resolve()
  }
})

test("sidebar links to llms.txt", async ({ page }) => {
  test.skip((page.viewportSize()?.width ?? 0) < 768, "Desktop navigation only")
  await page.goto("/docs/getting-started")

  await expect(page.getByRole("link", { name: "llms.txt" })).toHaveAttribute(
    "href",
    "/llms.txt",
  )
})

test("index hides page navigation while docs keep previous and next links", async ({
  page,
}, testInfo) => {
  await page.goto("/")
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
  await expect(
    page.getByRole("navigation", { name: "Documentation pages" }),
  ).toHaveCount(0)
  await testInfo.attach("index-without-page-navigation", {
    body: await page.screenshot({ fullPage: true, animations: "disabled" }),
    contentType: "image/png",
  })

  await page.getByRole("link", { name: "Get started", exact: true }).click()
  await page.waitForURL("**/docs/getting-started")

  const navigation = page.getByRole("navigation", {
    name: "Documentation pages",
  })

  await expect(
    navigation.getByRole("link", { name: "Previous: Introduction" }),
  ).toHaveAttribute("href", "/")
  await expect(
    navigation.getByRole("link", { name: "Next: Installation" }),
  ).toHaveAttribute("href", "/docs/installation")
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
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"])
  await page.setViewportSize({ width: 1600, height: 900 })
  await page.goto("/docs/getting-started")
  await expect(
    page.getByRole("heading", { name: "What you need" }),
  ).toBeVisible()
  await expect(
    page.getByRole("link", { name: "2. Install Button" }),
  ).toHaveAttribute("href", "#2-install-button")

  const snippet = page
    .getByTestId("copyable-code")
    .filter({ hasText: 'from "@/components/ui/button"' })
    .first()

  const code = await snippet.locator("pre").innerText()
  await snippet.getByRole("button", { name: "Copy Code", exact: true }).click()
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toBe(code)
  await expect(page.locator("#install-button")).toHaveCount(1)
})

test("theming guide renders copyable configuration", async ({ page }) => {
  await page.goto("/docs/theming")
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
  await expect(
    page.getByRole("button", { name: /^Copy src\/theme\// }).first(),
  ).toBeEnabled()
})

test("component docs cover CLI setup and API", async ({ page }) => {
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
  await expect(
    page.getByRole("button", {
      name: "Copy Initialize StyleX project with CLI",
    }),
  ).toBeEnabled()
  await expect(
    page.getByRole("button", { name: "Copy Install Button with CLI" }),
  ).toBeEnabled()
  await page
    .locator("summary")
    .filter({ hasText: "View API reference" })
    .click()

  const api = page.getByRole("region", { name: "Button", exact: true })
  await expect(api.getByRole("table").first()).toBeVisible()
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
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
  await expect(api.getByRole("row").filter({ hasText: "onClick" })).toHaveCount(
    0,
  )
})

test("copy buttons copy usage, not installation commands", async ({
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
  await expect(
    page.getByRole("button", { name: "Button usage copied", exact: true }),
  ).toBeVisible()
  await expect(
    page.getByRole("button", { name: "Copy Button usage", exact: true }),
  ).toBeVisible()
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
    .getByRole("button", { name: "Copy Button usage", exact: true })
    .click()
  await expect(
    page.getByRole("status").filter({ hasText: /copy|clipboard/i }),
  ).toContainText(/select|manual|blocked|failed|could not|couldn't/i)
})

test("StyleX search opens, finds a component, and navigates", async ({
  page,
}) => {
  await page.goto("/components/button")
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

for (const theme of ["light", "dark"] as const) {
  test(`Inter and IBM Plex Mono load in ${theme} theme`, async ({ page }) => {
    await page.addInitScript(
      (value) => localStorage.setItem("yopem-ui-theme", value),
      theme,
    )
    await page.goto("/components/button")
    await expect(
      page.getByRole("button", { name: "Copy Button usage", exact: true }),
    ).toBeEnabled()

    for (const element of [
      page.locator("body"),
      page.getByRole("heading", { name: "Button", exact: true, level: 1 }),
    ]) {
      await expect(element).toHaveCSS("font-family", /Inter/)
    }

    for (const element of [
      page.locator("main pre").first(),
      page.locator("main code").first(),
    ]) {
      await expect(element).toHaveCSS("font-family", /IBM Plex Mono/)
    }

    await expect
      .poll(() =>
        page.evaluate(async () => {
          const fonts = await Promise.all([
            document.fonts.load('16px "Inter Variable"'),
            document.fonts.load('16px "IBM Plex Mono"'),
          ])

          return Math.min(...fonts.map((faces) => faces.length))
        }),
      )
      .toBeGreaterThan(0)
    await page.screenshot({
      path: test.info().outputPath(`inter-ibm-plex-mono-${theme}.png`),
      fullPage: true,
    })
  })
}

test("dark theme applies dark color scheme", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("yopem-ui-theme", "dark"))
  await page.goto("/components/button")
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark")
  await expect(page.locator("html")).toHaveCSS("color-scheme", "dark")
})

test("main document scrolls normally and restores position on back navigation", async ({
  page,
}) => {
  test.setTimeout(45_000)
  await page.goto("/components/sidebar")
  await expect(
    page.getByRole("button", { name: "Copy Sidebar usage", exact: true }),
  ).toBeEnabled({ timeout: 25_000 })
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
  await page.getByRole("link", { name: "UI", exact: true }).click()
  await page.waitForURL((url) => url.pathname === "/")
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
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
  test.setTimeout(45_000)
  await page.goto("/components/button")
  await expect(
    page.getByRole("button", { name: "Copy Button usage", exact: true }),
  ).toBeEnabled({ timeout: 25_000 })
  const trigger = page.getByRole("button", { name: "Search documentation" })
  await trigger.press("Control+KeyK")
  const dialog = page.getByRole("dialog", { name: "Search documentation" })
  const input = dialog.getByRole("searchbox", { name: "Search documentation" })
  await expect(dialog).toBeVisible()
  await expect(input).toBeFocused()
  await input.fill("qxzvjk987654321")
  await expect(dialog.getByRole("status")).toHaveText("0 results")
  await page.keyboard.press("Escape")
  await expect(dialog).toBeHidden()
  await expect(trigger).toBeFocused()

  await trigger.press("Control+KeyK")
  await input.fill("button")
  await expect(
    dialog.getByRole("link", { name: /Button/ }).first(),
  ).toBeVisible()
  await page.keyboard.press("Escape")

  await page.route("**/api/search.json*", (route) =>
    route.fulfill({ status: 503 }),
  )
  await page.reload()
  await trigger.click()
  await expect(dialog).toBeVisible()
  await expect(input).toBeFocused()
  await input.fill("button")
  await expect(dialog.getByRole("status")).toContainText("Search unavailable")

  await page.unroute("**/api/search.json*")
  await input.fill("Accordion")
  await expect(
    dialog.getByRole("link", { name: "Accordion", exact: true }).first(),
  ).toBeVisible()
})

test("mobile header changes theme and navigation restores trigger focus", async ({
  page,
}) => {
  test.setTimeout(45_000)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.emulateMedia({ colorScheme: "light" })
  await page.goto("/components/button")
  await expect(
    page.getByRole("button", { name: "Copy Button usage", exact: true }),
  ).toBeEnabled({ timeout: 25_000 })
  const header = page.getByRole("banner")
  await header
    .getByRole("button", { name: "Switch to dark theme", exact: true })
    .click()
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark")
  await expect(
    header.getByRole("button", { name: "Switch to light theme", exact: true }),
  ).toBeVisible()
  expect(
    await page.evaluate(() => localStorage.getItem("yopem-ui-theme")),
  ).toBe("dark")
  const trigger = page.getByRole("button", { name: "Open navigation" })
  await trigger.click()
  const dialog = page.getByRole("dialog", { name: "Documentation" })
  await expect(dialog).toBeVisible()
  await page.keyboard.press("Escape")
  await expect(dialog).toBeHidden()
  await expect(trigger).toBeFocused()
})
