import { expect, test } from "@playwright/test"

test("SSR initializes theme tokens before rendering documentation", async ({
  page,
}) => {
  const errors: string[] = []
  page.on("pageerror", (error) => errors.push(error.message))

  for (const path of ["/", "/components", "/components/button"]) {
    const response = await page.goto(path)
    expect(response?.status(), path).toBe(200)
    await expect(page.locator("h1").first()).toBeVisible()
    await expect(page.locator("html")).toHaveAttribute(
      "data-theme",
      /^(light|dark)$/,
    )
    expect(await page.locator("html").getAttribute("class")).toBeTruthy()
  }

  expect(errors).toEqual([])
})
