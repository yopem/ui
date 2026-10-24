import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

test("@a11y footnotes preserve references, rich definitions, backlinks and history", async ({
  page,
}, testInfo) => {
  await page.goto("/editor/footnote-controls")

  const editor = page.getByRole("textbox", {
    name: "Footnote editor",
    exact: true,
  })

  const reference = editor.locator('[data-editor-footnote-reference="1"]')
  const definition = editor.locator('[data-editor-footnote-definition="1"]')

  await expect(reference).toHaveCount(2)
  await expect(reference.first()).toBeVisible()
  await expect(definition).toContainText("Rich footnote body")
  await expect(
    editor.locator('[data-editor-footnote-reference="2"]'),
  ).toBeVisible()
  const duplicates = editor.locator('[data-editor-footnote-definition="3"]')
  await expect(duplicates).toHaveCount(2)
  await expect(duplicates.nth(1)).toContainText(
    "Second duplicate definition body",
  )
  await duplicates.nth(1).getByText("Second duplicate definition body").click()

  const renumber = page.getByRole("button", {
    name: "Renumber duplicate definition",
    exact: true,
  })

  await expect(renumber).toBeEnabled()
  await renumber.click()
  await expect(
    editor.locator('[data-editor-footnote-definition="3"]'),
  ).toHaveCount(1)
  await expect(
    editor.locator('[data-editor-footnote-definition="4"]'),
  ).toContainText("Second duplicate definition body")
  await page
    .getByRole("button", { name: "Footnote backlinks", exact: true })
    .click()
  await expect(
    page.getByRole("button", { name: "Back to reference 1", exact: true }),
  ).toBeVisible()
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
  await page
    .getByRole("button", { name: "Back to reference 1", exact: true })
    .click()
  await page.getByRole("button", { name: "Undo", exact: true }).click()
  await expect(duplicates).toHaveCount(2)
  await page.getByRole("button", { name: "Redo", exact: true }).click()
  await expect(duplicates).toHaveCount(1)
  await expect(
    editor.locator('[data-editor-footnote-definition="4"]'),
  ).toContainText("Second duplicate definition body")
  await expect(definition).toContainText("Rich footnote body")
  await page.screenshot({
    path: testInfo.outputPath("footnote-workflow.png"),
    scale: "css",
  })
})

test("footnote typeahead disables mutation controls in read-only state", async ({
  page,
}) => {
  await page.goto("/editor/footnote-typeahead")

  const editor = page.getByRole("textbox", {
    name: "Footnote editor",
    exact: true,
  })

  await page.getByRole("button", { name: "Read only", exact: true }).click()
  await expect(editor).toHaveAttribute("contenteditable", "false")

  for (const name of [
    "Insert footnote",
    "Remove selected footnote part",
    "Renumber duplicate definition",
  ]) {
    await expect(page.getByRole("button", { name, exact: true })).toBeDisabled()
  }

  await expect(
    page.getByRole("button", { name: "Footnote backlinks", exact: true }),
  ).toBeEnabled()
})

for (const slug of [
  "footnote-insert-control",
  "footnote-remove-control",
  "footnote-renumber-control",
  "footnote-backlinks",
]) {
  test(`@a11y ${slug} exposes its native workflow`, async ({
    page,
  }, testInfo) => {
    await page.goto(`/editor/${slug}`)

    const editor = page.getByRole("textbox", {
      name: "Footnote editor",
      exact: true,
    })

    await expect(
      editor.locator("[data-editor-footnote-reference]"),
    ).toHaveCount(3)

    if (slug === "footnote-insert-control") {
      await editor.click()
      await editor.press("ControlOrMeta+Home")
      await page
        .getByRole("button", { name: "Insert footnote", exact: true })
        .click()
      await expect(
        editor.locator("[data-editor-footnote-reference]"),
      ).toHaveCount(4)
      await page.getByRole("button", { name: "Read only", exact: true }).click()
      await expect(
        page.getByRole("button", { name: "Insert footnote", exact: true }),
      ).toBeDisabled()
    } else if (slug === "footnote-remove-control") {
      const remove = page.getByRole("button", {
        name: "Remove selected footnote part",
        exact: true,
      })

      await editor.getByText("Rich footnote body", { exact: true }).click()
      await expect(remove).toBeEnabled()
      await remove.click()
      await expect(
        editor.locator('[data-editor-footnote-definition="1"]'),
      ).toHaveCount(0)
      await page.getByRole("button", { name: "Undo", exact: true }).click()
      await expect(
        editor.locator('[data-editor-footnote-definition="1"]'),
      ).toHaveCount(1)
    } else if (slug === "footnote-renumber-control") {
      await editor
        .getByText("Second duplicate definition body", { exact: true })
        .click()
      await page
        .getByRole("button", {
          name: "Renumber duplicate definition",
          exact: true,
        })
        .click()
      await expect(
        editor.locator('[data-editor-footnote-definition="4"]'),
      ).toBeVisible()
    } else {
      await page
        .getByRole("button", { name: "Footnote backlinks", exact: true })
        .click()
      await expect(
        page.getByRole("button", { name: "Back to reference 1", exact: true }),
      ).toBeVisible()
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
      await page
        .getByRole("button", { name: "Back to reference 1", exact: true })
        .click()
      await expect(editor).toBeFocused()
    }

    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
    await testInfo.attach(slug, {
      body: await page.screenshot(),
      contentType: "image/png",
    })
  })
}
