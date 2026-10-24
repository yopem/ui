import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

test("DocumentStatic disclosure and title links @a11y", async ({
  page,
}, info) => {
  await page.goto("/editor/document-static")

  const preview = page.getByRole("group", {
    name: "DocumentStatic live preview",
    exact: true,
  })

  const document = preview.getByRole("region", {
    name: "Static document",
    exact: true,
  })

  const link = document.getByRole("link", { name: "Reference", exact: true })
  const disclosure = document.locator("summary")
  await expect(link).toHaveAttribute("href", "https://example.com/")
  await expect(
    document.getByText("Document body", { exact: true }),
  ).not.toBeVisible()
  await disclosure.focus()
  await disclosure.press("Enter")
  await expect(
    document.getByText("Document body", { exact: true }),
  ).toBeVisible()
  await disclosure.press("Space")
  await expect(
    document.getByText("Document body", { exact: true }),
  ).not.toBeVisible()
  await expect(link).toBeVisible()

  const results = await new AxeBuilder({ page })
    .include('[data-slot="editor-part-preview"]')
    .analyze()

  await info.attach("document-static-axe.json", {
    body: JSON.stringify(results),
    contentType: "application/json",
  })
  expect(results.violations).toEqual([])
  await page.screenshot({
    path: info.outputPath("document-static.png"),
    scale: "css",
  })
  await page.route("https://example.com/", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: "<title>Reference</title>",
    }),
  )
  await link.focus()
  await link.press("Enter")
  await expect(page).toHaveURL("https://example.com/")
})
