import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

test("@a11y native equations support insert, edit, cancel, delete and history", async ({
  page,
}, testInfo) => {
  await page.goto("/components/editor-math")

  const content = page.getByRole("textbox", {
    name: "Math editor",
    exact: true,
  })

  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
  await content.click()
  await content.fill("Before after")
  await page.keyboard.press("Home")
  await page
    .getByRole("button", { name: "Insert inline equation", exact: true })
    .click()
  await page.getByRole("textbox", { name: "TeX expression" }).fill("x^2")
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
  await page
    .getByRole("button", { name: "Apply equation", exact: true })
    .click()
  await expect(content).toBeFocused()
  const equation = content.locator('[data-editor-math="inline"]')
  await expect(equation.locator("math")).toBeVisible()
  await expect(content).toContainText("Before after")
  await equation.click()
  await page.getByRole("button", { name: "Edit equation", exact: true }).click()
  await page.getByRole("textbox", { name: "TeX expression" }).fill("y^3")
  await page.getByRole("button", { name: "Cancel", exact: true }).click()
  await expect(content).toBeFocused()
  await expect(equation).toHaveAttribute("data-editor-tex", "x^2")
  await equation.click()
  await page.getByRole("button", { name: "Edit equation", exact: true }).click()
  await page.getByRole("textbox", { name: "TeX expression" }).fill("y^3")
  await page
    .getByRole("button", { name: "Apply equation", exact: true })
    .click()
  await expect(equation).toHaveAttribute("data-editor-tex", "y^3")
  await page.keyboard.press("ControlOrMeta+z")
  await expect(equation).toHaveAttribute("data-editor-tex", "x^2")
  await equation.focus()
  await page.getByRole("button", { name: "Edit equation", exact: true }).click()
  await page.getByRole("textbox", { name: "TeX expression" }).fill("\\frac{")
  await expect(page.getByRole("alert")).toBeVisible()
  await expect(
    page.getByRole("button", { name: "Apply equation", exact: true }),
  ).toBeDisabled()
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
  await page.keyboard.press("Escape")
  await expect(content).toBeFocused()
  await equation.click()
  await page.keyboard.press("Delete")
  await expect(equation).toHaveCount(0)
  await page.keyboard.press("ControlOrMeta+z")
  await expect(equation).toHaveCount(1)
  await content.click()
  await page.keyboard.press("ControlOrMeta+End")
  await page
    .getByRole("button", { name: "Insert block equation", exact: true })
    .click()
  await page
    .getByRole("textbox", { name: "TeX expression" })
    .fill("\\frac{1}{2}")
  await page
    .getByRole("button", { name: "Apply equation", exact: true })
    .click()
  await expect(content.locator('[data-editor-math="block"] math')).toBeVisible()
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
  await content.screenshot({ path: testInfo.outputPath("math-workflow.png") })
})
