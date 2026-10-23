import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"
import { z } from "zod"

const stateSchema = z.object({
  root: z.object({
    type: z.literal("root"),
    children: z.array(z.object({ type: z.string() })),
  }),
})

test.beforeEach(async ({ page }) => {
  await page.goto("/docs/editor")
  await expect(
    page.getByRole("textbox", { name: "Rich text editor", exact: true }),
  ).toHaveAttribute("contenteditable", "true")
})

test("formats selection with pointer and keyboard and records history", async ({
  page,
}, testInfo) => {
  const editor = page.getByRole("textbox", {
    name: "Rich text editor",
    exact: true,
  })

  const toolbar = page.getByRole("toolbar", {
    name: "Rich text editor formatting",
  })

  await expect(page.getByTestId("preset-editor")).toHaveAttribute(
    "id",
    "example-editor",
  )
  await expect(
    toolbar.getByRole("button", { name: "Undo", exact: true }),
  ).toBeDisabled()
  await editor.fill("Foundation")
  await editor.press("ControlOrMeta+a")
  await toolbar.getByRole("button", { name: "Bold", exact: true }).click()
  await expect(editor.locator("strong, b")).toHaveText("Foundation")
  await editor.press("ControlOrMeta+i")
  await expect(editor.locator("strong, b")).toHaveCSS("font-style", "italic")
  await expect(
    toolbar.getByRole("button", { name: "Undo", exact: true }),
  ).toBeEnabled()
  await toolbar.getByRole("button", { name: "Undo", exact: true }).click()
  await expect(editor.locator("strong, b")).toHaveCSS("font-style", "normal")
  await toolbar.getByRole("button", { name: "Redo", exact: true }).click()
  await expect(editor.locator("strong, b")).toHaveCSS("font-style", "italic")
  const output = page.getByRole("region", { name: "Serialized editor state" })
  await expect(output).toContainText("Foundation")
  await expect
    .poll(
      async () =>
        stateSchema.parse(JSON.parse(await output.innerText())).root.children
          .length,
    )
    .toBeGreaterThan(0)
  await testInfo.attach("serialized-editor-state.json", {
    body: await output.innerText(),
    contentType: "application/json",
  })
})

test("changes blocks, lists, and inserts a table", async ({ page }) => {
  const editor = page.getByRole("textbox", {
    name: "Rich text editor",
    exact: true,
  })

  const toolbar = page.getByRole("toolbar", {
    name: "Rich text editor formatting",
  })

  await editor.fill("Heading")
  await toolbar.getByRole("button", { name: "Heading 1", exact: true }).click()
  await expect(editor.locator("h1")).toHaveText("Heading")
  await toolbar.getByRole("button", { name: "Paragraph", exact: true }).click()
  await toolbar
    .getByRole("button", { name: "Bullet list", exact: true })
    .click()
  await expect(editor.locator("ul li")).toHaveText("Heading")
  await toolbar
    .getByRole("button", { name: "Numbered list", exact: true })
    .click()
  await expect(editor.locator("ol li")).toHaveText("Heading")
  await toolbar.getByRole("button", { name: "Undo", exact: true }).click()
  await expect(editor.locator("ul li")).toHaveText("Heading")
  await toolbar.getByRole("button", { name: "Redo", exact: true }).click()
  await expect(editor.locator("ol li")).toHaveText("Heading")
  await toolbar.getByRole("button", { name: "Checklist", exact: true }).click()
  await expect(editor.getByRole("checkbox")).toHaveCount(1)
  await toolbar.getByRole("button", { name: "Paragraph", exact: true }).click()
  await toolbar
    .getByRole("button", { name: "Insert table", exact: true })
    .click()
  await expect(editor.getByRole("table")).toHaveCount(1)
})

test("checklist supports pointer and keyboard state changes", async ({
  page,
}) => {
  const editor = page.getByRole("textbox", {
    name: "Rich text editor",
    exact: true,
  })

  const toolbar = page.getByRole("toolbar", {
    name: "Rich text editor formatting",
    exact: true,
  })

  await editor.fill("Ship release")
  await toolbar.getByRole("button", { name: "Checklist", exact: true }).click()

  const checkbox = editor.getByRole("checkbox", {
    name: "Ship release",
    exact: true,
  })

  await expect(checkbox).toHaveAttribute("aria-checked", "false")
  await checkbox.click({ position: { x: 8, y: 8 } })
  await expect(checkbox).toHaveAttribute("aria-checked", "true")
  await checkbox.focus()
  await checkbox.press("Space")
  await expect(checkbox).toHaveAttribute("aria-checked", "false")
})

test("@a11y rejects unsafe links and adds safe links", async ({
  page,
}, testInfo) => {
  const editor = page.getByRole("textbox", {
    name: "Rich text editor",
    exact: true,
  })

  const toolbar = page.getByRole("toolbar", {
    name: "Rich text editor formatting",
  })

  await editor.fill("Link")
  await editor.press("ControlOrMeta+a")
  await toolbar.getByRole("button", { name: "Link", exact: true }).click()
  await page
    .getByRole("textbox", { name: "Link URL", exact: true })
    .fill("javascript:alert(1)")
  await page.getByRole("button", { name: "Apply link", exact: true }).click()
  await expect(page.getByRole("alert")).toBeVisible()
  await expect(editor.locator("a")).toHaveCount(0)
  const report = await new AxeBuilder({ page }).analyze()
  await testInfo.attach("editor-link-validation-axe.json", {
    body: JSON.stringify(report, null, 2),
    contentType: "application/json",
  })
  expect(report.violations).toEqual([])
  await page
    .getByRole("textbox", { name: "Link URL", exact: true })
    .fill("https://example.com/")
  await page.getByRole("button", { name: "Apply link", exact: true }).click()
  await expect(editor.locator("a")).toHaveAttribute(
    "href",
    "https://example.com/",
  )
  await expect(editor).toBeFocused()
})

test("keeps content and controls in sync when editing changes", async ({
  page,
}) => {
  const editor = page.getByRole("textbox", {
    name: "Read-only editor",
    exact: true,
  })

  await expect(editor).toHaveAttribute("contenteditable", "false")
  await expect(editor).toHaveText("Read-only content")
  const before = await editor.innerText()
  await editor.click()
  await page.keyboard.type("must not appear")
  await expect(editor).toHaveText(before)

  const toolbar = page.getByRole("toolbar", {
    name: "Read-only editor formatting",
  })

  for (const button of await toolbar.getByRole("button").all()) {
    await expect(button).toBeDisabled()
  }

  await page
    .getByRole("button", { name: "Enable editing", exact: true })
    .click()
  await expect(editor).toHaveAttribute("contenteditable", "true")
  await expect(editor).toHaveAttribute("aria-readonly", "false")
  await expect(
    toolbar.getByRole("button", { name: "Bold", exact: true }),
  ).toBeEnabled()
  await editor.fill("Now editable")
  await editor.press("ControlOrMeta+a")
  await toolbar.getByRole("button", { name: "Bold", exact: true }).click()
  await expect(editor.locator("strong")).toHaveText("Now editable")
  await page
    .getByRole("button", { name: "Disable editing", exact: true })
    .click()
  await expect(editor).toHaveAttribute("contenteditable", "false")
  await expect(editor).toHaveAttribute("aria-readonly", "true")

  for (const button of await toolbar.getByRole("button").all()) {
    await expect(button).toBeDisabled()
  }

  await editor.click()
  await page.keyboard.type("must not appear")
  await expect(editor).toHaveText("Now editable")
})
