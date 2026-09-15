import type { Page, Request, Response } from "@playwright/test"

import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

const assetTypes = new Set(["font", "image", "media", "script", "stylesheet"])
const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type=hidden])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[contenteditable=true]",
  "[tabindex]:not([tabindex='-1'])",
].join(",")

function isFailedAsset(page: Page, url: string, resourceType: string) {
  if (!assetTypes.has(resourceType) || !page.url().startsWith("http"))
    return false

  return new URL(url).origin === new URL(page.url()).origin
}

function trackFailures(page: Page) {
  const consoleErrors: string[] = []
  const pageErrors: string[] = []
  const assetFailures: string[] = []

  function onConsole(message: { text(): string; type(): string }) {
    if (message.type() === "error") consoleErrors.push(message.text())
  }

  function onPageError(error: Error) {
    pageErrors.push(error.message)
  }

  function onRequestFailed(request: Request) {
    if (isFailedAsset(page, request.url(), request.resourceType()))
      assetFailures.push(
        `${request.resourceType()} ${request.url()} ${
          request.failure()?.errorText ?? "request failed"
        }`,
      )
  }

  function onResponse(response: Response) {
    const request = response.request()
    if (
      response.status() >= 400 &&
      isFailedAsset(page, response.url(), request.resourceType())
    )
      assetFailures.push(
        `${request.resourceType()} ${response.status()} ${response.url()}`,
      )
  }

  page.on("console", onConsole)
  page.on("pageerror", onPageError)
  page.on("requestfailed", onRequestFailed)
  page.on("response", onResponse)

  return {
    expectNone() {
      expect(consoleErrors, "console errors").toEqual([])
      expect(pageErrors, "page errors").toEqual([])
      expect(assetFailures, "failed same-origin assets").toEqual([])
    },
    stop() {
      page.off("console", onConsole)
      page.off("pageerror", onPageError)
      page.off("requestfailed", onRequestFailed)
      page.off("response", onResponse)
    },
  }
}

async function openExample(page: Page, name: string, theme: "dark" | "light") {
  const response = await page.goto(`/examples/${name}?theme=${theme}`, {
    waitUntil: "domcontentloaded",
  })
  expect(response?.ok()).toBe(true)
  await expect(page).toHaveURL(`/examples/${name}?theme=${theme}`)

  const root = page.locator("[data-example-root]")
  await expect(root).toBeVisible()
  await expect(root).toHaveAttribute("data-theme", theme)
  await expect(page.getByRole("heading", { name, level: 1 })).toBeAttached()
  await expect(page.getByText("Loading example…", { exact: true })).toHaveCount(
    0,
  )
  await expect(
    page.getByText("Example could not load. Refresh the page and try again.", {
      exact: true,
    }),
  ).toHaveCount(0)
  await expect(root.locator(":scope > :not(h1)")).not.toHaveCount(0)
  await page.waitForFunction(() => document.fonts.status === "loaded")
  await page.waitForLoadState("networkidle")
  return root
}

async function expectResponsive(page: Page) {
  for (const viewport of [
    { height: 800, width: 1280 },
    { height: 844, width: 390 },
  ]) {
    await page.setViewportSize(viewport)
    const root = page.locator("[data-example-root]")
    await expect(root).toBeVisible()
    const widths = await root.evaluate((element) => ({
      document: document.documentElement.scrollWidth,
      root: element.getBoundingClientRect().width,
      viewport: document.documentElement.clientWidth,
    }))
    expect(widths.root).toBeLessThanOrEqual(widths.viewport + 1)
    expect(widths.document).toBeLessThanOrEqual(widths.viewport + 1)
  }
}

async function expectKeyboardFocusWhenInteractive(page: Page) {
  const root = page.locator("[data-example-root]")
  const focusable = root.locator(focusableSelector)
  const visibleCount = await focusable.evaluateAll(
    (elements) =>
      elements.filter((element) => {
        const style = getComputedStyle(element)
        return (
          style.display !== "none" &&
          style.visibility !== "hidden" &&
          element.getClientRects().length > 0
        )
      }).length,
  )
  if (!visibleCount) return

  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement)
      document.activeElement.blur()
  })
  for (let index = 0; index <= visibleCount; index += 1) {
    await page.keyboard.press("Tab")
    if (
      await page.evaluate(() =>
        Boolean(
          document
            .querySelector("[data-example-root]")
            ?.contains(document.activeElement),
        ),
      )
    )
      return
  }
  expect(false, "interactive example has no keyboard focus target").toBe(true)
}

export function defineExampleE2EContract(name: string) {
  test.describe(name, () => {
    test("renders light and dark previews without runtime failures", async ({
      page,
    }) => {
      const failures = trackFailures(page)
      const backgrounds = new Set<string>()
      try {
        for (const theme of ["light", "dark"] as const) {
          const root = await openExample(page, name, theme)
          backgrounds.add(
            await root.evaluate(
              (element) => getComputedStyle(element).backgroundColor,
            ),
          )
          await expectResponsive(page)
          await expectKeyboardFocusWhenInteractive(page)
        }
        expect(backgrounds.size).toBe(2)
        failures.expectNone()
      } finally {
        failures.stop()
      }
    })

    test(`@full-a11y ${name} light and dark previews pass axe`, async ({
      page,
    }) => {
      test.setTimeout(60_000)
      const failures = trackFailures(page)
      try {
        for (const theme of ["light", "dark"] as const) {
          await openExample(page, name, theme)
          const result = await new AxeBuilder({ page })
            .include("[data-example-root]")
            .analyze()
          expect(
            result.violations.map(({ help, id, nodes }) => ({
              help,
              id,
              targets: nodes.flatMap(({ target }) => target),
            })),
          ).toEqual([])
        }
        failures.expectNone()
      } finally {
        failures.stop()
      }
    })
  })
}
