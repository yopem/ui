import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

test("controlled replacement, reset, async initialization, and focus @a11y", async ({
  page,
}, info) => {
  test.slow()
  await page.goto("/editor/examples#controlled")
  await expect(
    page.getByRole("button", { name: "Search documentation", exact: true }),
  ).toBeEnabled()
  const example = page.getByTestId("editor-example-controlled")
  await example
    .getByRole("button", { name: "Live preview", exact: true })
    .click()

  const editor = example.getByRole("textbox", {
    name: "Controlled editor",
    exact: true,
  })

  await expect(editor).toHaveAttribute("contenteditable", "true")
  await expect(editor).toHaveText("Initial document")
  await editor.fill("Local draft")
  await example
    .getByRole("button", { name: "Replace value", exact: true })
    .click()
  await expect(editor).toHaveText("Replacement document")
  await expect(editor).toBeFocused()
  await page.keyboard.type(" end")
  await expect(editor).toHaveText("Replacement document end")
  await example
    .getByRole("button", { name: "Reset editor", exact: true })
    .click()
  await expect(editor).toHaveText("")
  await expect(editor).toBeFocused()

  const initialized = example.getByRole("textbox", {
    name: "Async initialized editor",
    exact: true,
  })

  await expect(initialized).toHaveAttribute("contenteditable", "true")
  await expect(initialized).toHaveText("Loaded document")
  await initialized.fill("Edited loaded document")
  await expect(editor).toHaveText("")

  const results = await new AxeBuilder({ page })
    .include('[data-testid="editor-example-controlled"]')
    .analyze()

  expect(results.violations).toEqual([])
  await info.attach("controlled-example-axe.json", {
    body: JSON.stringify(results, null, 2),
    contentType: "application/json",
  })
})

test("multiple roots isolate content, history, formatting, and read-only state @a11y", async ({
  page,
}, info) => {
  test.slow()
  const errors: string[] = []
  page.on("pageerror", (error) => errors.push(error.message))
  await page.goto("/editor/examples#multiple-editors")
  await expect(
    page.getByRole("button", { name: "Search documentation", exact: true }),
  ).toBeEnabled()
  const example = page.getByTestId("editor-example-multiple-editors")
  await example
    .getByRole("button", { name: "Live preview", exact: true })
    .click()

  const first = example.getByRole("textbox", {
    name: "First independent editor",
    exact: true,
  })

  const second = example.getByRole("textbox", {
    name: "Second independent editor",
    exact: true,
  })

  await expect(first).toHaveAttribute("contenteditable", "true")
  await expect(second).toHaveAttribute("contenteditable", "true")
  await first.fill("First draft")
  await first.press("ControlOrMeta+a")
  await first.press("ControlOrMeta+b")
  await expect(first.locator("strong, b")).toHaveText("First draft")
  await second.fill("Second draft")
  await expect(second.locator("strong, b")).toHaveCount(0)
  await second.press("ControlOrMeta+z")
  await expect(second).not.toHaveText("Second draft")
  await expect(first).toHaveText("First draft")
  await second.press("ControlOrMeta+Shift+z")
  await expect(second).toHaveText("Second draft")
  await example
    .getByRole("button", { name: "Toggle second read only", exact: true })
    .click()
  await expect(second).toHaveAttribute("contenteditable", "false")
  await expect(first).toHaveAttribute("contenteditable", "true")
  await first.fill("First remains writable")
  await example
    .getByRole("button", { name: "Toggle second read only", exact: true })
    .click()
  await expect(second).toHaveAttribute("contenteditable", "true")
  await second.fill("Second writable again")
  await expect(first).toHaveText("First remains writable")

  const results = await new AxeBuilder({ page })
    .include('[data-testid="editor-example-multiple-editors"]')
    .analyze()

  expect(results.violations).toEqual([])
  expect(errors).toEqual([])
  await info.attach("multiple-editors-axe.json", {
    body: JSON.stringify(results, null, 2),
    contentType: "application/json",
  })
})
