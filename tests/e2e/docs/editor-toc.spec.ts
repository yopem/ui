import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

test("@a11y TOC follows real headings and moves focus to the selected heading", async ({
  page,
}, testInfo) => {
  await page.goto("/editor/toc-controls")
  const editor = page.getByRole("textbox", { name: "TOC editor", exact: true })
  const toc = editor.locator("[data-editor-toc]")

  const heading = editor.getByRole("heading", {
    name: "Example Content",
    exact: true,
  })

  await expect(
    toc.getByRole("link", { name: "Example Content", exact: true }),
  ).toBeVisible()
  await toc.getByRole("link", { name: "Example Content", exact: true }).click()
  await expect(heading).toBeFocused()
  await page.keyboard.insertText("Marker ")
  await expect(
    editor.getByRole("heading", {
      name: "Marker Example Content",
      exact: true,
    }),
  ).toBeVisible()
  await expect(
    toc.getByRole("link", { name: "Marker Example Content", exact: true }),
  ).toBeVisible()
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
  await page.screenshot({
    path: testInfo.outputPath("toc-navigation.png"),
    scale: "css",
  })
})

test("TOC heading edits keep the base overview current", async ({ page }) => {
  await page.goto("/editor/toc-controls")
  const editor = page.getByRole("textbox", { name: "TOC editor", exact: true })

  const heading = editor.getByRole("heading", {
    name: "Example Content",
    exact: true,
  })

  await heading.click()
  await page.keyboard.press("Home")
  await page.keyboard.press("Shift+End")
  await page.keyboard.type("Renamed section")
  await expect(
    editor
      .locator("[data-editor-toc] a", { hasText: "Renamed section" })
      .first(),
  ).toBeVisible()
})

test("optional TOC slash insertion uses the host typeahead", async ({
  page,
}, testInfo) => {
  await page.goto("/editor/toc-slash-command")
  const editor = page.getByRole("textbox", { name: "TOC editor", exact: true })

  await editor.locator("p").first().click()
  await page.keyboard.press("End")
  await page.keyboard.press("Enter")
  await editor.pressSequentially("/toc")
  await expect(
    page.getByRole("option", { name: /Table of contents/ }),
  ).toBeVisible()
  await page.keyboard.press("Enter")
  await expect(editor.locator("[data-editor-toc]")).toHaveCount(2)
  await testInfo.attach("toc-slash-insertion", {
    body: await page.screenshot(),
    contentType: "image/png",
  })
})

for (const slug of ["toc-insert-control", "toc-remove-control"]) {
  test(`@a11y ${slug} changes native TOC nodes`, async ({ page }, testInfo) => {
    await page.goto(`/editor/${slug}`)

    const editor = page.getByRole("textbox", {
      name: "TOC editor",
      exact: true,
    })

    await expect(editor.locator("[data-editor-toc]")).toHaveCount(1)
    await editor
      .getByRole("heading", { name: "Example Content", exact: true })
      .click()
    await page.keyboard.press("Home")

    if (slug === "toc-insert-control") {
      await page
        .getByRole("button", { name: "Insert table of contents", exact: true })
        .click()
      await expect(editor.locator("[data-editor-toc]")).toHaveCount(2)
      expect(
        (await editor.getByRole("heading").allTextContents()).every(
          (title) => title.trim().length > 0,
        ),
      ).toBe(true)
      await expect(
        editor.getByRole("navigation", {
          name: "Table of contents 1",
          exact: true,
        }),
      ).toBeVisible()
      await expect(
        editor.getByRole("navigation", {
          name: "Table of contents 2",
          exact: true,
        }),
      ).toBeVisible()
    } else {
      await page.keyboard.press("ArrowLeft")

      const remove = page.getByRole("button", {
        name: "Remove table of contents",
        exact: true,
      })

      await expect(remove).toBeEnabled()
      await remove.click()
      await expect(editor.locator("[data-editor-toc]")).toHaveCount(0)
      await page.getByRole("button", { name: "Undo", exact: true }).click()
      await expect(editor.locator("[data-editor-toc]")).toHaveCount(1)
    }

    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
    await testInfo.attach(slug, {
      body: await page.screenshot(),
      contentType: "image/png",
    })
  })
}

test("middle-heading insertion keeps both text halves, native history, and the next typing target", async ({
  page,
}, testInfo) => {
  await page.goto("/editor/toc-insert-control")
  const editor = page.getByRole("textbox", { name: "TOC editor", exact: true })
  const entries = editor.locator("[data-editor-toc]").first().getByRole("link")
  await expect(entries).toHaveText(["Example Content", "Subsection"])
  await editor
    .getByRole("heading", { name: "Example Content", exact: true })
    .click()
  await page.keyboard.press("Home")

  for (let index = 0; index < 8; index += 1)
    await page.keyboard.press("ArrowRight")
  await page
    .getByRole("button", { name: "Insert table of contents", exact: true })
    .click()
  await expect(editor.getByRole("heading")).toHaveCount(3)
  expect(await editor.getByRole("heading").allTextContents()).toEqual([
    "Example ",
    "Content",
    "Subsection",
  ])
  await expect(entries).toHaveText(["Example", "Content", "Subsection"])
  await editor.press("ControlOrMeta+z")
  await expect(editor.getByRole("heading")).toHaveCount(2)
  await expect(editor.locator("[data-editor-toc]")).toHaveCount(1)
  await expect(entries).toHaveText(["Example Content", "Subsection"])
  await editor.press("ControlOrMeta+Shift+z")
  await expect(editor.getByRole("heading")).toHaveCount(3)
  await expect(editor.locator("[data-editor-toc]")).toHaveCount(2)
  await expect(entries).toHaveText(["Example", "Content", "Subsection"])
  await page.keyboard.insertText("Marker ")
  await expect(
    editor.getByRole("heading", { name: "Marker Content", exact: true }),
  ).toBeVisible()
  await testInfo.attach("split-heading-history.html", {
    body: await editor.innerHTML(),
    contentType: "text/html",
  })
})
