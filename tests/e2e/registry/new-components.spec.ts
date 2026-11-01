import type { Page, TestInfo } from "@playwright/test"

import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

test("@a11y rating supports keyboard selection and announces selected value", async ({
  page,
}) => {
  await page.goto("/components/rating", { waitUntil: "domcontentloaded" })
  await expect(
    page.getByRole("button", { name: "Copy Rating usage", exact: true }),
  ).toBeEnabled()

  const rating = page.getByRole("radiogroup", { name: "Rate this component" })
  await expect(rating.getByRole("radio", { name: "3 stars" })).toBeChecked()
  await rating.getByRole("radio", { name: "3 stars" }).click()
  await page.keyboard.press("ArrowRight")
  await expect(rating.getByRole("radio", { name: "4 stars" })).toBeChecked()

  const disabledRating = page.getByRole("radiogroup", {
    name: "Disabled rating",
  })

  await expect(
    disabledRating.getByRole("radio", { name: "2 stars" }),
  ).toBeDisabled()
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
})

test("@a11y native select keeps aligned fields and keyboard behavior", async ({
  page,
}, testInfo) => {
  await page.goto("/components/native-select", {
    waitUntil: "domcontentloaded",
  })
  await expect(
    page.getByRole("button", { name: "Copy Native Select usage", exact: true }),
  ).toBeEnabled()

  const select = page.getByRole("combobox", { name: "Theme", exact: true })
  await expect(select).toHaveValue("system")
  await select.click()
  await page.keyboard.press("Escape")
  await select.focus()
  await page.keyboard.press("End")
  await expect(select).toHaveValue("dark")
  const disabledSelect = page.getByRole("combobox", { name: "Disabled theme" })
  await expect(disabledSelect).toBeDisabled()

  const selectBox = await select.boundingBox()
  const disabledBox = await disabledSelect.boundingBox()
  expect(selectBox).not.toBeNull()
  expect(disabledBox).not.toBeNull()
  expect(selectBox?.x).toBe(disabledBox?.x)
  expect(selectBox?.width).toBe(disabledBox?.width)

  for (const name of ["Theme", "Disabled theme"]) {
    const label = page.getByText(name, { exact: true })
    const control = page.getByRole("combobox", { name, exact: true })
    const labelBox = await label.boundingBox()
    const controlBox = await control.boundingBox()
    expect(labelBox).not.toBeNull()
    expect(controlBox).not.toBeNull()

    if (labelBox && controlBox) {
      expect(labelBox.y + labelBox.height).toBeLessThan(controlBox.y)
      expect(labelBox.x).toBe(controlBox.x)
    }
  }

  const icon = page.locator('[data-slot="native-select-icon"]').first()
  await expect(icon).toBeVisible()
  await expect(icon).toHaveAttribute("aria-hidden", "true")
  const chevronBox = await icon.locator("path").boundingBox()

  const textInset = await select.evaluate((element) => {
    const style = getComputedStyle(element)

    return (
      Number.parseFloat(style.paddingInlineStart) +
      Number.parseFloat(style.borderInlineStartWidth)
    )
  })

  expect(chevronBox).not.toBeNull()

  if (selectBox && chevronBox) {
    const arrowInset =
      selectBox.x + selectBox.width - chevronBox.x - chevronBox.width

    expect(Math.abs(arrowInset - textInset)).toBeLessThanOrEqual(2)
  }

  await select.scrollIntoViewIfNeeded()
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
  await page.screenshot({
    path: testInfo.outputPath("native-select.png"),
    scale: "css",
  })

  await select
    .locator("..")
    .evaluate((element) => element.setAttribute("dir", "rtl"))
  const rtlSelectBox = await select.boundingBox()
  const rtlIconBox = await icon.boundingBox()
  expect(rtlSelectBox).not.toBeNull()
  expect(rtlIconBox).not.toBeNull()

  if (rtlSelectBox && rtlIconBox) {
    expect(rtlIconBox.x).toBeLessThan(rtlSelectBox.x + rtlSelectBox.width / 2)
  }

  await page.screenshot({
    path: testInfo.outputPath("native-select-rtl.png"),
    scale: "css",
  })
})

test("marquee can be paused and resumed", async ({ page }) => {
  await page.goto("/components/marquee", { waitUntil: "domcontentloaded" })
  await expect(
    page.getByRole("button", { name: "Copy Marquee usage", exact: true }),
  ).toBeEnabled()
  await page.getByRole("button", { name: "Pause scrolling content" }).click()
  await expect(page.locator('[data-slot="marquee-track"]')).toHaveAttribute(
    "data-paused",
    "",
  )
  await page.getByRole("button", { name: "Resume scrolling content" }).click()
  await expect(page.locator('[data-slot="marquee-track"]')).not.toHaveAttribute(
    "data-paused",
    "",
  )
})

test("highlight marks matching text without losing surrounding words", async ({
  page,
}) => {
  await page.goto("/components/highlight")
  const highlight = page.locator('[data-slot="highlight"]')
  await expect(highlight.locator("mark")).toHaveText("heron")
  await expect(highlight).toContainText(/.+heron.+/)
})

test("prose constrains long-form content", async ({ page }) => {
  await page.goto("/components/prose")
  const prose = page.locator('[data-slot="prose"]')
  await expect(prose).toBeVisible()
  await expect
    .poll(() =>
      prose.evaluate((element) =>
        Number.parseFloat(getComputedStyle(element).maxWidth),
      ),
    )
    .toBeLessThanOrEqual(700)
})

test("@a11y steps expose active item as current step", async ({ page }) => {
  await page.goto("/components/steps")
  await expect(
    page.locator('[data-slot="steps-item"]').filter({ hasText: "Plan visit" }),
  ).toHaveAttribute("aria-current", "step")
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
})

async function checkClipboardAccessibility(
  page: Page,
  testInfo: TestInfo,
  state: string,
) {
  const report = await new AxeBuilder({ page })
    .options({ rules: { "label-content-name-mismatch": { enabled: true } } })
    .analyze()

  await testInfo.attach(`clipboard-${state}-axe.json`, {
    body: JSON.stringify(report, null, 2),
    contentType: "application/json",
  })
  await testInfo.attach(`clipboard-${state}.png`, {
    body: await page.screenshot({ fullPage: true, scale: "css" }),
    contentType: "image/png",
  })
  expect(report.violations).toEqual([])
}

async function openClipboardPreview(page: Page) {
  await page.goto("/components/clipboard", { waitUntil: "domcontentloaded" })
  await expect(
    page.getByRole("button", { name: "Copy Clipboard usage", exact: true }),
  ).toBeEnabled({ timeout: 20_000 })
}

test("@a11y clipboard keeps command labels and copies native text", async ({
  page,
  context,
}, testInfo) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"])
  await openClipboardPreview(page)
  await checkClipboardAccessibility(page, testInfo, "idle")

  for (const [name, label, value] of [
    ["Copy link", "Copy link", "https://example.com/field-notes"],
    ["Copy to clipboard", "Copy", "Default clipboard text"],
    ["Copy source", "Copy", 'const message = "Clipboard example"'],
    ["Copy icon example", "", "Icon clipboard text"],
    ["Copy to clipboard", "", "Default icon clipboard text"],
  ] as const) {
    const button = page
      .getByRole("button", { name, exact: true })
      .filter({ hasText: label === "" ? /^$/ : label })
      .and(page.locator('button:not([id^="clipboard-"])'))

    await expect(button).toHaveText(label)
    await expect(button).toHaveAccessibleName(name)
    await expect(button).toHaveAttribute("type", "button")
    const status = button.locator("+ output")
    await expect(status).toHaveAttribute("aria-live", "polite")
    await expect(status).toHaveAttribute("aria-atomic", "true")

    if (value === "Default icon clipboard text") {
      await expect(button).toHaveAttribute("title", "")
      await expect(button).toHaveAttribute("aria-label", "Copy to clipboard")
    }

    if (await page.evaluate(() => matchMedia("(pointer: coarse)").matches)) {
      const bounds = await button.boundingBox()
      expect(bounds).not.toBeNull()
      expect(bounds?.width).toBeGreaterThanOrEqual(44)
      expect(bounds?.height).toBeGreaterThanOrEqual(44)
    }

    await expect(button.locator('[data-slot="clipboard-icon"]')).toBeVisible()
    await expect(
      button.locator('[data-slot="clipboard-icon"]'),
    ).toHaveAttribute("aria-hidden", "true")
    await button.focus()
    await button.press("Enter")
    await expect(button.locator("+ output")).toHaveText("Copied to clipboard")
    await expect(button).toHaveText(label)
    await expect(button).toHaveAccessibleName(name)
    await expect(button).toBeFocused()
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
      value,
    )
    await testInfo.attach(`${name}-${label || "icon"}-clipboard.txt`, {
      body: await page.evaluate(() => navigator.clipboard.readText()),
      contentType: "text/plain",
    })
  }

  await checkClipboardAccessibility(page, testInfo, "success")
})

test("@a11y clipboard keeps its command during a pending native write", async ({
  page,
  context,
}, testInfo) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"])
  await openClipboardPreview(page)
  await page.evaluate(() => {
    const writeText = navigator.clipboard.writeText.bind(navigator.clipboard)
    Object.defineProperty(navigator.clipboard, "writeText", {
      configurable: true,
      value: async (value: string) => {
        await new Promise<void>((resolve) => {
          window.addEventListener("release-clipboard-write", () => resolve(), {
            once: true,
          })
        })
        await writeText(value)
      },
    })
  })
  const button = page.getByRole("button", { name: "Copy source", exact: true })
  await button.click()
  await expect(button.locator("+ output")).toHaveText("Copying to clipboard")
  await expect(button).toHaveText("Copy")
  await expect(button).toHaveAccessibleName("Copy source")
  await checkClipboardAccessibility(page, testInfo, "pending")
  await page.evaluate(() =>
    window.dispatchEvent(new Event("release-clipboard-write")),
  )
  await expect(button.locator("+ output")).toHaveText("Copied to clipboard")
  await expect(button).toHaveText("Copy")
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    'const message = "Clipboard example"',
  )
})

for (const failure of ["denied", "unavailable"] as const) {
  test(`@a11y clipboard reports ${failure} writes without changing its command`, async ({
    page,
    context,
  }, testInfo) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"])
    await openClipboardPreview(page)
    await page.evaluate(() =>
      navigator.clipboard.writeText("Clipboard sentinel"),
    )
    await page.evaluate((kind) => {
      if (kind === "unavailable") {
        Object.defineProperty(navigator, "clipboard", {
          configurable: true,
          value: undefined,
        })
      } else {
        Object.defineProperty(navigator.clipboard, "writeText", {
          configurable: true,
          value: () =>
            Promise.reject(new DOMException("Denied", "NotAllowedError")),
        })
      }
    }, failure)
    const button = page.getByRole("button", { name: "Copy link", exact: true })
    await button.click()
    const status = button.locator("+ output")
    await expect(status).toHaveText("Could not copy to clipboard")
    await expect(status).toBeVisible()
    await expect(status).toHaveCSS("clip-path", "none")
    await expect(status.locator("xpath=ancestor::button")).toHaveCount(0)
    await expect(status).toHaveAttribute("aria-live", "polite")
    await expect(button).toHaveText("Copy link")
    await expect(button).toHaveAccessibleName("Copy link")
    await checkClipboardAccessibility(page, testInfo, failure)

    if (failure === "unavailable") {
      await page.evaluate(() => Reflect.deleteProperty(navigator, "clipboard"))
    } else {
      await page.evaluate(() =>
        Reflect.deleteProperty(navigator.clipboard, "writeText"),
      )
    }

    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
      "Clipboard sentinel",
    )
    await button.click()
    await expect(button.locator("+ output")).toHaveText("Copied to clipboard")
    await expect(button).toHaveText("Copy link")
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
      "https://example.com/field-notes",
    )
  })
}

test("@a11y clipboard names empty children without changing their text", async ({
  page,
  context,
}, testInfo) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"])
  await openClipboardPreview(page)

  for (const [id, text] of [
    ["clipboard-false", ""],
    ["clipboard-whitespace", "   "],
    ["clipboard-fragment", ""],
    ["clipboard-nested-fragment", "  "],
  ] as const) {
    const button = page.locator(`#${id}`)
    await expect(button).toHaveAttribute("title", "")
    await expect.poll(() => button.textContent()).toBe(text)
    await expect(button).toHaveAccessibleName("Copy to clipboard")
    await button.focus()
    await button.press("Enter")
    await expect(button.locator("+ output")).toHaveText("Copied to clipboard")
    await expect.poll(() => button.textContent()).toBe(text)
    await expect(button).toHaveAccessibleName("Copy to clipboard")
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(id)
  }

  await checkClipboardAccessibility(page, testInfo, "empty-children")
})

test("clipboard keeps visible text in native names and respects explicit labels", async ({
  page,
}) => {
  await openClipboardPreview(page)

  for (const [id, text, name] of [
    ["clipboard-fragment-text", "Copy report", "Copy report"],
    ["clipboard-custom-text", "Copy custom", "Copy custom"],
    ["clipboard-custom-empty", "", "Copy custom empty"],
    ["clipboard-other-label", "Duplicate", "Duplicate"],
  ] as const) {
    const button = page.locator(`#${id}`)
    await expect(button).toHaveText(text)
    await expect(button).toHaveAccessibleName(name)
  }

  await expect(page.locator("#clipboard-fragment-text")).not.toHaveAttribute(
    "aria-label",
    /.+/,
  )
  await expect(page.locator("#clipboard-custom-text")).not.toHaveAttribute(
    "aria-label",
    /.+/,
  )
  await expect(page.locator("#clipboard-custom-empty")).toHaveAttribute(
    "aria-label",
    "Copy custom empty",
  )
  await expect(page.locator("#clipboard-other-label")).toHaveAttribute(
    "aria-label",
    "Duplicate",
  )
})

test("clipboard preserves a consumer aria-labelledby name", async ({
  page,
}) => {
  await openClipboardPreview(page)

  const button = page
    .getByRole("button", { name: "Cancel copy", exact: true })
    .filter({ hasText: /^$/ })

  await expect(button).toHaveAccessibleName("Cancel copy")
  await expect(button).not.toHaveAttribute("aria-label", /.+/)
  await expect(button).toHaveAttribute("title", "")
})

test("clipboard usage copy keeps the visible disabled label", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"])
  await openClipboardPreview(page)
  await page
    .getByRole("button", { name: "Copy Clipboard usage", exact: true })
    .click()

  const usage = await page.evaluate(() => navigator.clipboard.readText())

  const disabled = usage.match(
    /<Clipboard\b([^>]*\bdisabled\b[^>]*)>([\s\S]*?)<\/Clipboard>/,
  )

  expect(disabled).not.toBeNull()

  const visibleLabel = disabled?.[2].trim()
  const ariaLabel = disabled?.[1].match(/aria-label="([^"]*)"/)?.[1]

  expect(visibleLabel).toBeTruthy()

  if (ariaLabel) expect(ariaLabel).toContain(visibleLabel)
})

test("@a11y clipboard preserves consumer cancellation and native disabled state", async ({
  page,
  context,
}, testInfo) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"])
  await openClipboardPreview(page)
  await page.evaluate(() => navigator.clipboard.writeText("Clipboard sentinel"))

  const cancelled = page
    .getByRole("button", { name: "Cancel copy", exact: true })
    .filter({ hasText: "Cancel copy" })

  await cancelled.click()
  await expect(cancelled.locator("+ output")).toHaveText("")
  await cancelled.focus()
  await cancelled.press("Space")
  await expect(cancelled.locator("+ output")).toHaveText("")
  await expect(cancelled).toHaveText("Cancel copy")
  await expect(cancelled).toHaveAccessibleName("Cancel copy")
  await expect(cancelled).toBeFocused()

  const disabled = page.getByRole("button", {
    name: "Disabled copy",
    exact: true,
  })

  await expect(disabled).toBeDisabled()
  await expect(disabled).toHaveText("Disabled copy")
  await cancelled.press("Tab")
  await expect(disabled).not.toBeFocused()
  await expect(disabled.locator("+ output")).toHaveText("")
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    "Clipboard sentinel",
  )
  await checkClipboardAccessibility(page, testInfo, "cancelled")
})

test("codeblock preserves source, copy and keyboard access", async ({
  page,
  context,
}, info) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"])
  await page.goto("/components/codeblock", { waitUntil: "domcontentloaded" })
  await expect(
    page.getByRole("button", { name: "Copy Codeblock usage", exact: true }),
  ).toBeEnabled()

  const source =
    'const station = { name: "Willow Creek", region: "North Ridge", equipment: ["weather sensor", "field camera", "water sampler"] }'

  await expect(page.locator('[data-slot="codeblock-code"]')).toHaveText(source)
  await page.getByRole("button", { name: "Copy code", exact: true }).click()
  await expect(page.locator('[data-slot="codeblock-status"]')).toBeVisible()
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(source)
  await page
    .getByRole("button", { name: "Copy code", exact: true })
    .press("Tab")
  const viewport = page.getByRole("group", { name: "Code", exact: true })

  const preview = page.getByRole("group", {
    name: "Formatted source code with copy action live preview",
    exact: true,
  })

  await expect(viewport).toBeFocused()

  for (const width of [1440, 768, 390]) {
    await page.setViewportSize({ width, height: 900 })
    await expect
      .poll(() =>
        viewport.evaluate(
          (element) => element.scrollWidth > element.clientWidth,
        ),
      )
      .toBe(true)

    const before = await viewport.evaluate((element) =>
      Math.abs(element.scrollLeft),
    )

    await expect
      .poll(() =>
        preview.evaluate(
          (element) => element.scrollWidth <= element.clientWidth + 1,
        ),
      )
      .toBe(true)
    await page.keyboard.press("ArrowRight")
    await expect
      .poll(() => viewport.evaluate((element) => Math.abs(element.scrollLeft)))
      .toBeGreaterThan(before)
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth + 1,
      ),
    ).toBe(true)
    await info.attach(`codeblock-keyboard-${width}.png`, {
      body: await page
        .locator('[data-slot="codeblock"]')
        .screenshot({ scale: "css" }),
      contentType: "image/png",
    })
  }
})
