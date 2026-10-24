import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"
import { getEditorPart } from "@workspace/apps/docs/src/catalog/editor-parts"

for (const slug of [
  "columns-controls",
  "columns-insert-control",
  "columns-layout-control",
  "column-resize-controls",
  "column-move-controls",
  "columns-remove-control",
  "date-control",
  "date-insert-control",
  "date-inline",
])
  test(`${slug} publishes usable source and accessible preview`, async ({
    page,
    request,
    context,
  }, testInfo) => {
    test.slow()
    const part = getEditorPart(slug)

    if (!part) throw new Error(`Missing part: ${slug}`)
    const response = await request.get(`/editor/${slug}.md`)
    expect(response.ok()).toBe(true)
    expect(response.headers()["content-type"]).toContain("text/")
    await page.goto(`/editor/${slug}`)
    const preview = page.locator('[data-slot="editor-live-preview"]')
    await expect(preview.getByRole("textbox")).toHaveAttribute(
      "contenteditable",
      "true",
    )
    await context.grantPermissions(["clipboard-read", "clipboard-write"])
    await page.evaluate(() =>
      navigator.clipboard.writeText("Clipboard sentinel"),
    )
    await page
      .getByRole("button", { name: `Copy ${part.name} usage`, exact: true })
      .click()
    await expect
      .poll(() => page.evaluate(() => navigator.clipboard.readText()))
      .toContain(
        slug.startsWith("date")
          ? "@/components/editor/date"
          : "@/components/editor/columns",
      )
    const copied = await page.evaluate(() => navigator.clipboard.readText())
    expect(copied).not.toContain("@/catalog/")
    expect(copied).not.toContain("@workspace/")
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
    await testInfo.attach("preview", {
      body: await page.screenshot({ scale: "css" }),
      contentType: "image/png",
    })
  })
