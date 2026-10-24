import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"
import { routeMediaResources } from "@workspace/tests/editor-media/resources"

for (const [slug, name] of [
  ["media-insert-control", "MediaInsertControl"],
  ["media-content", "MediaContent"],
] as const) {
  test(`@a11y ${name} has a focused public preview`, async ({
    page,
  }, testInfo) => {
    await routeMediaResources(page)
    await page.goto(`/editor/${slug}`)
    await expect(page.getByRole("heading", { name, exact: true })).toBeVisible()

    if (slug === "media-insert-control") {
      await expect(
        page.getByRole("button", { name: "Insert image", exact: true }),
      ).toBeVisible()
    } else {
      const image = page.getByRole("img", {
        name: "Media preview",
        exact: true,
      })

      await expect(image).toBeVisible()
      expect(
        await image.evaluate(async (element: HTMLImageElement) => {
          await element.decode()

          return element.naturalWidth
        }),
      ).toBeGreaterThan(0)
      await expect(
        page.getByRole("button", { name: "Select media", exact: true }),
      ).toHaveCount(0)
    }

    const report = await new AxeBuilder({ page }).include("main").analyze()
    expect(report.violations).toEqual([])
    await testInfo.attach(`${slug}-axe.json`, {
      body: JSON.stringify(report),
      contentType: "application/json",
    })
  })
}
