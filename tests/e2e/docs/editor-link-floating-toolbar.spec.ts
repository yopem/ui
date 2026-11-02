import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Locator } from "@playwright/test"

async function placeLinkCaret(editor: Locator, link: Locator) {
  await expect(editor).toHaveAttribute("contenteditable", "true")
  await link.click()
  await expect(editor).toBeFocused()
  await expect
    .poll(() =>
      link.evaluate((element) => {
        const selection = element.ownerDocument.getSelection()

        return (
          selection?.isCollapsed === true &&
          element.contains(selection.anchorNode) &&
          element.contains(selection.focusNode)
        )
      }),
    )
    .toBe(true)
}

test("selected-link toolbar edits and removes one native link @a11y", async ({
  page,
}, testInfo) => {
  await page.goto("/editor/link-floating-toolbar")

  const editor = page.getByRole("textbox", {
    name: "Floating link editor",
    exact: true,
  })

  const link = editor.getByRole("link", { name: "Example link", exact: true })
  await placeLinkCaret(editor, link)

  const toolbar = page.getByRole("toolbar", {
    name: "Selected link",
    exact: true,
  })

  await expect(toolbar).toBeVisible()
  await expect(
    toolbar.getByRole("link", { name: "Open link", exact: true }),
  ).toHaveAttribute("href", "https://example.com")
  await expect(
    toolbar.getByRole("link", { name: "Open link", exact: true }),
  ).toHaveAttribute("rel", /noopener/)
  await editor.press("Alt+F10")
  await expect(
    toolbar.getByRole("link", { name: "Open link", exact: true }),
  ).toBeFocused()
  await page.keyboard.press("ArrowRight")
  await expect(
    toolbar.getByRole("button", { name: "Edit link", exact: true }),
  ).toBeFocused()
  await toolbar.getByRole("button", { name: "Edit link", exact: true }).click()
  const dialog = page.getByRole("dialog", { name: "Link", exact: true })
  await expect(
    dialog.getByRole("textbox", { name: "Link URL", exact: true }),
  ).toHaveValue("https://example.com")
  await dialog
    .getByRole("textbox", { name: "Link URL", exact: true })
    .fill("javascript:alert(1)")
  await dialog.getByRole("button", { name: "Apply link", exact: true }).click()
  await expect(dialog.getByRole("alert")).toBeVisible()
  await expect(link).toHaveAttribute("href", "https://example.com")
  const url = dialog.getByRole("textbox", { name: "Link URL", exact: true })
  await url.click()
  await expect(url).toBeFocused()
  await page.keyboard.press("ControlOrMeta+a")
  await page.keyboard.type("https://example.org/updated")
  await expect(url).toBeFocused()
  await expect(url).toHaveValue("https://example.org/updated")
  const text = dialog.getByRole("textbox", { name: "Link text", exact: true })
  await text.click()
  await expect(text).toBeFocused()
  await page.keyboard.press("ControlOrMeta+a")
  await page.keyboard.type("Updated link")
  await expect(text).toBeFocused()
  await expect(text).toHaveValue("Updated link")
  await dialog.getByRole("button", { name: "Apply link", exact: true }).click()

  const updated = editor.getByRole("link", {
    name: "Updated link",
    exact: true,
  })

  await expect(updated).toHaveAttribute("href", "https://example.org/updated")
  await expect(editor.getByRole("link")).toHaveCount(1)
  await expect(editor).toBeFocused()
  await editor.press("ControlOrMeta+z")
  await expect(link).toHaveAttribute("href", "https://example.com")
  await editor.press("ControlOrMeta+Shift+z")
  await expect(updated).toHaveAttribute("href", "https://example.org/updated")
  await placeLinkCaret(editor, updated)
  await expect(toolbar).toBeVisible()
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
  await toolbar
    .getByRole("button", { name: "Remove link", exact: true })
    .click()
  await expect(editor.getByRole("link")).toHaveCount(0)
  await expect(editor).toContainText("Updated link")
  await editor.press("ControlOrMeta+z")
  await expect(
    editor.getByRole("link", { name: "Updated link", exact: true }),
  ).toHaveAttribute("href", "https://example.org/updated")
  await testInfo.attach("selected-link-after-undo.html", {
    body: await editor.innerHTML(),
    contentType: "text/html",
  })
  await testInfo.attach("selected-link-toolbar.png", {
    body: await page.screenshot({ scale: "css" }),
    contentType: "image/png",
  })
})

test("link toolbar follows the native keyboard caret", async ({
  page,
}, testInfo) => {
  await page.goto("/editor/link-floating-toolbar")

  const editor = page.getByRole("textbox", {
    name: "Floating link editor",
    exact: true,
  })

  const toolbar = page.getByRole("toolbar", {
    name: "Selected link",
    exact: true,
  })

  await expect(editor).toHaveAttribute("contenteditable", "true")
  await editor.click()
  await editor.press("ControlOrMeta+Home")
  await expect(editor).toBeFocused()
  await expect(toolbar).toHaveCount(0)

  for (let offset = 0; offset < 8; offset += 1)
    await page.keyboard.press("ArrowRight")

  await expect(toolbar).toBeVisible()
  await expect(editor).toBeFocused()
  await testInfo.attach("keyboard-link-caret.png", {
    body: await page.screenshot({ scale: "css" }),
    contentType: "image/png",
  })
  await page.keyboard.press("ControlOrMeta+Home")
  await expect(toolbar).toHaveCount(0)
  await expect(editor.getByRole("link")).toHaveAttribute(
    "href",
    "https://example.com",
  )
})

test("link toolbar honors host veto and read-only transitions", async ({
  page,
}) => {
  await page.goto("/editor/link-floating-toolbar")

  const editor = page.getByRole("textbox", {
    name: "Floating link editor",
    exact: true,
  })

  await page
    .getByRole("checkbox", { name: "Prevent link actions", exact: true })
    .check()
  await placeLinkCaret(
    editor,
    editor.getByRole("link", { name: "Example link", exact: true }),
  )

  const toolbar = page.getByRole("toolbar", {
    name: "Selected link",
    exact: true,
  })

  await expect(toolbar).toBeVisible()
  const edit = toolbar.getByRole("button", { name: "Edit link", exact: true })
  await edit.click()
  await expect(
    page.getByRole("dialog", { name: "Link", exact: true }),
  ).toHaveCount(0)
  await expect(edit).toHaveAttribute("aria-expanded", "false")
  await editor.press("Alt+F10")
  await page.keyboard.press("ArrowRight")
  await expect(edit).toBeFocused()
  await page.keyboard.press("Enter")
  await expect(
    page.getByRole("dialog", { name: "Link", exact: true }),
  ).toHaveCount(0)
  await toolbar
    .getByRole("button", { name: "Remove link", exact: true })
    .click()
  await expect(editor.getByRole("link")).toHaveCount(1)
  await page.getByRole("button", { name: "Read only", exact: true }).click()
  await expect(editor).toHaveAttribute("contenteditable", "false")
  await expect(toolbar).toHaveCount(0)
  await page.getByRole("button", { name: "Read only", exact: true }).click()
  await expect(editor).toHaveAttribute("contenteditable", "true")
  await editor.click()
  await editor.press("ControlOrMeta+Home")
  await expect(toolbar).toHaveCount(0)
})

test("document changes discard saved floating link edits", async ({ page }) => {
  await page.goto("/editor/link-floating-toolbar")

  const editor = page.getByRole("textbox", {
    name: "Floating link editor",
    exact: true,
  })

  await placeLinkCaret(
    editor,
    editor.getByRole("link", { name: "Example link", exact: true }),
  )

  const toolbar = page.getByRole("toolbar", {
    name: "Selected link",
    exact: true,
  })

  await expect(toolbar).toBeVisible()
  await toolbar.getByRole("button", { name: "Edit link", exact: true }).click()
  await expect(
    page.getByRole("dialog", { name: "Link", exact: true }),
  ).toBeVisible()
  await editor.fill("Replacement document")
  await expect(
    page.getByRole("dialog", { name: "Link", exact: true }),
  ).toHaveCount(0)
  await expect(toolbar).toHaveCount(0)
  await expect(editor).toHaveText("Replacement document")
})

for (const activation of ["pointer", "keyboard"]) {
  test(`nested link mutations honor host veto with ${activation} activation`, async ({
    page,
  }, testInfo) => {
    await page.goto("/editor/link-floating-toolbar")
    await page
      .getByRole("checkbox", { name: "Prevent link changes", exact: true })
      .check()

    const editor = page.getByRole("textbox", {
      name: "Floating link editor",
      exact: true,
    })

    const link = editor.getByRole("link", { name: "Example link", exact: true })
    await placeLinkCaret(editor, link)

    const toolbar = page.getByRole("toolbar", {
      name: "Selected link",
      exact: true,
    })

    await toolbar
      .getByRole("button", { name: "Edit link", exact: true })
      .click()
    const dialog = page.getByRole("dialog", { name: "Link", exact: true })
    const url = dialog.getByRole("textbox", { name: "Link URL", exact: true })
    await url.click()
    await page.keyboard.press("ControlOrMeta+a")
    await page.keyboard.type("https://example.org/vetoed")
    await expect(url).toBeFocused()

    for (const name of ["Apply link", "Remove link"]) {
      const action = dialog.getByRole("button", { name, exact: true })

      if (activation === "pointer") await action.click()
      else {
        if (name === "Apply link") {
          await page.keyboard.press("Tab")
          await page.keyboard.press("Tab")
        }

        await page.keyboard.press("Tab")
        await expect(action).toBeFocused()
        await page.keyboard.press("Enter")
      }

      await expect(dialog).toBeVisible()
      await expect(link).toHaveAttribute("href", "https://example.com")
      await expect(editor.getByRole("link")).toHaveCount(1)
      await expect(editor).toHaveText("Visit Example link to try link actions.")
    }

    await testInfo.attach(`link-veto-${activation}.html`, {
      body: await editor.innerHTML(),
      contentType: "text/html",
    })
  })
}
