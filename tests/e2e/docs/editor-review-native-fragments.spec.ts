import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

for (const decision of ["accept", "reject"] as const) {
  test(`native rich clipboard ${decision} retains authored review history`, async ({
    page,
    context,
  }) => {
    test.slow()
    const errors: string[] = []

    page.on("pageerror", (cause) => errors.push(cause.message))
    await context.grantPermissions(["clipboard-read", "clipboard-write"])
    await page.goto("/components/editor")

    const source = page.getByRole("textbox", {
      name: "Rich text editor",
      exact: true,
    })

    await expect(source).toHaveAttribute("contenteditable", "true")
    await source.fill("Rich paragraph")
    await source.press("ControlOrMeta+a")
    await source.press("ControlOrMeta+b")
    await expect(source.locator("strong,b")).toHaveText("Rich paragraph")
    await page.evaluate(() =>
      navigator.clipboard.writeText("Clipboard sentinel"),
    )
    await source.press("ControlOrMeta+c")
    await expect
      .poll(() => page.evaluate(() => navigator.clipboard.readText()))
      .toBe("Rich paragraph")

    await page.goto("/components/editor-review")

    const editor = page.getByRole("textbox", {
      name: "Review document",
      exact: true,
    })

    const panel = page.getByRole("complementary", {
      name: "Document review",
      exact: true,
    })

    await expect(editor).toHaveAttribute("contenteditable", "true")
    await editor.fill("Original target")
    await page
      .getByRole("button", { name: "Suggest edits", exact: true })
      .click()
    await editor.click()
    await editor.press("ControlOrMeta+a")
    await editor.press("ControlOrMeta+v")
    await expect(editor.locator("strong,b")).toHaveText("Rich paragraph")
    await expect(
      panel.getByRole("button", { name: "Go to suggestion", exact: true }),
    ).toHaveCount(1)
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
    await panel
      .getByRole("button", {
        name: `${decision === "accept" ? "Accept" : "Reject"} all suggestions`,
        exact: true,
      })
      .click()
    await expect(
      panel.getByRole("button", { name: "Go to suggestion", exact: true }),
    ).toHaveCount(0)
    await expect(editor).toHaveText(
      decision === "accept" ? "Rich paragraph" : "Original target",
    )
    await editor.press("ControlOrMeta+z")
    await expect(editor.locator("strong,b")).toHaveText("Rich paragraph")
    await expect(
      panel.getByRole("button", { name: "Go to suggestion", exact: true }),
    ).toHaveCount(1)
    await editor.press("ControlOrMeta+Shift+z")
    await expect(
      panel.getByRole("button", { name: "Go to suggestion", exact: true }),
    ).toHaveCount(0)
    await expect(editor).toHaveText(
      decision === "accept" ? "Rich paragraph" : "Original target",
    )
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
    expect(errors).toEqual([])
  })
}

test("independent native rich replacements resolve without changing another operation", async ({
  page,
  context,
}) => {
  test.slow()
  const errors: string[] = []

  page.on("pageerror", (cause) => errors.push(cause.message))
  await context.grantPermissions(["clipboard-read", "clipboard-write"])
  await page.goto("/components/editor")

  const source = page.getByRole("textbox", {
    name: "Rich text editor",
    exact: true,
  })

  await expect(source).toHaveAttribute("contenteditable", "true")
  await source.fill("Rich paragraph")
  await source.press("ControlOrMeta+a")
  await source.press("ControlOrMeta+b")
  await expect(source.locator("strong,b")).toHaveText("Rich paragraph")
  await page.evaluate(() => navigator.clipboard.writeText("Clipboard sentinel"))
  await source.press("ControlOrMeta+c")
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toBe("Rich paragraph")

  await page.goto("/components/editor-review")

  const editor = page.getByRole("textbox", {
    name: "Review document",
    exact: true,
  })

  const panel = page.getByRole("complementary", {
    name: "Document review",
    exact: true,
  })

  const suggestions = panel.getByRole("button", {
    name: "Go to suggestion",
    exact: true,
  })

  await expect(editor).toHaveAttribute("contenteditable", "true")
  await editor.fill("First")
  await editor.press("End")
  await editor.press("Enter")
  await page.keyboard.insertText("Second")
  await expect(editor.locator("p")).toHaveText(["First", "Second"])
  await page.getByRole("button", { name: "Suggest edits", exact: true }).click()
  await editor.click()
  await editor.press("ControlOrMeta+Home")
  await editor.press("Shift+End")
  await expect
    .poll(() => page.evaluate(() => window.getSelection()?.toString()))
    .toBe("First")
  await editor.press("ControlOrMeta+v")
  await expect(suggestions).toHaveCount(1)
  await editor.press("ControlOrMeta+End")
  await editor.press("Home")
  await editor.press("Shift+End")
  await expect
    .poll(() => page.evaluate(() => window.getSelection()?.toString()))
    .toBe("Second")
  await editor.press("ControlOrMeta+v")
  await expect(suggestions).toHaveCount(2)
  await expect(editor.locator("strong,b")).toHaveText([
    "Rich paragraph",
    "Rich paragraph",
  ])
  await panel
    .getByRole("button", { name: "Reject suggestion", exact: true })
    .first()
    .click()
  await expect(suggestions).toHaveCount(1)
  await expect(editor.locator("strong,b")).toHaveText("Rich paragraph")
  await expect(editor.locator("p").first()).toHaveText("First")
  await panel
    .getByRole("button", { name: "Accept suggestion", exact: true })
    .click()
  await expect(suggestions).toHaveCount(0)
  await expect(editor.locator("p")).toHaveText(["First", "Rich paragraph"])
  await editor.press("ControlOrMeta+z")
  await expect(suggestions).toHaveCount(1)
  await expect(editor.locator("p").first()).toHaveText("First")
  await editor.press("ControlOrMeta+Shift+z")
  await expect(suggestions).toHaveCount(0)
  await expect(editor.locator("p")).toHaveText(["First", "Rich paragraph"])
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
  expect(errors).toEqual([])
})
