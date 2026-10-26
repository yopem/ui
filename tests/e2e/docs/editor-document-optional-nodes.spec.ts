import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

test("optional document nodes fail closed when target nodes are not registered @a11y", async ({
  page,
}, info) => {
  await page.goto("/docs/editor")

  const htmlSource = page.getByRole("textbox", {
    name: "HTML source",
    exact: true,
  })

  const document = page.getByRole("textbox", {
    name: "Document editor",
    exact: true,
  })

  await htmlSource.fill("<p>Original content</p>")
  await page.getByRole("button", { name: "Import HTML", exact: true }).click()
  await expect(document).toHaveText("Original content")

  await htmlSource.fill(
    '<p>Optional date <time data-editor-date="1" datetime="2024-02-29">2024-02-29</time></p>',
  )
  await page.getByRole("button", { name: "Import HTML", exact: true }).click()
  await expect(page.getByRole("alert")).toBeVisible()
  await expect(document).toHaveText("Original content")

  const results = await new AxeBuilder({ page })
    .include('[aria-label="Document I/O example"]')
    .analyze()

  await info.attach("editor-document-optional-nodes-axe.json", {
    body: JSON.stringify(results),
    contentType: "application/json",
  })
  expect(results.violations).toEqual([])
  await page.screenshot({
    path: info.outputPath("editor-document-optional-nodes.png"),
    scale: "css",
  })
})

test("readonly document preview blocks optional-node import", async ({
  page,
}) => {
  await page.goto("/docs/editor")

  const htmlSource = page.getByRole("textbox", {
    name: "HTML source",
    exact: true,
  })

  const document = page.getByRole("textbox", {
    name: "Document editor",
    exact: true,
  })

  await htmlSource.fill("<p>Original content</p>")
  await page.getByRole("button", { name: "Import HTML", exact: true }).click()
  await expect(document).toHaveText("Original content")

  await page
    .getByRole("button", { name: "Toggle readonly", exact: true })
    .click()
  await expect(
    page.getByRole("button", { name: "Import HTML", exact: true }),
  ).toBeDisabled()
  await expect(document).toHaveText("Original content")
})
