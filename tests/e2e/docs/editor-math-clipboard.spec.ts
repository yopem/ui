import { expect, test } from "@playwright/test"

test.use({ permissions: ["clipboard-read", "clipboard-write"] })

for (const kind of ["inline", "block"] as const) {
  test(`native ${kind} equation survives browser clipboard`, async ({
    page,
  }) => {
    await page.goto("/components/editor-math")

    const content = page.getByRole("textbox", {
      name: "Math editor",
      exact: true,
    })

    await content.fill("Before after")
    await page.keyboard.press("Home")
    await page
      .getByRole("button", { name: `Insert ${kind} equation`, exact: true })
      .click()
    await page.getByRole("textbox", { name: "TeX expression" }).fill("x^2")
    await page
      .getByRole("button", { name: "Apply equation", exact: true })
      .click()
    const equations = content.locator(`[data-editor-math="${kind}"]`)
    await expect(equations).toHaveCount(1)
    await equations.first().click()
    await page.keyboard.press("ControlOrMeta+c")
    await content.click()
    await page.keyboard.press("ControlOrMeta+End")
    await page.keyboard.press("ControlOrMeta+v")
    await expect(equations).toHaveCount(2)
    await expect(equations.last()).toHaveAttribute("data-editor-tex", "x^2")
    await expect(content).toContainText("Before after")
  })
}
