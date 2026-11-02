import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

test("block menus keep native selection and separate insert from conversion @a11y", async ({
  page,
}, testInfo) => {
  await page.goto("/editor/insert-menu")

  const editor = page.getByRole("textbox", {
    name: "Toolbar menu document",
    exact: true,
  })

  await editor.click()
  await editor.press("ControlOrMeta+Home")
  await page.getByRole("button", { name: "Insert", exact: true }).click()
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
  await page.getByRole("menuitem", { name: "Heading 2", exact: true }).click()
  await expect(editor.locator(":scope > p")).toContainText(
    "Keep this paragraph",
  )
  await expect(editor.locator(":scope > h2")).toHaveCount(1)
  await expect(editor).toBeFocused()
  await editor.press("ControlOrMeta+z")
  await expect(editor.locator(":scope > h2")).toHaveCount(0)
  await editor.click()
  await page.getByRole("button", { name: "Insert", exact: true }).click()
  await page.getByRole("menuitem", { name: "Bullet list", exact: true }).click()
  await expect(editor.locator(":scope > ul")).toHaveCount(1)
  await expect(editor.locator(":scope > p")).toContainText(
    "Keep this paragraph",
  )
  await editor.press("ControlOrMeta+z")
  await expect(editor.locator(":scope > ul")).toHaveCount(0)
  await editor.click()
  await editor.press("ControlOrMeta+Home")
  await editor.press("ControlOrMeta+Shift+End")
  const turn = page.getByRole("button", { name: /^Turn into:/ })
  await expect(turn).toHaveAccessibleName("Turn into: Paragraph")
  await turn.click()
  await expect(
    page.getByRole("menuitemradio", { name: "Paragraph", exact: true }),
  ).toHaveAttribute("aria-checked", "true")
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
  await page
    .getByRole("menuitemradio", { name: "Heading 2", exact: true })
    .click()
  await expect(editor.locator(":scope > h2")).toContainText(
    "Keep this paragraph",
  )
  await expect(editor.locator(":scope > p")).toHaveCount(0)
  await expect(turn).toHaveAccessibleName("Turn into: Heading 2")
  await turn.focus()
  await turn.press("ArrowDown")
  await expect(
    page.getByRole("menuitemradio", { name: "Heading 2", exact: true }),
  ).toHaveAttribute("aria-checked", "true")
  await page.keyboard.press("Escape")
  await expect(turn).toBeFocused()
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
  await testInfo.attach("toolbar-converted.html", {
    body: await editor.innerHTML(),
    contentType: "text/html",
  })
})

test("Turn into keeps an explicit accessible name @a11y", async ({
  page,
}, testInfo) => {
  await page.goto("/editor/turn-into-menu")

  const editor = page.getByRole("textbox", {
    name: "Block conversion content",
    exact: true,
  })

  await expect(editor).toHaveAttribute("contenteditable", "true")
  await expect(editor).toHaveText("Keep this paragraph")
  await editor.click()
  await editor.press("ControlOrMeta+a")
  const trigger = page.getByRole("button", { name: "Block type", exact: true })
  await expect(trigger).toHaveText("Block type")
  await trigger.click()
  await page
    .getByRole("menuitemradio", { name: "Heading 2", exact: true })
    .click()
  await expect(editor.locator("h2")).toHaveText("Keep this paragraph")
  await expect(trigger).toHaveAccessibleName("Block type")
  await expect(trigger).toHaveText("Block type")
  await trigger.click()
  await expect(
    page.getByRole("menuitemradio", { name: "Heading 2", exact: true }),
  ).toHaveAttribute("aria-checked", "true")
  const accessibility = await new AxeBuilder({ page }).analyze()
  expect(accessibility.violations).toEqual([])
  await testInfo.attach("custom-block-label", {
    body: JSON.stringify({
      label: await trigger.getAttribute("aria-label"),
      text: await trigger.innerText(),
      html: await editor.innerHTML(),
      accessibility,
    }),
    contentType: "application/json",
  })
})

test("More retains keyboard range, respects host veto, and disables mutations read-only @a11y", async ({
  page,
}, testInfo) => {
  await page.goto("/editor/more-menu")

  const editor = page.getByRole("textbox", {
    name: "Toolbar menu document",
    exact: true,
  })

  await editor.click()
  await editor.press("ControlOrMeta+a")
  const more = page.getByRole("button", { name: "More", exact: true })
  await more.focus()
  await more.press("Enter")
  await page.keyboard.press("ArrowDown")
  await page.keyboard.press("ArrowDown")
  await expect(
    page.getByRole("menuitemcheckbox", { name: "Superscript", exact: true }),
  ).toBeFocused()
  await page.keyboard.press("Enter")
  await expect(editor.locator("sup")).toContainText("Keep this paragraph")
  await more.click()
  await expect(
    page.getByRole("menuitemcheckbox", { name: "Superscript", exact: true }),
  ).toHaveAttribute("aria-checked", "true")
  await page.keyboard.press("Escape")
  await editor.press("ControlOrMeta+z")
  await expect(editor.locator("sup")).toHaveCount(0)
  await page.getByLabel("Advanced host checks", { exact: true }).click()
  await page
    .getByRole("checkbox", { name: "Prevent menu actions", exact: true })
    .check()
  await editor.click()
  await editor.press("ControlOrMeta+a")
  await more.click()
  await page
    .getByRole("menuitemcheckbox", { name: "Subscript", exact: true })
    .click()
  await expect(editor.locator("sub")).toHaveCount(0)
  await page.keyboard.press("Escape")
  await page.getByRole("button", { name: "Read only", exact: true }).click()
  await expect(more).toBeDisabled()
  await expect(editor).toHaveAttribute("contenteditable", "false")
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
  await testInfo.attach("toolbar-readonly.html", {
    body: await editor.innerHTML(),
    contentType: "text/html",
  })
})

test("menu policies and stale selections reject without document replacement", async ({
  page,
}, testInfo) => {
  await page.goto("/editor/insert-menu")
  await page.getByLabel("Advanced host checks", { exact: true }).click()

  const editor = page.getByRole("textbox", {
    name: "Toolbar menu document",
    exact: true,
  })

  await page
    .getByRole("checkbox", { name: "Deny block conversion", exact: true })
    .check()
  await editor.click()
  await page.getByRole("button", { name: /^Turn into:/ }).click()
  await expect(
    page.getByRole("menuitemradio", { name: "Heading 2", exact: true }),
  ).toHaveAttribute("aria-disabled", "true")
  await page.keyboard.press("Escape")
  await editor.click()
  await editor.press("ControlOrMeta+a")
  await page.getByRole("button", { name: "More", exact: true }).click()
  await editor.fill("Replacement document")

  const mark = page.getByRole("menuitemcheckbox", {
    name: "Superscript",
    exact: true,
  })

  if (await mark.isVisible())
    await expect(mark).toHaveAttribute("aria-disabled", "true")
  await expect(editor).toHaveText("Replacement document")
  await expect(editor.locator("sup")).toHaveCount(0)
  await testInfo.attach("stale-menu.html", {
    body: await editor.innerHTML(),
    contentType: "text/html",
  })
})

test("controlled mode changes keep host locks and review policy authoritative @a11y", async ({
  page,
}, testInfo) => {
  await page.goto("/editor/review-mode-menu")

  const editor = page.getByRole("textbox", {
    name: "Mode menu document",
    exact: true,
  })

  const mode = page.getByRole("button", { name: /^Document mode:/ })
  await expect(mode).toHaveAccessibleName("Document mode: Editing")
  await expect(mode).toHaveText("Editing")
  await mode.click()
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
  await page
    .getByRole("menuitemradio", { name: "Viewing", exact: true })
    .click()
  await expect(editor).toHaveAttribute("contenteditable", "false")
  await expect(mode).toHaveAccessibleName("Document mode: Viewing")
  await mode.click()
  await expect(
    page.getByRole("menuitemradio", { name: "Viewing", exact: true }),
  ).toHaveAttribute("aria-checked", "true")
  await page
    .getByRole("menuitemradio", { name: "Suggestion", exact: true })
    .click()
  await expect(editor).toHaveAttribute("contenteditable", "true")
  await expect(mode).toHaveAccessibleName("Document mode: Suggestion")
  await editor.click()
  await editor.press("ControlOrMeta+End")
  await editor.pressSequentially(" proposed")
  await expect(
    page.getByRole("button", { name: "Accept suggestion", exact: true }),
  ).toBeVisible()
  await page
    .getByRole("checkbox", { name: "Deny suggestions", exact: true })
    .check()
  await mode.click()
  await expect(
    page.getByRole("menuitemradio", { name: "Suggestion", exact: true }),
  ).toHaveAttribute("aria-disabled", "true")
  await page.keyboard.press("Escape")
  await page
    .getByRole("checkbox", { name: "Host read only", exact: true })
    .check()
  await expect(editor).toHaveAttribute("contenteditable", "false")
  await mode.click()
  await expect(
    page.getByRole("menuitemradio", { name: "Editing", exact: true }),
  ).toHaveAttribute("aria-disabled", "true")
  await expect(
    page.getByRole("menuitemradio", { name: "Suggestion", exact: true }),
  ).toHaveAttribute("aria-disabled", "true")
  await page.keyboard.press("Escape")
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
  await testInfo.attach("mode-menu.png", {
    body: await page.screenshot({ scale: "css" }),
    contentType: "image/png",
  })
})

test("mode menu preserves an explicit accessible label across changes @a11y", async ({
  page,
}, testInfo) => {
  await page.goto("/editor/review-mode-menu")
  await page
    .getByRole("checkbox", { name: "Use custom mode label", exact: true })
    .check()
  const mode = page.getByRole("button", { name: "Writing mode", exact: true })
  await expect(mode).toHaveText("Writing mode")
  await mode.click()
  await expect(
    page.getByRole("menuitemradio", { name: "Editing", exact: true }),
  ).toHaveAttribute("aria-checked", "true")
  await page
    .getByRole("menuitemradio", { name: "Viewing", exact: true })
    .click()
  await expect(mode).toHaveAccessibleName("Writing mode")
  await expect(mode).toHaveText("Writing mode")
  await mode.click()
  await expect(
    page.getByRole("menuitemradio", { name: "Viewing", exact: true }),
  ).toHaveAttribute("aria-checked", "true")
  const report = await new AxeBuilder({ page }).analyze()
  await testInfo.attach("explicit-mode-label-axe.json", {
    body: JSON.stringify(report),
    contentType: "application/json",
  })
  expect(report.violations).toEqual([])
  await page.keyboard.press("Escape")
})

test("floating grouped buttons keep nested menu usable and return focus @a11y", async ({
  page,
}, testInfo) => {
  await page.goto("/editor/floating-toolbar-buttons")

  const editor = page.getByRole("textbox", {
    name: "Grouped floating document",
    exact: true,
  })

  await editor.click()
  await editor.press("ControlOrMeta+a")
  await editor.press("Alt+F10")

  const toolbar = page.getByRole("toolbar", {
    name: "Grouped floating formatting",
    exact: true,
  })

  await expect(toolbar).toBeVisible()
  const more = toolbar.getByRole("button", { name: "More", exact: true })
  await more.click()
  await expect(
    page.getByRole("menuitemcheckbox", { name: "Superscript", exact: true }),
  ).toBeVisible()
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
  await page.keyboard.press("Escape")
  await expect(more).toBeFocused()
  await more.click()
  await page
    .getByRole("menuitemcheckbox", { name: "Superscript", exact: true })
    .click()
  await expect(editor.locator("sup")).toContainText("Select this text")
  await expect(editor).toBeFocused()
  await testInfo.attach("floating-menus.html", {
    body: await editor.innerHTML(),
    contentType: "text/html",
  })
})

for (const scenario of [
  { control: "Change document on menu action", text: "Xabcdef" },
  { control: "Change document during menu authorization", text: "Xabcdef" },
  { control: "Revoke menu permission on action", text: "abcdef" },
  { control: "Cycle read only during menu authorization", text: "abcdef" },
]) {
  test(`saved menu actions reject ${scenario.control.toLowerCase()}`, async ({
    page,
  }, testInfo) => {
    await page.goto("/editor/more-menu")
    await page.getByLabel("Advanced host checks", { exact: true }).click()
    await page
      .getByRole("checkbox", { name: scenario.control, exact: true })
      .check()

    const editor = page.getByRole("textbox", {
      name: "Toolbar menu document",
      exact: true,
    })

    await editor.fill("abcdef")
    await editor.press("ControlOrMeta+Home")
    await editor.press("ArrowRight")
    await editor.press("ArrowRight")
    await editor.press("Shift+ArrowRight")
    await editor.press("Shift+ArrowRight")
    await expect
      .poll(() => page.evaluate(() => window.getSelection()?.toString()))
      .toBe("cd")
    await page.getByRole("button", { name: "More", exact: true }).click()

    const action = page.getByRole("menuitemcheckbox", {
      name: "Superscript",
      exact: true,
    })

    await expect(action).not.toHaveAttribute("aria-disabled", "true")
    await action.click()
    await expect(editor).toHaveText(scenario.text)
    await expect(editor.locator("sup")).toHaveCount(0)

    if (scenario.control === "Cycle read only during menu authorization") {
      await expect(action).toBeHidden()
      await expect(
        page.getByRole("button", { name: "More", exact: true }),
      ).toHaveAttribute("aria-expanded", "false")
    }

    await page.keyboard.press("Escape")
    await editor.click()
    await editor.press("ControlOrMeta+z")
    await expect(editor.locator("sup")).toHaveCount(0)
    await testInfo.attach("rejected-menu-action.html", {
      body: await editor.innerHTML(),
      contentType: "text/html",
    })
  })
}

test("Alt+F10 skips native and focusable disabled floating controls", async ({
  page,
}, testInfo) => {
  await page.goto("/editor/floating-toolbar-buttons")
  await page.getByLabel("Advanced host checks", { exact: true }).click()
  await page
    .getByRole("checkbox", { name: "Show disabled controls", exact: true })
    .check()

  const editor = page.getByRole("textbox", {
    name: "Grouped floating document",
    exact: true,
  })

  await editor.click()
  await editor.press("ControlOrMeta+a")

  const toolbar = page.getByRole("toolbar", {
    name: "Grouped floating formatting",
    exact: true,
  })

  await expect(
    toolbar.getByRole("button", { name: "Unavailable bold", exact: true }),
  ).toHaveAttribute("aria-disabled", "true")
  await expect(
    toolbar.getByRole("button", { name: "Unavailable italic", exact: true }),
  ).toBeDisabled()
  await editor.press("Alt+F10")
  await expect(
    toolbar.getByRole("button", { name: "Bold", exact: true }),
  ).toBeFocused()
  await page.keyboard.press("Enter")
  await expect(editor.locator("strong, b")).toContainText("Select this text")
  await editor.press("ControlOrMeta+z")
  await expect(editor.locator("strong, b")).toHaveCount(0)
  await testInfo.attach("disabled-floating-controls.html", {
    body: await editor.innerHTML(),
    contentType: "text/html",
  })
})
