import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

const cases = [
  ["callout-button", "EditorCalloutButton"],
  ["toggle-button", "EditorToggleButton"],
  ["callout-appearance-button", "EditorCalloutAppearanceButton"],
  ["callout-icon-control", "EditorCalloutIconControl"],
  ["block-type-button", "EditorBlockTypeButton"],
  ["remove-block-button", "EditorRemoveBlockButton"],
  ["disclosure-button", "EditorDisclosureButton"],
  ["blocks-controls", "EditorBlocksControls"],
] as const

for (const [slug, name] of cases) {
  test(`${name} focused workflow @a11y`, async ({ page }, info) => {
    await page.goto(`/editor/${slug}`)

    const preview = page.getByRole("group", {
      name: `${name} live preview`,
      exact: true,
    })

    const editor = preview.getByRole("textbox", {
      name: `${name} preview`,
      exact: true,
    })

    const toggle = slug === "toggle-button" || slug === "disclosure-button"
    await expect(editor).toHaveAttribute("contenteditable", "true")
    await editor.click()
    await preview
      .getByRole("button", {
        name: toggle ? "Insert toggle" : "Insert callout",
        exact: true,
      })
      .click()
    await editor.pressSequentially("Focused block")

    if (toggle) {
      await editor.press("Enter")
      await editor.pressSequentially("Body content")
      await expect(editor.locator("details")).toHaveAttribute("open", "")
    } else {
      await expect(editor.locator("aside")).toContainText("Focused block")
    }

    if (slug === "callout-appearance-button") {
      await preview
        .getByRole("button", {
          name: "Callout appearance warning",
          exact: true,
        })
        .click()
      await expect(editor.locator("aside")).toHaveAttribute(
        "data-appearance",
        "warning",
      )
    }

    if (slug === "callout-icon-control") {
      await preview
        .getByRole("textbox", { name: "Callout icon", exact: true })
        .fill("✅")
      await preview
        .getByRole("button", { name: "Apply icon", exact: true })
        .click()
      await expect(editor.locator("aside")).toHaveAttribute("data-icon", "✅")
    }

    if (slug === "block-type-button") {
      await preview
        .getByRole("button", { name: "Convert to toggle", exact: true })
        .click()
      await expect(editor.locator("[data-editor-toggle-body]")).toContainText(
        "Focused block",
      )
      await expect(editor.locator("[data-editor-toggle-summary]")).toHaveText(
        "",
      )
      await editor.pressSequentially("New summary")
      await expect(editor.locator("[data-editor-toggle-summary]")).toHaveText(
        "New summary",
      )
      await expect(editor.locator("[data-editor-toggle-body]")).toContainText(
        "Focused block",
      )
    }

    if (slug === "remove-block-button") {
      await preview
        .getByRole("button", { name: "Remove block", exact: true })
        .click()
      await expect(editor.locator("aside")).toHaveCount(0)
      await expect(editor).toContainText("Focused block")
    }

    if (slug === "disclosure-button") {
      await preview
        .getByRole("button", { name: "Toggle disclosure", exact: true })
        .click()
      await expect(editor.locator("details")).not.toHaveAttribute("open", "")
    }

    if (toggle) {
      const summary = editor.locator("summary").first()
      await summary.focus()
      await summary.press("Enter")
      await expect(summary).toBeFocused()
    }

    expect(
      (
        await new AxeBuilder({ page })
          .include('[data-slot="editor-part-preview"]')
          .analyze()
      ).violations,
    ).toEqual([])
    await preview
      .getByRole("button", { name: "Read only", exact: true })
      .click()
    await expect(editor).toHaveAttribute("contenteditable", "false")
    await expect(
      preview.getByRole("button", {
        name: toggle ? "Insert toggle" : "Insert callout",
        exact: true,
      }),
    ).toBeDisabled()

    if (toggle) {
      const summary = editor.locator("summary").first()
      await summary.focus()
      await summary.press("Space")
      await expect(summary).toBeFocused()
    }

    expect(
      (
        await new AxeBuilder({ page })
          .include('[data-slot="editor-part-preview"]')
          .analyze()
      ).violations,
    ).toEqual([])
    await page.screenshot({
      path: info.outputPath(`${slug}-readonly.png`),
      fullPage: true,
      scale: "css",
    })
    await preview
      .getByRole("button", { name: "Edit document", exact: true })
      .click()
    await expect(editor).toHaveAttribute("contenteditable", "true")
    await expect(
      preview.getByRole("button", {
        name: toggle ? "Insert toggle" : "Insert callout",
        exact: true,
      }),
    ).toBeEnabled()
  })
}
