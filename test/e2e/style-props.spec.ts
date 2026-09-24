import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

const previewPath = "/components/style-props"

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" })
})

test("style props preview and source appear in component docs", async ({
  page,
}) => {
  await page.goto(previewPath)
  await expect(
    page.getByRole("button", { name: "Numeric padding" }),
  ).toBeVisible()
  await expect(
    page.getByRole("button", { name: /Copy .* source/ }).first(),
  ).toBeVisible()
})

test("numeric spacing, raw CSS, logical RTL, and negative space reach real components", async ({
  page,
}) => {
  const errors: string[] = []
  page.on("pageerror", (error) => errors.push(error.message))
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text())
  })
  await page.goto(previewPath)
  const numeric = page.getByRole("button", {
    name: "Numeric padding",
    exact: true,
  })
  await expect(numeric).toHaveCSS("padding-top", "16px")
  await expect(numeric).toHaveCSS("padding-right", "16px")
  await expect(
    page.getByRole("button", { name: "Raw padding", exact: true }),
  ).toHaveCSS("padding-top", "13px")

  for (const direction of ["LTR", "RTL"]) {
    const button = page.getByRole("button", { name: `Logical ${direction}` })
    await expect(button).toHaveCSS("padding-inline-start", "24px")
    await expect(button).toHaveCSS("padding-inline-end", "8px")
    await expect(button).toHaveCSS("margin-inline-start", "-8px")
    await expect(button).toHaveCSS(
      direction === "LTR" ? "padding-left" : "padding-right",
      "24px",
    )
    await expect(button).toHaveCSS(
      direction === "LTR" ? "margin-left" : "margin-right",
      "-8px",
    )
  }
  await expect(page.getByRole("button", { name: "Scaled space" })).toHaveCSS(
    "column-gap",
    "12px",
  )
  const negative = page.getByRole("button", { name: "Negative space" })
  await expect(negative.locator("span").first()).toHaveCSS(
    "margin-inline-start",
    "0px",
  )
  await expect(negative.locator("span").last()).toHaveCSS(
    "margin-inline-start",
    "-8px",
  )

  const leaked = await page
    .locator('[data-slot="button"]')
    .evaluateAll((buttons) =>
      buttons.flatMap((button) =>
        button
          .getAttributeNames()
          .filter((name) =>
            [
              "p",
              "ps",
              "pe",
              "ms",
              "gap",
              "spacex",
              "xstyle",
              "_hover",
              "_focusvisible",
              "_disabled",
            ].includes(name),
          ),
      ),
    )
  expect(leaked).toEqual([])
  const runtimeVariables = await page
    .locator("[data-slot='button']")
    .evaluateAll(
      (buttons) =>
        buttons.filter((button) =>
          button.getAttribute("style")?.includes("--ysp-"),
        ).length,
    )
  expect(runtimeVariables).toBe(0)
  expect(errors).toEqual([])
})

test("responsive arrays, objects, and ranges update at boundaries without reload", async ({
  page,
}) => {
  await page.goto(previewPath)
  const array = page.getByRole("button", { name: "Responsive array" })
  const object = page.getByRole("button", { name: "Responsive object" })
  const range = page.getByRole("button", { name: "Responsive range" })
  for (const width of [479, 480, 767, 768, 1023, 1024, 1279, 1280, 767]) {
    await page.setViewportSize({ width, height: 1000 })
    await expect(array, `array at ${width}px`).toHaveCSS(
      "padding-top",
      width >= 768 ? "24px" : "8px",
    )
    await expect(object, `object at ${width}px`).toHaveCSS(
      "padding-top",
      width >= 1024 ? "24px" : width >= 768 ? "16px" : "8px",
    )
    await expect(range, `range at ${width}px`).toHaveCSS(
      "padding-top",
      width >= 768 && width < 1280 ? "20px" : "8px",
    )
  }
})

test("xstyle overrides style props while native inline precedence and className survive", async ({
  page,
}) => {
  await page.goto(previewPath)
  await expect(
    page.getByRole("button", { name: "Copy Style Props usage" }),
  ).toBeEnabled()
  await expect(
    page.getByRole("button", { name: "Xstyle precedence" }),
  ).toHaveCSS("padding-top", "28px")
  const inline = page.getByRole("button", { name: "Inline precedence" })
  await inline.evaluate((element) => {
    element.style.padding = "7px"
  })
  await expect(inline).toHaveCSS("padding-top", "7px")
  const consumer = page.getByRole("button", { name: "Consumer class" })
  await expect(consumer).toHaveCSS("padding-top", "28px")
  await expect(consumer).toHaveCSS("border-top-width", "5px")
})

test("pseudos respond to pointer and keyboard without breaking disabled semantics", async ({
  page,
  isMobile,
}) => {
  await page.goto(previewPath)
  await expect(
    page.getByRole("button", { name: "Copy Style Props usage" }),
  ).toBeEnabled()
  const interactive = page.getByRole("button", { name: "Interactive styles" })
  const disabled = page.getByRole("button", { name: "Disabled styles" })
  const activations = page
    .getByRole("region", { name: "Style props playground" })
    .getByRole("status")
  await expect(interactive).toHaveCSS("padding-top", "16px")
  if (!isMobile) {
    await interactive.hover()
    await expect(interactive).toHaveCSS("padding-top", "24px")
    await page.mouse.move(0, 0)
    await expect(interactive).toHaveCSS("padding-top", "16px")
  }
  await page.getByRole("button", { name: "Negative space" }).focus()
  await page.keyboard.press("Tab")
  await expect(interactive).toBeFocused()
  await expect(interactive).toHaveCSS("outline-offset", "6px")
  await expect(interactive).toHaveCSS("outline-style", "solid")
  await page.keyboard.press("Enter")
  await expect(activations).toHaveText("Activations: 1")
  await page.keyboard.press("Space")
  await expect(activations).toHaveText("Activations: 2")
  await expect(disabled).toBeDisabled()
  await expect(disabled).toHaveCSS("opacity", "0.4")
  await page.keyboard.press("Tab")
  await expect(
    page.getByRole("button", { name: "After disabled" }),
  ).toBeFocused()
  await interactive.click()
  await expect(activations).toHaveText("Activations: 3")
})

for (const theme of ["light", "dark"]) {
  test(`style props states have no detectable accessibility violations (${theme})`, async ({
    page,
    isMobile,
  }) => {
    test.setTimeout(60_000)
    await page.addInitScript(
      (value) => localStorage.setItem("yopem-ui-theme", value),
      theme,
    )
    await page.goto(previewPath)
    await expect(
      page.getByRole("button", { name: "Copy Style Props usage" }),
    ).toBeEnabled()
    await expect(
      page.getByRole("region", { name: "Style props playground" }),
    ).toBeVisible()
    function scanPlayground() {
      return new AxeBuilder({ page })
        .include('[aria-label="Style props playground"]')
        .analyze()
    }
    expect((await scanPlayground()).violations).toEqual([])
    if (!isMobile) {
      await page.getByRole("button", { name: "Interactive styles" }).hover()
      expect((await scanPlayground()).violations).toEqual([])
      await page.mouse.move(0, 0)
    }
    await page.getByRole("button", { name: "Negative space" }).focus()
    await page.keyboard.press("Tab")
    await expect(
      page.getByRole("button", { name: "Interactive styles" }),
    ).toBeFocused()
    expect((await scanPlayground()).violations).toEqual([])
    await page.keyboard.press("Enter")
    await expect(
      page
        .getByRole("region", { name: "Style props playground" })
        .getByRole("status"),
    ).toHaveText("Activations: 1")
    expect((await scanPlayground()).violations).toEqual([])
  })
}
