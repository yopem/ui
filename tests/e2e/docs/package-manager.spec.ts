import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

const managers = [
  ["Bun", "bunx --bun", "bun add -d", "bunx --no-install"],
  ["npm", "npx", "npm install -D", "npx --no-install"],
  ["pnpm", "pnpm dlx", "pnpm add -D", "pnpm exec"],
  ["Yarn", "yarn dlx", "yarn add -D", "yarn exec"],
] as const

for (const [manager, runner, install, localRunner] of managers) {
  test(`@a11y ${manager} commands share selection and copy current text`, async ({
    page,
    context,
  }, testInfo) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"])
    await page.goto("/docs/installation")
    const main = page.getByRole("main")
    const switches = main.getByRole("group", { name: "Package manager" })
    await switches
      .first()
      .getByRole("button", { name: manager, exact: true })
      .click()
    await expect(
      switches.getByRole("button", { name: manager, exact: true }),
    ).not.toHaveCount(0)

    for (const button of await switches
      .getByRole("button", { name: manager, exact: true })
      .all()) {
      await expect(button).toHaveAttribute("aria-pressed", "true")
    }

    await page.reload()
    await expect(
      switches.first().getByRole("button", { name: manager, exact: true }),
    ).toHaveAttribute("aria-pressed", "true")

    const command = `${runner} @yopem-ui/cli init`
    await expect(main.locator("pre").first()).toHaveText(command)
    await main
      .getByTestId("copyable-code")
      .first()
      .getByRole("button", { name: "Copy Code", exact: true })
      .click()
    await expect
      .poll(() => page.evaluate(() => navigator.clipboard.readText()))
      .toBe(command)
    await main.getByRole("link", { name: "CLI guide", exact: true }).click()
    await expect(page.getByRole("main").locator("pre").first()).toContainText(
      `${runner} @yopem-ui/cli init --framework react-router`,
    )
    await page.goto("/docs/getting-started")

    const componentCommand = main
      .getByTestId("copyable-code")
      .filter({ hasText: "@yopem-ui/cli add button" })

    await componentCommand
      .getByRole("button", { name: manager, exact: true })
      .click()
    await expect(componentCommand.locator("pre")).toHaveText(
      `${runner} @yopem-ui/cli add button`,
    )
    await componentCommand
      .getByRole("button", { name: "Copy Code", exact: true })
      .click()
    await expect
      .poll(() => page.evaluate(() => navigator.clipboard.readText()))
      .toBe(`${runner} @yopem-ui/cli add button`)
    await page.goto("/docs/lint")
    await page
      .getByRole("group", { name: "Package manager" })
      .first()
      .getByRole("button", { name: manager, exact: true })
      .click()
    await expect(page.getByRole("main")).toContainText(
      `${install} oxlint @yopem-ui/oxlint-plugin`,
    )

    const localCommand = page
      .getByRole("main")
      .locator("pre")
      .filter({ hasText: "oxlint ." })

    await expect(localCommand).toHaveText(`${localRunner} oxlint .`)

    const localBlock = localCommand.locator(
      "xpath=ancestor::*[@data-testid='copyable-code'][1]",
    )

    await localBlock
      .getByRole("button", { name: "Copy Code", exact: true })
      .click()
    await expect
      .poll(() => page.evaluate(() => navigator.clipboard.readText()))
      .toBe(`${localRunner} oxlint .`)
    await expect(page.getByRole("main").locator("pre").first()).toHaveText(
      `${runner} @yopem-ui/cli init`,
    )

    const dependency = page
      .getByRole("main")
      .locator("pre")
      .filter({
        hasText: `${install} oxlint @yopem-ui/oxlint-plugin`,
      })

    const dependencyBlock = dependency.locator(
      "xpath=ancestor::*[@data-testid='copyable-code'][1]",
    )

    await dependencyBlock
      .getByRole("button", { name: "Copy Code", exact: true })
      .click()
    await expect
      .poll(() => page.evaluate(() => navigator.clipboard.readText()))
      .toBe(`${install} oxlint @yopem-ui/oxlint-plugin`)
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
    await testInfo.attach(`${manager}-commands`, {
      body: await dependencyBlock.screenshot({
        animations: "disabled",
        scale: "css",
      }),
      contentType: "image/png",
    })
  })
}

for (const storage of ["invalid", "blocked", "read-only"] as const) {
  test(`package manager handles ${storage} browser storage`, async ({
    page,
  }) => {
    await page.addInitScript((mode) => {
      if (mode === "invalid") {
        localStorage.setItem("yopem-package-manager", "unsupported")
      } else {
        if (mode === "read-only") {
          localStorage.setItem("yopem-package-manager", "pnpm")
        } else {
          Object.defineProperty(Storage.prototype, "getItem", {
            value() {
              throw new DOMException("Storage unavailable", "SecurityError")
            },
          })
        }

        Object.defineProperty(Storage.prototype, "setItem", {
          value() {
            throw new DOMException("Storage unavailable", "SecurityError")
          },
        })
      }
    }, storage)
    await page.goto("/docs/installation")

    const group = page
      .getByRole("main")
      .getByRole("group", { name: "Package manager" })
      .first()

    await expect(
      group.getByRole("button", {
        name: storage === "read-only" ? "pnpm" : "Bun",
        exact: true,
      }),
    ).toHaveAttribute("aria-pressed", "true")
    await group.getByRole("button", { name: "npm", exact: true }).click()
    await expect(
      group.getByRole("button", { name: "npm", exact: true }),
    ).toHaveAttribute("aria-pressed", "true")
    await expect(page.getByRole("main").locator("pre").first()).toHaveText(
      "npx @yopem-ui/cli init",
    )
  })
}

test("package manager keyboard selection updates component commands without changing source examples", async ({
  page,
}, testInfo) => {
  await page.goto("/components/button")
  const main = page.getByRole("main")
  const group = main.getByRole("group", { name: "Package manager" }).first()
  const bun = group.getByRole("button", { name: "Bun", exact: true })
  await expect(bun).toBeEnabled()

  const source = main
    .locator("pre")
    .filter({ hasText: 'from "@/components/ui/button"' })
    .first()

  const originalSource = await source.innerText()
  await bun.focus()
  await page.keyboard.press("ArrowRight")
  await page.keyboard.press("Space")
  await expect(
    group.getByRole("button", { name: "npm", exact: true }),
  ).toHaveAttribute("aria-pressed", "true")
  await expect(
    main.locator("pre").filter({ hasText: "npx @yopem-ui/cli init" }),
  ).toBeVisible()
  await expect(
    main.locator("pre").filter({ hasText: "npx @yopem-ui/cli add button" }),
  ).toBeVisible()
  await expect(source).toHaveText(originalSource)
  await testInfo.attach("keyboard-selection", {
    body: await page.screenshot({ fullPage: true }),
    contentType: "image/png",
  })
})

test("package manager waits for hydration before accepting selection", async ({
  page,
}) => {
  const scripts = Promise.withResolvers<void>()
  await page.route("**/assets/*.js", async (route) => {
    await scripts.promise
    await route.continue()
  })
  await page.goto("/docs/lint", { waitUntil: "commit" })

  const group = page.getByRole("group", { name: "Package manager" }).first()
  const npm = group.getByRole("button", { name: "npm", exact: true })
  await expect(npm).toBeDisabled()
  scripts.resolve()
  await npm.click()
  await expect(npm).toHaveAttribute("aria-pressed", "true")
  await expect(page.getByRole("main")).toContainText(
    "npm install -D oxlint @yopem-ui/oxlint-plugin",
  )
})

test("lint Markdown preserves raw commands", async ({ request }) => {
  const source = await request.get("/docs/lint.md")
  expect(source.ok()).toBe(true)
  expect(source.headers()["content-type"]).toContain("text/markdown")
  const rawSource = await source.text()
  expect(rawSource).toContain("pnpm add -D oxlint @yopem-ui/oxlint-plugin")
  expect(rawSource).toContain("pnpm exec oxlint .")
  expect(rawSource).toContain("npm exec -- @yopem-ui/cli init")
})

test.describe("server-rendered package manager", () => {
  test.use({ javaScriptEnabled: false })

  test("SSR command selection defaults to Bun", async ({ page }, testInfo) => {
    const response = await page.goto("/docs/installation")
    expect(response?.ok()).toBe(true)
    const main = page.getByRole("main")

    await expect(main.locator("pre").first()).toHaveText(
      "bunx --bun @yopem-ui/cli init",
    )
    await expect(
      main
        .getByRole("group", { name: "Package manager" })
        .first()
        .getByRole("button", { name: "Bun", exact: true }),
    ).toHaveAttribute("aria-pressed", "true")
    await testInfo.attach("ssr-installation", {
      body: await page.content(),
      contentType: "text/html",
    })
  })
})
