import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

test("@a11y CLI guide documents commands, options, and safe updates", async ({
  page,
}, testInfo) => {
  await page.goto("/docs/cli")
  const main = page.getByRole("main")
  await expect(
    main.getByRole("heading", { name: "CLI", exact: true, level: 1 }),
  ).toBeVisible()

  for (const name of [
    "Prerequisites",
    "init",
    "Design system guidance",
    "add",
    "update",
    "Help and version",
    "Options",
    "Safe overwrites",
    "Dry run",
    "Registry",
    "Monorepos",
  ]) {
    await expect(main.getByRole("heading", { name, exact: true })).toBeVisible()
  }

  for (const flag of [
    "--framework",
    "--guidance",
    "--ui",
    "--cwd",
    "--registry",
    "--dry-run",
    "--force",
    "--help",
    "-h",
    "--version",
    "-v",
  ]) {
    await expect(main).toContainText(flag)
  }

  const options = main.getByRole("table")
  await expect(options).toBeVisible()
  await expect(options).toHaveAttribute("data-slot", "table")
  await expect(options.getByRole("columnheader")).toHaveText([
    "Option",
    "Commands",
    "Purpose",
  ])
  await expect(options.getByRole("row")).toHaveCount(10)
  await expect(
    options.getByRole("cell", { name: "--framework <name>", exact: true }),
  ).toBeVisible()

  await expect(
    options.getByRole("cell", { name: "--guidance <choice>", exact: true }),
  ).toBeVisible()

  for (const text of [
    "DESIGN.md",
    "AGENTS.md",
    "init --guidance design",
    "init --guidance agents",
    "init --guidance none",
    "Noninteractive init skips guidance by default.",
    "Init preserves text outside the marked Yopem UI section.",
    "The instructions include light and dark color values, spacing values, and component sizes.",
    "Use --dry-run with --guidance to preview the file without writes.",
  ])
    await expect(main).toContainText(text)

  await expect(main).toContainText(
    "The CLI and Oxlint plugin are not published yet.",
  )
  await expect(main).toContainText(
    "The update command rejects modified files unless you pass --force.",
  )
  await expect(
    main.getByRole("button", { name: "Copy Code" }).first(),
  ).toBeEnabled()
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
  await testInfo.attach("cli-guide", {
    body: await page.screenshot({ animations: "disabled", fullPage: true }),
    contentType: "image/png",
  })
})

test("CLI guide is reachable from installation, navigation, and search", async ({
  page,
}) => {
  await page.goto("/docs/installation")
  await expect(
    page.getByRole("button", { name: "Search documentation", exact: true }),
  ).toBeEnabled()
  await expect(
    page.getByRole("main").getByRole("heading", { name: /update/i }),
  ).toHaveCount(0)
  await page
    .getByRole("main")
    .getByRole("link", { name: "CLI guide", exact: true })
    .click()
  await page.waitForURL("**/docs/cli")
  await expect(
    page
      .getByRole("main")
      .getByRole("heading", { name: "CLI", exact: true, level: 1 }),
  ).toBeVisible()
  await page.goto("/docs/installation")

  if ((page.viewportSize()?.width ?? 0) < 768) {
    await page.getByRole("button", { name: "Open navigation" }).click()
    await page
      .getByRole("dialog", { name: "Documentation", exact: true })
      .getByRole("link", { name: "CLI", exact: true })
      .click()
  } else {
    await page
      .getByRole("navigation", { name: "Documentation", exact: true })
      .getByRole("link", { name: "CLI", exact: true })
      .click()
  }

  await expect(
    page
      .getByRole("main")
      .getByRole("heading", { name: "CLI", exact: true, level: 1 }),
  ).toBeVisible()
  await page.getByRole("button", { name: "Search documentation" }).click()
  const dialog = page.getByRole("dialog", { name: "Search documentation" })
  await dialog.getByRole("searchbox").fill("CLI")
  await dialog.getByRole("link", { name: "CLI", exact: true }).click()
  await expect(dialog).toBeHidden()
  await expect(
    page.getByRole("heading", { name: "CLI", exact: true, level: 1 }),
  ).toBeVisible()
})

test("CLI guide has machine-readable documentation and discovery links", async ({
  request,
}, testInfo) => {
  const response = await request.get("/docs/cli.md")
  expect(response.status()).toBe(200)
  expect(response.headers()["content-type"]).toContain("text/markdown")
  const guide = await response.text()

  for (const text of [
    "# CLI",
    "bunx --bun @yopem-ui/cli init",
    "bunx --bun @yopem-ui/cli add button",
    "bunx --bun @yopem-ui/cli update base",
    "--help",
    "-h",
    "--version",
    "-v",
    "--force",
    "--framework",
    "--ui",
    "--cwd",
    "--registry",
    "--dry-run",
    "--guidance",
    "init --guidance design",
    "init --guidance agents",
    "init --guidance none",
    "DESIGN.md",
    "AGENTS.md",
    "Noninteractive init skips guidance by default.",
    "Init preserves text outside the marked Yopem UI section.",
    "not published yet",
  ])
    expect(guide).toContain(text)

  expect(guide.replace(/\s+/g, " ")).toContain(
    "The instructions include light and dark color values, spacing values, and component sizes.",
  )

  for (const [url, path] of [
    ["/llms.txt", "/docs/cli.md"],
    ["/sitemap.xml", "/docs/cli"],
  ]) {
    const index = await request.get(url)
    expect(index.status()).toBe(200)
    expect(await index.text()).toContain(path)
  }

  const installation = await (await request.get("/docs/installation.md")).text()
  expect(installation).toContain("[CLI guide](/docs/cli)")
  expect(installation).not.toContain("update base")
  await testInfo.attach("cli-markdown", {
    body: guide,
    contentType: "text/markdown",
  })
})
