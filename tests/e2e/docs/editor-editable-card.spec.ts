import type { Page } from "@playwright/test"

import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

function example(page: Page, slug: string) {
  return page.getByTestId(`editor-example-${slug}`)
}

async function openExample(page: Page, slug: string) {
  await page.goto(`/editor/examples#${slug}`)
  const root = example(page, slug)

  const preview = root.getByRole("button", {
    name: "Live preview",
    exact: true,
  })

  if ((await preview.getAttribute("aria-expanded")) === "false")
    await preview.click()

  await expect(
    root.locator('[data-slot="editor-content"]').first(),
  ).toHaveAttribute("contenteditable", "true")

  return root
}

test("editable void controls stay local to their outer Lexical document", async ({
  page,
  context,
}, testInfo) => {
  test.slow()
  await context.grantPermissions(["clipboard-read", "clipboard-write"])

  const root = await openExample(page, "public-editable-voids")

  const editor = root.getByRole("textbox", {
    name: "Public editable voids editor",
    exact: true,
  })

  await editor.fill("Outer document")
  await root
    .getByRole("button", { name: "Insert editable card", exact: true })
    .click()
  const card = root.getByTestId("editable-card")
  const outerState = root.getByTestId("editable-card-outer-state")

  await editor.locator("p").first().click()
  await page.keyboard.press("Home")
  await page.keyboard.press("Shift+End")
  const stateBefore = await outerState.textContent()

  await card
    .getByRole("textbox", { name: "Card title", exact: true })
    .fill("Local card title")
  await card.getByRole("radio", { name: "Private", exact: true }).click()
  await expect(
    card.getByRole("textbox", { name: "Card title", exact: true }),
  ).toHaveValue("Local card title")
  await expect(
    card.getByRole("radio", { name: "Private", exact: true }),
  ).toBeChecked()

  const note = card.getByRole("textbox", {
    name: "Card note editor",
    exact: true,
  })

  await expect(note).toHaveAttribute("contenteditable", "true")
  await note.fill("Nested editor draft")
  await expect(note).toHaveText("Nested editor draft")
  await expect(outerState).not.toContainText("Nested editor draft")
  await expect(outerState).toHaveText(stateBefore ?? "")
  await card
    .getByRole("button", { name: "Save card locally", exact: true })
    .click()
  const savedValues = card.getByLabel("Saved card values", { exact: true })
  await expect(savedValues).toContainText("Local card title")
  await expect(savedValues).toContainText("private")
  await card
    .getByRole("textbox", { name: "Card title", exact: true })
    .fill("Unsaved draft")
  await expect(savedValues).not.toContainText("Unsaved draft")

  const toolbar = root.getByRole("toolbar", {
    name: "Editable card tools",
    exact: true,
  })

  await toolbar.getByRole("button", { name: "Undo", exact: true }).click()
  await expect(card).toHaveCount(0)
  await expect(editor).toContainText("Outer document")
  await toolbar.getByRole("button", { name: "Redo", exact: true }).click()
  const restoredCard = root.getByTestId("editable-card")

  await expect(
    restoredCard.getByRole("textbox", { name: "Card title", exact: true }),
  ).toHaveValue("New card")
  await expect(
    restoredCard.getByRole("textbox", {
      name: "Card note editor",
      exact: true,
    }),
  ).toHaveText("")
  await testInfo.attach("editable-voids-outer-state.txt", {
    body: (await outerState.textContent()) ?? "",
    contentType: "text/plain",
  })

  expect(
    (
      await new AxeBuilder({ page })
        .include('[data-testid="editor-example-public-editable-voids"]')
        .analyze()
    ).violations,
  ).toEqual([])
})

test("editable void controls and nested editor follow outer read-only state", async ({
  page,
}) => {
  const root = await openExample(page, "public-editable-voids")

  await root
    .getByRole("button", { name: "Insert editable card", exact: true })
    .click()

  const card = root.getByTestId("editable-card")

  const title = card.getByRole("textbox", {
    name: "Card title",
    exact: true,
  })

  const note = card.getByRole("textbox", {
    name: "Card note editor",
    exact: true,
  })

  await root
    .getByRole("button", { name: "Make editor read-only", exact: true })
    .click()
  await expect(title).toBeDisabled()
  await expect(
    card.getByRole("radio", { name: "Public", exact: true }),
  ).toBeDisabled()
  await expect(note).toHaveAttribute("contenteditable", "false")
  await expect(
    root.getByRole("textbox", {
      name: "Public editable voids editor",
      exact: true,
    }),
  ).toHaveAttribute("contenteditable", "false")
  await root
    .getByRole("button", { name: "Make editor editable", exact: true })
    .click()
  await expect(title).toBeEnabled()
  await expect(note).toHaveAttribute("contenteditable", "true")
})

test("invalid editable card HTML leaves selected outer text intact", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"])

  const root = await openExample(page, "public-editable-voids")

  const editor = root.getByRole("textbox", {
    name: "Public editable voids editor",
    exact: true,
  })

  await editor.fill("Keep this selection")
  await editor.press("ControlOrMeta+a")
  await page.evaluate(async () => {
    await navigator.clipboard.write([
      new ClipboardItem({
        "text/html": new Blob(
          ['<figure data-editor-editable-card="2"><input></figure>'],
          { type: "text/html" },
        ),
        "text/plain": new Blob([""], { type: "text/plain" }),
      }),
    ])
  })
  await editor.press("ControlOrMeta+v")
  await expect(editor).toHaveText("Keep this selection")
})

test("tab order uses browser navigation and leaves native editor keys intact", async ({
  page,
}, testInfo) => {
  const root = await openExample(page, "public-tabbable")

  await root
    .getByRole("button", { name: "Insert editable card", exact: true })
    .click()

  const editor = root.getByRole("textbox", {
    name: "Tabbable editor",
    exact: true,
  })

  const card = root.getByTestId("editable-card")

  const title = card.getByRole("textbox", {
    name: "Card title",
    exact: true,
  })

  const radio = card.getByRole("radio", { name: "Public", exact: true })

  const note = card.getByRole("textbox", {
    name: "Card note editor",
    exact: true,
  })

  const action = card.getByRole("button", {
    name: "Save card locally",
    exact: true,
  })

  const after = root.getByRole("button", {
    name: "Focus after editor",
    exact: true,
  })

  await editor.focus()
  await page.keyboard.press("Tab")
  await expect(title).toBeFocused()
  await page.keyboard.press("Tab")
  await expect(radio).toBeFocused()
  await page.keyboard.press("Tab")
  await expect(note).toBeFocused()
  await note.pressSequentially("Nested line one")
  await note.press("End")
  await note.press("Enter")
  await page.keyboard.insertText("Nested line two")
  await expect(note).toContainText("Nested line one")
  await expect(note).toContainText("Nested line two")
  await page.keyboard.press("Tab")
  await expect(action).toBeFocused()
  await page.keyboard.press("Tab")
  await expect(after).toBeFocused()
  await page.keyboard.press("Shift+Tab")
  await expect(action).toBeFocused()
  await page.keyboard.press("Shift+Tab")
  await expect(note).toBeFocused()

  const listEditor = root.getByRole("textbox", {
    name: "Native list editor",
    exact: true,
  })

  await expect(listEditor).toHaveAttribute("contenteditable", "true")
  await listEditor.fill("First item")
  await root
    .getByRole("toolbar", { name: "Native list tools", exact: true })
    .getByRole("button", { name: "Bullet list", exact: true })
    .click()
  await listEditor.press("End")
  await listEditor.press("Enter")
  await page.keyboard.insertText("Second item")
  await expect(listEditor.getByRole("listitem")).toHaveCount(2)

  const codeEditor = root.getByRole("textbox", {
    name: "Native code editor",
    exact: true,
  })

  await expect(codeEditor).toHaveAttribute("contenteditable", "true")
  await codeEditor.fill("first line")
  await root
    .getByRole("toolbar", { name: "Native code tools", exact: true })
    .getByRole("button", { name: "Code block", exact: true })
    .click()
  await codeEditor.press("End")
  await codeEditor.press("Enter")
  await page.keyboard.insertText("second line")
  await expect(codeEditor.locator("code")).toContainText("first line")
  await expect(codeEditor.locator("code")).toContainText("second line")

  expect(
    (
      await new AxeBuilder({ page })
        .include('[data-testid="editor-example-public-tabbable"]')
        .analyze()
    ).violations,
  ).toEqual([])
  await testInfo.attach("public-tabbable.html", {
    body: await root.innerHTML(),
    contentType: "text/html",
  })
})
