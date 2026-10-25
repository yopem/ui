import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

for (const [slug, name] of [
  ["docx-import-control", "EditorDocxImportControl"],
  ["docx-export-control", "EditorDocxExportControl"],
  ["docx-controls", "EditorDocxControls"],
]) {
  test(`Word parts publish ${slug} with complete consumer source`, async ({
    page,
    context,
  }) => {
    test.slow()
    await context.grantPermissions(["clipboard-read", "clipboard-write"])
    const response = await page.goto(`/editor/${slug}`)
    expect(response?.status()).toBe(200)
    const preview = page.getByTestId("editor-part-preview")
    await expect(
      preview.getByRole("textbox", {
        name: "Native Word document",
        exact: true,
      }),
    ).toHaveAttribute("contenteditable", "true")

    if (slug !== "docx-export-control") {
      await expect(
        preview.getByLabel("Word document file", { exact: true }),
      ).toBeVisible()
      await expect(
        preview.getByRole("button", {
          name: "Import Word document",
          exact: true,
        }),
      ).toBeDisabled()
    }

    if (slug !== "docx-import-control") {
      await expect(
        preview.getByRole("button", {
          name: "Download Word document",
          exact: true,
        }),
      ).toBeEnabled()
    }

    await page.evaluate(() =>
      navigator.clipboard.writeText("Clipboard sentinel"),
    )
    await page
      .getByRole("button", { name: `Copy ${name} usage`, exact: true })
      .click()
    await expect
      .poll(() => page.evaluate(() => navigator.clipboard.readText()))
      .toContain('from "@/components/editor/docx-controls"')
    const source = await page.evaluate(() => navigator.clipboard.readText())
    expect(source).not.toMatch(
      /@registry\/|@workspace\/|@yopem-ui\/|@\/catalog\//,
    )
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
  })
}
