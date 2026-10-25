import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

const previewCases = [
  {
    id: "potion-iframe",
    name: "Potion",
    title: "potion",
    url: "https://potion.platejs.org/?iframe=true",
    origin: "https://potion.platejs.org",
  },
  {
    id: "pro-iframe",
    name: "Plate Pro example",
    title: "media-controller",
    url: "https://pro.platejs.org/iframe/media-controller",
    origin: "https://pro.platejs.org",
  },
  {
    id: "image-pro",
    name: "Plate Pro media controller",
    title: "media-controller",
    url: "https://pro.platejs.org/iframe/media-controller",
    origin: "https://pro.platejs.org",
  },
] as const

const fixtureDocument = `<!doctype html><html lang="en"><head><title>Intercepted external fixture</title><link rel="icon" href="data:,"></head><body><button type="button">Fixture focus target</button></body></html>`

const fixtureOrigins = new Set<string>(
  previewCases.map((preview) => preview.origin),
)

test.describe("public external preview wrappers with intercepted fixtures only", () => {
  for (const preview of previewCases) {
    test(`${preview.id}: gates its exact external frame behind opt-in`, async ({
      page,
    }, testInfo) => {
      test.slow()
      const externalRequests: string[] = []

      for (const origin of fixtureOrigins) {
        await page.route(`${origin}/**`, async (route) => {
          await route.fulfill({
            status: 200,
            contentType: "text/html; charset=utf-8",
            body: fixtureDocument,
          })
        })
      }

      page.on("request", (request) => {
        const url = new URL(request.url())

        if (fixtureOrigins.has(url.origin)) externalRequests.push(url.href)
      })

      await page.goto("/editor/examples#public-external-previews")

      const entry = page.getByTestId("editor-example-public-external-previews")
      await expect(entry).toBeVisible()
      await entry
        .getByRole("button", { name: "Live preview", exact: true })
        .click()

      const example = entry.getByTestId("public-external-previews-example")
      const card = example.getByTestId(`public-external-preview-${preview.id}`)
      const frame = card.getByTestId(`external-preview-frame-${preview.id}`)

      const loadButton = card.getByRole("button", {
        name: `Load ${preview.name} preview`,
        exact: true,
      })

      await expect(example).toBeVisible()
      await expect(card.locator("iframe")).toHaveCount(0)

      const urlField = card.getByRole("textbox", {
        name: `${preview.name} external URL`,
        exact: true,
      })

      await expect(urlField).toHaveValue(preview.url)
      await expect(urlField).toHaveAttribute("readonly", "")
      expect(externalRequests).toEqual([])

      const unloadedReport = await new AxeBuilder({ page })
        .include('[data-testid="public-external-previews-example"]')
        .analyze()

      await testInfo.attach(`${preview.id}-unloaded-wrapper-axe.json`, {
        body: JSON.stringify(unloadedReport, null, 2),
        contentType: "application/json",
      })
      expect(unloadedReport.violations).toEqual([])

      await loadButton.focus()
      await page.keyboard.press("Enter")

      await expect(frame).toHaveAttribute("src", preview.url)
      await expect(frame).toHaveAttribute("title", preview.title)
      await expect(frame).toHaveAttribute(
        "sandbox",
        "allow-scripts allow-forms",
      )
      await expect(frame).toHaveAttribute("referrerpolicy", "no-referrer")
      await expect(frame).not.toHaveAttribute("allow")

      const frameButton = page
        .frameLocator(`[data-testid="external-preview-frame-${preview.id}"]`)
        .getByRole("button", { name: "Fixture focus target", exact: true })

      await expect(frameButton).toBeVisible()
      await page.keyboard.press("Tab")
      await expect(frameButton).toBeFocused()
      expect(externalRequests).toEqual([preview.url])

      for (const width of [1440, 768, 390]) {
        await page.setViewportSize({ width, height: 844 })

        const dimensions = await frame.evaluate((element) => ({
          frameWidth: element.getBoundingClientRect().width,
          parentWidth:
            element.parentElement?.getBoundingClientRect().width ?? 0,
          viewportWidth: element.ownerDocument.documentElement.clientWidth,
          scrollWidth: element.parentElement?.scrollWidth ?? 0,
        }))

        expect(dimensions.frameWidth).toBeLessThanOrEqual(
          dimensions.parentWidth + 1,
        )
        expect(dimensions.scrollWidth).toBeLessThanOrEqual(
          dimensions.parentWidth + 1,
        )
        expect(dimensions.frameWidth).toBeLessThanOrEqual(
          dimensions.viewportWidth,
        )
        await testInfo.attach(`${preview.id}-${width}-wrapper.png`, {
          body: await card.screenshot({ scale: "css" }),
          contentType: "image/png",
        })
      }

      const report = await new AxeBuilder({ page })
        .include('[data-testid="public-external-previews-example"]')
        .analyze()

      await testInfo.attach(`${preview.id}-intercepted-wrapper-axe.json`, {
        body: JSON.stringify(report, null, 2),
        contentType: "application/json",
      })
      expect(report.violations).toEqual([])

      await card
        .getByRole("button", {
          name: `Remove ${preview.name} preview`,
          exact: true,
        })
        .click()
      await expect(frame).toHaveCount(0)
      await expect(
        card.getByRole("button", {
          name: `Load ${preview.name} preview`,
          exact: true,
        }),
      ).toBeFocused()
      expect(externalRequests).toEqual([preview.url])

      await testInfo.attach(`${preview.id}-intercepted-wrapper-requests.json`, {
        body: JSON.stringify(
          {
            evidence:
              "Intercepted wrapper behavior only; no live service was contacted.",
            expectedUrl: preview.url,
            requests: externalRequests,
          },
          null,
          2,
        ),
        contentType: "application/json",
      })
    })
  }
})

test("public Pro wrapper bounds its ID before explicit external navigation", async ({
  page,
}) => {
  test.slow()
  const requests: string[] = []

  for (const origin of fixtureOrigins) {
    await page.route(`${origin}/**`, async (route) => {
      requests.push(route.request().url())
      await route.fulfill({
        status: 200,
        contentType: "text/html; charset=utf-8",
        body: fixtureDocument,
      })
    })
  }

  await page.goto("/editor/examples#public-external-previews")
  const entry = page.getByTestId("editor-example-public-external-previews")
  await entry.getByRole("button", { name: "Live preview", exact: true }).click()
  const card = entry.getByTestId("public-external-preview-pro-iframe")

  const identifier = card.getByRole("textbox", {
    name: "Plate Pro example ID",
    exact: true,
  })

  const load = card.getByRole("button", {
    name: "Load Plate Pro example preview",
    exact: true,
  })

  for (const value of [
    "",
    "../other",
    "media-controller?token=secret",
    "https://untrusted.invalid",
    "a".repeat(129),
  ]) {
    await identifier.fill(value)
    await expect(load).toBeDisabled()
    await expect(card.getByRole("alert")).toBeVisible()
    await expect(card.locator("iframe")).toHaveCount(0)
    expect(requests).toEqual([])
  }

  await identifier.fill("basic-blocks")
  await expect(card.getByRole("alert")).toHaveCount(0)
  await expect(load).toBeEnabled()
  expect(requests).toEqual([])
  await load.click()
  const frame = card.locator("iframe")
  await expect(frame).toHaveAttribute(
    "src",
    "https://pro.platejs.org/iframe/basic-blocks",
  )
  await expect(frame).toHaveAttribute("title", "basic-blocks")
  await expect(identifier).toBeDisabled()
  await expect
    .poll(() => requests)
    .toEqual(["https://pro.platejs.org/iframe/basic-blocks"])
  await card
    .getByRole("button", {
      name: "Remove Plate Pro example preview",
      exact: true,
    })
    .click()
  await expect(frame).toHaveCount(0)
  await expect(identifier).toBeEnabled()
})
