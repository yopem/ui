import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

test("native slash, mentions and emoji keep editor focus and history", async ({
  page,
}, testInfo) => {
  await page.goto("/docs/editor")

  const editor = page.getByRole("textbox", {
    name: "Typeahead editor",
    exact: true,
  })

  await expect(editor).toHaveAttribute("contenteditable", "true")
  await editor.click()
  await page.keyboard.type("/heading")
  const list = page.getByRole("listbox", { name: "Editor suggestions" })
  await expect(list).toBeVisible()
  await expect(editor).toBeFocused()
  await page.keyboard.press("Home")
  await page.keyboard.press("Enter")
  await expect(editor.locator("h1")).toBeVisible()
  await page.keyboard.type("Title")
  await page.keyboard.press("Enter")
  await page.keyboard.type("@Ada")
  await expect(page.getByRole("option", { name: "Ada Lovelace" })).toBeVisible()
  await expect(editor).toBeFocused()
  await expect(editor).toHaveAttribute("aria-activedescendant", /.+/)

  const accessibility = await new AxeBuilder({ page })
    .include('[data-testid="typeahead-example"]')
    .analyze()

  await testInfo.attach("typeahead-axe", {
    body: JSON.stringify(accessibility),
    contentType: "application/json",
  })
  expect(accessibility.violations).toEqual([])
  await page.keyboard.press("Enter")
  await expect(editor.locator('[data-slot="editor-mention"]')).toHaveText(
    "@Ada Lovelace",
  )
  await page.keyboard.type(":woman_technologist")
  await expect(list).toBeVisible()
  await page.keyboard.press("Home")
  await page.keyboard.press("Enter")
  await expect(editor).toContainText("👩‍💻")
  await page.keyboard.press("ControlOrMeta+z")
  await expect(editor).not.toContainText("👩‍💻")

  await page.waitForFunction(() => document.fonts.status === "loaded")

  for (const width of [1440, 768, 390]) {
    await page.setViewportSize({ width, height: 900 })
    await editor.scrollIntoViewIfNeeded()
    await testInfo.attach(`typeahead-${width}`, {
      body: await page.screenshot({ fullPage: false }),
      contentType: "image/png",
    })
  }
})

test("mention HTTP errors and stale requests never replace current query", async ({
  page,
}) => {
  const oldResponse = Promise.withResolvers<void>()
  await page.route("**/typeahead-fixture?q=*", async (route) => {
    const query = new URL(route.request().url()).searchParams.get("q")

    if (query === "Error") {
      await route.fulfill({ status: 503 })

      return
    }

    if (query === "A") await new Promise((resolve) => setTimeout(resolve, 300))

    try {
      await route.fulfill({
        json: [
          {
            id: query ?? "none",
            label: query === "A" ? "Old result" : "Current result",
          },
        ],
      })
    } catch {
      if (query !== "A") throw new Error("Fixture response failed")
    } finally {
      if (query === "A") oldResponse.resolve()
    }
  })
  await page.goto("/docs/editor")

  const editor = page.getByRole("textbox", {
    name: "HTTP typeahead editor",
    exact: true,
  })

  await expect(editor).toHaveAttribute("contenteditable", "true")
  await editor.click()
  const firstRequest = page.waitForRequest("**/typeahead-fixture?q=A")
  await page.keyboard.type("@A")
  await firstRequest
  await page.keyboard.type("d")
  await expect(
    page.getByRole("option", { name: "Current result" }),
  ).toBeVisible()
  await oldResponse.promise
  await expect(page.getByRole("option", { name: "Old result" })).toHaveCount(0)
  await expect(editor).toBeFocused()
  await page.keyboard.press("Escape")
  await page.keyboard.press("ControlOrMeta+a")
  await page.keyboard.type("@Error")
  const suggestions = page.getByLabel("Editor suggestions", { exact: true })
  const status = suggestions.getByRole("status")
  await expect(suggestions.and(page.locator('[aria-busy="true"]'))).toHaveCount(
    0,
  )
  await expect(status).toBeVisible()
  await expect(status).not.toBeEmpty()
  await expect(status).toHaveAttribute("aria-live", "polite")
  await expect(editor).toBeFocused()
})
