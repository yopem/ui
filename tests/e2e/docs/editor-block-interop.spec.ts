import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

test.beforeEach(async ({ page }) => {
  test.slow()
  await page.goto("/docs/editor")
  await expect(
    page.getByRole("textbox", { name: "Blocks editor", exact: true }),
  ).toHaveAttribute("contenteditable", "true")
})

test("read-only title pointers change disclosure without document history", async ({
  page,
}) => {
  const editor = page.getByRole("textbox", {
    name: "Blocks editor",
    exact: true,
  })

  const toolbar = page.getByRole("toolbar", { name: "Blocks", exact: true })
  await editor.click()
  await toolbar
    .getByRole("button", { name: "Insert toggle", exact: true })
    .click()
  await editor.pressSequentially("Visible title")
  await editor.press("Enter")
  await editor.pressSequentially("Visible body")
  await page
    .getByRole("button", { name: "Read only blocks", exact: true })
    .click()
  await expect(editor).toHaveAttribute("contenteditable", "false")
  const state = page.getByLabel("Blocks JSON", { exact: true }).locator("pre")
  const before = await state.textContent()
  const title = editor.locator("[data-editor-toggle-summary]").last()
  await title.click()
  await expect(editor.locator("details")).not.toHaveAttribute("open", "")
  await expect(state).toHaveText(before!)
  await title.click()
  await expect(editor.locator("details")).toHaveAttribute("open", "")
  await expect(state).toHaveText(before!)
  await title.click()
  await state.click()
  await expect(editor.locator("details")).not.toHaveAttribute("open", "")
  await expect(state).toHaveText(before!)
  await page
    .getByRole("button", { name: "Roundtrip blocks JSON", exact: true })
    .click()
  await expect(editor.locator("details")).toHaveAttribute("open", "")
  await title.click()
  await expect(editor.locator("details")).not.toHaveAttribute("open", "")
  await page.getByRole("button", { name: "Edit blocks", exact: true }).click()
  await expect(editor.locator("details")).toHaveAttribute("open", "")
  expect(
    (
      await new AxeBuilder({ page })
        .include('[data-testid="blocks-example"]')
        .analyze()
    ).violations,
  ).toEqual([])
})

test("read-only summary links retain native navigation", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"])

  const editor = page.getByRole("textbox", {
    name: "Blocks editor",
    exact: true,
  })

  const target = new URL("/docs/editor#summary-link", page.url()).href
  await page.evaluate(async (href) => {
    await navigator.clipboard.write([
      new ClipboardItem({
        "text/html": new Blob(
          [
            `<details data-editor-toggle open><summary><a href="${href}">Summary link</a></summary><div data-editor-toggle-body><p>Body</p></div></details>`,
          ],
          { type: "text/html" },
        ),
      }),
    ])
  }, target)
  await editor.click()
  await editor.press("ControlOrMeta+v")
  const link = editor.getByRole("link", { name: "Summary link", exact: true })
  await expect(link).toHaveAttribute("href", target)
  await page
    .getByRole("button", { name: "Read only blocks", exact: true })
    .click()
  const state = page.getByLabel("Blocks JSON", { exact: true }).locator("pre")
  const before = await state.textContent()
  await link.click()
  await expect(page).toHaveURL(target)
  await expect(editor.locator("details")).toHaveAttribute("open", "")
  await expect(state).toHaveText(before!)
  expect(
    (
      await new AxeBuilder({ page })
        .include('[data-testid="blocks-example"]')
        .analyze()
    ).violations,
  ).toEqual([])
})

test("native clipboard between different editor schemas preserves target content", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"])
  const errors: string[] = []
  page.on("pageerror", (error) => errors.push(error.message))

  const source = page.getByRole("textbox", {
    name: "Blocks editor",
    exact: true,
  })

  const target = page.getByRole("textbox", {
    name: "Composed editor",
    exact: true,
  })

  await expect(target).toHaveAttribute("contenteditable", "true")
  await source.fill("Source prefix")
  await page
    .getByRole("toolbar", { name: "Blocks", exact: true })
    .getByRole("button", { name: "Insert callout", exact: true })
    .click()
  await source.press("ControlOrMeta+b")
  await source.pressSequentially("Rich callout")
  await source.press("ControlOrMeta+b")
  await source.locator("aside").evaluate((element) => {
    const document = element.ownerDocument
    const selection = document.getSelection()

    if (!selection) throw new Error("Missing native callout selection")
    const range = document.createRange()
    range.selectNode(element)
    selection.removeAllRanges()
    selection.addRange(range)
  })
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => requestAnimationFrame(() => resolve())),
  )
  await page.keyboard.press("ControlOrMeta+c")

  const clipboard = await page.evaluate(async () => {
    const items = await navigator.clipboard.read()
    const item = items.find((entry) => entry.types.includes("text/html"))

    if (!item) throw new Error("Missing copied HTML")

    return (await item.getType("text/html")).text()
  })

  const payload = await page.evaluate((html) => {
    const doc = new DOMParser().parseFromString(html, "text/html")
    const callout = doc.querySelector("aside[data-editor-callout]")

    return {
      appearance: callout?.getAttribute("data-appearance"),
      icon: callout?.getAttribute("data-icon"),
      bold: callout?.querySelector("b, strong")?.textContent,
    }
  }, clipboard)

  expect(payload).toEqual({
    appearance: "info",
    icon: "💡",
    bold: "Rich callout",
  })
  await target.fill("Target keep")
  await target.press("End")
  await target.press("Enter")
  await target.press("ControlOrMeta+v")
  await expect(target).toContainText("Target keep")
  await expect(target).toContainText("Rich callout")
  await expect(
    target.locator("strong").filter({ hasText: "Rich callout" }),
  ).toBeVisible()
  await expect(target).not.toContainText("Source prefix")
  await expect(target).toHaveAttribute("contenteditable", "true")
  expect(errors).toEqual([])
})
