import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

test("generic fixture host validates IDs and clones fresh independent values", async ({
  page,
}, testInfo) => {
  test.slow()
  await page.goto("/editor/examples#public-demo-host")
  const example = page.getByTestId("editor-example-public-demo-host")
  await example
    .getByRole("button", { name: "Live preview", exact: true })
    .click()

  const first = example.getByRole("textbox", {
    name: "First fixture document",
    exact: true,
  })

  const second = example.getByRole("textbox", {
    name: "Second fixture document",
    exact: true,
  })

  await expect(first).toHaveAttribute("contenteditable", "true")
  await expect(second).toHaveAttribute("contenteditable", "true")
  const seed = await second.innerText()
  await first.fill("First root changed")
  await expect(second).toHaveText(seed)
  await example
    .getByRole("textbox", { name: "Canonical fixture ID", exact: true })
    .fill("missing-fixture")
  await example
    .getByRole("button", { name: "Load fresh fixture roots", exact: true })
    .click()
  await expect(example.getByRole("alert")).toBeVisible()
  await expect(first).toHaveText("First root changed")
  await expect(second).toHaveText(seed)
  await example
    .getByRole("textbox", { name: "Canonical fixture ID", exact: true })
    .fill("basic-marks")
  await example
    .getByRole("button", { name: "Load fresh fixture roots", exact: true })
    .click()
  await expect(first).toHaveAttribute("contenteditable", "true")
  await expect(first.locator("strong")).toContainText("Bold")
  await expect(second.locator("strong")).toContainText("Bold")
  await first.fill("Only first changed again")
  await expect(second.locator("strong")).toContainText("Bold")
  await example
    .getByRole("button", { name: "Load fresh fixture roots", exact: true })
    .click()
  await expect(first.locator("strong")).toContainText("Bold")
  await expect(example.getByRole("alert")).toHaveCount(0)

  const report = await new AxeBuilder({ page })
    .include('[data-testid="editor-example-public-demo-host"]')
    .analyze()

  expect(report.violations).toEqual([])
  await testInfo.attach("demo-host-axe.json", {
    body: JSON.stringify(report),
    contentType: "application/json",
  })
})
