import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

test("@a11y host AI configuration and proposal dialog; protocol fixture proof only", async ({
  page,
}, testInfo) => {
  await page.route("**/__fixture-ai", (route) =>
    route.fulfill({
      contentType: "text/event-stream",
      body: 'event: text\ndata: {"text":"Review this plain text."}\n\nevent: complete\ndata: {"version":1}\n\n',
    }),
  )
  await page.goto("/docs/editor")
  const region = page.getByRole("region", { name: "Host AI setup" })

  const before = await new AxeBuilder({ page })
    .include('section[aria-label="Host AI setup"]')
    .analyze()

  expect(before.violations).toEqual([])
  await region.getByLabel("Host endpoint").fill("/__fixture-ai")
  await region.getByLabel("Host document ID").fill("fixture-doc")
  await region.getByLabel("Host CSRF token").fill("fixture-only")
  await region.getByRole("button", { name: "Configure AI" }).click()
  const editor = region.getByRole("textbox", { name: "AI example editor" })
  await editor.fill("Replace me")
  await editor.press("Home")
  await editor.press("Shift+End")
  const trigger = region.getByRole("button", { name: "Rewrite", exact: true })
  await trigger.focus()
  await trigger.press("Enter")
  const dialog = page.getByRole("dialog")
  await dialog.getByLabel("AI instruction").fill("Rewrite selection")
  await dialog.getByRole("button", { name: "Request proposal" }).click()
  await expect(
    dialog.getByRole("button", { name: "Approve proposal" }),
  ).toBeEnabled()
  const ready = await new AxeBuilder({ page }).analyze()
  expect(ready.violations).toEqual([])
  await page.keyboard.press("Escape")
  await expect(trigger).toBeFocused()
  await expect(editor).toHaveText("Replace me")
  await testInfo.attach("ai-a11y-fixture", {
    body: JSON.stringify({
      before,
      ready,
      evidence: "Synthetic intercepted protocol. No inference proof.",
    }),
    contentType: "application/json",
  })
})
