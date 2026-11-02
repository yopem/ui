import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

for (const [slug, name] of [
  ["labels-picker", "EditorLabelsPicker"],
  ["labels-option", "EditorLabelsOption"],
]) {
  test(`label parts publish ${slug} with complete consumer source`, async ({
    page,
    context,
  }) => {
    test.slow()
    await context.grantPermissions(["clipboard-read", "clipboard-write"])
    const response = await page.goto(`/editor/${slug}`)
    expect(response?.status()).toBe(200)

    const preview = page.getByRole("group", {
      name: `${name} live preview`,
      exact: true,
    })

    if (slug === "labels-option") {
      const editor = preview.getByRole("checkbox", {
        name: "Editor",
        exact: true,
      })

      await expect(editor).toBeChecked()
      await editor.click()
      await expect(editor).not.toBeChecked()
      await expect(
        preview.getByRole("checkbox", { name: "Disabled form label" }),
      ).toBeDisabled()
      await expect(preview.locator('[contenteditable="true"]')).toHaveCount(0)
    } else {
      await expect(
        preview.getByRole("textbox", { name: "Public labels editor" }),
      ).toHaveAttribute("contenteditable", "true")
    }

    await page.evaluate(() =>
      navigator.clipboard.writeText("Clipboard sentinel"),
    )
    await page
      .getByRole("button", { name: `Copy ${name} usage`, exact: true })
      .click()
    await expect
      .poll(() => page.evaluate(() => navigator.clipboard.readText()))
      .toContain('from "@/components/editor/labels"')
    const source = await page.evaluate(() => navigator.clipboard.readText())
    expect(source).not.toMatch(
      /@registry\/|@workspace\/|@yopem-ui\/|@\/catalog\//,
    )
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
  })
}
