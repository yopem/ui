import { expect, test } from "@playwright/test"
import { readdir } from "node:fs/promises"
import { resolve } from "node:path"

const previews = (
  await readdir(
    resolve(import.meta.dirname, "../../apps/docs/src/catalog/previews"),
  )
)
  .filter((file) => file.endsWith(".tsx"))
  .map((file) => file.slice(0, -4))
  .toSorted()

for (const slug of previews) {
  test(`${slug} preview renders without runtime errors`, async ({
    page,
  }, testInfo) => {
    test.setTimeout(60_000)
    const errors: string[] = []
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text())
    })
    page.on("pageerror", (error) => errors.push(error.message))

    const theme = testInfo.project.name === "mobile-chromium" ? "dark" : "light"
    await page.addInitScript(
      (value) => localStorage.setItem("yopem-ui-theme", value),
      theme,
    )
    const response = await page.goto(`/components/${slug}`)
    expect(response?.status(), slug).toBe(200)
    await expect(
      page.getByRole("heading", { name: "Preview", exact: true }),
    ).toBeVisible()
    await expect(page.locator(`[aria-label$="live preview"]`)).toBeVisible()
    await expect(
      page.getByRole("button", { name: /^Copy .* usage$/ }).first(),
    ).toBeEnabled()
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme)
    expect(errors, slug).toEqual([])
  })
}
