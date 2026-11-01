import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"
import { bundleToolbarPressedFixture } from "@workspace/tests/fixtures/toolbar-pressed-bundle"

test("toolbar preview copies consumer source", async ({ context, page }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"])
  await page.goto("/components/toolbar")
  await page
    .getByRole("button", { name: "Copy Formatting controls source" })
    .click()
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toContain('from "@/components/ui/toolbar"')
  const source = await page.evaluate(() => navigator.clipboard.readText())
  expect(source).not.toContain("@/catalog/")
  expect(source).not.toContain("@registry/")
  expect(source).not.toContain("import.meta.env")
})

for (const theme of ["light", "dark"] as const) {
  test(`editor formatting keeps its pressed appearance in ${theme} theme @a11y`, async ({
    page,
  }, testInfo) => {
    await page.addInitScript(
      (value) => localStorage.setItem("yopem-ui-theme", value),
      theme,
    )
    await page.goto("/components/editor")
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme)

    const editor = page.getByRole("textbox", {
      name: "Rich text editor",
      exact: true,
    })

    const toolbar = page.getByRole("toolbar", {
      name: "Rich text editor formatting",
      exact: true,
    })

    const bold = toolbar.getByRole("button", { name: "Bold", exact: true })
    await expect(editor).toHaveAttribute("contenteditable", "true")
    await editor.fill("Selected text")
    await editor.press("ControlOrMeta+a")
    await expect(bold).toHaveAttribute("aria-pressed", "false")
    await page.mouse.move(0, 0)

    const defaultColor = await bold.evaluate(
      (element) => getComputedStyle(element).backgroundColor,
    )

    await bold.click()
    await page.mouse.move(0, 0)
    await expect(bold).toHaveAttribute("aria-pressed", "true")
    await expect(editor.locator("strong, b")).toHaveText("Selected text")
    await expect
      .poll(() =>
        bold.evaluate((element) => getComputedStyle(element).backgroundColor),
      )
      .not.toBe(defaultColor)
    await bold.click()
    await page.mouse.move(0, 0)
    await expect(bold).toHaveAttribute("aria-pressed", "false")
    await expect
      .poll(() =>
        bold.evaluate((element) => getComputedStyle(element).backgroundColor),
      )
      .toBe(defaultColor)

    const report = await new AxeBuilder({ page })
      .options({ resultTypes: ["violations", "incomplete"] })
      .analyze()

    await testInfo.attach(`editor-toolbar-${theme}-axe.json`, {
      body: JSON.stringify(report),
      contentType: "application/json",
    })
    expect(report.violations).toEqual([])
    await testInfo.attach(`editor-toolbar-${theme}.png`, {
      body: await page.screenshot({ scale: "css" }),
      contentType: "image/png",
    })
  })

  test(`final pressed attributes control ghost appearance in ${theme} theme @a11y`, async ({
    page,
  }, testInfo) => {
    test.setTimeout(120_000)
    const { script, css } = await bundleToolbarPressedFixture()
    const origin = "https://toolbar-pressed.invalid"
    await page.route("**/*", (route) => {
      const url = route.request().url()

      if (url === `${origin}/`)
        return route.fulfill({
          contentType: "text/html",
          body: `<!doctype html><html lang="en" data-theme="${theme}"><head><title>Pressed state fixture</title><link rel="stylesheet" href="/fixture.css"></head><body><main id="root"></main><script type="module" src="/fixture.js"></script></body></html>`,
        })

      if (url === `${origin}/fixture.js`)
        return route.fulfill({ contentType: "text/javascript", body: script })

      if (url === `${origin}/fixture.css`)
        return route.fulfill({ contentType: "text/css", body: css })

      return route.abort()
    })
    await page.goto(`${origin}/`)
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme)

    const fixture = page.getByRole("region", { name: "Pressed state fixture" })

    const control = (name: string) =>
      fixture.getByRole("button", { name, exact: true })

    await page.mouse.move(0, 0)

    const off = control("Boolean false")
    const on = control("Boolean true")

    const offColor = await off.evaluate(
      (element) => getComputedStyle(element).backgroundColor,
    )

    const onColor = await on.evaluate(
      (element) => getComputedStyle(element).backgroundColor,
    )

    expect(onColor).not.toBe(offColor)

    for (const [name, state] of [
      ["Boolean true", "true"],
      ["String true", "true"],
      ["Boolean false", "false"],
      ["String false", "false"],
      ["Mixed", "mixed"],
      ["Render only true", "true"],
      ["Render overrides false", "true"],
      ["Render overrides true", "false"],
      ["Render overrides mixed", "mixed"],
      ["Nested overrides true", "false"],
      ["Callback overrides false", "true"],
      ["Callback overrides true", "false"],
      ["Callback overrides mixed", "mixed"],
      ["Undefined marker", "true"],
      ["Disabled true", "true"],
      ["Standalone true", "true"],
      ["Standalone false", "false"],
      ["Standalone mixed", "mixed"],
    ] as const) {
      const button = control(name)
      await expect(button).toHaveAttribute("aria-pressed", state)
      await expect(button).not.toHaveAttribute("data-pressed", /[\s\S]*/)
      await expect
        .poll(() =>
          button.evaluate(
            (element) => getComputedStyle(element).backgroundColor,
          ),
        )
        .toBe(state === "true" ? onColor : offColor)
    }

    const explicit = control("Explicit marker")
    await expect(explicit).toHaveAttribute("aria-pressed", "false")
    await expect(explicit).toHaveAttribute("data-pressed", "")
    await expect
      .poll(() =>
        explicit.evaluate(
          (element) => getComputedStyle(element).backgroundColor,
        ),
      )
      .toBe(onColor)

    const controlled = control("Controlled")
    await expect(controlled).toHaveAttribute("aria-pressed", "false")
    await controlled.click()
    await page.mouse.move(0, 0)
    await expect(controlled).toHaveAttribute("aria-pressed", "true")
    await expect
      .poll(() =>
        controlled.evaluate(
          (element) => getComputedStyle(element).backgroundColor,
        ),
      )
      .toBe(onColor)
    await expect(controlled).toBeFocused()
    await controlled.press("Space")
    await expect(controlled).toHaveAttribute("aria-pressed", "false")
    await expect
      .poll(() =>
        controlled.evaluate(
          (element) => getComputedStyle(element).backgroundColor,
        ),
      )
      .toBe(offColor)

    const cancelled = control("Cancelled")
    await cancelled.click()
    await cancelled.press("Enter")
    await expect(cancelled).toHaveAttribute("aria-pressed", "false")
    await expect(controlled).toHaveAttribute("aria-pressed", "false")
    await expect(controlled).not.toHaveAttribute("data-pressed", /[\s\S]*/)
    await expect(control("Disabled true")).toBeDisabled()
    await expect(fixture.getByRole("status")).toHaveText("2")

    const report = await new AxeBuilder({ page })
      .include('[aria-label="Pressed state fixture"]')
      .options({ resultTypes: ["violations", "incomplete"] })
      .analyze()

    await testInfo.attach(`pressed-fixture-${theme}-axe.json`, {
      body: JSON.stringify(report),
      contentType: "application/json",
    })
    expect(report.violations).toEqual([])
    await testInfo.attach(`pressed-fixture-${theme}.png`, {
      body: await fixture.screenshot({ scale: "css" }),
      contentType: "image/png",
    })
  })

  test(`toolbar retains native toggle state and keyboard behavior in ${theme} theme @a11y`, async ({
    page,
  }, testInfo) => {
    await page.addInitScript(
      (value) => localStorage.setItem("yopem-ui-theme", value),
      theme,
    )
    await page.goto("/components/toolbar")
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme)

    const preview = page.locator('[aria-label$="live preview"]')
    const toolbar = preview.getByRole("toolbar").first()

    const buttons = toolbar
      .locator('[data-slot="toggle-group"]')
      .getByRole("button")

    await expect(buttons).toHaveCount(3)

    const left = buttons.nth(0)
    const center = buttons.nth(1)
    const pointerAction = testInfo.project.use.hasTouch ? "tap" : "click"
    await expect(left).toHaveAttribute("aria-pressed", "true")
    await expect(left).toHaveAttribute("data-pressed", "")
    await expect(center).toHaveAttribute("aria-pressed", "false")
    await center[pointerAction]()
    await expect(center).toHaveAttribute("aria-pressed", "true")
    await expect(center).toHaveAttribute("data-pressed", "")
    await expect(left).toHaveAttribute("aria-pressed", "false")
    await expect(left).not.toHaveAttribute("data-pressed", /[\s\S]*/)
    await center.press("ArrowLeft")
    await expect(left).toBeFocused()
    await left.press("Space")
    await expect(left).toHaveAttribute("aria-pressed", "true")
    await expect(left).toHaveAttribute("data-pressed", "")
    await expect(center).toHaveAttribute("aria-pressed", "false")
    await expect(center).not.toHaveAttribute("data-pressed", /[\s\S]*/)

    const report = await new AxeBuilder({ page })
      .options({ resultTypes: ["violations", "incomplete"] })
      .analyze()

    await testInfo.attach(`native-toggle-toolbar-${theme}.json`, {
      body: JSON.stringify(report),
      contentType: "application/json",
    })
    expect(report.violations).toEqual([])
    await toolbar.scrollIntoViewIfNeeded()
    await testInfo.attach(`native-toggle-toolbar-${theme}.png`, {
      body: await page.screenshot({ scale: "css" }),
      contentType: "image/png",
    })
  })
}
