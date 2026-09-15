import type { APIRequestContext, Page } from "@playwright/test"

import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

interface EndpointContract {
  body: RegExp
  contentType: RegExp
  missingPath?: string
  path: string
  status?: number
}

interface UiContract {
  heading: RegExp
  path: string
}

const endpointContracts: Record<string, EndpointContract> = {
  "lib/og.tsx": {
    body: /^PNG$/,
    contentType: /^image\/png/,
    path: "/api/og?title=Button&description=Accessible%20components",
  },
  "lib/plain-text.ts": {
    body: /# Button[\s\S]+## API reference/,
    contentType: /^text\/markdown/,
    path: "/components/button.md",
  },
  "lib/seo.ts": {
    body: /<urlset[\s\S]+https:\/\/ui\.yopem\.com\/components\/button/,
    contentType: /^application\/xml/,
    path: "/sitemap.xml",
  },
  "routes/api/og.ts": {
    body: /^PNG$/,
    contentType: /^image\/png/,
    path: "/api/og?title=Button&description=Accessible%20components",
  },
  "routes/api/search.ts": {
    body: /button/i,
    contentType: /^application\/json/,
    path: "/api/search?query=button",
  },
  "routes/components[.]md.ts": {
    body: /^# Components[\s\S]+\/components\/button\.md/m,
    contentType: /^text\/markdown/,
    path: "/components.md",
  },
  "routes/components/{$name}[.]md.ts": {
    body: /# Button[\s\S]+## API reference/,
    contentType: /^text\/markdown/,
    missingPath: "/components/not-a-component.md",
    path: "/components/button.md",
  },
  "routes/docs/{$name}[.]md.ts": {
    body: /^# Installation/m,
    contentType: /^text\/markdown/,
    missingPath: "/docs/not-a-guide.md",
    path: "/docs/installation.md",
  },
  "routes/index[.]md.ts": {
    body: /^# Introduction/m,
    contentType: /^text\/markdown/,
    path: "/index.md",
  },
  "routes/llms[.]txt.ts": {
    body: /Yopem UI[\s\S]+components\/button\.md/i,
    contentType: /^text\/plain/,
    path: "/llms.txt",
  },
  "routes/sitemap[.]xml.ts": {
    body: /<urlset[\s\S]+https:\/\/ui\.yopem\.com\/components\/button/,
    contentType: /^application\/xml/,
    path: "/sitemap.xml",
  },
}

const uiContracts: Record<string, UiContract> = {
  "catalog/components.ts": { heading: /^Components$/, path: "/components" },
  "catalog/docs-data.ts": { heading: /^Components$/, path: "/components" },
  "catalog/example-modules.ts": {
    heading: /^p-button-1$/,
    path: "/examples/p-button-1?theme=light",
  },
  "components/brand-logo.tsx": {
    heading: /React components/i,
    path: "/",
  },
  "hooks/use-media-query.ts": {
    heading: /^Button$/,
    path: "/components/button",
  },
  "lib/brand.ts": { heading: /React components/i, path: "/" },
  "lib/table-wrapper.ts": { heading: /^Table$/, path: "/components/table" },
  "routeTree.gen.ts": { heading: /React components/i, path: "/" },
  "router.tsx": { heading: /React components/i, path: "/" },
  "routes/__root.tsx": { heading: /React components/i, path: "/" },
  "routes/components/$name.tsx": {
    heading: /^Button$/,
    path: "/components/button",
  },
  "routes/components/index.tsx": {
    heading: /^Components$/,
    path: "/components",
  },
  "routes/docs/getting-started.tsx": {
    heading: /^Add your first component$/,
    path: "/docs/getting-started",
  },
  "routes/docs/installation.tsx": {
    heading: /^Installation$/,
    path: "/docs/installation",
  },
  "routes/docs/theming.tsx": {
    heading: /^Theming$/,
    path: "/docs/theming",
  },
  "routes/examples/$example.tsx": {
    heading: /^p-button-1$/,
    path: "/examples/p-button-1?theme=light",
  },
  "routes/examples/index.tsx": {
    heading: /^Browse examples$/,
    path: "/examples",
  },
  "routes/index.tsx": { heading: /React components/i, path: "/" },
  "routes/stylex/index.tsx": {
    heading: /^Components$/,
    path: "/stylex",
  },
  "styles.css": { heading: /React components/i, path: "/" },
  "vite-env.d.ts": { heading: /React components/i, path: "/" },
}

function componentTitle(component: string) {
  return new RegExp(`^${component.replaceAll("-", " ")}$`, "i")
}

function getUiContract(sourceRelativePath: string): UiContract {
  if (sourceRelativePath.startsWith("components/ui/stylex/")) {
    const component = sourceRelativePath
      .slice("components/ui/stylex/".length)
      .replace(/\.tsx$/, "")
    return {
      heading: componentTitle(component),
      path: `/components/${component}`,
    }
  }

  if (sourceRelativePath.startsWith("catalog/")) {
    return { heading: /^Button$/, path: "/components/button" }
  }

  if (sourceRelativePath === "hooks/use-copy-to-clipboard.ts") {
    return { heading: /^Button$/, path: "/components/button" }
  }

  const contract = uiContracts[sourceRelativePath]
  if (!contract)
    throw new Error(`Missing UI contract for ${sourceRelativePath}`)
  return contract
}

function collectPageFailures(page: Page) {
  const consoleErrors: string[] = []
  const pageErrors: string[] = []
  const failedAssets: string[] = []

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text())
  })
  page.on("pageerror", (error) => pageErrors.push(error.message))
  page.on("response", (response) => {
    const resourceType = response.request().resourceType()
    if (
      response.status() >= 400 &&
      ["font", "image", "script", "stylesheet"].includes(resourceType)
    ) {
      failedAssets.push(`${response.status()} ${response.url()}`)
    }
  })

  return { consoleErrors, failedAssets, pageErrors }
}

async function waitForHydration(page: Page) {
  await page.waitForLoadState("load")
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      }),
  )
}

async function expectKeyboardAndResponsiveLayout(page: Page, mobile: boolean) {
  await page.keyboard.press("Tab")
  await expect
    .poll(() => page.evaluate(() => document.activeElement?.tagName))
    .not.toBe("BODY")
  await page.keyboard.press("Tab")

  if (mobile) {
    await expect
      .poll(() =>
        page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
      )
      .toBeLessThanOrEqual(1)
  }
}

async function expectEndpointContract(
  contract: EndpointContract,
  request: APIRequestContext,
) {
  const response = await request.get(contract.path)
  expect(response.status()).toBe(contract.status ?? 200)
  expect(response.headers()["content-type"]).toMatch(contract.contentType)

  if (contract.contentType.test("image/png")) {
    const image = await response.body()
    expect(image.subarray(1, 4).toString()).toBe("PNG")
    expect(image.readUInt32BE(16)).toBe(1200)
    expect(image.readUInt32BE(20)).toBe(630)
  } else {
    expect(await response.text()).toMatch(contract.body)
  }

  if (contract.missingPath) {
    const missing = await request.get(contract.missingPath)
    expect(missing.status()).toBe(404)
    expect(await missing.text()).toContain("Page not found")
  }
}

async function expectSpecialUiBehavior(
  sourceRelativePath: string,
  page: Page,
  mobile: boolean,
) {
  if (sourceRelativePath === "routes/stylex/index.tsx") {
    await expect(page).toHaveURL(/\/components\/?$/)
  }

  if (sourceRelativePath === "routes/components/index.tsx") {
    const main = page.getByRole("main")
    const search = main.getByRole("searchbox", { name: "Search components" })
    await expect(search).toBeEditable()
    await search.fill("button")
    await expect(search).toHaveValue("button")
    await expect(
      main.getByRole("heading", { level: 2, name: "Button", exact: true }),
    ).toBeVisible()
    await expect(
      main.getByRole("heading", { level: 2, name: "Accordion", exact: true }),
    ).toHaveCount(0)
  }

  if (sourceRelativePath === "routes/examples/index.tsx") {
    const search = page.getByRole("searchbox", { name: "Search examples" })
    await search.fill("button")
    await expect(
      page.getByRole("link", { name: "Button 1", exact: true }),
    ).toBeVisible()
    await page
      .getByRole("button", { name: "Copy Button 1 code", exact: true })
      .click()
    await expect(
      page.getByRole("button", {
        name: "Button 1 code copied",
        exact: true,
      }),
    ).toBeVisible()
  }

  if (sourceRelativePath === "hooks/use-copy-to-clipboard.ts") {
    await page
      .getByRole("button", { name: "Copy src/components/ui/button.tsx" })
      .click()
    await expect(
      page.getByRole("status").filter({ hasText: /Could not copy/ }),
    ).toContainText(/select.*manual/i)
  }

  if (sourceRelativePath === "catalog/code-block.tsx") {
    const copy = page.getByRole("button", {
      name: "Copy src/components/ui/button.tsx",
    })
    await copy.click()
    await expect
      .poll(() => page.evaluate(() => navigator.clipboard.readText()))
      .toContain("export function Button")
    const viewCode = page.getByRole("button", { name: "View code" })
    if ((await viewCode.count()) > 0) await viewCode.first().click()
  }

  if (sourceRelativePath === "catalog/global-search.tsx") {
    await page.getByRole("button", { name: /^Search docs/ }).click()
    const dialog = page.getByRole("dialog", { name: "Search documentation" })
    await expect(dialog).toBeVisible()
    await dialog
      .getByRole("searchbox", { name: "Search documentation" })
      .fill("sidebar")
    await expect(
      dialog.getByRole("link", { name: /Sidebar/ }).first(),
    ).toBeVisible()
    await page.keyboard.press("Escape")
    await expect(dialog).not.toBeVisible()
    const trigger = page.getByRole("button", { name: /^Search docs/ })
    await expect(trigger).toBeFocused()

    await page.route("**/api/search**", (route) =>
      route.fulfill({
        body: JSON.stringify({ invalid: true }),
        contentType: "application/json",
        status: 200,
      }),
    )
    await trigger.click()
    await dialog
      .getByRole("searchbox", { name: "Search documentation" })
      .fill("broken search")
    await expect(dialog.getByRole("status")).toContainText("Search unavailable")
  }

  if (
    sourceRelativePath === "catalog/docs-layout.tsx" ||
    sourceRelativePath === "hooks/use-media-query.ts"
  ) {
    const navigation = page.getByRole("button", { name: "Open navigation" })
    if (mobile) {
      await expect(navigation).toBeVisible()
      await navigation.click()
      await expect(
        page.getByRole("dialog", { name: "Documentation" }),
      ).toBeVisible()
      await page.keyboard.press("Escape")
      await expect(navigation).toBeFocused()
    } else {
      await expect(navigation).toBeHidden()
      await page.getByRole("link", { name: "Skip to content" }).focus()
      await page.keyboard.press("Enter")
      await expect(page.getByRole("main")).toBeFocused()
    }
  }

  if (sourceRelativePath === "catalog/docs-navigation.tsx") {
    const navigation = mobile
      ? page.getByRole("dialog", { name: "Documentation" })
      : page.getByRole("complementary").first()
    if (mobile) {
      await page.getByRole("button", { name: "Open navigation" }).click()
      await expect(navigation).toBeVisible()
    }
    await expect(
      navigation.getByRole("link", { name: "llms.txt" }),
    ).toHaveAttribute("href", "/llms.txt")
  }

  if (sourceRelativePath === "catalog/theme-toggle.tsx") {
    const themeControls = mobile
      ? page.getByRole("dialog", { name: "Documentation" })
      : page.getByRole("complementary").first()
    if (mobile) {
      await page.getByRole("button", { name: "Open navigation" }).click()
      await expect(themeControls).toBeVisible()
    }
    await themeControls.getByRole("button", { name: "Dark" }).click()
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark")
    await expect(page.locator("html")).toHaveCSS("color-scheme", "dark")
  }

  if (sourceRelativePath === "catalog/table-of-contents.tsx" && !mobile) {
    const contents = page.getByRole("complementary", { name: "On this page" })
    await expect(contents).toBeVisible()
    const examples = contents.getByRole("link", { name: "Examples" })
    await examples.click()
    await expect(examples).toHaveAttribute("aria-current", "location")
  }

  if (sourceRelativePath === "routes/components/$name.tsx") {
    const missing = await page.goto("/components/not-a-component")
    expect(missing?.status()).toBe(404)
    await expect(
      page.getByRole("heading", { name: "Component not found" }),
    ).toBeVisible()
  }

  if (sourceRelativePath === "routes/examples/$example.tsx") {
    const missing = await page.goto("/examples/not-an-example")
    expect(missing?.status()).toBe(404)
  }

  if (sourceRelativePath === "routes/__root.tsx") {
    const missing = await page.goto("/not-a-route")
    expect(missing?.status()).toBe(404)
    await expect(
      page.getByRole("heading", { name: "Page not found" }),
    ).toBeVisible()
  }

  if (sourceRelativePath === "styles.css") {
    await expect(page.locator("html")).toHaveCSS("--foreground", /\S/)
    await expect(page.getByRole("main")).toHaveCSS("font-family", /Figtree/i)
  }
}

export function runDocsE2eContract(sourceRelativePath: string) {
  if (process.versions.bun) return

  const endpoint = endpointContracts[sourceRelativePath]
  if (endpoint) {
    test(`${sourceRelativePath} serves its production response contract`, async ({
      request,
    }) => {
      await expectEndpointContract(endpoint, request)
    })
    return
  }

  const contract = getUiContract(sourceRelativePath)
  test(`${sourceRelativePath} works in production`, async ({
    context,
    page,
  }, testInfo) => {
    test.setTimeout(60_000)
    const mobile = testInfo.project.name.includes("mobile")
    if (sourceRelativePath === "hooks/use-copy-to-clipboard.ts") {
      await page.addInitScript(() => {
        Object.defineProperty(navigator, "clipboard", {
          configurable: true,
          value: {
            writeText: () => Promise.reject(new Error("Clipboard blocked")),
          },
        })
      })
    }
    if (
      sourceRelativePath === "catalog/code-block.tsx" ||
      sourceRelativePath === "routes/examples/index.tsx"
    ) {
      await context.grantPermissions(["clipboard-read", "clipboard-write"])
    }

    const failures = collectPageFailures(page)
    const response = await page.goto(contract.path)
    expect(response?.status()).toBeLessThan(400)
    await waitForHydration(page)
    await expect(
      page.getByRole("heading", { level: 1, name: contract.heading }),
    ).toBeVisible()
    await expectKeyboardAndResponsiveLayout(page, mobile)
    await expectSpecialUiBehavior(sourceRelativePath, page, mobile)
    const expectsMissingPage = [
      "routes/__root.tsx",
      "routes/components/$name.tsx",
    ].includes(sourceRelativePath)
    const consoleErrors = expectsMissingPage
      ? failures.consoleErrors.filter(
          (message) => !message.includes("responded with a status of 404"),
        )
      : failures.consoleErrors
    expect(consoleErrors).toEqual([])
    expect(failures.pageErrors).toEqual([])
    expect(failures.failedAssets).toEqual([])
  })

  test(`@full-a11y ${sourceRelativePath} has no detectable axe violations`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" })
    await page.goto(contract.path)
    await waitForHydration(page)
    await expect(
      page.getByRole("heading", { level: 1, name: contract.heading }),
    ).toBeVisible()
    const results = await new AxeBuilder({ page }).analyze()
    expect(
      results.violations.map(({ help, id, nodes }) => ({
        help,
        id,
        targets: nodes.flatMap((node) => node.target),
      })),
    ).toEqual([])
  })
}
