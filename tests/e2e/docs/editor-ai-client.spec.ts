import type { Page, Route } from "@playwright/test"

import { expect, test } from "@playwright/test"

async function setup(page: Page) {
  await page.goto("/docs/editor")
  const region = page.getByRole("region", { name: "Host AI setup" })
  await expect(region.getByRole("button", { name: "Generate" })).toHaveCount(0)
  await region.getByLabel("Host endpoint").fill("/__fixture-ai")
  await region.getByLabel("Host document ID").fill("fixture-doc")
  await region.getByLabel("Host CSRF token").fill("fixture-only")
  await region.getByRole("button", { name: "Configure AI" }).click()

  return region
}

test("protocol fixture proof only: approval, literal text, one undo and keyboard focus", async ({
  page,
}, testInfo) => {
  let calls = 0
  await page.route("**/__fixture-ai", async (route) => {
    calls++
    expect(route.request().headers()["x-csrf-token"]).toBe("fixture-only")
    await route.fulfill({
      contentType: "text/event-stream",
      body: 'event: text\ndata: {"text":"<script>proposal</script>"}\n\nevent: complete\ndata: {"version":1}\n\n',
    })
  })
  const region = await setup(page)
  const editor = region.getByRole("textbox", { name: "AI example editor" })
  await editor.fill("Original")
  await editor.press("End")
  await region.getByRole("button", { name: "Generate", exact: true }).click()
  const dialog = page.getByRole("dialog")
  await dialog.getByLabel("AI instruction").fill("Draft")
  await dialog.getByRole("button", { name: "Request proposal" }).click()
  await expect(
    dialog.getByRole("button", { name: "Approve proposal" }),
  ).toBeEnabled()
  await expect(editor).toHaveText("Original")
  await expect(dialog.getByLabel("AI proposal")).toHaveText(
    "<script>proposal</script>",
  )
  await dialog.getByRole("button", { name: "Approve proposal" }).click()
  await expect(editor).toBeFocused()
  await expect(editor).toContainText("proposal")
  await region.getByRole("button", { name: "Undo" }).click()
  await expect(editor).toHaveText("Original")
  expect(calls).toBe(1)
  await testInfo.attach("fixture-proof", {
    body: "Intercepted SSE only. No model inference or production backend proof.",
    contentType: "text/plain",
  })
})

test("protocol fixture proof only: truncation never applies; Escape restores focus", async ({
  page,
}) => {
  await page.route("**/__fixture-ai", (route) =>
    route.fulfill({
      contentType: "text/event-stream",
      body: 'event: text\ndata: {"text":"partial"}\n\n',
    }),
  )
  const region = await setup(page)
  const editor = region.getByRole("textbox", { name: "AI example editor" })
  await editor.fill("Keep")
  await region.getByRole("button", { name: "Copilot", exact: true }).click()
  const dialog = page.getByRole("dialog")
  await dialog.getByLabel("AI instruction").fill("Continue")
  await dialog.getByRole("button", { name: "Request proposal" }).click()
  await expect(dialog.getByRole("alert")).toBeVisible()
  await expect(
    dialog.getByRole("button", { name: "Approve proposal" }),
  ).toBeDisabled()
  await page.keyboard.press("Escape")
  await expect(
    region.getByRole("button", { name: "Copilot", exact: true }),
  ).toBeFocused()
  await expect(editor).toHaveText("Keep")
})

test("protocol fixture proof only: explicit cancellation never applies or retries", async ({
  page,
}) => {
  let calls = 0
  let pending: Route | undefined
  await page.route("**/__fixture-ai", (route) => {
    calls++
    pending = route
  })
  const region = await setup(page)
  const editor = region.getByRole("textbox", { name: "AI example editor" })
  await editor.fill("Keep")
  await region.getByRole("button", { name: "Generate", exact: true }).click()
  const dialog = page.getByRole("dialog")
  await dialog.getByLabel("AI instruction").fill("Draft")
  await dialog.getByRole("button", { name: "Request proposal" }).click()
  await expect.poll(() => calls).toBe(1)
  await dialog.getByRole("button", { name: "Cancel request" }).click()
  await expect(dialog.getByRole("alert")).toBeVisible()
  await expect(
    dialog.getByRole("button", { name: "Approve proposal" }),
  ).toBeDisabled()
  await pending?.abort()
  await page.keyboard.press("Escape")
  await expect(editor).toHaveText("Keep")
  expect(calls).toBe(1)
})

test("protocol fixture proof only: server deadline clears proposal and blocks approval", async ({
  page,
}) => {
  await page.route("**/__fixture-ai", (route) =>
    route.fulfill({
      contentType: "text/event-stream",
      body: 'event: text\ndata: {"text":"partial"}\n\nevent: error\ndata: {"code":"deadline"}\n\n',
    }),
  )
  const region = await setup(page)
  const editor = region.getByRole("textbox", { name: "AI example editor" })
  await editor.fill("Keep")
  await region.getByRole("button", { name: "Generate", exact: true }).click()
  const dialog = page.getByRole("dialog")
  await dialog.getByLabel("AI instruction").fill("Draft")
  await dialog.getByRole("button", { name: "Request proposal" }).click()
  await expect(dialog.locator("output")).toHaveText("timeout")
  await expect(dialog.getByLabel("AI proposal")).toBeEmpty()
  await expect(
    dialog.getByRole("button", { name: "Approve proposal" }),
  ).toBeDisabled()
  await expect(editor).toHaveText("Keep")
})
