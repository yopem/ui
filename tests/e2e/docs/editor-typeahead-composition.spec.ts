import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

test("custom inline parts share native input, grouped options, focus and cancellation", async ({
  page,
}, testInfo) => {
  await page.goto("/docs/editor")
  const example = page.getByTestId("typeahead-example")

  const editor = example.getByRole("textbox", {
    name: "Typeahead editor",
    exact: true,
  })

  await expect(editor).toHaveAttribute("contenteditable", "true")
  await editor.click()
  await page.keyboard.type("@Ada")
  const option = page.getByRole("option", { name: "Ada Lovelace", exact: true })
  await expect(option).toBeVisible()
  await expect(editor).toBeFocused()
  const active = await editor.getAttribute("aria-activedescendant")
  expect(active).toBeTruthy()
  await expect(option).toHaveAttribute("id", active ?? "")
  await expect(
    page.getByRole("listbox", { name: "Editor suggestions" }),
  ).toBeVisible()
  await expect(example.getByRole("textbox")).toHaveCount(1)
  await page.keyboard.press("Escape")
  await expect(option).toHaveCount(0)
  await expect(editor).toContainText("@Ada")
  await page.keyboard.press("ControlOrMeta+a")
  await page.keyboard.type("@Grace")
  await page.getByRole("option", { name: "Grace Hopper", exact: true }).click()
  await expect(editor).toBeFocused()
  await expect(editor.locator('[data-slot="editor-mention"]')).toHaveText(
    "@Grace Hopper",
  )

  const result = await new AxeBuilder({ page })
    .include('[data-testid="typeahead-example"]')
    .analyze()

  await testInfo.attach("composition-inline-axe", {
    body: JSON.stringify(result),
    contentType: "application/json",
  })
  expect(result.violations).toEqual([])
})

test("separate emoji toolbar/popover/picker parts support search, cancellation, insertion and readonly", async ({
  page,
}, testInfo) => {
  await page.goto("/docs/editor")
  const example = page.getByTestId("typeahead-example")

  const editor = example.getByRole("textbox", {
    name: "Typeahead editor",
    exact: true,
  })

  await expect(editor).toHaveAttribute("contenteditable", "true")
  await editor.click()
  await page.keyboard.type("Before ")
  const trigger = example.getByRole("button", { name: "Emoji", exact: true })
  await trigger.focus()
  await trigger.press("Enter")
  const popup = page.getByRole("dialog", { name: "Emoji picker", exact: true })
  const search = popup.getByRole("combobox", { name: "Search emoji" })
  await expect(search).toBeFocused()
  await search.fill("woman_technologist")

  const result = await new AxeBuilder({ page })
    .include('[data-slot="editor-emoji-popover-content"]')
    .analyze()

  await testInfo.attach("composition-emoji-axe", {
    body: JSON.stringify(result),
    contentType: "application/json",
  })
  expect(result.violations).toEqual([])
  await page.keyboard.press("Escape")
  await expect(popup).toBeHidden()
  await expect(trigger).toBeFocused()
  await trigger.click()
  await search.fill("woman_technologist")

  const baseOption = popup.getByRole("option", {
    name: "👩‍💻 woman technologist",
    exact: true,
  })

  const toneOption = popup.getByRole("option", {
    name: "👩🏻‍💻 woman technologist: light skin tone",
    exact: true,
  })

  await expect(baseOption).toHaveAttribute("data-highlighted")
  await search.press("ArrowDown")
  await expect(toneOption).toHaveAttribute("data-highlighted")
  await search.press("ArrowUp")
  await expect(baseOption).toHaveAttribute("data-highlighted")
  await search.press("Enter")
  await expect(editor).toBeFocused()
  await expect(editor).toContainText("👩‍💻")
  await expect(popup).toBeHidden()
  await page.keyboard.press("ControlOrMeta+z")
  await expect(editor).not.toContainText("👩‍💻")
  await example.getByRole("button", { name: "Read only", exact: true }).click()
  await expect(trigger).toBeDisabled()

  for (const width of [1440, 768, 390]) {
    await page.setViewportSize({ width, height: 900 })
    await editor.scrollIntoViewIfNeeded()
    await testInfo.attach(`composition-${width}`, {
      body: await page.screenshot(),
      contentType: "image/png",
    })
  }
})

test("emoji preset remains independent from composed editor", async ({
  page,
}, testInfo) => {
  await page.goto("/docs/editor")

  const first = page.getByRole("textbox", {
    name: "Typeahead editor",
    exact: true,
  })

  const preset = page.getByRole("textbox", {
    name: "Emoji preset editor",
    exact: true,
  })

  await expect(first).toHaveAttribute("contenteditable", "true")
  await expect(preset).toHaveAttribute("contenteditable", "true")
  await preset.click()
  await page.keyboard.type("Preset ")
  const root = page.getByTestId("emoji-preset-example")
  await root.getByRole("button", { name: "Emoji", exact: true }).click()
  const popup = page.getByRole("dialog", { name: "Emoji picker", exact: true })
  await popup
    .getByRole("combobox", { name: "Search emoji" })
    .fill("woman_technologist")
  await popup
    .getByRole("option", { name: /woman technologist/ })
    .first()
    .click()
  await expect(preset).toContainText("👩‍💻")
  await expect(first).not.toContainText("👩‍💻")
  await testInfo.attach("preset-independent-content", {
    body: JSON.stringify({
      preset: await preset.textContent(),
      composed: await first.textContent(),
    }),
    contentType: "application/json",
  })
})

test("emoji parts support paging, category, hover preview, empty search and frequency reset", async ({
  page,
}, testInfo) => {
  await page.goto("/docs/editor")
  const example = page.getByTestId("typeahead-example")

  const editor = example.getByRole("textbox", {
    name: "Typeahead editor",
    exact: true,
  })

  await expect(editor).toHaveAttribute("contenteditable", "true")
  await editor.click()
  await page.keyboard.type("History ")
  const trigger = example.getByRole("button", { name: "Emoji", exact: true })
  await trigger.click()
  const popup = page.getByRole("dialog", { name: "Emoji picker", exact: true })
  const list = popup.getByRole("listbox", { name: "Emoji", exact: true })
  const category = popup.getByRole("combobox", { name: "Emoji category" })
  const search = popup.getByRole("combobox", { name: "Search emoji" })

  const previous = popup.getByRole("button", {
    name: "Previous emoji",
    exact: true,
  })

  const next = popup.getByRole("button", { name: "Next emoji", exact: true })
  await expect(previous).toBeDisabled()
  const first = await list.getByRole("option").first().innerText()
  await next.click()
  await expect(list.getByRole("option").first()).not.toHaveText(first)
  await expect(previous).toBeEnabled()
  await previous.click()
  await expect(list.getByRole("option").first()).toHaveText(first)
  await list.getByRole("option").first().hover()
  await expect(
    popup.locator('[data-slot="editor-emoji-preview"]'),
  ).toContainText(first)
  await category.selectOption({ index: 2 })
  await expect(list.getByRole("option").first()).toBeVisible()
  await category.selectOption("all")
  await search.fill("no_such_emoji_9qz0")
  await expect(list.getByRole("option")).toHaveCount(0)
  await expect(popup.locator('[data-slot="editor-emoji-empty"]')).toBeVisible()
  await popup
    .getByRole("button", { name: "Clear emoji search", exact: true })
    .click()
  await expect(search).toHaveValue("")
  const selected = await list.getByRole("option").first().innerText()
  await list.getByRole("option").first().click()
  await expect(editor).toBeFocused()
  await trigger.click()
  await category.selectOption("frequent")
  await expect(list.getByRole("option").first()).toHaveText(selected)

  const result = await new AxeBuilder({ page })
    .include('[data-slot="editor-emoji-popover-content"]')
    .analyze()

  expect(result.violations).toEqual([])

  const clear = popup.getByRole("button", {
    name: "Clear emoji history",
    exact: true,
  })

  await clear.click()
  await expect(clear).toBeDisabled()
  await expect(list.getByRole("option")).toHaveCount(0)
  await testInfo.attach("emoji-frequency-reset", {
    body: JSON.stringify({ selected, result }),
    contentType: "application/json",
  })
  await search.press("Escape")
  await expect(trigger).toBeFocused()
})

test("composed emoji popup stays within light and dark responsive viewports", async ({
  page,
}, testInfo) => {
  test.slow()
  await page.addInitScript(() =>
    localStorage.setItem("yopem-ui-theme", "system"),
  )
  await page.goto("/docs/editor")
  const example = page.getByTestId("typeahead-example")

  const editor = example.getByRole("textbox", {
    name: "Typeahead editor",
    exact: true,
  })

  await expect(editor).toHaveAttribute("contenteditable", "true")
  await editor.click()
  await page.keyboard.type("Responsive ")
  const trigger = example.getByRole("button", { name: "Emoji", exact: true })

  await trigger.click()
  const popup = page.getByRole("dialog", { name: "Emoji picker", exact: true })

  for (const colorScheme of ["light", "dark"] as const) {
    await page.emulateMedia({ colorScheme })
    await expect(page.locator("html")).toHaveAttribute(
      "data-theme",
      colorScheme,
    )

    for (const width of [1440, 768, 390]) {
      await page.setViewportSize({ width, height: 900 })
      await trigger.scrollIntoViewIfNeeded()
      await expect(popup).toBeVisible()
      await expect
        .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
        .toBeLessThanOrEqual(width)
      await expect
        .poll(async () => {
          const bounds = await popup.boundingBox()

          return (
            bounds !== null &&
            bounds.x >= 0 &&
            bounds.y >= 0 &&
            bounds.x + bounds.width <= width &&
            bounds.y + bounds.height <= 900
          )
        })
        .toBe(true)
      const bounds = await popup.boundingBox()
      expect(bounds).not.toBeNull()

      if (!bounds) throw new Error("Popup needs visible geometry")
      await testInfo.attach(`emoji-${colorScheme}-${width}`, {
        body: await page.screenshot({ scale: "css" }),
        contentType: "image/png",
      })
      await testInfo.attach(`emoji-${colorScheme}-${width}-geometry`, {
        body: JSON.stringify(bounds),
        contentType: "application/json",
      })

      if (width === 390) {
        const result = await new AxeBuilder({ page })
          .include('[role="dialog"][aria-label="Emoji picker"]')
          .analyze()

        expect(result.violations).toEqual([])
      }
    }
  }
})
