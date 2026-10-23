import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"
import { z } from "zod"

for (const theme of ["light", "dark"] as const) {
  test(`code workflow preserves native editing and clipboard in ${theme} @a11y`, async ({
    page,
    context,
  }, testInfo) => {
    test.slow()
    await page.addInitScript(
      (value) => localStorage.setItem("yopem-ui-theme", value),
      theme,
    )
    await context.grantPermissions(["clipboard-read", "clipboard-write"])
    await page.goto("/docs/editor")

    const editor = page.getByRole("textbox", {
      name: "Code editor",
      exact: true,
    })

    const tools = page.getByRole("toolbar", { name: "Code tools", exact: true })
    await expect(editor).toHaveAttribute("contenteditable", "true")
    expect(
      (
        await new AxeBuilder({ page })
          .include('[data-slot="editor-code-demo"]')
          .analyze()
      ).violations,
    ).toEqual([])
    await editor.click()
    await editor.press("ControlOrMeta+a")
    await editor.pressSequentially("const answer = 42;")
    await tools.getByRole("button", { name: "Code block", exact: true }).click()
    const language = tools.getByRole("combobox", { name: "Code language" })
    await language.focus()
    await language.press("ArrowDown")
    await expect(language).toBeFocused()
    await language.selectOption("typescript")
    const code = editor.locator("code[data-language='typescript']")
    await expect(code).toContainText("const answer = 42;")
    await expect(code).toHaveAttribute("data-highlight-language", "typescript")
    await expect(code.locator("span").first()).toBeVisible()
    await code.click()
    await editor.press("End")
    await editor.press("Enter")
    await editor.pressSequentially("const next = answer + 1;")
    await editor.press("ControlOrMeta+a")
    const original = await code.innerText()
    await editor.press("Tab")
    await expect.poll(() => code.innerText()).not.toBe(original)
    await editor.press("ControlOrMeta+z")
    await expect.poll(() => code.innerText()).toBe(original)
    await editor.press("ControlOrMeta+Shift+z")
    await expect.poll(() => code.innerText()).not.toBe(original)
    await editor.press("Shift+Tab")
    await expect.poll(() => code.innerText()).toBe(original)
    await tools.getByRole("button", { name: "Copy code", exact: true }).click()
    await expect(
      page.getByRole("status").filter({ hasText: "Code copied" }),
    ).toBeVisible()
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
      await code.innerText(),
    )
    await tools
      .getByRole("button", { name: "Line numbers", exact: true })
      .click()
    await expect(code).toHaveAttribute("data-code-line-numbers", "true")
    await tools.getByRole("button", { name: "Wrap code", exact: true }).click()
    await expect(code).toHaveAttribute("data-code-wrap", "true")
    await editor.click()
    await editor.press("ControlOrMeta+a")
    await page.evaluate(() =>
      navigator.clipboard.writeText(
        '<img src=x onerror="alert(1)">\nconst safe = true;',
      ),
    )
    await editor.press("ControlOrMeta+v")
    await expect(code).toContainText('<img src=x onerror="alert(1)">')
    await expect(editor.locator("img")).toHaveCount(0)
    await page
      .getByRole("button", { name: "Code read-only", exact: true })
      .click()
    await expect(editor).toHaveAttribute("aria-readonly", "true")
    await expect(
      tools.getByRole("combobox", { name: "Code language" }),
    ).toBeDisabled()
    await tools.getByRole("button", { name: "Copy code", exact: true }).click()
    expect(await page.evaluate(() => navigator.clipboard.readText())).toContain(
      "const safe = true;",
    )
    expect(
      (
        await new AxeBuilder({ page })
          .include('[data-slot="editor-code-demo"]')
          .analyze()
      ).violations,
    ).toEqual([])
    await page
      .getByRole("button", { name: "Code read-only", exact: true })
      .click()
    await editor.click()
    await editor.press("ControlOrMeta+End")
    await editor.press("Enter")
    await editor.press("Enter")
    await editor.press("Enter")
    await editor.pressSequentially("After code")
    await expect(editor.locator("p").last()).toContainText("After code")
    await page.screenshot({
      path: testInfo.outputPath("code-desktop.png"),
      fullPage: true,
      scale: "css",
    })
    await page.setViewportSize({ width: 390, height: 844 })
    await page.screenshot({
      path: testInfo.outputPath("code-mobile.png"),
      fullPage: true,
      scale: "css",
    })
  })
}

test("code controls reject replaced host content and report denied clipboard", async ({
  page,
  context,
  browserName,
}) => {
  test.skip(
    browserName !== "chromium",
    "Clipboard denial requires Chromium permission control",
  )
  await page.goto("/docs/editor")
  const editor = page.getByRole("textbox", { name: "Code editor", exact: true })
  const tools = page.getByRole("toolbar", { name: "Code tools", exact: true })
  await expect(editor).toHaveAttribute("contenteditable", "true")
  await editor.click()
  await editor.pressSequentially("original")
  await tools.getByRole("button", { name: "Code block", exact: true }).click()
  await tools.getByRole("combobox", { name: "Code language" }).focus()
  await page
    .getByRole("button", { name: "Replace code document", exact: true })
    .click()
  await expect(editor).toContainText("Host replacement")
  await expect(
    tools.getByRole("combobox", { name: "Code language" }),
  ).toBeDisabled()
  await expect(editor.locator("code")).toHaveCount(0)
  await editor.click()
  await tools.getByRole("button", { name: "Code block", exact: true }).click()
  const session = await context.newCDPSession(page)

  const target = z
    .object({ targetInfo: z.object({ browserContextId: z.string().min(1) }) })
    .parse(await session.send("Target.getTargetInfo"))

  await session.send("Browser.setPermission", {
    browserContextId: target.targetInfo.browserContextId,
    permission: { name: "clipboard-write" },
    setting: "denied",
    origin: new URL(page.url()).origin,
  })
  await tools.getByRole("button", { name: "Copy code", exact: true }).click()
  await expect(
    page.getByRole("status").filter({ hasText: "Copy failed" }),
  ).toBeVisible()
})

test("disabled code tools leave native editing available", async ({ page }) => {
  await page.goto("/docs/editor")
  const editor = page.getByRole("textbox", { name: "Code editor", exact: true })
  const tools = page.getByRole("toolbar", { name: "Code tools", exact: true })
  await expect(editor).toHaveAttribute("contenteditable", "true")
  await editor.fill("const enabled = true;")
  await tools.getByRole("button", { name: "Code block", exact: true }).click()
  await page
    .getByRole("button", { name: "Disable code tools", exact: true })
    .click()

  for (const button of await tools.getByRole("button").all())
    await expect(button).toBeDisabled()
  await expect(
    tools.getByRole("combobox", { name: "Code language" }),
  ).toBeDisabled()
  await expect(editor).toHaveAttribute("contenteditable", "true")
  await editor.click()
  await editor.press("End")
  await editor.pressSequentially(" const stillEditable = true;")
  await expect(editor.locator("code")).toContainText("stillEditable")
  await page
    .getByRole("button", { name: "Enable code tools", exact: true })
    .click()
  await expect(
    tools.getByRole("combobox", { name: "Code language" }),
  ).toBeEnabled()
})

test("native code inside tables keeps indentation and history", async ({
  page,
}) => {
  await page.goto("/docs/editor")
  const editor = page.getByRole("textbox", { name: "Code editor", exact: true })
  const tools = page.getByRole("toolbar", { name: "Code tools", exact: true })
  await expect(editor).toHaveAttribute("contenteditable", "true")
  await editor.click()
  await tools.getByRole("button", { name: "Insert table", exact: true }).click()
  const cell = editor.getByRole("columnheader").first()
  await cell.click()
  await editor.pressSequentially("const nested = 1;")
  await tools.getByRole("button", { name: "Code block", exact: true }).click()
  const code = cell.locator("code")
  await expect(code).toContainText("const nested = 1;")
  await code.click()
  await editor.press("Home")
  const original = await code.innerText()
  await editor.press("Tab")
  await expect.poll(() => code.innerText()).toBe(`\t${original}`)
  await editor.press("Shift+Tab")
  await expect.poll(() => code.innerText()).toBe(original)
  await editor.press("ControlOrMeta+z")
  await expect.poll(() => code.innerText()).toBe(`\t${original}`)
  await editor.press("ControlOrMeta+z")
  await expect.poll(() => code.innerText()).toBe(original)
  await editor.press("End")
  await editor.press("Enter")
  await editor.press("Enter")
  await editor.press("Enter")
  await editor.pressSequentially("After nested code")
  await expect(cell.locator("p").last()).toContainText("After nested code")
})

test("code extension preserves ordinary table Tab navigation", async ({
  page,
}) => {
  await page.goto("/docs/editor")
  const editor = page.getByRole("textbox", { name: "Code editor", exact: true })
  const tools = page.getByRole("toolbar", { name: "Code tools", exact: true })
  await expect(editor).toHaveAttribute("contenteditable", "true")
  await editor.click()
  await tools.getByRole("button", { name: "Insert table", exact: true }).click()
  const cells = editor.locator("th, td")
  await cells.nth(1).click()
  await editor.pressSequentially("ordinary")
  await editor.press("Tab")
  await editor.pressSequentially("next cell")
  await expect(cells.nth(2)).toHaveText("next cell")
  await editor.press("Shift+Tab")
  await editor.pressSequentially(" returned")
  await expect(cells.nth(1)).toContainText("returned")
  await page
    .getByRole("button", { name: "Code read-only", exact: true })
    .click()
  await expect(editor).toHaveAttribute("contenteditable", "false")
  const before = await editor.innerText()
  await editor.press("Tab")
  await editor.pressSequentially("blocked")
  await expect.poll(() => editor.innerText()).toBe(before)
})

for (const width of [1440, 768, 390]) {
  test(`code controls and long lines stay contained at ${width}px @a11y`, async ({
    page,
  }, testInfo) => {
    test.slow()
    await page.setViewportSize({ width, height: 900 })
    await page.goto("/docs/editor")

    const editor = page.getByRole("textbox", {
      name: "Code editor",
      exact: true,
    })

    const tools = page.getByRole("toolbar", { name: "Code tools", exact: true })
    await expect(editor).toHaveAttribute("contenteditable", "true")
    await editor.fill(`const ${"longIdentifier".repeat(80)} = 1;`)
    await tools.getByRole("button", { name: "Code block", exact: true }).click()
    await tools
      .getByRole("button", { name: "Line numbers", exact: true })
      .click()
    await expect(editor.locator("code")).toHaveAttribute(
      "data-code-line-numbers",
      "true",
    )
    await expect(editor.locator("code")).toHaveAttribute("tabindex", "0")
    await editor.locator("code").focus()
    await expect(editor.locator("code")).toBeFocused()
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth + 1,
      ),
    ).toBe(true)
    expect(
      (
        await new AxeBuilder({ page })
          .include('[data-slot="editor-code-demo"]')
          .analyze()
      ).violations,
    ).toEqual([])
    await page.locator('[data-slot="editor-code-demo"]').screenshot({
      path: testInfo.outputPath(`code-${width}.png`),
      scale: "css",
    })
  })
}
