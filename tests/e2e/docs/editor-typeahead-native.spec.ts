import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

test("palette navigation keeps caret focus and composition events suspend actions", async ({
  page,
}) => {
  await page.goto("/docs/editor")

  const editor = page.getByRole("textbox", {
    name: "Typeahead editor",
    exact: true,
  })

  await expect(editor).toHaveAttribute("contenteditable", "true")
  await editor.click()
  await page.keyboard.type("/")
  await expect(
    page.getByRole("option", { name: "Paragraph", exact: true }),
  ).toHaveAttribute("aria-selected", "true")
  await page.keyboard.press("End")
  const last = page.getByRole("option", { name: "Table", exact: true })
  await expect(last).toHaveAttribute("aria-selected", "true")
  const activeId = await last.getAttribute("id")

  if (!activeId) throw new Error("Active option needs an ID")
  await expect(editor).toHaveAttribute("aria-activedescendant", activeId)
  await page.keyboard.press("Home")
  await expect(
    page.getByRole("option", { name: "Paragraph", exact: true }),
  ).toHaveAttribute("aria-selected", "true")
  await expect(editor).toBeFocused()
  await editor.dispatchEvent("compositionstart", { data: "" })
  await expect(
    page.getByRole("listbox", { name: "Editor suggestions" }),
  ).toHaveCount(0)
  await expect(editor).not.toHaveAttribute("aria-activedescendant")
  await editor.dispatchEvent("compositionend", { data: "" })
  await page.keyboard.press("Escape")
  await expect(editor).toHaveText("/")
  await expect(editor).toBeFocused()
})

test("native clipboard retains mention identity across roots without profile URLs", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"])
  await page.goto("/docs/editor")

  const source = page.getByRole("textbox", {
    name: "Typeahead editor",
    exact: true,
  })

  const target = page.getByRole("textbox", {
    name: "HTTP typeahead editor",
    exact: true,
  })

  await expect(source).toHaveAttribute("contenteditable", "true")
  await expect(target).toHaveAttribute("contenteditable", "true")
  await source.click()
  await page.keyboard.type("@Ad")
  await page.getByRole("option", { name: "Ada Lovelace", exact: true }).click()
  await expect(source).toBeFocused()
  await expect(
    source.getByRole("link", { name: "@Ada Lovelace", exact: true }),
  ).toHaveAttribute("href", "https://example.com/people/ada")
  await page.evaluate(() => navigator.clipboard.writeText("Clipboard sentinel"))
  await page.keyboard.press("ControlOrMeta+a")
  await page.keyboard.press("ControlOrMeta+c")
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toContain("@Ada Lovelace")

  const copied = await page.evaluate(async () => {
    for (const item of await navigator.clipboard.read()) {
      if (!item.types.includes("text/html")) continue
      const html = await (await item.getType("text/html")).text()
      const document = new DOMParser().parseFromString(html, "text/html")
      const mention = document.querySelector("[data-mention-id]")

      return {
        id: mention?.getAttribute("data-mention-id"),
        label: mention?.getAttribute("data-mention-label"),
        links: document.querySelectorAll("a[href]").length,
      }
    }

    return null
  })

  expect(copied).toEqual({ id: "ada", label: "Ada Lovelace", links: 0 })
  await target.click()
  await page.keyboard.press("ControlOrMeta+v")
  await expect(target.locator('[data-slot="editor-mention"]')).toHaveText(
    "@Ada Lovelace",
  )
  await expect(target).toBeFocused()
  await expect(
    target.getByRole("link", { name: "@Ada Lovelace", exact: true }),
  ).toHaveCount(0)
  await page.keyboard.press("End")
  await page.keyboard.press("Backspace")
  await page.keyboard.press("Backspace")
  await expect(target.locator('[data-slot="editor-mention"]')).toHaveCount(0)
  await page.keyboard.press("ControlOrMeta+z")
  await expect(target.locator('[data-slot="editor-mention"]')).toHaveText(
    "@Ada Lovelace",
  )
  await expect(source.locator('[data-slot="editor-mention"]')).toHaveText(
    "@Ada Lovelace",
  )
})

test("RTL mention labels retain Unicode graphemes and pointer selection focus", async ({
  page,
}) => {
  await page.addInitScript(() =>
    document.documentElement.setAttribute("dir", "rtl"),
  )
  const label = "أدا 👩🏽‍💻"
  await page.route("**/typeahead-fixture?*", (route) =>
    route.fulfill({ json: [{ id: "arabic-coder", label }] }),
  )
  await page.goto("/docs/editor")

  const editor = page.getByRole("textbox", {
    name: "HTTP typeahead editor",
    exact: true,
  })

  await expect(editor).toHaveAttribute("contenteditable", "true")
  await editor.click()
  await page.keyboard.insertText("@أ")
  const option = page.getByRole("option", { name: label, exact: true })
  await expect(option).toBeVisible()

  const result = await new AxeBuilder({ page })
    .include('[aria-label="Editor suggestions"]')
    .analyze()

  expect(result.violations).toEqual([])
  await option.click()
  await expect(editor.locator('[data-slot="editor-mention"]')).toHaveText(
    `@${label}`,
  )
  await expect(editor).toBeFocused()
  await page.keyboard.press("Backspace")
  await page.keyboard.press("Backspace")
  await expect(editor).not.toContainText(label)
  await page.keyboard.press("ControlOrMeta+z")
  await expect(editor).toContainText(label)
})

test("native browser composition commits Unicode and suspends mention actions", async ({
  page,
  context,
}, testInfo) => {
  test.slow()
  await page.goto("/docs/editor")

  const editor = page.getByRole("textbox", {
    name: "Typeahead editor",
    exact: true,
  })

  await expect(editor).toHaveAttribute("contenteditable", "true")
  await editor.click()
  const session = await context.newCDPSession(page)

  try {
    await session.send("Input.imeSetComposition", {
      text: "あ",
      selectionStart: 1,
      selectionEnd: 1,
    })
    await expect(editor).toHaveText("あ")
    await expect(
      page.getByRole("listbox", { name: "Editor suggestions" }),
    ).toHaveCount(0)
    await session.send("Input.insertText", { text: "あ" })
    await expect(editor).toHaveText("あ")
    await page.keyboard.press("ControlOrMeta+a")
    await page.keyboard.press("Backspace")
    await session.send("Input.imeSetComposition", {
      text: "@Ad",
      selectionStart: 3,
      selectionEnd: 3,
    })
    await expect(editor).toHaveText("@Ad")
    await expect(
      page.getByRole("listbox", { name: "Editor suggestions" }),
    ).toHaveCount(0)
    await expect(editor).not.toHaveAttribute("aria-activedescendant")
    await session.send("Input.insertText", { text: "@Ad" })
    await expect(
      page.getByRole("option", { name: "Ada Lovelace", exact: true }),
    ).toBeVisible()
    await page.keyboard.press("Enter")
    await expect(editor.locator('[data-slot="editor-mention"]')).toHaveText(
      "@Ada Lovelace",
    )
    await expect(editor).toBeFocused()

    const result = await new AxeBuilder({ page })
      .include('[role="textbox"][aria-label="Typeahead editor"]')
      .analyze()

    expect(result.violations).toEqual([])
    await testInfo.attach("native-browser-ime", {
      body: JSON.stringify({
        protocol: ["Input.imeSetComposition", "Input.insertText"],
        unicode: "あ",
        query: "@Ad",
        committed: await editor.textContent(),
      }),
      contentType: "application/json",
    })
  } finally {
    await session.detach()
  }
})

test("native mention clipboard falls back safely in an editor without MentionNode", async ({
  page,
  context,
}, testInfo) => {
  test.slow()
  await context.grantPermissions(["clipboard-read", "clipboard-write"])
  const errors: string[] = []
  page.on("pageerror", (error) => errors.push(error.message))
  await page.goto("/docs/editor")

  const source = page.getByRole("textbox", {
    name: "Typeahead editor",
    exact: true,
  })

  const target = page.getByRole("textbox", {
    name: "Rich text editor",
    exact: true,
  })

  await expect(source).toHaveAttribute("contenteditable", "true")
  await expect(target).toHaveAttribute("contenteditable", "true")
  await source.click()
  await page.keyboard.type("@Ad")
  await page.getByRole("option", { name: "Ada Lovelace", exact: true }).click()
  await expect(source.locator('[data-slot="editor-mention"]')).toHaveText(
    "@Ada Lovelace",
  )
  await page.evaluate(() => navigator.clipboard.writeText("Clipboard sentinel"))
  await page.keyboard.press("ControlOrMeta+a")
  await page.keyboard.press("ControlOrMeta+c")
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toContain("@Ada Lovelace")
  await target.fill("Target ")
  const original = await target.innerText()
  expect(original).toContain("Target")
  await page.keyboard.press("End")
  await page.keyboard.press("ControlOrMeta+v")
  await expect(target).toContainText("@Ada Lovelace")
  const pasted = await target.innerText()
  expect(pasted.startsWith(original)).toBe(true)
  await expect(target.locator('[data-slot="editor-mention"]')).toHaveCount(0)
  await expect(target.getByRole("link")).toHaveCount(0)
  await expect(target).toBeFocused()
  await page.keyboard.press("ControlOrMeta+z")
  await expect.poll(() => target.innerText()).toBe(original)
  await page.keyboard.press("ControlOrMeta+Shift+z")
  await expect.poll(() => target.innerText()).toBe(pasted)
  await expect(source.locator('[data-slot="editor-mention"]')).toHaveText(
    "@Ada Lovelace",
  )
  await expect(page.getByRole("alert")).toHaveCount(0)
  expect(errors).toEqual([])

  const result = await new AxeBuilder({ page })
    .include('[role="textbox"][aria-label="Rich text editor"]')
    .analyze()

  expect(result.violations).toEqual([])
  await testInfo.attach("missing-node-clipboard-fallback", {
    body: JSON.stringify({ original, pasted, errors }),
    contentType: "application/json",
  })
})
