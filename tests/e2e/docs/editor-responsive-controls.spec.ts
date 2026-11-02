import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

for (const width of [390, 768, 1280, 1440]) {
  test(`footnote controls stay usable at ${width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 960 })
    await page.goto("/editor/footnote-typeahead")

    const preview = page.getByTestId("footnote-example")

    const editor = preview.getByRole("textbox", {
      name: "Footnote editor",
      exact: true,
    })

    await expect(editor).toHaveAttribute("contenteditable", "true")

    const bounds = await preview.boundingBox()
    expect(bounds).not.toBeNull()

    if (!bounds) throw new Error("Footnote preview has no layout")

    for (const name of [
      "Read only",
      "Insert footnote",
      "Remove selected footnote part",
      "Renumber duplicate definition",
      "Footnote backlinks",
    ]) {
      const control = preview.getByRole("button", { name, exact: true })
      await expect(control).toBeVisible()
      const box = await control.boundingBox()
      expect(box).not.toBeNull()

      if (!box) throw new Error(`${name} has no layout`)
      expect(box.x).toBeGreaterThanOrEqual(bounds.x - 1)
      expect(box.x + box.width).toBeLessThanOrEqual(bounds.x + bounds.width + 1)
    }

    const readOnly = preview.getByRole("button", {
      name: "Read only",
      exact: true,
    })

    await readOnly.click()
    await expect(readOnly).toHaveAttribute("aria-pressed", "true")
    await expect(editor).toHaveAttribute("contenteditable", "false")
    await readOnly.click()
    await expect(editor).toHaveAttribute("contenteditable", "true")

    await preview
      .getByRole("button", { name: "Footnote backlinks", exact: true })
      .click()

    const backlink = page.getByRole("button", {
      name: "Back to reference 1",
      exact: true,
    })

    await expect(backlink).toBeVisible()
    await backlink.click()
    await expect(editor).toBeFocused()

    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
    await page.screenshot({
      path: testInfo.outputPath(`footnote-${width}.png`),
      scale: "css",
    })
  })
}

test("editor navigation exposes focused feature groups", async ({
  page,
}, testInfo) => {
  await page.goto("/editor/footnote-typeahead")
  await expect(
    page.getByRole("textbox", { name: "Footnote editor", exact: true }),
  ).toBeVisible()
  const mobile = testInfo.project.name === "mobile-chromium"

  if (mobile)
    await page
      .getByRole("button", { name: "Open navigation", exact: true })
      .click()

  const navigation = page
    .getByRole("navigation", { name: "Documentation", exact: true })
    .filter({ visible: true })

  const notes = navigation.getByRole("button", {
    name: "Notes and references",
    exact: true,
  })

  await expect(notes).toHaveAttribute("aria-expanded", "true")
  await expect(
    navigation.getByRole("link", { name: "Footnote Typeahead", exact: true }),
  ).toHaveAttribute("aria-current", "page")

  const basics = navigation.getByRole("button", {
    name: "Editor basics",
    exact: true,
  })

  await expect(basics).toHaveAttribute("aria-expanded", "false")
  await basics.click()
  const root = navigation.getByRole("link", { name: "Root", exact: true })
  await expect(root).toHaveAttribute("href", "/editor/root")
  await root.click()
  await expect(page).toHaveURL(/\/editor\/root$/)

  if (mobile)
    await expect(
      page.getByRole("dialog", { name: "Documentation", exact: true }),
    ).toHaveCount(0)
})

test("editor overview groups composable parts and opens a focused example", async ({
  page,
}, testInfo) => {
  await page.goto("/editor")
  const main = page.getByRole("main")

  const notes = main.getByRole("region", {
    name: "Notes and references",
    exact: true,
  })

  await expect(notes).toBeVisible()
  const part = notes.getByRole("link", { name: /^Footnote Typeahead\b/ })
  await expect(part).toHaveAttribute("href", "/editor/footnote-typeahead")
  await page.screenshot({
    path: testInfo.outputPath("editor-overview.png"),
    scale: "css",
    fullPage: true,
  })
  await part.click()
  await expect(
    page
      .getByRole("main")
      .getByRole("heading", { name: "Footnote Typeahead", exact: true }),
  ).toHaveCount(1)
  await expect(
    page.getByRole("textbox", { name: "Footnote editor", exact: true }),
  ).toBeEditable()
})
