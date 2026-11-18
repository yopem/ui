import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"
import { readFile } from "node:fs/promises"

import { openPreview } from "./helpers"

const source = [
  "export async function GET(request: Request) {",
  "  const { searchParams } = new URL(request.url)",
  '  const city = searchParams.get("city") ?? "Portland"',
  "",
  "  const response = await fetch(`https://weather.example.com/v1/forecast?city=${encodeURIComponent(city)}&units=metric&include=hourly,wind,humidity`, {",
  '    headers: { Accept: "application/json" },',
  "  })",
  "  const forecast = await response.json()",
  "",
  "  return Response.json({ city, forecast, updatedAt: new Date().toISOString() })",
  "}",
].join("\n")

test("one numbered route demo copies its original source repeatedly", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"])
  await openPreview(page, "codeblock")
  const preview = page.getByLabel(/live preview$/).first()
  const block = preview.locator('[data-slot="codeblock"]')

  await expect(block).toHaveCount(1)
  await expect(block.locator('[data-slot="codeblock-title"]')).toHaveText(
    "app/api/weather/route.ts",
  )
  await expect(block.locator("pre")).toHaveCount(1)
  await expect(block.locator("pre pre")).toHaveCount(0)
  await expect(block.locator("pre")).toHaveAttribute("data-numbered", "true")
  await expect(
    block
      .locator('[data-slot="codeblock-line"][data-variant="highlighted"]')
      .first(),
  ).toBeVisible()
  await expect(block.locator('[data-slot="codeblock-footer"]')).toHaveCount(0)

  for (let attempt = 0; attempt < 2; attempt++) {
    await page.evaluate(() => navigator.clipboard.writeText("replacement"))
    await block.getByRole("button", { name: "Copy code" }).click()
    await expect
      .poll(() => page.evaluate(() => navigator.clipboard.readText()))
      .toBe(source)
  }

  await expect(
    block.locator('[data-slot="codeblock-copy"]'),
  ).not.toHaveAttribute("data-copied", "true")
  await expect(block.locator('[data-slot="codeblock-status"]')).toBeEmpty()
})

test("download saves the same original TypeScript source", async ({ page }) => {
  await openPreview(page, "codeblock")
  const preview = page.getByLabel(/live preview$/).first()
  const pendingDownload = page.waitForEvent("download")
  await preview.getByRole("link", { name: "Download", exact: true }).click()
  const download = await pendingDownload
  expect(download.suggestedFilename()).toBe("route.ts")
  const path = await download.path()

  if (path === null) throw new Error("The code download has no saved file")

  expect(await readFile(path, "utf8")).toBe(source)
})

test("copy failure is announced and copying can be retried", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"])
  await openPreview(page, "codeblock")

  const block = page
    .getByLabel(/live preview$/)
    .first()
    .locator('[data-slot="codeblock"]')

  await page.evaluate(() => {
    const writeText = navigator.clipboard.writeText.bind(navigator.clipboard)
    let first = true

    Object.defineProperty(navigator.clipboard, "writeText", {
      configurable: true,
      value: (text: string) => {
        if (first) {
          first = false

          return Promise.reject(new Error("Clipboard unavailable"))
        }

        return writeText(text)
      },
    })
  })

  const copy = block.getByRole("button", { name: "Copy code" })
  await copy.click()
  const status = block.getByRole("status")
  await expect(status).toContainText(/could not|failed|unable|error/i)
  await expect(copy).toBeEnabled()
  await copy.click()
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toBe(source)
  await expect(status).not.toContainText(/could not|failed|unable|error/i)
})

test("wrap reflows the actual highlighted long line without changing the preview width", async ({
  page,
}) => {
  await openPreview(page, "codeblock")
  const preview = page.getByLabel(/live preview$/).first()
  const block = preview.locator('[data-slot="codeblock"]')
  const wrap = block.getByRole("button", { name: "Wrap lines" })
  const pre = block.locator("pre")

  await expect(wrap).toHaveAttribute("aria-pressed", "false")
  await expect
    .poll(() =>
      pre.evaluate((element) => element.scrollWidth > element.clientWidth),
    )
    .toBe(true)

  const originalHeight = await pre.evaluate(
    (element) => element.getBoundingClientRect().height,
  )

  const originalWidth = await block.evaluate(
    (element) => element.getBoundingClientRect().width,
  )

  await wrap.focus()

  for (let step = 0; step < 4; step++) {
    await page.keyboard.press("Tab")

    if (await pre.evaluate((element) => element === document.activeElement))
      break
  }

  await expect(pre).toBeFocused()
  await page.keyboard.press("ArrowRight")
  await expect
    .poll(() => pre.evaluate((element) => element.scrollLeft))
    .toBeGreaterThan(0)

  await wrap.focus()
  await page.keyboard.press("Space")
  await expect(wrap).toHaveAttribute("aria-pressed", "true")
  await expect
    .poll(() =>
      pre.evaluate((element) => element.scrollWidth <= element.clientWidth),
    )
    .toBe(true)
  await expect
    .poll(() =>
      pre.evaluate((element) => element.getBoundingClientRect().height),
    )
    .toBeGreaterThan(originalHeight)
  expect(
    await block.evaluate((element) => element.getBoundingClientRect().width),
  ).toBe(originalWidth)
  await page.keyboard.press("Space")
  await expect(wrap).toHaveAttribute("aria-pressed", "false")
  await expect
    .poll(() =>
      pre.evaluate((element) => element.scrollWidth > element.clientWidth),
    )
    .toBe(true)
})

test("@a11y route demo has no accessibility violations before or after wrapping", async ({
  page,
}, testInfo) => {
  await openPreview(page, "codeblock")
  const preview = page.getByLabel(/live preview$/).first()
  await expect(preview.locator('[data-slot="codeblock"]')).toBeVisible()

  for (const state of ["unwrapped", "wrapped"]) {
    if (state === "wrapped")
      await preview.getByRole("button", { name: "Wrap lines" }).click()

    const results = await new AxeBuilder({ page })
      .include('[aria-label$="live preview"]')
      .analyze()

    expect(results.violations).toEqual([])
    await preview.screenshot({
      path: testInfo.outputPath(`codeblock-${state}.png`),
    })
  }
})
