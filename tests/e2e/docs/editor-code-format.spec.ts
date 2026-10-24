import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

for (const theme of ["light", "dark"]) {
  test(`format selection, history, syntax errors and native languages in ${theme} @a11y`, async ({
    page,
  }, testInfo) => {
    await page.addInitScript(
      (value) => localStorage.setItem("yopem-ui-theme", value),
      theme,
    )
    await page.goto("/docs/editor")

    const editor = page.getByRole("textbox", {
      name: "Code editor",
      exact: true,
    })

    const tools = page.getByRole("toolbar", { name: "Code tools", exact: true })
    await editor.fill("const x={a:1}")
    await tools.getByRole("button", { name: "Code block", exact: true }).click()
    const language = tools.getByRole("combobox", { name: "Code language" })
    await language.selectOption("javascript")
    const code = editor.locator("code")
    await code.click()
    await editor.press("Home")
    await editor.press("Shift+ArrowRight")
    await tools
      .getByRole("button", { name: "Format code", exact: true })
      .click()
    await expect(code).toHaveText("const x = { a: 1 };\n")
    await expect(editor).toBeFocused()
    expect(
      (
        await new AxeBuilder({ page })
          .include('[data-slot="editor-code-demo"]')
          .analyze()
      ).violations,
    ).toEqual([])
    await editor.press("ControlOrMeta+z")
    await expect(code).toHaveText("const x={a:1}")
    await editor.press("ControlOrMeta+Shift+z")
    await expect(code).toHaveText("const x = { a: 1 };\n")
    await language.selectOption("python")
    await expect(
      tools.getByRole("button", { name: "Format code", exact: true }),
    ).toBeDisabled()
    await language.selectOption("tsx")
    await code.click()
    await editor.press("ControlOrMeta+a")
    await editor.pressSequentially('const node = <div title="hello" />;')
    await expect(code).toHaveAttribute("data-highlight-language", "tsx")
    await expect(code.locator("span").first()).toBeVisible()
    await language.selectOption("javascript")
    await code.click()
    await editor.press("ControlOrMeta+a")
    await editor.pressSequentially("const =")
    await tools
      .getByRole("button", { name: "Format code", exact: true })
      .click()
    await expect(code).toHaveText("const =")
    await expect(
      tools.getByRole("status").filter({ hasText: /Formatting failed/ }),
    ).toBeVisible()
    await page
      .getByRole("button", { name: "Code read-only", exact: true })
      .click()
    await expect(
      tools.getByRole("button", { name: "Format code", exact: true }),
    ).toBeDisabled()
    expect(
      (
        await new AxeBuilder({ page })
          .include('[data-slot="editor-code-demo"]')
          .analyze()
      ).violations,
    ).toEqual([])

    await testInfo.attach("formatted-code-state", {
      body: await editor.innerHTML(),
      contentType: "text/html",
    })
  })
}

test("format part completes one undo and explains unsupported languages @a11y", async ({
  page,
}, testInfo) => {
  const response = await page.goto("/editor/code-format-button")
  expect(response?.status()).toBe(200)

  const editor = page.getByRole("textbox", {
    name: "EditorCodeFormatButton preview",
    exact: true,
  })

  const toolbar = page.getByRole("toolbar", {
    name: "Code tools",
    exact: true,
  })

  const code = editor.locator("code")

  const format = toolbar.getByRole("button", {
    name: "Format code",
    exact: true,
  })

  await code.click()
  await expect(format).toBeEnabled()
  await format.click()
  await expect(code).toHaveText('{\n  "count": 1\n}\n')
  await expect(toolbar.getByRole("status")).toContainText("Code formatted")
  await expect(editor).toBeFocused()
  await editor.press("ControlOrMeta+z")
  await expect(code).toHaveText('{"count":1}')
  await editor.press("ControlOrMeta+Shift+z")
  await expect(code).toHaveText('{\n  "count": 1\n}\n')

  await toolbar
    .getByRole("combobox", { name: "Code language" })
    .selectOption("python")
  await expect(format).toBeDisabled()
  await expect(format).toHaveAccessibleDescription(
    "Formatting is not supported for this language",
  )
  expect(
    (
      await new AxeBuilder({ page })
        .include('[data-slot="editor-part-preview"]')
        .analyze()
    ).violations,
  ).toEqual([])

  await testInfo.attach("format-control-preview", {
    body: await editor.innerHTML(),
    contentType: "text/html",
  })
})
