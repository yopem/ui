import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

const managers = [
  ["Bun", "bunx --bun", "bun add -d", "bun run dev", "bunx --no-install"],
  ["npm", "npx", "npm install -D", "bun run dev", "npx --no-install"],
  ["pnpm", "pnpm dlx", "pnpm add -D", "bun run dev", "pnpm exec"],
  ["Yarn", "yarn dlx", "yarn add -D", "bun run dev", "yarn exec"],
] as const

for (const [manager, runner, install, dev, localRunner] of managers) {
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
    ).toHaveCount(3)

    for (const button of await switches
      .getByRole("button", { name: manager, exact: true })
      .all()) {
      await expect(button).toHaveAttribute("aria-pressed", "true")
    }

    const command = `${runner} @yopem-ui/cli init`
    await expect(main.locator("pre").first()).toHaveText(command)
    await main
      .getByRole("button", {
        name: "Copy Initialize project with CLI",
        exact: true,
      })
      .click()
    await expect
      .poll(() => page.evaluate(() => navigator.clipboard.readText()))
      .toBe(command)
    await main.getByRole("link", { name: "CLI guide", exact: true }).click()
    await expect(page.getByRole("main").locator("pre").first()).toContainText(
      `${runner} @yopem-ui/cli init --framework react-router`,
    )
    await expect(page.getByRole("main")).toContainText(dev)
    await page.goto("/docs/lint")
    await page
      .getByRole("group", { name: "Package manager" })
      .first()
      .getByRole("button", { name: manager, exact: true })
      .click()
    await expect(page.getByRole("main")).toContainText(
      `${install} oxlint @yopem-ui/oxlint-plugin`,
    )
    await expect(
      page
        .getByRole("main")
        .locator("pre")
        .filter({ hasText: '"jsPlugins"' })
        .first(),
    ).toContainText('"specifier": "@yopem-ui/oxlint-plugin"')

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
    await expect(
      dependencyBlock.getByRole("group", { name: "Package manager" }),
    ).toBeVisible()
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

test("package manager keyboard selection updates component commands without changing source examples", async ({
  page,
}, testInfo) => {
  await page.goto("/components/button")
  const main = page.getByRole("main")
  const group = main.getByRole("group", { name: "Package manager" }).first()
  const bun = group.getByRole("button", { name: "Bun", exact: true })
  await expect(bun).toBeEnabled()
  await bun.focus()
  await page.keyboard.press("ArrowRight")
  await page.keyboard.press("Space")
  await expect(
    group.getByRole("button", { name: "npm", exact: true }),
  ).toHaveAttribute("aria-pressed", "true")
  await expect(
    main.locator("pre").filter({ hasText: "npx @yopem-ui/cli init" }),
  ).toHaveCount(1)
  await expect(
    main.locator("pre").filter({ hasText: "npx @yopem-ui/cli add button" }),
  ).toHaveCount(1)
  await expect(
    main
      .locator("pre")
      .filter({ hasText: 'from "@/components/ui/button"' })
      .first(),
  ).toBeVisible()
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

test("manager controls use compact lowercase labels and preserve raw source", async ({
  page,
  request,
}, testInfo) => {
  await page.goto("/docs/lint")
  const group = page.getByRole("group", { name: "Package manager" }).first()
  await expect(
    group.getByRole("button", { name: "Bun", exact: true }),
  ).toHaveText("bun")
  await expect(
    group.getByRole("button", { name: "Yarn", exact: true }),
  ).toHaveText("yarn")
  const toolbar = group.locator("..").locator("..")
  await expect(toolbar.locator("svg[data-slot='terminal-icon']")).toBeVisible()
  await expect(
    toolbar.getByRole("button", { name: "Copy Code", exact: true }),
  ).toBeVisible()
  const source = await request.get("/docs/lint.md")
  expect(source.ok()).toBe(true)
  const rawSource = await source.text()
  expect(rawSource).toContain("pnpm add -D oxlint @yopem-ui/oxlint-plugin")
  expect(rawSource).toContain("pnpm exec oxlint .")
  expect(rawSource).toContain("npm exec -- @yopem-ui/cli init")
  await testInfo.attach("compact-command-toolbar", {
    body: await toolbar.screenshot(),
    contentType: "image/png",
  })
})

test("SSR command selection defaults to Bun", async ({ request }) => {
  const response = await request.get("/docs/installation")
  expect(response.ok()).toBe(true)
  expect(await response.text()).toContain("bunx --bun @yopem-ui/cli init")
})
