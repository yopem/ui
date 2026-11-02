import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"
import { editorPartLabel } from "@workspace/apps/docs/src/catalog/editor-parts"
import { editorTypeaheadParts } from "@workspace/apps/docs/src/catalog/editor-typeahead-parts"

for (const part of editorTypeaheadParts) {
  test(`${part.name} public composition preview @a11y`, async ({
    page,
  }, testInfo) => {
    test.slow()
    const response = await page.goto(`/editor/${part.slug}`)
    expect(response?.status()).toBe(200)
    await expect(
      page.getByRole("heading", {
        name: editorPartLabel(part.name),
        exact: true,
        level: 1,
      }),
    ).toBeVisible()
    const preview = page.locator('[data-slot="editor-part-preview"]')

    const editor = preview.getByRole("textbox", {
      name: `${part.name} preview`,
      exact: true,
    })

    await expect(editor).toHaveAttribute("contenteditable", "true")
    await expect(preview.getByRole("textbox")).toHaveCount(1)
    await editor.click()

    if (part.name.startsWith("EditorEmoji")) {
      await page.keyboard.type("Emoji ")
      await preview.getByRole("button", { name: "Emoji", exact: true }).click()
      await page
        .getByRole("combobox", { name: "Search emoji", exact: true })
        .fill("woman_technologist")
      await expect(
        page.getByRole("option", {
          name: "👩‍💻 woman technologist",
          exact: true,
        }),
      ).toBeVisible()
    } else {
      await page.keyboard.type("@Ada")
      await expect(
        page.getByRole("option", { name: "Ada", exact: true }),
      ).toBeVisible()
      await expect(editor).toBeFocused()
    }

    const result = await new AxeBuilder({ page }).analyze()
    await testInfo.attach(`${part.slug}-open-axe`, {
      body: JSON.stringify(result),
      contentType: "application/json",
    })
    expect(result.violations).toEqual([])

    if (part.name.startsWith("EditorEmoji")) {
      const search = page.getByRole("combobox", {
        name: "Search emoji",
        exact: true,
      })

      const base = page.getByRole("option", {
        name: "👩‍💻 woman technologist",
        exact: true,
      })

      const lightTone = page.getByRole("option", {
        name: "👩🏻‍💻 woman technologist: light skin tone",
        exact: true,
      })

      await expect(base).toHaveAttribute("data-highlighted")
      await search.press("ArrowDown")
      await expect(lightTone).toHaveAttribute("data-highlighted")
      await search.press("ArrowUp")
      await expect(base).toHaveAttribute("data-highlighted")
      await search.press("Enter")
      await expect(editor).toContainText("👩‍💻")
      await expect(editor).toBeFocused()
      await preview.getByRole("button", { name: "Emoji", exact: true }).click()
      await page.keyboard.press("Escape")
      await expect(
        preview.getByRole("button", { name: "Emoji", exact: true }),
      ).toBeFocused()
    } else {
      await editor.press("Enter")
      await expect(editor.locator('[data-slot="editor-mention"]')).toHaveText(
        "@Ada",
      )
      await expect(editor).toBeFocused()
      await expect(
        page.getByRole("option", { name: "Ada", exact: true }),
      ).toHaveCount(0)
      await editor.pressSequentially(" @Ada")
      await expect(
        page.getByRole("option", { name: "Ada", exact: true }),
      ).toBeVisible()
      await editor.press("Escape")
      await expect(
        page.getByRole("option", { name: "Ada", exact: true }),
      ).toHaveCount(0)
      await expect(editor).toContainText("@Ada")
    }

    await page.setViewportSize({ width: 390, height: 844 })
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
      .toBeLessThanOrEqual(390)

    const closed = await new AxeBuilder({ page }).analyze()
    await testInfo.attach(`${part.slug}-closed-mobile-axe`, {
      body: JSON.stringify(closed),
      contentType: "application/json",
    })
    expect(closed.violations).toEqual([])
    await testInfo.attach(`${part.slug}-mobile-preview`, {
      body: await preview.screenshot({ scale: "css" }),
      contentType: "image/png",
    })

    const markdown = await page.request.get(`/editor/${part.slug}.md`)
    expect(markdown.status()).toBe(200)
    expect(markdown.headers()["content-type"]).toContain("text/")
  })
}
