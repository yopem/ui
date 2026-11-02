import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

for (const [slug, name] of [
  ["combobox", "Select equipment"],
  ["autocomplete", "Search items"],
]) {
  test(`${slug} keeps portalled suggestions inside the host landmark`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width: 390, height: 640 })
    await page.goto(`/components/${slug}`)
    await expect(
      page.getByRole("button", { name: /^Copy .* source$/ }).first(),
    ).toBeEnabled()
    const input = page.getByRole("combobox", { name, exact: true })
    await input.fill("Com")
    await input.press("ArrowDown")
    await expect(page.getByRole("main").getByRole("listbox")).toBeVisible()
    const option = page.getByRole("option", { name: "Compass", exact: true })
    await expect(option).toBeInViewport()
    await expect
      .poll(() =>
        option.evaluate((element) => {
          const bounds = element.getBoundingClientRect()

          return element.contains(
            document.elementFromPoint(
              bounds.x + bounds.width / 2,
              bounds.y + bounds.height / 2,
            ),
          )
        }),
      )
      .toBe(true)

    const report = await new AxeBuilder({ page })
      .options({ resultTypes: ["violations", "incomplete"] })
      .analyze()

    await testInfo.attach("portalled-suggestions-axe.json", {
      body: JSON.stringify(report),
      contentType: "application/json",
    })
    await testInfo.attach("portalled-suggestions.png", {
      body: await page.screenshot({ scale: "css" }),
      contentType: "image/png",
    })
    expect(report.violations).toEqual([])
  })
}

test("standalone ScrollArea keeps native keyboard scrolling", async ({
  page,
}, testInfo) => {
  await page.goto("/components/scroll-area")
  const preview = page.getByRole("group", { name: / live preview$/ }).first()

  const viewport = preview.getByRole("group", {
    name: "Scrollable content",
    exact: true,
  })

  await expect(viewport).toHaveAttribute("data-has-overflow-y", "")
  await expect(viewport).toHaveAttribute("tabindex", "0")
  await viewport.focus()
  await page.keyboard.press("Shift+Tab")
  await page.keyboard.press("Tab")
  await expect(viewport).toBeFocused()
  const before = await viewport.evaluate((element) => element.scrollTop)
  await page.keyboard.press("ArrowDown")
  await expect
    .poll(() => viewport.evaluate((element) => element.scrollTop))
    .toBeGreaterThan(before)
  await testInfo.attach("standalone-scroll-area.json", {
    body: JSON.stringify({
      before,
      after: await viewport.evaluate((element) => element.scrollTop),
      aria: await preview.ariaSnapshot(),
    }),
    contentType: "application/json",
  })
})

test("Autocomplete suggestions do not add a viewport Tab stop", async ({
  page,
}, testInfo) => {
  await page.goto("/components/autocomplete")

  const input = page.getByRole("combobox", {
    name: "Search items",
    exact: true,
  })

  await input.click()
  await input.press("ArrowDown")
  const options = page.getByRole("listbox")
  await expect(options).toBeVisible()

  const viewport = page
    .locator('[data-slot="scroll-area-viewport"]')
    .filter({ has: options })

  await expect(viewport).toHaveAttribute("tabindex", "-1")
  await input.press("Tab")
  await expect(
    page.getByRole("button", { name: /^Copy .* source$/ }).first(),
  ).toBeFocused()
  await expect(page.getByRole("listbox", { includeHidden: true })).toHaveCount(
    0,
  )
  await testInfo.attach("autocomplete-tab-order.txt", {
    body: await page
      .getByRole("group", { name: / live preview$/ })
      .first()
      .ariaSnapshot(),
    contentType: "text/plain",
  })
})

test("Combobox suggestions scroll without adding a viewport Tab stop", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 320 })
  await page.goto("/editor/labels-select")
  await expect(
    page.getByRole("textbox", { name: "Label document", exact: true }),
  ).toHaveAttribute("data-lexical-editor", "true")

  const input = page.getByRole("combobox", {
    name: "Choose labels",
    exact: true,
  })

  await input.click()
  await input.press("ArrowDown")
  const options = page.getByRole("listbox")
  await expect(options).toBeVisible()

  const viewport = page
    .locator('[data-slot="scroll-area-viewport"]')
    .filter({ has: options })

  await expect(viewport).toHaveAttribute("tabindex", "-1")
  await expect(viewport).toHaveAttribute("data-has-overflow-y", "")
  await expect
    .poll(() =>
      viewport.evaluate(
        (element) => element.scrollHeight > element.clientHeight,
      ),
    )
    .toBe(true)
  const before = await viewport.evaluate((element) => element.scrollTop)
  await viewport.hover()
  await page.mouse.wheel(0, 240)
  await expect
    .poll(() => viewport.evaluate((element) => element.scrollTop))
    .toBeGreaterThan(before)
  const after = await viewport.evaluate((element) => element.scrollTop)
  await expect(input).toBeFocused()
  await input.press("Tab")
  await expect(
    page.getByRole("button", { name: "Submit labels", exact: true }),
  ).toBeFocused()
  await expect(page.getByRole("listbox", { includeHidden: true })).toHaveCount(
    0,
  )
  await testInfo.attach("composite-scroll-area.json", {
    body: JSON.stringify({
      before,
      after,
      inputExpanded: await input.getAttribute("aria-expanded"),
      submitFocused: await page
        .getByRole("button", { name: "Submit labels", exact: true })
        .evaluate((element) => element === element.ownerDocument.activeElement),
    }),
    contentType: "application/json",
  })
})
