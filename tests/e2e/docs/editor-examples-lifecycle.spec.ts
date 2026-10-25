import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

test("gallery mounts editors and source panes only when opened @a11y", async ({
  page,
}, info) => {
  test.slow()
  const errors: string[] = []
  page.on("pageerror", (error) => errors.push(error.message))
  await page.goto("/editor/examples")
  await expect(
    page.getByRole("button", { name: "Search documentation", exact: true }),
  ).toBeEnabled()
  const gallery = page.getByTestId("editor-examples-core")
  const example = page.getByTestId("editor-example-basic-marks")

  const preview = example.getByRole("button", {
    name: "Live preview",
    exact: true,
  })

  const source = example.getByRole("button", {
    name: "View source",
    exact: true,
  })

  await expect(gallery.locator('[data-slot="editor-content"]')).toHaveCount(0)
  await expect(gallery.locator('[data-slot="codeblock"]')).toHaveCount(0)
  await preview.click()
  const editor = example.locator('[data-slot="editor-content"]')
  await expect(editor).toHaveAttribute("contenteditable", "true")
  await editor.fill("Transient gallery draft")
  await expect(editor).toHaveText("Transient gallery draft")
  await expect(gallery.locator('[data-slot="editor-content"]')).toHaveCount(1)
  await source.click()
  await expect(example.locator('[data-slot="codeblock"]')).toBeVisible()
  await source.click()
  await expect(gallery.locator('[data-slot="codeblock"]')).toHaveCount(0)
  await preview.click()
  await expect(preview).toBeFocused()
  await expect(gallery.locator('[data-slot="editor-content"]')).toHaveCount(0)
  await preview.click()
  await expect(editor).toHaveAttribute("contenteditable", "true")
  await expect(editor).not.toContainText("Transient gallery draft")

  const results = await new AxeBuilder({ page })
    .include('[data-testid="editor-example-basic-marks"]')
    .analyze()

  expect(results.violations).toEqual([])
  expect(errors).toEqual([])
  await info.attach("gallery-lifecycle-axe.json", {
    body: JSON.stringify(results, null, 2),
    contentType: "application/json",
  })
  await example.screenshot({
    path: info.outputPath("gallery-lifecycle.png"),
    scale: "css",
  })
})

test("closed previews still expose complete consumer source", async ({
  page,
  context,
}) => {
  await page.goto("/editor/examples")
  await expect(
    page.getByRole("button", { name: "Search documentation", exact: true }),
  ).toBeEnabled()
  await context.grantPermissions(["clipboard-read", "clipboard-write"], {
    origin: new URL(page.url()).origin,
  })
  const example = page.getByTestId("editor-example-basic-marks")
  await page.evaluate(() => navigator.clipboard.writeText("Clipboard sentinel"))
  await example
    .getByRole("button", { name: "Copy source", exact: true })
    .click()
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toContain("@/components/editor")
  await expect(example.locator('[data-slot="editor-content"]')).toHaveCount(0)
})
