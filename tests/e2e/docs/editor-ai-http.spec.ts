import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

const origin = process.env.EDITOR_AI_FIXTURE_ORIGIN

test("owned HTTPS handler fixture: progressive proposal, approval, focus and undo", async ({
  page,
}, testInfo) => {
  test.skip(
    !origin,
    "Start tests/editor-ai/native-http.ts with owned TLS and docs proxy first",
  )

  if (!origin) return
  await page.goto(`${origin}/docs/editor-ai`)
  const region = page.getByRole("region", { name: "Host AI setup" })
  await region.getByLabel("Host endpoint").fill("/__fixture-ai")
  await region.getByLabel("Host document ID").fill("fixture-doc")
  await region.getByLabel("Host CSRF token").fill("fixture-only")
  await region.getByRole("button", { name: "Configure AI" }).click()
  const editor = region.getByRole("textbox", { name: "AI example editor" })
  await editor.fill("Original")
  await editor.press("End")
  await region.getByRole("button", { name: "Generate", exact: true }).click()
  const dialog = page.getByRole("dialog")
  await dialog.getByLabel("AI instruction").fill("Draft")
  await dialog.getByRole("button", { name: "Request proposal" }).click()
  await expect(dialog.getByLabel("AI proposal")).toContainText("proposal")
  await expect(editor).toHaveText("Original")
  await expect(
    dialog.getByRole("button", { name: "Approve proposal" }),
  ).toBeEnabled()
  const accessibility = await new AxeBuilder({ page }).analyze()
  expect(accessibility.violations).toEqual([])
  await testInfo.attach("accessibility", {
    body: JSON.stringify(accessibility),
    contentType: "application/json",
  })
  await dialog.getByRole("button", { name: "Approve proposal" }).click()
  await expect(editor).toBeFocused()
  await expect(editor).toContainText("<script>proposal</script>")
  await region.getByRole("button", { name: "Undo" }).click()
  await expect(editor).toHaveText("Original")
  const evidence = await page.request.get(`${origin}/__fixture-evidence`)
  expect(evidence.ok()).toBe(true)
  await testInfo.attach("native-http-evidence", {
    body: await evidence.body(),
    contentType: "application/json",
  })
  await testInfo.attach("browser-state", {
    body: await page.screenshot(),
    contentType: "image/png",
  })
})
