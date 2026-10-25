import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

test("read-only: rich rendering, native copy, links, and rejected mutation @a11y", async ({
  page,
  context,
}, testInfo) => {
  test.slow()
  await page.goto("/editor/examples#read-only")
  await context.grantPermissions(["clipboard-read", "clipboard-write"], {
    origin: new URL(page.url()).origin,
  })
  const root = page.getByTestId("editor-example-read-only")
  await root.getByRole("button", { name: "Live preview", exact: true }).click()

  const editor = root.getByRole("textbox", {
    name: "Read-only rich document",
    exact: true,
  })

  await expect(editor).toHaveAttribute("contenteditable", "false")
  await expect(editor).toHaveAttribute("aria-readonly", "true")
  await expect(
    editor.getByRole("heading", { name: "Read-only guide", exact: true }),
  ).toBeVisible()
  await expect(editor.locator("strong, b")).toHaveText("Bold content")
  await expect(editor.locator("em, i")).toHaveText("Italic content")
  await expect(editor.locator("blockquote")).toContainText(
    "Quoted content stays selectable.",
  )
  await expect(
    root.getByRole("button", { name: "Bold", exact: true }),
  ).toBeDisabled()
  const before = await editor.innerHTML()
  await editor.click()
  await page.keyboard.type("Rejected mutation")
  await page.keyboard.press("Backspace")
  await expect(editor).not.toContainText("Rejected mutation")
  expect(await editor.innerHTML()).toBe(before)
  await page.evaluate(() => navigator.clipboard.writeText("Clipboard sentinel"))
  await editor
    .getByRole("heading", { name: "Read-only guide", exact: true })
    .click({ clickCount: 3 })
  await page.keyboard.press("ControlOrMeta+c")
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toContain("Read-only guide")
  let navigated = false
  await page.route("https://ui.yopem.com/docs/editor", async (route) => {
    navigated = true
    await route.abort()
  })
  const link = editor.getByRole("link", { name: "Editor guide", exact: true })
  await expect(link).toHaveAttribute("href", "https://ui.yopem.com/docs/editor")
  await link.click({ noWaitAfter: true })
  await expect.poll(() => navigated).toBe(true)

  const report = await new AxeBuilder({ page })
    .include('[data-testid="editor-example-read-only"]')
    .analyze()

  expect(report.violations).toEqual([])
  await testInfo.attach("read-only-rich-document.html", {
    body: await editor.innerHTML(),
    contentType: "text/html",
  })
})
