import { expect, test, type Page, type TestInfo } from "@playwright/test"
import { readdir, writeFile } from "node:fs/promises"
import { resolve } from "node:path"
import { PNG } from "pngjs"

test.skip(
  !process.env.FULL_PARITY,
  "Set FULL_PARITY=1 to run all 508 visual comparisons",
)

const parityFilter = (process.env.PARITY_FILTER ?? "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean)

const demos = (
  await readdir(
    resolve(import.meta.dirname, "../../apps/docs/src/components/demos/stylex"),
  )
)
  .filter((file) => file.endsWith(".tsx"))
  .map((file) => file.slice(0, -4))
  .filter(
    (demo) =>
      parityFilter.length === 0 ||
      parityFilter.some((component) => matchesComponent(demo, component)),
  )
  .sort()
  .slice(
    0,
    process.env.PARITY_LIMIT ? Number(process.env.PARITY_LIMIT) : undefined,
  )

const matrices = [
  { height: 720, name: "desktop-light", theme: "light", width: 1280 },
  { height: 720, name: "desktop-dark", theme: "dark", width: 1280 },
  { height: 844, name: "mobile-light", theme: "light", width: 390 },
  { height: 844, name: "mobile-dark", theme: "dark", width: 390 },
] as const

const criticalStates = [
  { demo: "p-button-1", name: "hover" },
  { demo: "p-button-1", name: "focus" },
  { demo: "p-button-18", name: "disabled-loading" },
  { demo: "p-dialog-1", name: "open" },
  { demo: "p-tabs-1", name: "selected" },
  { demo: "p-otp-field-7", name: "invalid" },
] as const

const activeCriticalStates = process.env.PARITY_SKIP_STATES
  ? []
  : criticalStates.filter(
      ({ demo }) =>
        parityFilter.length === 0 ||
        parityFilter.some((component) => matchesComponent(demo, component)),
    )

function matchesComponent(demo: string, component: string) {
  const prefix = `p-${component}-`
  return demo.startsWith(prefix) && /^\d+$/.test(demo.slice(prefix.length))
}

for (const matrix of matrices) {
  test(`@parity ${matrix.name} matches all demos pixel-for-pixel`, async ({
    browser,
  }, testInfo) => {
    test.setTimeout(45 * 60_000)
    const context = await browser.newContext({
      locale: "en-US",
      reducedMotion: "reduce",
      timezoneId: "UTC",
      viewport: { height: matrix.height, width: matrix.width },
    })
    await context.route("https://images.unsplash.com/**", (route) =>
      route.fulfill({
        body: '<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128"><rect width="128" height="128" fill="#d4d4d8"/></svg>',
        contentType: "image/svg+xml",
        status: 200,
      }),
    )
    await context.addInitScript(() => {
      const now = Date.UTC(2026, 0, 15, 12)
      const NativeDate = Date
      globalThis.Date = new Proxy(NativeDate, {
        construct(target, args) {
          return Reflect.construct(target, args.length ? args : [now])
        },
        get(target, property) {
          if (property === "now") return () => now
          return Reflect.get(target, property)
        },
      })
      Math.random = () => 0.5
      globalThis.setInterval = (() => 0) as typeof setInterval
      globalThis.clearInterval = () => undefined
      const style = document.createElement("style")
      style.textContent =
        "*,*::before,*::after{animation:none!important;caret-color:transparent!important;transition:none!important}"
      document.documentElement.append(style)
    })
    const tailwind = await context.newPage()
    const stylex = await context.newPage()
    const mismatches: string[] = []

    for (const [index, demo] of demos.entries()) {
      if (index % 50 === 0) {
        process.stdout.write(`[${matrix.name}] ${index}/${demos.length}\n`)
      }
      let [tailwindShot, stylexShot] = await Promise.all(
        (
          [
            [tailwind, "tailwind"],
            [stylex, "stylex"],
          ] as const
        ).map(async ([page, system]) => {
          if (index === 0) {
            await page.goto(
              `/render/${system}/${matrix.theme}/${encodeURIComponent(demo)}`,
            )
          } else {
            await page
              .locator("[data-demo-selector]")
              .evaluate((element, nextDemo) => {
                const select = element as HTMLSelectElement
                select.value = nextDemo
                select.dispatchEvent(new Event("change", { bubbles: true }))
              }, demo)
          }
          await expect(page.locator("[data-parity-root]")).toHaveAttribute(
            "data-demo",
            demo,
          )
          await page.waitForFunction(
            () =>
              document.fonts.status === "loaded" &&
              [...document.images].every((image) => image.complete) &&
              !document.body.textContent?.includes("Loading demo…"),
          )
          return screenshotAfterRender(page)
        }),
      )
      for (
        let attempt = 0;
        attempt < 3 && !pixelsEqual(tailwindShot, stylexShot);
        attempt += 1
      ) {
        await Promise.all([
          tailwind.waitForTimeout(250),
          stylex.waitForTimeout(250),
        ])
        ;[tailwindShot, stylexShot] = await Promise.all([
          stableScreenshot(tailwind),
          stableScreenshot(stylex),
        ])
      }
      if (!pixelsEqual(tailwindShot, stylexShot)) {
        mismatches.push(demo)
        if (mismatches.length <= 10) {
          await saveComparison(testInfo, demo, tailwindShot, stylexShot)
        }
      }
    }

    for (const state of activeCriticalStates) {
      const [tailwindShot, stylexShot] = await Promise.all(
        (
          [
            [tailwind, "tailwind"],
            [stylex, "stylex"],
          ] as const
        ).map(async ([page, system]) => {
          await page.goto(`/render/${system}/${matrix.theme}/${state.demo}`)
          await page.locator("[data-parity-root]").waitFor()
          await page.waitForFunction(
            () =>
              document.fonts.status === "loaded" &&
              [...document.images].every((image) => image.complete) &&
              !document.body.textContent?.includes("Loading demo…"),
          )
          await page.mouse.move(0, 0)
          await applyCriticalState(page, state.name)
          return screenshotAfterRender(page)
        }),
      )
      if (!pixelsEqual(tailwindShot, stylexShot)) {
        mismatches.push(`${state.demo}:${state.name}`)
        await saveComparison(
          testInfo,
          `${state.demo}-${state.name}`,
          tailwindShot,
          stylexShot,
        )
      }
    }

    await context.close()
    expect(
      mismatches,
      `${mismatches.length}/${demos.length + activeCriticalStates.length} comparisons differ`,
    ).toEqual([])
  })
}

async function saveComparison(
  testInfo: TestInfo,
  name: string,
  tailwind: Buffer,
  stylexShot: Buffer,
) {
  const tailwindPath = testInfo.outputPath(`${name}-tailwind.png`)
  const stylexPath = testInfo.outputPath(`${name}-stylex.png`)
  await Promise.all([
    writeFile(tailwindPath, tailwind),
    writeFile(stylexPath, stylexShot),
  ])
  await Promise.all([
    testInfo.attach(`${name}-tailwind`, {
      contentType: "image/png",
      path: tailwindPath,
    }),
    testInfo.attach(`${name}-stylex`, {
      contentType: "image/png",
      path: stylexPath,
    }),
  ])
}

async function applyCriticalState(
  page: Page,
  state: (typeof criticalStates)[number]["name"],
) {
  if (state === "hover") {
    await page.getByRole("button", { name: "Button" }).hover()
  } else if (state === "focus") {
    await page.keyboard.press("Tab")
  } else if (state === "open") {
    await page.getByRole("button", { name: "Open Dialog" }).click()
    await expect(
      page.getByRole("dialog", { name: "Edit profile" }),
    ).toBeVisible()
  } else if (state === "selected") {
    await page.getByRole("tab", { name: "Tab 2" }).click()
    await expect(page.getByText("Tab 2 content")).toBeVisible()
  } else if (state === "invalid") {
    await page.getByRole("textbox").first().click()
    await page.keyboard.type("654321")
    await expect(page.getByText("Code must be 123456.")).toBeVisible()
  }
}

function pixelsEqual(left: Buffer, right: Buffer) {
  if (left.equals(right)) return true

  const leftPng = PNG.sync.read(left)
  const rightPng = PNG.sync.read(right)
  return (
    leftPng.width === rightPng.width &&
    leftPng.height === rightPng.height &&
    leftPng.data.equals(rightPng.data)
  )
}

async function screenshotAfterRender(page: Page) {
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  )
  return page.screenshot({ animations: "disabled" })
}

async function stableScreenshot(page: Page) {
  let previous = await page.screenshot({ animations: "disabled" })
  for (let attempt = 0; attempt < 5; attempt += 1) {
    await page.waitForTimeout(100)
    const current = await page.screenshot({ animations: "disabled" })
    if (pixelsEqual(previous, current)) return current
    previous = current
  }
  return previous
}
