import type { Locator, Page } from "@playwright/test"

import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

function example(page: Page, slug: string) {
  return page.getByTestId(`editor-example-${slug}`)
}

async function surface(page: Page, slug: string, name: string) {
  const root = example(page, slug)
  const toggle = root.getByRole("button", { name: "Live preview", exact: true })

  if ((await toggle.getAttribute("aria-expanded")) === "false")
    await toggle.click()
  const editor = root.getByRole("textbox", { name, exact: true })
  await expect(editor).toHaveAttribute("contenteditable", "true")

  return editor
}

function toolbar(page: Page, slug: string, name: string) {
  return example(page, slug).getByRole("toolbar", { name, exact: true })
}

async function applyStyle(
  page: Page,
  root: Locator,
  name: string,
  value: string,
) {
  await root.getByRole("button", { name, exact: true }).click()
  await page
    .getByRole("textbox", { name: `${name} value`, exact: true })
    .fill(value)
  await page.getByRole("button", { name: `Apply ${name}`, exact: true }).click()
}

test.beforeEach(async ({ page }) => {
  test.slow()
  await page.goto("/editor/examples#public-styles")
})

test("text-align: selected block changes without changing neighbors", async ({
  page,
}, testInfo) => {
  const editor = await surface(page, "public-styles", "Public styles editor")
  const exampleRoot = example(page, "public-styles")
  const controls = toolbar(page, "public-styles", "Public styles")
  await editor.fill("Before")
  await editor.press("Enter")
  await editor.pressSequentially("Target")
  await editor.press("Enter")
  await editor.pressSequentially("After")

  const paragraphs = editor.locator("p")

  const beforeAlignment = await paragraphs
    .nth(0)
    .evaluate((element) => getComputedStyle(element).textAlign)

  const afterAlignment = await paragraphs
    .nth(2)
    .evaluate((element) => getComputedStyle(element).textAlign)

  await paragraphs.nth(1).click()

  for (const alignment of ["left", "center", "right", "justify"] as const) {
    await controls
      .getByRole("button", { name: `Align ${alignment}`, exact: true })
      .click()
    await expect(paragraphs.nth(1)).toHaveCSS("text-align", alignment)
    expect(
      await paragraphs
        .nth(0)
        .evaluate((element) => getComputedStyle(element).textAlign),
    ).toBe(beforeAlignment)
    expect(
      await paragraphs
        .nth(2)
        .evaluate((element) => getComputedStyle(element).textAlign),
    ).toBe(afterAlignment)
  }

  await testInfo.attach("text-align.html", {
    body: await editor.innerHTML(),
    contentType: "text/html",
  })

  const report = await new AxeBuilder({ page })
    .include('[data-testid="editor-example-public-styles"]')
    .analyze()

  expect(report.violations).toEqual([])
  await expect(exampleRoot).toBeVisible()
})

test("font: applies text and background colors, keeps marks, and undoes", async ({
  page,
}, testInfo) => {
  const editor = await surface(page, "public-styles", "Public styles editor")
  const root = example(page, "public-styles")
  const controls = toolbar(page, "public-styles", "Public styles")
  await editor.fill("Styled text")
  await editor.press("ControlOrMeta+a")
  await controls.getByRole("button", { name: "Bold", exact: true }).click()
  await applyStyle(page, root, "Font color", "#0f766e")
  await applyStyle(page, root, "Background color", "#fef3c7")
  const styledText = editor.getByText("Styled text", { exact: true })
  await expect(editor.locator("strong, b")).toHaveText("Styled text")
  await expect(styledText).toHaveCSS("color", "rgb(15, 118, 110)")
  await expect(styledText).toHaveCSS("background-color", "rgb(254, 243, 199)")
  await controls.getByRole("button", { name: "Undo", exact: true }).click()
  await expect(editor).toContainText("Styled text")
  await expect(editor.locator("strong, b")).toHaveText("Styled text")
  await expect(styledText).not.toHaveCSS(
    "background-color",
    "rgb(254, 243, 199)",
  )
  await testInfo.attach("font.html", {
    body: await editor.innerHTML(),
    contentType: "text/html",
  })
})

test("indent: changes only selected block and reverses with outdent", async ({
  page,
}) => {
  const editor = await surface(page, "public-styles", "Public styles editor")
  const controls = toolbar(page, "public-styles", "Public styles")
  await editor.fill("Before")
  await editor.press("Enter")
  await editor.pressSequentially("Target")
  await editor.press("Enter")
  await editor.pressSequentially("After")
  const paragraphs = editor.locator("p")
  await paragraphs.nth(1).click()
  await controls.getByRole("button", { name: "Indent", exact: true }).click()
  await expect(paragraphs.nth(1)).not.toHaveCSS("padding-inline-start", "0px")
  await expect(paragraphs.nth(0)).toHaveCSS("padding-inline-start", "0px")
  await expect(paragraphs.nth(2)).toHaveCSS("padding-inline-start", "0px")
  await controls.getByRole("button", { name: "Outdent", exact: true }).click()
  await expect(paragraphs.nth(1)).toHaveCSS("padding-inline-start", "0px")
  await expect(editor).toContainText("BeforeTargetAfter")
})

test("line-height: survives native JSON and HTML reloads", async ({
  page,
}, testInfo) => {
  const editor = await surface(page, "public-styles", "Public styles editor")
  const root = example(page, "public-styles")
  const controls = toolbar(page, "public-styles", "Public styles")
  await editor.fill("Round trip")
  await editor.press("ControlOrMeta+a")
  await applyStyle(page, root, "Line height", "2")
  await expect
    .poll(() =>
      editor.locator("p").evaluate((element) => element.style.lineHeight),
    )
    .toBe("2")

  for (const format of ["JSON", "HTML"] as const) {
    await root
      .getByRole("button", { name: `Save styled ${format}`, exact: true })
      .click()
    await editor.fill("Replacement")
    await root
      .getByRole("button", { name: `Load styled ${format}`, exact: true })
      .click()
    await expect(editor).toHaveText("Round trip")
    await expect
      .poll(() =>
        editor.locator("p").evaluate((element) => element.style.lineHeight),
      )
      .toBe("2")
  }

  await testInfo.attach("line-height.html", {
    body: await editor.innerHTML(),
    contentType: "text/html",
  })
  await expect(
    controls.getByRole("button", { name: "Line height", exact: true }),
  ).toBeEnabled()
})
