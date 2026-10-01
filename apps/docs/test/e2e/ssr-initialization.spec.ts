import { expect, test } from "@playwright/test"

for (const path of ["/", "/components", "/components/button"]) {
  test(`SSR initializes theme tokens before rendering ${path}`, async ({
    page,
  }) => {
    const errors: string[] = []
    page.on("pageerror", (error) => errors.push(error.message))

    const response = await page.goto(path)
    expect(response?.status(), path).toBe(200)
    await expect(page.locator("h1").first()).toBeVisible()
    await expect(page.locator("html")).toHaveAttribute(
      "data-theme",
      /^(light|dark)$/,
    )
    expect(await page.locator("html").getAttribute("class")).toBeTruthy()
    expect(errors).toEqual([])
  })
}
