import { expect, test } from "@playwright/test"
import { readdir } from "node:fs/promises"
import { resolve } from "node:path"

const examples = (
  await readdir(
    resolve(
      import.meta.dirname,
      "../../apps/docs/src/components/examples/stylex",
    ),
  )
)
  .filter((file) => file.endsWith(".tsx"))
  .map((file) => file.slice(0, -4))
  .toSorted()

for (const example of examples) {
  test(`${example} renders without runtime errors`, async ({
    page,
  }, testInfo) => {
    test.setTimeout(60_000)
    const errors: string[] = []
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text())
    })
    page.on("pageerror", (error) => errors.push(error.message))

    const theme = testInfo.project.name === "mobile-chromium" ? "dark" : "light"
    const response = await page.goto(`/examples/${example}?theme=${theme}`)
    expect(response?.status(), `${example} ${theme}`).toBe(200)
    const root = page.locator("[data-example-root]")
    await expect(root).toBeVisible()
    await expect(root).toHaveAttribute("data-theme", theme)
    await expect(root).not.toContainText("Loading example…")
    expect(errors, example).toEqual([])
  })
}
