import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

const cases = [
  "alert-dialog",
  "dialog",
  "drawer",
  "menu",
  "popover",
  "preview-card",
  "select",
  "sheet",
  "tooltip",
] as const

for (const component of cases) {
  test(`@a11y ${component} open state has no detectable accessibility violations`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" })
    await page.goto(`/components/${component}`)
    await expect(
      page.getByRole("button", { name: /^Copy .* usage$/ }).first(),
    ).toBeEnabled()

    if (component === "alert-dialog")
      await page.getByRole("button", { name: "Delete field note" }).click()
    else if (component === "dialog")
      await page.getByRole("button", { name: "Open Dialog" }).click()
    else if (component === "drawer")
      await page.getByRole("button", { name: "Open drawer" }).click()
    else if (component === "menu")
      await page.getByRole("button", { name: "Open menu" }).click()
    else if (component === "popover")
      await page.getByRole("button", { name: "Open Popover" }).click()
    else if (component === "preview-card")
      await page
        .getByRole("button", { name: "Willow Creek field notes" })
        .focus()
    else if (component === "select")
      await page.getByRole("combobox", { name: "Select equipment" }).click()
    else if (component === "sheet")
      await page.getByRole("button", { name: "Open Sheet" }).click()
    else await page.getByRole("button", { name: "Hover me" }).hover()

    await expect(
      page
        .locator(
          `[data-slot="${component === "preview-card" ? "preview-card-content" : `${component}-popup`}"]`,
        )
        .last(),
    ).toBeVisible()

    const result = await new AxeBuilder({ page })
      .exclude("pre.shiki")
      .disableRules([
        "aria-hidden-focus",
        "region",
        "scrollable-region-focusable",
      ])
      .analyze()

    expect(
      result.violations.map(({ help, id, nodes }) => ({
        help,
        id,
        targets: nodes.flatMap((node) => node.target),
      })),
    ).toEqual([])
  })
}

test("sheet close button stays above the content in the frame corner", async ({
  page,
}) => {
  await page.goto("/components/sheet")
  await expect(
    page.getByRole("button", { name: /^Copy .* usage$/ }).first(),
  ).toBeEnabled()
  await page.getByRole("button", { name: "Open Sheet" }).click()

  const popup = page.locator('[data-slot="sheet-popup"]')
  const title = popup.locator('[data-slot="sheet-title"]')
  const close = popup.getByRole("button", { name: "Close" })
  await expect(close).toBeVisible()
  await expect(close).toBeEnabled()

  const popupBox = await popup.boundingBox()
  const titleBox = await title.boundingBox()
  const closeBox = await close.boundingBox()
  expect(popupBox).not.toBeNull()
  expect(titleBox).not.toBeNull()
  expect(closeBox).not.toBeNull()

  if (popupBox && titleBox && closeBox) {
    const popupEnd = popupBox.x + popupBox.width
    const closeEnd = closeBox.x + closeBox.width

    expect(closeEnd).toBeGreaterThan(popupEnd - closeBox.width)
    expect(closeEnd).toBeLessThanOrEqual(popupEnd)
    expect(closeBox.x).toBeGreaterThanOrEqual(popupBox.x)
    expect(closeBox.y).toBeGreaterThanOrEqual(popupBox.y)
    expect(closeBox.y + closeBox.height).toBeLessThanOrEqual(titleBox.y)
    expect(titleBox.x).toBeGreaterThanOrEqual(popupBox.x)
    expect(titleBox.x + titleBox.width).toBeLessThanOrEqual(popupEnd)
  }

  await close.click()
  await expect(popup).not.toBeVisible()
})

test("@a11y context menu keyboard alternative opens an accessible menu", async ({
  page,
}) => {
  await page.goto("/components/context-menu")
  await expect(
    page.getByRole("button", { name: "Copy Context Menu usage" }),
  ).toBeEnabled()
  const trigger = page.getByText("Right-click a field note", { exact: true })
  await trigger.focus()
  await page.keyboard.press("Shift+F10")
  await expect(page.getByRole("menuitem", { name: "Open note" })).toBeVisible()

  const result = await new AxeBuilder({ page })
    .exclude("pre.shiki")
    .disableRules(["aria-hidden-focus", "region"])
    .analyze()

  expect(result.violations).toEqual([])
})
