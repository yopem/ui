import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

for (const decision of ["accept", "reject"] as const) {
  test(`native selected-text input supports review ${decision} and history`, async ({
    page,
  }, testInfo) => {
    test.slow()
    const errors: string[] = []
    const original = "Keep old text now"
    const inserted = "fast 🌠 words"
    const pendingText = `Keep old text${inserted} now`

    const decidedText =
      decision === "accept" ? `Keep ${inserted} now` : original

    page.on("pageerror", (cause) => errors.push(cause.message))
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
    await editor.fill(original)
    await page
      .getByRole("button", { name: "Suggest edits", exact: true })
      .click()
    await editor.click()
    await page.keyboard.press("ControlOrMeta+Home")

    for (let index = 0; index < "Keep ".length; index++)
      await page.keyboard.press("ArrowRight")

    for (let index = 0; index < "old text".length; index++)
      await page.keyboard.press("Shift+ArrowRight")
    await expect
      .poll(() => page.evaluate(() => window.getSelection()?.toString()))
      .toBe("old text")
    await page.keyboard.insertText(inserted)
    await expect(suggestions).toHaveCount(1)
    await expect.poll(() => editor.innerText()).toBe(pendingText)
    await panel
      .getByRole("button", {
        name: `${decision === "accept" ? "Accept" : "Reject"} all suggestions`,
        exact: true,
      })
      .click()
    await expect(suggestions).toHaveCount(0)
    await expect.poll(() => editor.innerText()).toBe(decidedText)
    await editor.press("ControlOrMeta+z")
    await expect(suggestions).toHaveCount(1)
    await expect.poll(() => editor.innerText()).toBe(pendingText)
    await editor.press("ControlOrMeta+Shift+z")
    await expect(suggestions).toHaveCount(0)
    await expect.poll(() => editor.innerText()).toBe(decidedText)
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
    expect(errors).toEqual([])
    await testInfo.attach("native-review-selected-input.json", {
      body: JSON.stringify({
        original,
        inserted,
        pendingText,
        decision,
        decidedText,
      }),
      contentType: "application/json",
    })
  })
}

test("host read-only changes block native replacement and deletion input", async ({
  page,
}) => {
  test.slow()
  const errors: string[] = []
  const original = "Keep selected text"

  page.on("pageerror", (cause) => errors.push(cause.message))
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

  const readOnly = page.getByRole("button", {
    name: "Read-only document",
    exact: true,
  })

  await expect(editor).toHaveAttribute("contenteditable", "true")
  await editor.fill(original)
  await page.getByRole("button", { name: "Suggest edits", exact: true }).click()
  await editor.click()
  await page.keyboard.press("ControlOrMeta+Home")

  for (let index = 0; index < "Keep ".length; index++)
    await page.keyboard.press("ArrowRight")

  for (let index = 0; index < "selected".length; index++)
    await page.keyboard.press("Shift+ArrowRight")
  await expect
    .poll(() => page.evaluate(() => window.getSelection()?.toString()))
    .toBe("selected")
  await readOnly.click()
  await expect(editor).toHaveAttribute("contenteditable", "false")
  await expect(editor).toHaveAttribute("aria-readonly", "true")
  await editor.click()
  await page.keyboard.insertText("replacement")
  await page.keyboard.press("Control+Backspace")
  await expect.poll(() => editor.innerText()).toBe(original)
  await expect(suggestions).toHaveCount(0)
  await readOnly.click()
  await expect(editor).toHaveAttribute("contenteditable", "true")
  await editor.click()
  await page.keyboard.press("ControlOrMeta+End")
  await page.keyboard.insertText(" 🌠")
  await expect(suggestions).toHaveCount(1)
  await expect.poll(() => editor.innerText()).toBe(`${original} 🌠`)
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
  expect(errors).toEqual([])
})
