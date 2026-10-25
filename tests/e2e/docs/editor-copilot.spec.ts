import type { Page } from "@playwright/test"

import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

async function mountCopilotExample(page: Page) {
  await page.goto("/editor/examples#public-copilot")
  const entry = page.getByTestId("editor-example-public-copilot")
  await entry.getByRole("button", { name: "Live preview", exact: true }).click()
  const region = entry.getByRole("region", { name: "Copilot host setup" })
  await expect(region).toBeVisible()

  return region
}

async function configureCopilot(page: Page, hostAllowsAutomatic = false) {
  const region = await mountCopilotExample(page)

  await region.getByLabel("Host endpoint").fill("/__fixture-copilot")
  await region.getByLabel("Host document ID").fill("fixture-document")
  await region.getByLabel("Host CSRF token").fill("fixture-csrf")

  if (hostAllowsAutomatic)
    await region
      .getByRole("checkbox", { name: "Host allows automatic predictions" })
      .click()

  await region.getByRole("button", { name: "Configure Copilot" }).click()
  await expect(
    region.getByRole("textbox", { name: "Copilot editor" }),
  ).toHaveAttribute("contenteditable", "true")

  return region
}

test("manual completion accepts full text as one undoable update", async ({
  page,
}) => {
  test.slow()
  let calls = 0

  await page.route("**/__fixture-copilot", async (route) => {
    calls++
    expect(route.request().headers()["x-csrf-token"]).toBe("fixture-csrf")
    await route.fulfill({
      contentType: "text/event-stream",
      body: 'event: text\ndata: {"text":" continuation"}\n\nevent: complete\ndata: {"version":1}\n\n',
    })
  })

  const region = await configureCopilot(page)
  const editor = region.getByRole("textbox", { name: "Copilot editor" })

  await editor.fill("Original")
  await expect.poll(() => calls).toBe(0)
  await editor.press("End")
  await editor.press("Control+Space")
  await expect(
    region.locator('[data-slot="editor-copilot-status"]'),
  ).toHaveAttribute("data-state", "ready")
  await expect(editor).toHaveText("Original")
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
  await editor.press("Tab")
  await expect(editor).toHaveText("Original continuation")
  await region.getByRole("button", { name: "Undo" }).click()
  await expect(editor).toHaveText("Original")
  expect(calls).toBe(1)
})

test("partial acceptance keeps graphemes whole and stale text never inserts", async ({
  page,
}) => {
  test.slow()
  let calls = 0

  await page.route("**/__fixture-copilot", async (route) => {
    calls++
    const text = calls === 1 ? "👩‍🚀 orbit" : " stale text"
    await route.fulfill({
      contentType: "text/event-stream",
      body: `event: text\ndata: ${JSON.stringify({ text })}\n\nevent: complete\ndata: {"version":1}\n\n`,
    })
  })

  const region = await configureCopilot(page)
  const editor = region.getByRole("textbox", { name: "Copilot editor" })

  await editor.fill("Keep")
  await editor.press("End")
  await editor.press("Control+Space")
  await expect(
    region.locator('[data-slot="editor-copilot-status"]'),
  ).toHaveAttribute("data-state", "ready")
  await editor.press("Control+ArrowRight")
  await expect(editor).toHaveText("Keep👩‍🚀")
  await editor.press("Escape")
  await expect(editor).toHaveText("Keep👩‍🚀")

  await editor.press("Control+Space")
  await expect(
    region.locator('[data-slot="editor-copilot-status"]'),
  ).toHaveAttribute("data-state", "ready")
  await editor.pressSequentially("!")
  await editor.press("Tab")
  await expect(editor).toHaveText("Keep👩‍🚀!")
  expect(calls).toBe(2)
})

test("automatic requests need host enablement and user consent", async ({
  page,
}) => {
  test.slow()
  let calls = 0

  await page.route("**/__fixture-copilot", async (route) => {
    calls++
    await route.fulfill({
      contentType: "text/event-stream",
      body: 'event: text\ndata: {"text":" auto"}\n\nevent: complete\ndata: {"version":1}\n\n',
    })
  })

  const region = await configureCopilot(page, true)
  const editor = region.getByRole("textbox", { name: "Copilot editor" })

  const automatic = region.getByRole("button", {
    name: "Automatic suggestions; paid requests may incur charges",
  })

  await editor.fill("A")
  await editor.pressSequentially("B")
  await page.waitForTimeout(600)
  expect(calls).toBe(0)

  await automatic.click()
  await expect(automatic).toHaveAttribute("aria-pressed", "true")
  await editor.pressSequentially("C")
  await expect(
    region.locator('[data-slot="editor-copilot-status"]'),
  ).toHaveAttribute("data-state", "ready")
  expect(calls).toBe(1)
})
