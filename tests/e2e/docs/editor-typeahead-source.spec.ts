import { expect, test } from "@playwright/test"

const compositions = [
  { slug: "inline-combobox-content", name: "EditorInlineComboboxContent" },
  { slug: "emoji-category", name: "EditorEmojiCategory" },
] as const

for (const part of compositions) {
  test(`${part.name} usage copies a complete consumer composition`, async ({
    page,
    context,
  }, testInfo) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"])
    await page.goto(`/editor/${part.slug}`)
    await expect(
      page.getByRole("textbox", {
        name: `${part.name} preview`,
        exact: true,
      }),
    ).toHaveAttribute("contenteditable", "true")

    const copy = page.getByRole("button", {
      name: `Copy ${part.name} usage`,
      exact: true,
    })

    await expect(copy).toBeEnabled()
    const usage = page.getByTestId("copyable-code").filter({ has: copy })
    const displayed = await usage.locator("code").innerText()
    await page.evaluate(() =>
      navigator.clipboard.writeText("Clipboard sentinel"),
    )
    await copy.click()
    await expect
      .poll(async () =>
        (await page.evaluate(() => navigator.clipboard.readText())).trimEnd(),
      )
      .toBe(displayed.trimEnd())
    const copied = await page.evaluate(() => navigator.clipboard.readText())
    expect(copied).toContain(part.name)
    expect(copied).toContain("@/components/editor/typeahead-index")
    expect(copied).not.toContain("@/catalog/")
    expect(copied).not.toContain("@registry/")
    await testInfo.attach(`${part.slug}-consumer-composition.tsx`, {
      body: copied,
      contentType: "text/plain",
    })
  })
}
