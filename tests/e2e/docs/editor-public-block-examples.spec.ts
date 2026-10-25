import type { Page } from "@playwright/test"

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

test.beforeEach(async ({ page }) => {
  test.slow()
  await page.goto("/editor/examples#public-blocks")
})

test("callout: changes appearance and icon through emoji picker without losing rich content", async ({
  page,
}, testInfo) => {
  const editor = await surface(page, "public-blocks", "Public blocks editor")
  const controls = toolbar(page, "public-blocks", "Public blocks")
  await editor.fill("Callout body")
  await editor.press("End")
  await controls
    .getByRole("button", { name: "Insert callout", exact: true })
    .click()
  await editor.press("Enter")
  await editor.pressSequentially("Nested item")
  await controls
    .getByRole("button", { name: "Bullet list", exact: true })
    .click()
  const callout = editor.locator("aside[data-editor-callout]")
  await expect(callout.locator("ul li")).toContainText("Nested item")
  await controls
    .getByRole("button", { name: "Callout appearance warning", exact: true })
    .click()
  await expect(callout).toHaveAttribute("data-appearance", "warning")
  await controls
    .getByRole("button", { name: "Choose callout icon", exact: true })
    .click()

  const search = page.getByRole("combobox", {
    name: "Search emoji",
    exact: true,
  })

  await search.fill("fire")

  const pickerReport = await new AxeBuilder({ page })
    .include('[data-testid="editor-example-public-blocks"]')
    .include('[data-slot="popover-popup"]')
    .analyze()

  expect(pickerReport.violations).toEqual([])
  await page.getByRole("option", { name: "🔥 fire", exact: true }).click()
  await expect(callout).toHaveAttribute("data-icon", "🔥")
  await expect(callout.locator("ul li")).toContainText("Nested item")
  await expect(editor).toContainText("Callout body")

  const report = await new AxeBuilder({ page })
    .include('[data-testid="editor-example-public-blocks"]')
    .analyze()

  expect(report.violations).toEqual([])
  await testInfo.attach("callout.html", {
    body: await editor.innerHTML(),
    contentType: "text/html",
  })
})

test("toggle: nests, discloses by keyboard and pointer, keeps title links usable, and leaves readonly state unchanged", async ({
  page,
}, testInfo) => {
  const editor = await surface(page, "public-blocks", "Public blocks editor")
  const root = example(page, "public-blocks")
  const controls = toolbar(page, "public-blocks", "Public blocks")
  await editor.click()
  await controls
    .getByRole("button", { name: "Insert toggle", exact: true })
    .click()
  await editor.pressSequentially("Summary link")
  await editor.press("Home")
  await editor.press("Shift+End")
  await controls.getByRole("button", { name: "Link", exact: true }).click()
  await page
    .getByRole("textbox", { name: "Link URL", exact: true })
    .fill("https://example.com/")
  await page.getByRole("button", { name: "Apply link", exact: true }).click()
  await editor.press("End")
  await editor.press("Enter")
  await editor.pressSequentially("Toggle body")
  await controls
    .getByRole("button", { name: "Insert toggle", exact: true })
    .click()
  await editor.pressSequentially("Nested summary")
  await editor.press("Enter")
  await editor.pressSequentially("Nested body")
  const toggles = editor.locator("details[data-editor-toggle-body]")
  await expect(toggles).toHaveCount(2)
  const outer = toggles.first()
  const summary = outer.locator("summary").first()
  await summary.focus()
  await page.keyboard.press("Space")
  await expect(outer).not.toHaveAttribute("open", "")

  const titleLink = editor
    .locator("[data-editor-toggle-summary]")
    .getByRole("link", { name: "Summary link", exact: true })

  await expect(titleLink).toHaveAttribute("href", "https://example.com/")
  await page.route("https://example.com/**", (route) => route.abort())
  await titleLink.click({ noWaitAfter: true })
  await expect(outer).not.toHaveAttribute("open", "")
  await summary.focus()
  await page.keyboard.press("Enter")
  await expect(outer).toHaveAttribute("open", "")

  const openReport = await new AxeBuilder({ page })
    .include('[data-testid="editor-example-public-blocks"]')
    .analyze()

  expect(openReport.violations).toEqual([])
  await outer.locator("summary").click()
  await expect(outer).not.toHaveAttribute("open", "")
  const documentJSON = root.getByLabel("Blocks document JSON", { exact: true })
  const before = await documentJSON.textContent()
  await root
    .getByRole("button", { name: "Read-only blocks", exact: true })
    .click()
  await summary.click()
  await expect(outer).toHaveAttribute("open", "")
  await expect(documentJSON).toHaveText(before ?? "")
  await root.getByRole("button", { name: "Edit blocks", exact: true }).click()
  await expect(outer).not.toHaveAttribute("open", "")

  const report = await new AxeBuilder({ page })
    .include('[data-testid="editor-example-public-blocks"]')
    .analyze()

  expect(report.violations).toEqual([])
  await testInfo.attach("toggle.html", {
    body: await editor.innerHTML(),
    contentType: "text/html",
  })
})
