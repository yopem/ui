import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

test("native CSV paste preserves cells, history, host vetoes, and invalid selections @a11y", async ({
  page,
  context,
}, info) => {
  test.slow()
  const errors: string[] = []
  page.on("pageerror", (error) => errors.push(error.message))
  await context.grantPermissions(["clipboard-read", "clipboard-write"])
  await page.goto("/editor/examples#csv")
  await expect(
    page.getByRole("button", { name: "Search documentation", exact: true }),
  ).toBeEnabled()
  const example = page.getByTestId("editor-example-csv")
  await example
    .getByRole("button", { name: "Live preview", exact: true })
    .click()

  const editor = example.getByRole("textbox", {
    name: "CSV editor",
    exact: true,
  })

  await expect(editor).toHaveAttribute("contenteditable", "true")
  await editor.fill("Keep content")
  await example
    .getByRole("button", { name: "Host paste veto", exact: true })
    .click()
  await page.evaluate(() =>
    navigator.clipboard.writeText('Name,Note\nAda,"Quoted, value"'),
  )
  await editor.click()
  await editor.press("ControlOrMeta+a")
  await editor.press("ControlOrMeta+v")
  await expect(editor).toHaveText("Keep content")
  await example
    .getByRole("button", { name: "Host paste veto", exact: true })
    .click()
  await editor.click()
  await editor.press("ControlOrMeta+a")
  await editor.press("ControlOrMeta+v")
  await expect(editor.getByRole("table")).toBeVisible()
  await expect(editor.getByRole("cell")).toHaveText([
    "Name",
    "Note",
    "Ada",
    "Quoted, value",
  ])
  await editor.press("ControlOrMeta+z")
  await expect(editor).toHaveText("Keep content")
  await page.evaluate(() =>
    navigator.clipboard.write([
      new ClipboardItem({
        "text/html": new Blob(["<p><strong>Rich payload</strong></p>"], {
          type: "text/html",
        }),
        "text/plain": new Blob(["a,b\nc,d"], { type: "text/plain" }),
      }),
    ]),
  )
  await editor.click()
  await editor.press("ControlOrMeta+a")
  await editor.press("ControlOrMeta+v")
  await expect(editor.locator("strong, b")).toHaveText("Rich payload")
  await expect(editor.getByRole("table")).toHaveCount(0)
  await editor.fill("Keep content")
  await page.evaluate(() => navigator.clipboard.writeText("a,b\nc"))
  await editor.click()
  await editor.press("ControlOrMeta+a")
  await editor.press("ControlOrMeta+v")
  await expect(editor).toHaveText("Keep content")
  await expect(example.getByRole("alert")).toBeVisible()
  await page.evaluate(() =>
    navigator.clipboard.writeText('Name,Value\nAda,"<script>"'),
  )
  await editor.click()
  await editor.press("ControlOrMeta+a")
  await editor.press("ControlOrMeta+v")
  await expect(editor.getByRole("cell")).toHaveText([
    "Name",
    "Value",
    "Ada",
    "<script>",
  ])
  await expect(editor.locator("script")).toHaveCount(0)
  await expect(example.getByRole("alert")).toHaveCount(0)
  await example
    .getByRole("button", { name: "CSV read only", exact: true })
    .click()
  await expect(editor).toHaveAttribute("contenteditable", "false")
  const before = await editor.innerText()
  await editor.press("ControlOrMeta+v")
  await expect(editor).toHaveText(before)

  const result = await new AxeBuilder({ page })
    .include('[data-testid="editor-example-csv"]')
    .analyze()

  expect(result.violations).toEqual([])
  expect(errors).toEqual([])
  await info.attach("csv-paste-axe.json", {
    body: JSON.stringify(result, null, 2),
    contentType: "application/json",
  })
})
