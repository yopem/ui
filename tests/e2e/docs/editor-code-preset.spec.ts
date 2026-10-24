import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

for (const language of ["javascript", "python", "css"]) {
  test(`code preset provides editable ${language} example @a11y`, async ({
    page,
  }, testInfo) => {
    await page.goto("/docs/editor")

    const editor = page.getByRole("textbox", {
      name: "Code preset",
      exact: true,
    })

    const tools = page.getByRole("toolbar", {
      name: "Code preset tools",
      exact: true,
    })

    const code = editor.locator(`code[data-language="${language}"]`)
    await code.click()
    await expect(
      tools.getByRole("combobox", { name: "Code language" }),
    ).toHaveValue(language)
    await expect(code).toHaveAttribute("data-highlight-language", language)
    await expect(code.locator("span").first()).toBeVisible()

    const format = tools.getByRole("button", {
      name: "Format code",
      exact: true,
    })

    if (language === "python") await expect(format).toBeDisabled()
    else {
      await format.click()
      await expect(editor).toBeFocused()
      await expect(tools.getByRole("status")).toContainText("Code formatted")
    }

    expect(
      (
        await new AxeBuilder({ page })
          .include('[data-slot="editor-code-demo"]')
          .analyze()
      ).violations,
    ).toEqual([])

    await testInfo.attach(`preset-${language}`, {
      body: await editor.innerHTML(),
      contentType: "text/html",
    })
  })
}

test("base preset omits formatting without a host formatter", async ({
  page,
}, testInfo) => {
  await page.goto("/editor/code-preset")

  const editor = page.getByRole("textbox", {
    name: "EditorCode preview",
    exact: true,
  })

  const tools = page.getByRole("toolbar", {
    name: "EditorCode preview tools",
    exact: true,
  })

  await editor.locator("code").click()
  await expect(
    tools.getByRole("button", { name: "Format code", exact: true }),
  ).toHaveCount(0)
  await expect(
    tools.getByRole("button", { name: "Copy code", exact: true }),
  ).toBeEnabled()
  await testInfo.attach("base-code-without-formatter", {
    body: await tools.innerHTML(),
    contentType: "text/html",
  })
})
