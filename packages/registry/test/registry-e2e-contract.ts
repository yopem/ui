import type { Locator, Page } from "@playwright/test"

import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

export type RegistryComponentAction =
  | "activate"
  | "check"
  | "context-menu"
  | "day"
  | "expand"
  | "fill"
  | "hover"
  | "increment"
  | "none"
  | "select"
  | "slide"
  | "tabs"

export interface RegistryComponentE2EContract {
  action: RegistryComponentAction
  afterSelector?: string
  disabledExample?: string
  errorExample?: string
  example?: string
  pagePath?: string
  selector: string
  source: string
  target?: string
}

export interface RegistryArtifactE2EContract {
  contains: string[]
  contentType: "css" | "json"
  pagePath?: string
  path: string
  source: string
}

function isLocalUrl(url: string) {
  try {
    const hostname = new URL(url).hostname
    return hostname === "localhost" || hostname === "127.0.0.1"
  } catch {
    return false
  }
}

function captureFailures(page: Page) {
  const failures: string[] = []
  const onConsole = (message: { text(): string; type(): string }) => {
    if (message.type() === "error") failures.push(`console: ${message.text()}`)
  }
  const onPageError = (error: Error) => failures.push(`page: ${error.message}`)
  const onRequestFailed = (request: {
    failure(): null | { errorText: string }
    url(): string
  }) => {
    if (!isLocalUrl(request.url())) return
    failures.push(
      `request: ${request.url()} ${request.failure()?.errorText ?? "failed"}`,
    )
  }
  const onResponse = (response: {
    request(): { resourceType(): string }
    status(): number
    url(): string
  }) => {
    const assetTypes = new Set(["font", "image", "script", "stylesheet"])
    if (
      isLocalUrl(response.url()) &&
      response.status() >= 400 &&
      assetTypes.has(response.request().resourceType())
    ) {
      failures.push(`asset: ${response.status()} ${response.url()}`)
    }
  }

  page.on("console", onConsole)
  page.on("pageerror", onPageError)
  page.on("requestfailed", onRequestFailed)
  page.on("response", onResponse)

  return function expectNoFailures() {
    page.off("console", onConsole)
    page.off("pageerror", onPageError)
    page.off("requestfailed", onRequestFailed)
    page.off("response", onResponse)
    expect(failures).toEqual([])
  }
}

async function gotoComponent(
  page: Page,
  contract: RegistryComponentE2EContract,
  example = contract.example,
) {
  const path = example
    ? `/examples/${example}`
    : (contract.pagePath ?? `/components/${contract.source}`)
  await page.goto(path)
  await expect(page.locator("main").first()).toBeVisible({ timeout: 30_000 })
  if (example) {
    await expect(page.locator("[data-example-root]")).toBeVisible({
      timeout: 30_000,
    })
    await expect(page.getByText("Loading example…")).toHaveCount(0, {
      timeout: 30_000,
    })
  }
  const viewportFits = await page.evaluate(
    () => document.documentElement.scrollWidth <= window.innerWidth + 1,
  )
  expect(viewportFits).toBe(true)
}

async function expectRenderedState(
  page: Page,
  contract: RegistryComponentE2EContract,
) {
  const rendered = page
    .locator(contract.selector)
    .filter({ visible: true })
    .first()
  await expect(rendered).toBeVisible()
  const box = await rendered.boundingBox()
  expect(box).not.toBeNull()
  expect(box?.width ?? 0).toBeGreaterThan(0)
  expect(box?.height ?? 0).toBeGreaterThan(0)
}

function interactionTarget(page: Page, contract: RegistryComponentE2EContract) {
  const defaults: Record<RegistryComponentAction, string> = {
    activate: "button:not([disabled]), a[href]",
    check:
      '[role="checkbox"]:not([aria-disabled="true"]), [role="radio"]:not([aria-disabled="true"]), [role="switch"]:not([aria-disabled="true"]), [aria-pressed]:not([disabled])',
    "context-menu": '[data-slot="context-menu-trigger"]',
    day: '[role="gridcell"] button:not([disabled])',
    expand: "[aria-expanded]:not([disabled])",
    fill: 'input:not([disabled]):not([type="hidden"]), textarea:not([disabled]), [contenteditable="true"]',
    hover: '[data-slot="preview-card-trigger"], [data-slot="tooltip-trigger"]',
    increment: '[role="spinbutton"]:not([disabled])',
    none: contract.selector,
    select: '[role="combobox"]:not([aria-disabled="true"])',
    slide: '[role="slider"]:not([aria-disabled="true"])',
    tabs: '[role="tab"]:not([disabled])',
  }
  return page
    .locator(contract.target ?? defaults[contract.action])
    .filter({ visible: true })
    .first()
}

async function controlState(target: Locator) {
  const acceptsValue = await target.evaluate(
    (element) =>
      element instanceof HTMLInputElement ||
      element instanceof HTMLTextAreaElement,
  )
  if (acceptsValue) return target.inputValue()
  return (
    (await target.getAttribute("aria-checked")) ??
    (await target.getAttribute("aria-pressed")) ??
    (await target.getAttribute("aria-expanded")) ??
    (await target.getAttribute("aria-selected")) ??
    (await target.getAttribute("aria-valuenow")) ??
    (await target.getAttribute("value"))
  )
}

async function expectAfterState(
  page: Page,
  contract: RegistryComponentE2EContract,
) {
  if (contract.afterSelector) {
    await expect(
      page.locator(contract.afterSelector).filter({ visible: true }).first(),
    ).toBeVisible()
  }
}

async function performInteraction(
  page: Page,
  contract: RegistryComponentE2EContract,
) {
  if (contract.action === "none") return false

  const target = interactionTarget(page, contract)
  await expect(target).toBeVisible()
  const focusable = await target.evaluate(
    (element) => element instanceof HTMLElement && element.tabIndex >= 0,
  )
  if (focusable) {
    await target.focus()
    await expect(target).toBeFocused()
  }
  const before = await controlState(target)

  switch (contract.action) {
    case "activate":
    case "expand":
      await target.press("Enter")
      break
    case "check":
      if ((await target.getAttribute("role")) === "radio") {
        await target.press("ArrowRight")
        await expect(target).not.toBeFocused()
        return true
      }
      await target.press("Space")
      break
    case "context-menu":
      await target.click({ button: "right" })
      break
    case "day":
      await target.press("Enter")
      break
    case "fill": {
      const value = contract.source === "otp-field" ? "1" : "Registry contract"
      await target.fill(value)
      await expect(target).toHaveValue(value)
      break
    }
    case "hover":
      await target.hover()
      break
    case "increment":
      await target.press("ArrowUp")
      break
    case "select":
      await target.press("Space")
      break
    case "slide":
      await target.press("ArrowRight")
      break
    case "tabs":
      await target.press("ArrowRight")
      await expect(target).not.toBeFocused()
      return true
  }

  await expectAfterState(page, contract)
  const after = await controlState(target)
  if (before !== null && !contract.afterSelector) expect(after).not.toBe(before)
  return true
}

async function expectStateExample(
  page: Page,
  contract: RegistryComponentE2EContract,
  example: string,
  selector: string,
) {
  await gotoComponent(page, contract, example)
  const state = page.locator(selector).filter({ visible: true }).first()
  if (selector.includes("aria-invalid") && (await state.count()) === 0) {
    const input = page
      .locator("input:not([disabled]), textarea:not([disabled])")
      .filter({ visible: true })
      .first()
    if (await input.count()) {
      const invalidTextSources = new Set([
        "field",
        "form",
        "input",
        "input-group",
        "number-field",
      ])
      const value =
        contract.source === "otp-field"
          ? "000000"
          : invalidTextSources.has(contract.source)
            ? "invalid"
            : ""
      await input.focus()
      await input.fill(value)
      await input.press("Escape")
      await input.blur()
    }
    const submit = page
      .locator('button[type="submit"]')
      .filter({ visible: true })
      .first()
    if (await submit.count()) await submit.click()
  }
  await expect(state).toBeVisible()
}

async function expectNoAxeViolations(page: Page) {
  const results = await new AxeBuilder({ page })
    .disableRules(["heading-order"])
    .exclude("main[data-example-root] > h1")
    .analyze()
  expect(results.violations).toEqual([])
}

export function defineRegistryComponentE2E(
  contract: RegistryComponentE2EContract,
) {
  if (typeof Bun !== "undefined") return

  test(`${contract.source} renders, responds, and stays browser-clean`, async ({
    page,
  }) => {
    test.setTimeout(120_000)
    const expectNoFailures = captureFailures(page)
    await gotoComponent(page, contract)
    await expectRenderedState(page, contract)
    await performInteraction(page, contract)
    if (contract.disabledExample) {
      await expectStateExample(
        page,
        contract,
        contract.disabledExample,
        ':disabled, [aria-disabled="true"]',
      )
    }
    if (contract.errorExample) {
      await expectStateExample(
        page,
        contract,
        contract.errorExample,
        '[aria-invalid="true"], [data-invalid], [data-slot="field-error"], [role="alert"]',
      )
    }
    expectNoFailures()
  })

  test(`@full-a11y ${contract.source} initial and changed states`, async ({
    page,
  }) => {
    test.setTimeout(120_000)
    const expectNoFailures = captureFailures(page)
    await gotoComponent(page, contract)
    await expectRenderedState(page, contract)
    await expectNoAxeViolations(page)
    const changed = await performInteraction(page, contract)
    if (changed) await expectNoAxeViolations(page)
    expectNoFailures()
  })
}

export function defineRegistryArtifactE2E(
  contract: RegistryArtifactE2EContract,
) {
  if (typeof Bun !== "undefined") return

  test(`${contract.source} is valid in served production output`, async ({
    page,
    request,
  }) => {
    test.setTimeout(120_000)
    const response = await request.get(contract.path)
    expect(response.ok()).toBe(true)
    const body = await response.text()
    for (const expected of contract.contains) expect(body).toContain(expected)
    if (contract.contentType === "json") {
      const value: unknown = JSON.parse(body)
      expect(value).not.toBeNull()
      expect(JSON.stringify(value).length).toBeGreaterThan(20)
    }

    const expectNoFailures = captureFailures(page)
    await page.goto(contract.pagePath ?? "/components/button")
    await expect(page.locator("main").first()).toBeVisible()
    const viewportFits = await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1,
    )
    expect(viewportFits).toBe(true)
    expectNoFailures()
  })

  test(`@full-a11y ${contract.source} production surface`, async ({ page }) => {
    test.setTimeout(120_000)
    const expectNoFailures = captureFailures(page)
    await page.goto(contract.pagePath ?? "/components/button")
    await expect(page.locator("main").first()).toBeVisible()
    await expectNoAxeViolations(page)
    expectNoFailures()
  })
}
