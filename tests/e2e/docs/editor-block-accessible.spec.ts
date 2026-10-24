import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

test("disclosure labels track empty, rich and cleared titles @a11y", async ({
  page,
}) => {
  await page.goto("/docs/editor")

  const editor = page.getByRole("textbox", {
    name: "Blocks editor",
    exact: true,
  })

  await expect(editor).toHaveAttribute("contenteditable", "true")
  await editor.fill("Before")
  await page
    .getByRole("toolbar", { name: "Blocks", exact: true })
    .getByRole("button", { name: "Insert toggle", exact: true })
    .click()
  const control = editor.locator("[data-editor-toggle-control]")
  const title = editor.locator("[data-editor-toggle-summary]")
  const body = editor.locator("[data-editor-toggle-content]")
  await expect(control).toHaveAccessibleName("Toggle content")
  await editor.pressSequentially("Visible title")
  await expect(control).toHaveAccessibleName("Visible title")
  await editor.press("Enter")
  await editor.pressSequentially("Hidden body")
  await control.focus()
  await control.press("Space")
  await expect(control).toBeFocused()
  await expect(title).toBeVisible()
  await expect(body).toBeHidden()
  const box = await control.boundingBox()
  expect(box?.width).toBeGreaterThanOrEqual(44)
  expect(box?.height).toBeGreaterThanOrEqual(44)
  await control.press("Enter")
  await expect(control).toBeFocused()
  await expect(body).toBeVisible()
  const titleBox = await title.boundingBox()
  const bodyBox = await body.boundingBox()
  expect(bodyBox?.width).toBeGreaterThan(titleBox?.width ?? 0)
  await title.click()
  await page.keyboard.press("Home")
  await page.keyboard.press("Shift+End")
  await page.keyboard.press("Backspace")
  await expect(title).toBeEmpty()
  await expect(control).toHaveAccessibleName("Toggle content")
  expect(
    (
      await new AxeBuilder({ page })
        .include('[data-testid="blocks-example"]')
        .analyze()
    ).violations,
  ).toEqual([])
})

test("canonical rich title stays visible closed and roundtrips without control text @a11y", async ({
  page,
  context,
}, info) => {
  await page.goto("/docs/editor")
  await context.grantPermissions(["clipboard-read", "clipboard-write"])

  const editor = page.getByRole("textbox", {
    name: "Blocks editor",
    exact: true,
  })

  await expect(editor).toHaveAttribute("contenteditable", "true")
  const href = new URL("/docs/editor#accessible-title", page.url()).href
  await page.evaluate(async (target) => {
    await navigator.clipboard.write([
      new ClipboardItem({
        "text/html": new Blob(
          [
            `<section data-editor-toggle><div data-editor-toggle-summary style="text-align:center"><strong>Rich</strong> <a href="${target}">Title link</a></div><details data-editor-toggle-body><summary data-editor-toggle-control contenteditable="false" aria-label="Rich Title link"></summary><div data-editor-toggle-content><p><em>Body marks</em></p><ul><li>List item</li></ul><table><tbody><tr><td>Table cell</td></tr></tbody></table></div></details></section>`,
          ],
          { type: "text/html" },
        ),
      }),
    ])
  }, href)
  await editor.click()
  await editor.press("ControlOrMeta+v")

  for (const name of ["Roundtrip blocks HTML", "Roundtrip blocks JSON"]) {
    await page.getByRole("button", { name, exact: true }).click()
    await expect(editor.locator("[data-editor-toggle]")).toHaveCount(1)
    await expect(
      editor.locator("[data-editor-toggle-summary] strong"),
    ).toHaveText("Rich")
    await expect(
      editor.getByRole("link", { name: "Title link", exact: true }),
    ).toBeVisible()
    await expect(editor.locator("[data-editor-toggle-content]")).toBeHidden()
    await expect(editor.locator("[data-editor-toggle-control]")).toBeEmpty()
  }

  await page
    .getByRole("button", { name: "Read only blocks", exact: true })
    .click()
  const state = page.getByLabel("Blocks JSON", { exact: true }).locator("pre")
  const before = await state.textContent()
  const link = editor.getByRole("link", { name: "Title link", exact: true })
  const control = editor.locator("[data-editor-toggle-control]")
  await link.focus()
  await link.press("Tab")
  await expect(control).toBeFocused()
  await control.press("Enter")
  await expect(control).toBeFocused()
  await control.press("Space")
  await expect(control).toBeFocused()
  await expect(state).toHaveText(before!)
  await link.click()
  await expect(page).toHaveURL(href)
  await expect(editor.locator("details")).not.toHaveAttribute("open", "")
  await expect(state).toHaveText(before!)
  expect(
    (
      await new AxeBuilder({ page })
        .include('[data-testid="blocks-example"]')
        .analyze()
    ).violations,
  ).toEqual([])
  await editor.locator("[data-editor-toggle-control]").press("Enter")
  await expect(editor.locator("em")).toHaveText("Body marks")
  await expect(editor.locator("li")).toHaveText("List item")
  await expect(editor.locator("td")).toHaveText("Table cell")
  await info.attach("canonical-rich-block-state", {
    body: before!,
    contentType: "application/json",
  })
})

for (const malformed of [
  "<section data-editor-toggle><div data-editor-toggle-summary>Title</div><details data-editor-toggle-body><summary data-editor-toggle-control></summary></details></section>",
  "<section data-editor-toggle><div data-editor-toggle-summary>Title</div><details data-editor-toggle-body><summary data-editor-toggle-control>Injected title</summary><div data-editor-toggle-content><p>Body</p></div></details></section>",
  "<section data-editor-toggle><div data-editor-toggle-summary>Title</div><details data-editor-toggle-body><summary data-editor-toggle-control></summary><div data-editor-toggle-content><p>Body</p></div><p>Extra</p></details></section>",
  "<div data-editor-toggle-summary>Orphan title</div>",
  "<summary data-editor-toggle-control></summary>",
  "<div data-editor-toggle-content><p>Orphan body</p></div>",
]) {
  test(`reject malformed owned block HTML ${malformed}`, async ({
    page,
    context,
  }) => {
    await page.goto("/docs/editor")
    await context.grantPermissions(["clipboard-read", "clipboard-write"])

    const editor = page.getByRole("textbox", {
      name: "Blocks editor",
      exact: true,
    })

    await expect(editor).toHaveAttribute("contenteditable", "true")
    await editor.fill("Keep content")
    const state = page.getByLabel("Blocks JSON", { exact: true }).locator("pre")
    const before = await state.textContent()
    await page.evaluate(async (html) => {
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([html], { type: "text/html" }),
        }),
      ])
    }, malformed)
    await editor.press("ControlOrMeta+v")
    await expect(state).toHaveText(before!)
    await expect(editor).toHaveText("Keep content")
  })
}
