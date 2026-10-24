import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

const parts = [
  [
    "footnote-typeahead",
    "EditorFootnoteTypeahead",
    "footnote",
    "Footnote editor",
  ],
  [
    "footnote-controls",
    "EditorFootnoteControls",
    "footnote",
    "Footnote editor",
  ],
  [
    "footnote-insert-control",
    "EditorFootnoteInsertControl",
    "footnote",
    "Footnote editor",
  ],
  [
    "footnote-remove-control",
    "EditorFootnoteRemoveControl",
    "footnote",
    "Footnote editor",
  ],
  [
    "footnote-renumber-control",
    "EditorFootnoteRenumberControl",
    "footnote",
    "Footnote editor",
  ],
  [
    "footnote-backlinks",
    "EditorFootnoteBacklinks",
    "footnote",
    "Footnote editor",
  ],
  ["toc-controls", "EditorTocControls", "toc", "TOC editor"],
  ["toc-insert-control", "EditorTocInsertControl", "toc", "TOC editor"],
  ["toc-remove-control", "EditorTocRemoveControl", "toc", "TOC editor"],
  ["toc-slash-command", "editorTocSlashCommand", "toc", "TOC editor"],
] as const

for (const [slug, name, module, label] of parts) {
  test(`@a11y ${name} copies complete consumer composition`, async ({
    page,
    context,
    browserName,
  }, testInfo) => {
    test.skip(
      browserName !== "chromium",
      "Clipboard permissions require Chromium",
    )
    await context.grantPermissions(["clipboard-read", "clipboard-write"])
    await page.goto(`/editor/${slug}`)
    await expect(
      page.getByRole("textbox", { name: label, exact: true }),
    ).toBeVisible()
    await page
      .getByRole("button", { name: `Copy ${name} usage`, exact: true })
      .click()
    await expect
      .poll(() => page.evaluate(() => navigator.clipboard.readText()))
      .toContain("<EditorRoot")
    const source = await page.evaluate(() => navigator.clipboard.readText())
    expect(source).toContain(`from "@/components/editor/${module}"`)
    expect(source).toContain(
      module === "footnote"
        ? "const editorFootnoteFixture"
        : "const editorTocFixture",
    )
    expect(source).not.toMatch(
      /@registry\/|@workspace\/|@\/?catalog\/|@yopem-ui\/|(?:from|export[^\n]*from)\s+["']\./,
    )
    expect(source).toContain(
      name === "editorTocSlashCommand" ? "editorTocSlashCommand()" : `<${name}`,
    )
    expect(source).toContain("extensions={extensions}")

    if (module === "toc" && name !== "editorTocSlashCommand") {
      expect(source).toContain("<EditorContent")
      expect(source).not.toContain("typeahead-index")
      expect(source).not.toContain("editorTocSlashCommand")
    }

    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
    await testInfo.attach(`${slug}-consumer.tsx`, {
      body: source,
      contentType: "text/plain",
    })
    await testInfo.attach(`${slug}-preview`, {
      body: await page.screenshot(),
      contentType: "image/png",
    })
  })
}
