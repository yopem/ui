import AxeBuilder from "@axe-core/playwright"
import {
  expect,
  test,
  type Locator,
  type Page,
  type TestInfo,
} from "@playwright/test"

async function scanOpenSuggestions(
  page: Page,
  testInfo: TestInfo,
  name: string,
) {
  const result = await new AxeBuilder({ page }).analyze()
  await testInfo.attach(`${name}-axe`, {
    body: JSON.stringify(result),
    contentType: "application/json",
  })
  expect(result.violations).toEqual([])
}

async function descriptionFor(page: Page, option: Locator) {
  const id = await option.getAttribute("aria-describedby")

  if (!id)
    throw new Error("Default described option needs a description target")
  const description = page.locator(`[id="${id}"]`)
  await expect(description).toBeVisible()
  await expect(description).not.toHaveAttribute("aria-hidden", "true")
  await expect(option).toHaveAccessibleDescription(
    await description.innerText(),
  )
  expect(
    await option.evaluate(
      (element, target) => element.contains(document.getElementById(target)),
      id,
    ),
  ).toBe(false)

  return description
}

async function pointAt(target: Locator) {
  await target.scrollIntoViewIfNeeded()
  const bounds = await target.boundingBox()

  if (!bounds) throw new Error("Suggestion text needs visible geometry")

  return { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 }
}

test("default described suggestions keep short names, owned targets and controller keyboard order @a11y", async ({
  page,
}, testInfo) => {
  await page.goto("/editor/typeahead")
  const preview = page.locator('[data-slot="editor-part-preview"]')

  const editor = preview.getByRole("textbox", {
    name: "EditorTypeahead preview",
    exact: true,
  })

  await expect(editor).toHaveAttribute("contenteditable", "true")
  await editor.fill("/")

  const list = page.getByRole("listbox", {
    name: "Editor suggestions",
    exact: true,
  })

  await expect(list).toBeVisible()
  await expect(preview.getByRole("textbox")).toHaveCount(1)
  await expect(preview.locator('[contenteditable="true"]')).toHaveCount(1)
  await expect(editor).toBeFocused()
  const listId = await list.getAttribute("id")

  if (!listId) throw new Error("Suggestions list needs an ID")
  await expect(editor).toHaveAttribute("aria-controls", listId)
  const options = list.getByRole("option")
  const count = await options.count()
  expect(count).toBeGreaterThan(1)

  for (let index = 0; index < count; index += 1) {
    const option = options.nth(index)
    const label = option.locator('[data-slot="editor-inline-combobox-label"]')
    await expect(option).toHaveAccessibleName(await label.innerText())
    const description = await descriptionFor(page, option)
    expect((await description.innerText()).trim().length).toBeGreaterThan(0)
    const optionId = await option.getAttribute("id")

    if (!optionId) throw new Error("Suggestion option needs an ID")
    await expect(editor).toHaveAttribute("aria-activedescendant", optionId)
    await expect(option).toHaveAttribute("aria-selected", "true")
    await expect(option).toHaveAttribute("data-highlighted")
    await expect(editor).toBeFocused()

    if (index < count - 1) await editor.press("ArrowDown")
  }

  await editor.press("Home")
  await expect(options.first()).toHaveAttribute("aria-selected", "true")
  await editor.press("End")
  await expect(options.last()).toHaveAttribute("aria-selected", "true")
  await editor.press("Home")
  await scanOpenSuggestions(page, testInfo, "default-open-list")
  await testInfo.attach("default-open-list", {
    body: await page.screenshot({ scale: "css" }),
    contentType: "image/png",
  })
  await editor.press("ArrowDown")
  await editor.press("Enter")
  await expect(editor.locator("h1")).toBeVisible()
  await expect(list).toHaveCount(0)
  await expect(editor).not.toHaveAttribute("aria-activedescendant")
  await expect(editor).not.toHaveAttribute("aria-controls")
  await expect(editor).toBeFocused()
  await editor.pressSequentially("Keyboard choice")
  await expect(editor.locator("h1")).toHaveText("Keyboard choice")
})

for (const target of ["title", "description"]) {
  test(`pointer ${target} activates full described row without moving editable focus @a11y`, async ({
    page,
  }, testInfo) => {
    await page.goto("/editor/typeahead")
    const preview = page.locator('[data-slot="editor-part-preview"]')

    const editor = preview.getByRole("textbox", {
      name: "EditorTypeahead preview",
      exact: true,
    })

    await expect(editor).toHaveAttribute("contenteditable", "true")
    await editor.fill("/heading")
    const option = page.getByRole("option", { name: "Heading 2", exact: true })
    const description = await descriptionFor(page, option)

    const text =
      target === "title"
        ? option.locator('[data-slot="editor-inline-combobox-label"]')
        : description

    const point = await pointAt(text)
    expect(
      await option.evaluate(
        (element, point) =>
          element.contains(document.elementFromPoint(point.x, point.y)),
        point,
      ),
    ).toBe(true)
    await page.mouse.move(point.x, point.y)
    await expect(option).toHaveAttribute("aria-selected", "true")
    await expect(option).toHaveAttribute("data-highlighted")
    await expect(editor).toBeFocused()
    await scanOpenSuggestions(page, testInfo, `${target}-highlighted`)
    await page.mouse.down()
    await expect(editor).toBeFocused()
    await page.mouse.up()
    await expect(editor.locator("h2")).toBeVisible()
    await expect(
      page.getByRole("listbox", { name: "Editor suggestions", exact: true }),
    ).toHaveCount(0)
    await expect(editor).toBeFocused()
    await expect(preview.locator('[contenteditable="true"]')).toHaveCount(1)
    await editor.pressSequentially("Pointer choice")
    await expect(editor.locator("h2")).toHaveText("Pointer choice")
    await testInfo.attach(`${target}-pointer-result`, {
      body: JSON.stringify({ point, text: await editor.innerText() }),
      contentType: "application/json",
    })
  })
}

test("undescribed mentions and emoji keep label names and native focus @a11y", async ({
  page,
}, testInfo) => {
  await page.goto("/editor/typeahead")

  const editor = page.getByRole("textbox", {
    name: "EditorTypeahead preview",
    exact: true,
  })

  await expect(editor).toHaveAttribute("contenteditable", "true")
  await editor.fill("@Ada")
  const mention = page.getByRole("option", { name: "Ada", exact: true })
  await expect(mention).toHaveAccessibleDescription("")
  await scanOpenSuggestions(page, testInfo, "undescribed-mention")
  await mention.click()
  await expect(editor.locator('[data-slot="editor-mention"]')).toHaveText(
    "@Ada",
  )
  await expect(editor).toBeFocused()
  await editor.pressSequentially(" :woman_technologist")

  const emoji = page.getByRole("option", {
    name: "woman technologist",
    exact: true,
  })

  await expect(emoji).toContainText("👩‍💻")
  await scanOpenSuggestions(page, testInfo, "inline-emoji")
  await emoji.click()
  await expect(editor).toContainText("👩‍💻")
  await expect(editor).toBeFocused()
})

test("consumer names, descriptions, render refs and custom children stay on owned options @a11y", async ({
  page,
}, testInfo) => {
  await page.goto("/editor/inline-combobox-item")
  const preview = page.locator('[data-slot="editor-part-preview"]')

  const editor = preview.getByRole("textbox", {
    name: "EditorInlineComboboxItem preview",
    exact: true,
  })

  await expect(editor).toHaveAttribute("contenteditable", "true")
  await editor.fill("/")
  const list = page.getByRole("listbox", { name: "Suggestions", exact: true })
  const order = preview.getByTestId("typeahead-controller-order")
  const expectedIds = await order.getAttribute("data-items")
  expect(
    JSON.stringify(
      await list
        .getByRole("option")
        .evaluateAll((elements) =>
          elements.map((element) => element.getAttribute("data-item-id")),
        ),
    ),
  ).toBe(expectedIds)

  const paragraph = list.getByRole("option", {
    name: "Paragraph command",
    exact: true,
  })

  await expect(paragraph).toHaveAttribute("data-consumer-ref", "option")
  await descriptionFor(page, paragraph)

  const referenced = list.getByRole("option", {
    name: "Heading 1 command",
    exact: true,
  })

  await expect(referenced).toHaveAccessibleDescription(
    "Consumer referenced description",
  )
  await expect(referenced).toHaveAttribute("aria-labelledby", /.+/)
  const described = list.getByRole("option", { name: "Heading 2", exact: true })
  await expect(described).toHaveAccessibleDescription("Consumer description")

  const custom = list.getByRole("option", {
    name: "Heading 3 custom",
    exact: true,
  })

  await expect(
    custom.locator('[data-slot="editor-inline-combobox-row"]'),
  ).toBeVisible()
  await expect(custom).toHaveAccessibleDescription(/.+/)
  await expect(
    custom.locator('[data-slot="editor-inline-combobox-description"]'),
  ).toHaveCount(0)
  await scanOpenSuggestions(page, testInfo, "consumer-open-list")
  const options = list.getByRole("option")

  const ids = await options.evaluateAll((elements) =>
    elements.map((element) => element.id),
  )

  for (let index = 0; index < ids.length; index += 1) {
    await expect(editor).toHaveAttribute(
      "aria-activedescendant",
      ids[index] ?? "",
    )
    await expect(options.nth(index)).toHaveAttribute("aria-selected", "true")

    if (index < ids.length - 1) await editor.press("ArrowDown")
  }

  await editor.press("Home")
  await referenced.click()
  await expect(editor.locator("h1")).toBeVisible()
  await expect(editor).toBeFocused()
  await expect(preview.getByRole("textbox")).toHaveCount(1)

  const event = preview.getByRole("status", {
    name: "Option event",
    exact: true,
  })

  await expect(event).toHaveText("h1:click:option")
  await editor.fill("/paragraph")
  const paragraphPoint = await pointAt(await descriptionFor(page, paragraph))
  await page.mouse.click(paragraphPoint.x, paragraphPoint.y)
  await expect(event).toHaveText("paragraph:click:option")
  await expect(editor).toBeFocused()
  await editor.fill("/heading 3")
  await expect(custom).toBeVisible()
  await editor.press("Enter")
  await expect(editor.locator("h3")).toBeVisible()
  await expect(editor).toBeFocused()
})

test("render-element descriptions override defaults without changing option behavior @a11y", async ({
  page,
}, testInfo) => {
  await page.goto("/editor/inline-combobox-item")
  const preview = page.locator('[data-slot="editor-part-preview"]')

  const editor = preview.getByRole("textbox", {
    name: "EditorInlineComboboxItem preview",
    exact: true,
  })

  await expect(editor).toHaveAttribute("contenteditable", "true")
  await editor.fill("/")
  const list = page.getByRole("listbox", { name: "Suggestions", exact: true })
  await expect(list).toBeVisible()
  const listId = await list.getAttribute("id")

  if (!listId) throw new Error("Suggestions list needs an ID")
  await expect(editor).toHaveAttribute("aria-controls", listId)

  for (const [name, description, reference] of [
    ["Quote", "Host description", undefined],
    ["Code block", "Consumer referenced description", "target"],
    ["Bullet list", "", undefined],
    ["Numbered list", "", ""],
    ["Check list", "", undefined],
    ["Table", "", ""],
  ] as const) {
    const option = list.getByRole("option", { name, exact: true })
    await expect(option).toHaveAccessibleName(name)
    await expect(option).toHaveAccessibleDescription(description)
    await expect(option).toHaveAttribute("data-consumer-ref", "option")

    if (reference === undefined)
      await expect(option).not.toHaveAttribute("aria-describedby")
    else if (reference === "")
      await expect(option).toHaveAttribute("aria-describedby", "")
    else await expect(option).toHaveAttribute("aria-describedby", /.+/)

    const supporting = list
      .locator('[data-slot="editor-inline-combobox-option-row"]')
      .filter({ has: page.getByRole("option", { name, exact: true }) })
      .locator('[data-slot="editor-inline-combobox-description"]')

    await expect(supporting).toBeVisible()
    await expect(supporting).not.toHaveAttribute("aria-hidden", "true")
    expect((await supporting.innerText()).trim().length).toBeGreaterThan(0)
    const point = await pointAt(supporting)
    expect(
      await option.evaluate(
        (element, point) =>
          element.contains(document.elementFromPoint(point.x, point.y)),
        point,
      ),
    ).toBe(true)
  }

  await scanOpenSuggestions(page, testInfo, "render-description-overrides")
  await editor.press("Home")
  await expect(list.getByRole("option").first()).toHaveAttribute(
    "aria-selected",
    "true",
  )
  const quote = list.getByRole("option", { name: "Quote", exact: true })
  await expect(quote).toHaveAttribute("aria-description", "Host description")
  await expect(quote).toHaveAccessibleDescription("Host description")

  const supporting = list
    .locator('[data-slot="editor-inline-combobox-option-row"]')
    .filter({ has: page.getByRole("option", { name: "Quote", exact: true }) })
    .locator('[data-slot="editor-inline-combobox-description"]')

  const point = await pointAt(supporting)
  await page.mouse.move(point.x, point.y)
  await expect(quote).toHaveAttribute("aria-selected", "true")
  await expect(quote).toHaveAttribute("data-highlighted")
  const quoteId = await quote.getAttribute("id")

  if (!quoteId) throw new Error("Quote option needs an ID")
  await expect(editor).toHaveAttribute("aria-activedescendant", quoteId)
  await expect(editor).toBeFocused()
  await testInfo.attach("render-description-option", {
    body: JSON.stringify({ point, accessibility: await quote.ariaSnapshot() }),
    contentType: "application/json",
  })
  await page.mouse.down()
  await expect(editor).toBeFocused()
  await page.mouse.up()
  await expect(editor.locator("blockquote")).toBeVisible()
  await expect(list).toHaveCount(0)
  await expect(editor).toBeFocused()
  await expect(
    preview.getByRole("status", { name: "Option event", exact: true }),
  ).toHaveText("quote:click:option")
  await editor.pressSequentially("Pointer quote")
  await expect(editor.locator("blockquote")).toHaveText("Pointer quote")

  await editor.fill("/quote")
  await expect(quote).toHaveAccessibleDescription("Host description")
  await editor.press("Enter")
  await expect(editor.locator("blockquote")).toBeVisible()
  await expect(list).toHaveCount(0)
  await expect(editor).not.toHaveAttribute("aria-activedescendant")
  await expect(editor).not.toHaveAttribute("aria-controls")
  await expect(editor).toBeFocused()
  await expect(preview.locator('[contenteditable="true"]')).toHaveCount(1)
  await editor.pressSequentially("Keyboard quote")
  await expect(editor.locator("blockquote")).toHaveText("Keyboard quote")
})

for (const cancellation of ["default", "base-ui"]) {
  test(`consumer ${cancellation} veto prevents pointer choice and highlight through supporting text`, async ({
    page,
  }, testInfo) => {
    await page.goto("/editor/inline-combobox-item")

    const editor = page.getByRole("textbox", {
      name: "EditorInlineComboboxItem preview",
      exact: true,
    })

    await expect(editor).toHaveAttribute("contenteditable", "true")
    await editor.fill("/heading")
    const clickName = cancellation === "default" ? "Heading 4" : "Heading 5"
    const click = page.getByRole("option", { name: clickName, exact: true })
    const clickPoint = await pointAt(await descriptionFor(page, click))
    await page.mouse.click(clickPoint.x, clickPoint.y)
    await expect(editor).toHaveText("/heading")
    await expect(click).toBeVisible()
    await expect(editor).toBeFocused()

    const first = page.getByRole("option", {
      name: "Heading 1 command",
      exact: true,
    })

    await editor.press("Home")
    const active = await first.getAttribute("id")

    const hover = page.getByRole("option", {
      name: cancellation === "default" ? "Heading 6" : "Heading 3 custom",
      exact: true,
    })

    const hoverText =
      cancellation === "default" ? await descriptionFor(page, hover) : hover

    const hoverPoint = await pointAt(hoverText)
    await page.mouse.move(hoverPoint.x, hoverPoint.y)
    await expect(editor).toHaveAttribute("aria-activedescendant", active ?? "")
    await expect(hover).toHaveAttribute("aria-selected", "false")
    await editor.press("Escape")
    await expect(
      page.getByRole("listbox", { name: "Suggestions", exact: true }),
    ).toHaveCount(0)
    await expect(editor).toBeFocused()
    await expect(editor).toHaveText("/heading")
    await testInfo.attach(`${cancellation}-veto-result`, {
      body: JSON.stringify({
        clickPoint,
        hoverPoint,
        text: await editor.innerText(),
      }),
      contentType: "application/json",
    })
  })
}

test("composition closes described suggestions without a second editing surface", async ({
  page,
}, testInfo) => {
  await page.goto("/editor/typeahead")
  const preview = page.locator('[data-slot="editor-part-preview"]')

  const editor = preview.getByRole("textbox", {
    name: "EditorTypeahead preview",
    exact: true,
  })

  await expect(editor).toHaveAttribute("contenteditable", "true")
  await editor.fill("/heading")
  await expect(
    page.getByRole("option", { name: "Heading 2", exact: true }),
  ).toBeVisible()
  await editor.dispatchEvent("compositionstart", { data: "" })
  await expect(
    page.getByRole("listbox", { name: "Editor suggestions", exact: true }),
  ).toHaveCount(0)
  await expect(editor).not.toHaveAttribute("aria-activedescendant")
  await expect(editor).toBeFocused()
  await expect(preview.locator('[contenteditable="true"]')).toHaveCount(1)
  await editor.dispatchEvent("compositionend", { data: "" })
  await editor.press("Escape")
  await expect(editor).toHaveText("/heading")
  await testInfo.attach("composition-suspension", {
    body: await editor.ariaSnapshot(),
    contentType: "text/plain",
  })
})
