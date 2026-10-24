import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

for (const fixture of [
  { name: "empty", items: [] },
  {
    name: "duplicate",
    items: [
      { id: "duplicate", label: "One" },
      { id: "duplicate", label: "Two" },
    ],
  },
  {
    name: "invalid",
    items: [{ id: "invalid", label: "\u0000" }],
  },
  {
    name: "oversized",
    items: Array.from({ length: 51 }, (_, index) => ({
      id: `candidate-${index}`,
      label: `Candidate ${index}`,
    })),
  },
]) {
  test(`mention ${fixture.name} results announce state without changing editor focus`, async ({
    page,
  }, testInfo) => {
    const release = Promise.withResolvers<void>()
    await page.route("**/typeahead-fixture?*", async (route) => {
      await release.promise
      await route.fulfill({ json: fixture.items })
    })
    await page.goto("/docs/editor")

    const editor = page.getByRole("textbox", {
      name: "HTTP typeahead editor",
      exact: true,
    })

    await expect(editor).toHaveAttribute("contenteditable", "true")
    await editor.click()
    await page.keyboard.type("@Candidate")
    const list = page.getByRole("listbox", { name: "Editor suggestions" })
    const suggestions = page.getByLabel("Editor suggestions", { exact: true })
    const status = suggestions.getByRole("status")
    await expect(list).toHaveAttribute("aria-busy", "true")
    await expect(status).toBeVisible()
    await expect(status).not.toBeEmpty()
    await expect(status).toHaveAttribute("aria-live", "polite")
    const loadingAnnouncement = await status.innerText()
    await expect(editor).toBeFocused()

    const loading = await new AxeBuilder({ page })
      .include('[aria-label="Editor suggestions"]')
      .analyze()

    expect(loading.violations).toEqual([])
    release.resolve()
    await expect(
      suggestions.and(page.locator('[aria-busy="true"]')),
    ).toHaveCount(0)
    await expect(status).toBeVisible()
    await expect(status).not.toBeEmpty()
    await expect(status).not.toHaveText(loadingAnnouncement)
    await expect(list.getByRole("option")).toHaveCount(0)
    await expect(editor).toBeFocused()
    await expect(editor).toHaveText("@Candidate")

    const result = await new AxeBuilder({ page })
      .include('[aria-label="Editor suggestions"]')
      .analyze()

    await testInfo.attach(`${fixture.name}-axe`, {
      body: JSON.stringify({ loading, result }),
      contentType: "application/json",
    })
    expect(result.violations).toEqual([])
    await page.keyboard.press("Escape")
    await expect(status).toHaveCount(0)
    await expect(editor).toBeFocused()
  })
}

test("unmount aborts an in-flight HTTP request and remount rejects its late result", async ({
  page,
}) => {
  const release = Promise.withResolvers<void>()
  const settled = Promise.withResolvers<void>()
  await page.route("**/typeahead-fixture?*", async (route) => {
    await release.promise

    try {
      await route.fulfill({ json: [{ id: "old", label: "Old result" }] })
    } catch {
      expect(route.request().failure()).not.toBeNull()
    } finally {
      settled.resolve()
    }
  })
  await page.goto("/docs/editor")

  const editor = page.getByRole("textbox", {
    name: "HTTP typeahead editor",
    exact: true,
  })

  await expect(editor).toHaveAttribute("contenteditable", "true")
  await editor.click()
  const started = page.waitForRequest("**/typeahead-fixture?*")
  await page.keyboard.type("@Pending")
  await started

  const failed = page.waitForEvent("requestfailed", {
    predicate: (request) =>
      new URL(request.url()).pathname === "/typeahead-fixture",
  })

  await page
    .getByRole("button", { name: "Hide HTTP editor", exact: true })
    .click()
  await expect(editor).toHaveCount(0)
  release.resolve()
  await failed
  await settled.promise
  await page
    .getByRole("button", { name: "Show HTTP editor", exact: true })
    .click()
  await expect(editor).toBeVisible()
  await expect(editor).toHaveText("")
  await expect(
    page.getByRole("listbox", { name: "Editor suggestions" }),
  ).toHaveCount(0)
  await expect(
    page.getByRole("option", { name: "Old result", exact: true }),
  ).toHaveCount(0)
})
