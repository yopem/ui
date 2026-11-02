import { expect, test } from "@playwright/test"

const managers = [
  ["Bun", "bunx --bun"],
  ["npm", "npx"],
  ["pnpm", "pnpm dlx"],
  ["Yarn", "yarn dlx"],
] as const

const cases = [
  [
    "document-pdf-export-control",
    ["editor-document-export-pdf", "editor-document-export-image"],
  ],
  [
    "floating-toolbar-buttons",
    ["editor-toolbar-menus", "editor-floating-toolbar"],
  ],
  ["toc-slash-command", ["editor-toc", "editor-typeahead"]],
  [
    "document-image-export-control",
    ["editor-document-export", "editor-document-export-image", "editor-math"],
  ],
] as const

for (const [slug, items] of cases) {
  test(`${slug} copies complete install commands with each package manager`, async ({
    page,
    context,
  }, testInfo) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"])
    await page.goto(`/editor/${slug}`)

    const block = page
      .getByRole("main")
      .getByTestId("copyable-code")
      .filter({ hasText: "@yopem-ui/cli add" })

    await expect(block).toHaveCount(1)
    const copied: { manager: string; command: string }[] = []

    for (const [manager, runner] of managers) {
      await block.getByRole("button", { name: manager, exact: true }).click()

      const command = items
        .map((item) => `${runner} @yopem-ui/cli add ${item}`)
        .join("\n")

      await expect(block.locator("pre")).toHaveText(command)
      await block.getByRole("button", { name: /^Copy / }).click()
      await expect
        .poll(() => page.evaluate(() => navigator.clipboard.readText()))
        .toBe(command)
      copied.push({ manager, command })
    }

    await testInfo.attach("copied-install-commands.json", {
      body: JSON.stringify(copied),
      contentType: "application/json",
    })
  })
}
