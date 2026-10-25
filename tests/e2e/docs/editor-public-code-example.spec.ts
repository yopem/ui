import type { Page } from "@playwright/test"

import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

function example(page: Page, slug: string) {
  return page.getByTestId(`editor-example-${slug}`)
}

async function surface(page: Page, slug: string, name: string) {
  const root = example(page, slug)
  const toggle = root.getByRole("button", { name: "Live preview", exact: true })

  if ((await toggle.getAttribute("aria-expanded")) === "false")
    await toggle.click()
  const editor = root.getByRole("textbox", { name, exact: true })
  await expect(editor).toHaveAttribute("contenteditable", "true")

  return editor
}

function toolbar(page: Page, slug: string, name: string) {
  return example(page, slug).getByRole("toolbar", { name, exact: true })
}

test.beforeEach(async ({ page }) => {
  test.slow()
  await page.goto("/editor/examples#public-code")
})

test("code-block: edits JS, Python, and CSS, selects languages, formats and copies", async ({
  page,
  context,
}, testInfo) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"])
  const editor = await surface(page, "public-code", "Public code editor")
  const controls = toolbar(page, "public-code", "Public code tools")

  const languages = controls.getByRole("combobox", {
    name: "Code language",
    exact: true,
  })

  await expect(editor.locator("code")).toHaveCount(3)

  const javascript = editor.locator('code[data-language="javascript"]')
  await javascript.click()
  await expect(languages).toHaveValue("javascript")
  await editor.press("Home")
  await editor.press("Shift+End")
  await editor.pressSequentially("const answer=42")
  await expect(javascript).toContainText("const answer=42")

  const format = controls.getByRole("button", {
    name: "Format code",
    exact: true,
  })

  await expect(format).toBeEnabled()
  await format.click()
  await expect(javascript).toContainText("const answer = 42;")
  await controls.getByRole("button", { name: "Copy code", exact: true }).click()
  await expect(
    controls.getByRole("status").filter({ hasText: "Code copied" }),
  ).toBeVisible()
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain(
    "const answer = 42;",
  )
  await editor.press("ControlOrMeta+z")
  await expect(javascript).not.toContainText("const answer = 42;")
  await editor.press("ControlOrMeta+Shift+z")
  await expect(javascript).toContainText("const answer = 42;")

  const python = editor.locator('code[data-language="python"]')
  await python.click()
  await languages.selectOption("python")
  await expect(format).toBeDisabled()
  await editor.press("Home")
  await editor.press("Shift+End")
  await editor.pressSequentially('print("from python")')
  await expect(python).toContainText('print("from python")')
  const css = editor.locator('code[data-language="css"]')
  await css.click()
  await languages.selectOption("css")
  await editor.press("Home")
  await editor.press("Shift+End")
  await editor.pressSequentially(".example{color:teal}")
  await expect(css).toContainText(".example{color:teal}")
  await expect(languages.locator('option[value=""]')).toHaveText("Unspecified")
  await testInfo.attach("code.html", {
    body: await editor.innerHTML(),
    contentType: "text/html",
  })
})

test("public code: responsive native editors stay contained and accessible @a11y", async ({
  page,
}, testInfo) => {
  const editor = await surface(page, "public-code", "Public code editor")
  const root = example(page, "public-code")

  for (const width of [1440, 768, 390]) {
    await page.setViewportSize({ width, height: 1000 })
    await editor.scrollIntoViewIfNeeded()
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
      .toBeLessThanOrEqual(width + 1)

    const report = await new AxeBuilder({ page })
      .include('[data-testid="editor-example-public-code"]')
      .analyze()

    expect(report.violations).toEqual([])
    await testInfo.attach(`public-code-${width}.png`, {
      body: await root.screenshot({ scale: "css" }),
      contentType: "image/png",
    })
  }
})
