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
