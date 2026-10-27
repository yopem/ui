import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

test("inline suggestions preserve native Tab focus and blur through repeated opens", async ({
  page,
}, testInfo) => {
  test.slow()
  const errors: string[] = []
  page.on("pageerror", (error) => errors.push(error.message))
  await page.goto("/docs/editor")

  const editor = page.getByRole("textbox", {
    name: "Typeahead editor",
    exact: true,
  })

  await expect(editor).toHaveAttribute("contenteditable", "true")
  await editor.evaluate((element) => {
    element.setAttribute("data-observed-blur-count", "0")
    element.addEventListener("blur", function recordBlur() {
      const previous = Number(element.getAttribute("data-observed-blur-count"))
      element.setAttribute("data-observed-blur-count", String(previous + 1))
    })
  })

  const focusTargets: { key: string; tag: string; label: string | null }[] = []

  for (const key of ["Tab", "Shift+Tab", "Tab", "Shift+Tab"]) {
    await editor.fill("@Ad")
    await expect(
      page.getByRole("listbox", { name: "Editor suggestions" }),
    ).toBeVisible()
    await expect(editor).toBeFocused()
    await page.keyboard.press(key)
    await expect(
      page.getByRole("listbox", { name: "Editor suggestions" }),
    ).toBeHidden()
    await expect(editor).not.toBeFocused()
    await expect
      .poll(() =>
        page.evaluate(() => {
          const active = document.activeElement

          return (
            active !== null &&
            active !== document.body &&
            active !== document.documentElement &&
            active.isConnected &&
            active.closest('[aria-hidden="true"], [inert]') === null
          )
        }),
      )
      .toBe(true)
    focusTargets.push(
      await page.evaluate((key) => {
        const active = document.activeElement

        if (!active) throw new Error("Native Tab needs a focus target")
        active.setAttribute("data-observed-typeahead-neighbor", "true")

        return {
          key,
          tag: active.tagName,
          label: active.getAttribute("aria-label") ?? active.textContent,
        }
      }, key),
    )
  }

  await expect
    .poll(async () =>
      Number(await editor.getAttribute("data-observed-blur-count")),
    )
    .toBeGreaterThanOrEqual(4)
  await editor.fill("@Ad")
  await expect(
    page.getByRole("listbox", { name: "Editor suggestions" }),
  ).toBeVisible()

  const guardCount = await page
    .locator('[aria-hidden="true"][tabindex="0"]')
    .count()

  const openScan = await new AxeBuilder({ page }).analyze()

  await testInfo.attach("open-focus-accessibility", {
    body: JSON.stringify(openScan),
    contentType: "application/json",
  })
  expect(openScan.violations).toEqual([])

  for (let index = 0; index < guardCount; index += 1) {
    await editor.fill("")
    await page.keyboard.type("@Ad")
    await expect(
      page.getByRole("listbox", { name: "Editor suggestions" }),
    ).toBeVisible()
    await page.locator('[aria-hidden="true"][tabindex="0"]').nth(index).focus()
    await page.evaluate(
      () =>
        new Promise<void>((resolve) => {
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
        }),
    )
    await expect
      .poll(() =>
        page.evaluate(() => {
          const active = document.activeElement

          return (
            active !== null &&
            active.isConnected &&
            active.closest('[aria-hidden="true"], [inert]') === null &&
            (active.getAttribute("aria-label") === "Typeahead editor" ||
              active.hasAttribute("data-observed-typeahead-neighbor"))
          )
        }),
      )
      .toBe(true)
  }

  await editor.fill("@Ad")
  await expect(
    page.getByRole("listbox", { name: "Editor suggestions" }),
  ).toBeVisible()

  const mentionChoice = page.getByRole("option", {
    name: "Ada Lovelace",
    exact: true,
  })

  await expect(mentionChoice).toBeVisible()
  await expect(mentionChoice).toBeEnabled()
  await testInfo.attach("focus-before-mention-choice", {
    body: JSON.stringify(
      await editor.evaluate((element) => {
        const selection = element.ownerDocument.getSelection()

        return {
          activeLabel:
            element.ownerDocument.activeElement?.getAttribute("aria-label"),
          editorFocused: element === element.ownerDocument.activeElement,
          content: element.textContent,
          selectionType: selection?.type,
          collapsed: selection?.isCollapsed,
          anchorText: selection?.anchorNode?.textContent,
          anchorOffset: selection?.anchorOffset,
          focusText: selection?.focusNode?.textContent,
          focusOffset: selection?.focusOffset,
          activeDescendant: element.getAttribute("aria-activedescendant"),
        }
      }),
    ),
    contentType: "application/json",
  })
  await expect(editor).toBeFocused()
  await page.keyboard.press("ArrowDown")
  await page.keyboard.press("Enter")
  await expect(editor.locator('[data-slot="editor-mention"]')).toHaveCount(1)
  await expect(editor).toBeFocused()
  await page.keyboard.type(" after")
  await expect(editor).toContainText("after")
  const result = await new AxeBuilder({ page }).analyze()

  expect(result.violations).toEqual([])
  expect(errors).toEqual([])
  await testInfo.attach("native-focus-routes", {
    body: JSON.stringify({
      focusTargets,
      guardsChecked: guardCount,
      blurCount: await editor.getAttribute("data-observed-blur-count"),
      content: await editor.textContent(),
    }),
    contentType: "application/json",
  })
})

test("filtered inline options keep their active descendant after index changes", async ({
  page,
}, testInfo) => {
  test.slow()
  const errors: string[] = []
  page.on("pageerror", (error) => errors.push(error.message))
  await page.goto("/docs/editor")

  const editor = page.getByRole("textbox", {
    name: "Typeahead editor",
    exact: true,
  })

  await expect(editor).toHaveAttribute("contenteditable", "true")
  await editor.fill("/")

  const paragraph = page.getByRole("option", { name: "Paragraph", exact: true })
  const heading = page.getByRole("option", { name: "Heading 1", exact: true })

  await expect(paragraph).toBeVisible()
  await expect(heading).toBeVisible()
  await heading.evaluate((element) => {
    element.setAttribute("data-retained-option", "true")
  })
  await page.keyboard.type("heading")
  await expect(paragraph).toBeHidden()
  await expect(heading).toHaveAttribute("data-retained-option", "true")
  await expect(heading).toHaveAttribute("id", /\S+/)
  await expect
    .poll(async () => ({
      active: await editor.getAttribute("aria-activedescendant"),
      expected: await heading.getAttribute("id"),
    }))
    .toEqual({
      active: await heading.getAttribute("id"),
      expected: await heading.getAttribute("id"),
    })
  await expect(heading).toHaveAttribute("aria-selected", "true")
  await page.keyboard.press("Enter")
  await page.keyboard.type("Retained heading")
  await expect(editor.getByRole("heading", { level: 1 })).toHaveText(
    "Retained heading",
  )
  expect(errors).toEqual([])
  const scan = await new AxeBuilder({ page }).analyze()

  expect(scan.violations).toEqual([])
  await testInfo.attach("retained-option-state", {
    body: JSON.stringify({ content: await editor.innerHTML(), errors }),
    contentType: "application/json",
  })
})

test("inline editor keeps textbox semantics and native Space and Enter input", async ({
  page,
}) => {
  test.slow()
  await page.goto("/docs/editor")

  const editor = page.getByRole("textbox", {
    name: "Typeahead editor",
    exact: true,
  })

  await expect(editor).toHaveAttribute("contenteditable", "true")
  await expect(editor).not.toHaveAttribute("aria-expanded")
  await editor.fill("")
  await editor.pressSequentially("Native words")
  await editor.press("Enter")
  await editor.pressSequentially("Second line")
  await expect(editor.locator("p")).toHaveText(["Native words", "Second line"])
  await expect(editor).toBeFocused()
  await expect(
    page.getByRole("dialog", { name: "Editor suggestions", exact: true }),
  ).toHaveCount(0)
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
})
