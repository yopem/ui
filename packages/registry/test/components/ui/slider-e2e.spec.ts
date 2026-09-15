import type { Page } from "@playwright/test"

import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

test.describe.configure({ timeout: 120_000 })

function isLocalUrl(url: string) {
  try {
    const hostname = new URL(url).hostname
    return hostname === "localhost" || hostname === "127.0.0.1"
  } catch {
    return false
  }
}

function watchPage(page: Page) {
  const failures: string[] = []
  const assetTypes = new Set(["font", "image", "script", "stylesheet"])

  page.on("console", (message) => {
    if (message.type() === "error") failures.push(`console: ${message.text()}`)
  })
  page.on("pageerror", (error) => failures.push(`page: ${error.message}`))
  page.on("requestfailed", (request) => {
    if (isLocalUrl(request.url())) {
      failures.push(
        `request: ${request.url()} ${request.failure()?.errorText ?? "failed"}`,
      )
    }
  })
  page.on("response", (response) => {
    if (
      isLocalUrl(response.url()) &&
      response.status() >= 400 &&
      assetTypes.has(response.request().resourceType())
    ) {
      failures.push(`asset: ${response.status()} ${response.url()}`)
    }
  })

  return function expectCleanPage() {
    expect(failures).toEqual([])
  }
}

async function openExample(page: Page, name: string) {
  await page.goto(`/examples/${name}`)
  await expect(page.locator("[data-example-root]")).toBeVisible({
    timeout: 30_000,
  })
  await expect(page.getByText("Loading example…")).toHaveCount(0, {
    timeout: 30_000,
  })
  const viewportFits = await page.evaluate(
    () => document.documentElement.scrollWidth <= window.innerWidth + 1,
  )
  expect(viewportFits).toBe(true)
}

async function expectNoAxeViolations(page: Page) {
  const results = await new AxeBuilder({ page }).analyze()
  expect(results.violations).toEqual([])
}

test("slider supports keyboard, pointer, ranges, steps, vertical, and disabled states", async ({
  page,
}) => {
  const expectCleanPage = watchPage(page)
  await openExample(page, "p-slider-1")
  const slider = page.getByRole("slider", { name: "Volume" })
  await expect(slider).toHaveAttribute("aria-valuenow", "50")
  await slider.focus()
  await slider.press("ArrowRight")
  await expect(slider).toHaveAttribute("aria-valuenow", "51")
  await slider.press("Home")
  await expect(slider).toHaveAttribute("aria-valuenow", "0")
  await slider.press("End")
  await expect(slider).toHaveAttribute("aria-valuenow", "100")
  const track = page.locator('[data-slot="slider-track"]')
  const trackBox = await track.boundingBox()
  expect(trackBox).not.toBeNull()
  if (trackBox) {
    await page.mouse.click(
      trackBox.x + trackBox.width * 0.25,
      trackBox.y + trackBox.height / 2,
    )
  }
  await expect(slider).toHaveAttribute("aria-valuenow", /2[45]/)

  await openExample(page, "p-slider-3")
  await expect(page.getByRole("slider")).toBeDisabled()

  await openExample(page, "p-slider-6")
  const stepped = page.getByRole("slider", {
    name: "Intensity level from low to high",
  })
  await stepped.focus()
  await stepped.press("ArrowRight")
  await expect(stepped).toHaveAttribute("aria-valuenow", "60")

  await openExample(page, "p-slider-7")
  await expect(page.getByRole("slider")).toHaveCount(2)

  await openExample(page, "p-slider-8")
  await expect(page.getByRole("slider")).toHaveCount(3)

  await openExample(page, "p-slider-17")
  await expect(page.getByRole("slider")).toHaveAttribute(
    "aria-orientation",
    "vertical",
  )

  await openExample(page, "p-slider-18")
  const verticalRange = page.getByRole("slider")
  await expect(verticalRange).toHaveCount(2)
  await expect(verticalRange.first()).toHaveAttribute(
    "aria-orientation",
    "vertical",
  )
  expectCleanPage()
})

test("@full-a11y slider passes axe before and after keyboard and pointer changes", async ({
  page,
}) => {
  const expectCleanPage = watchPage(page)
  await openExample(page, "p-slider-1")
  await expectNoAxeViolations(page)
  const slider = page.getByRole("slider", { name: "Volume" })
  await slider.focus()
  await slider.press("ArrowRight")
  await expectNoAxeViolations(page)
  const track = page.locator('[data-slot="slider-track"]')
  const box = await track.boundingBox()
  expect(box).not.toBeNull()
  if (box)
    await page.mouse.click(box.x + box.width * 0.75, box.y + box.height / 2)
  await expectNoAxeViolations(page)
  expectCleanPage()
})
