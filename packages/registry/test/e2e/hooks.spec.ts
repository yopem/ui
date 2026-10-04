import { expect, test } from "@playwright/test"

test("event callback reads latest state across repeated commits", async ({
  page,
}) => {
  await page.goto("/components/use-event-callback")
  const increment = page.getByRole("button", { name: "Increment count" })
  const count = page.getByRole("status")

  for (let value = 1; value <= 3; value++) {
    await increment.click()
    await expect(count).toHaveText(`Count: ${value}`)
  }
})

test("media query responds at named, range, object, and raw query boundaries", async ({
  page,
}) => {
  await page.setViewportSize({ width: 639, height: 800 })
  await page.goto("/components/use-media-query")
  const medium = page.getByTestId("medium-query")
  const range = page.getByTestId("range-query")
  const maximum = page.getByTestId("maximum-query")
  const raw = page.getByTestId("raw-query")

  await expect(medium).toHaveText("Medium viewport: false")
  await expect(range).toHaveText("Small to large: false")
  await expect(maximum).toHaveText("Below medium: true")
  await expect(raw).toHaveText("Raw wide query: false")

  await page.setViewportSize({ width: 640, height: 800 })
  await expect(range).toHaveText("Small to large: true")
  await page.setViewportSize({ width: 799, height: 800 })
  await expect(maximum).toHaveText("Below medium: true")
  await page.setViewportSize({ width: 800, height: 800 })
  await expect(medium).toHaveText("Medium viewport: true")
  await expect(maximum).toHaveText("Below medium: false")
  await page.setViewportSize({ width: 1024, height: 800 })
  await expect(range).toHaveText("Small to large: false")
  await page.setViewportSize({ width: 1280, height: 800 })
  await expect(raw).toHaveText("Raw wide query: true")
})
