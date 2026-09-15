import type { Page } from "@playwright/test"

import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

const examples = [
  ...Array.from({ length: 24 }, (_, index) => `p-input-group-${index + 1}`),
  "p-input-group-26",
  "p-input-group-27",
  "p-input-group-28",
  "p-input-group-29",
]

function isLocalUrl(url: string) {
  try {
    const hostname = new URL(url).hostname
    return hostname === "localhost" || hostname === "127.0.0.1"
  } catch {
    return false
  }
}

function monitorPage(page: Page) {
  const failures: string[] = []
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
    const assets = new Set(["font", "image", "script", "stylesheet"])
    if (
      isLocalUrl(response.url()) &&
      response.status() >= 400 &&
      assets.has(response.request().resourceType())
    ) {
      failures.push(`asset: ${response.status()} ${response.url()}`)
    }
  })
  return function expectNoFailures() {
    expect(failures).toEqual([])
  }
}

async function openExample(page: Page, example: string) {
  await page.goto(`/examples/${example}`)
  await expect(page.locator("[data-example-root]")).toBeVisible()
  await expect(page.getByText("Loading example…")).toHaveCount(0)
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1,
    ),
  ).toBe(true)
}

async function expectNoAxeViolations(page: Page) {
  const results = await new AxeBuilder({ page }).analyze()
  expect(results.violations).toEqual([])
}

test.describe.configure({ timeout: 300_000 })

test("input-group renders every addon, size, and textarea example", async ({
  page,
}) => {
  const expectNoFailures = monitorPage(page)

  for (const example of examples) {
    await openExample(page, example)
    const group = page.locator('[data-slot="input-group"]').first()
    await expect(group).toBeVisible()
    await expect(group).toHaveAttribute("role", "group")
    await expect(group.locator("input, textarea").first()).toBeVisible()
  }

  expectNoFailures()
})

test("input-group controls update counters, clear, toggle, and disable", async ({
  page,
}) => {
  const expectNoFailures = monitorPage(page)

  await openExample(page, "p-input-group-22")
  const clearable = page.getByRole("textbox", {
    name: "Text input with clear button",
  })
  await expect(clearable).toHaveValue("Clear me")
  await page.getByRole("button", { name: "Clear input" }).click()
  await expect(clearable).toHaveValue("")
  await expect(page.getByRole("button", { name: "Clear input" })).toHaveCount(0)

  await openExample(page, "p-input-group-24")
  const username = page.getByRole("textbox", { name: "Username" })
  await username.fill("component")
  await expect(page.getByRole("status")).toHaveText("9/14")

  await openExample(page, "p-input-group-26")
  const password = page.getByRole("textbox", {
    exact: true,
    name: "Password",
  })
  await password.fill("StrongPass1")
  await expect(page.getByText(/Strong password/)).toBeVisible()
  await expect(password).toHaveAttribute("type", "password")
  await page.getByRole("button", { name: "Show password" }).click()
  await expect(password).toHaveAttribute("type", "text")
  await expect(
    page.getByRole("button", { name: "Hide password" }),
  ).toBeVisible()

  await openExample(page, "p-input-group-12")
  await expect(
    page.getByRole("button", { name: "Email notification details" }),
  ).toBeVisible()

  await openExample(page, "p-input-group-15")
  await expect(
    page.getByRole("textbox", { name: "Subscribe to our newsletter" }),
  ).toBeDisabled()
  await expect(page.getByRole("button", { name: "Subscribe" })).toBeDisabled()

  expectNoFailures()
})

test("input-group block addons keep textarea and toolbar interactions usable", async ({
  page,
}) => {
  const expectNoFailures = monitorPage(page)

  await openExample(page, "p-input-group-19")
  const textarea = page.getByPlaceholder("Tell us about yourself…")
  await textarea.fill("Direct component test")
  await expect(textarea).toHaveValue("Direct component test")
  const bold = page.getByRole("button", { name: "Toggle bold" })
  await bold.click()
  await expect(bold).toHaveAttribute("data-pressed")
  await bold.focus()
  await expect(bold).toBeFocused()

  await openExample(page, "p-input-group-27")
  await expect(page.getByRole("combobox", { name: "Language" })).toBeVisible()

  await openExample(page, "p-input-group-28")
  const composer = page.getByPlaceholder("Compose your message…")
  await composer.fill("Hello")
  await expect(composer).toHaveValue("Hello")
  await page.getByRole("button", { name: "Attach file" }).hover()
  await expect(page.locator('[data-slot="tooltip-popup"]')).toHaveText(
    "Attach file",
  )

  expectNoFailures()
})

test("input-group small, default, and large controls have ordered heights", async ({
  page,
}) => {
  const expectNoFailures = monitorPage(page)
  const heights: number[] = []

  for (const example of [
    "p-input-group-13",
    "p-input-group-1",
    "p-input-group-14",
  ]) {
    await openExample(page, example)
    const box = await page.locator('[data-slot="input-group"]').boundingBox()
    expect(box).not.toBeNull()
    heights.push(box?.height ?? 0)
  }

  expect(heights[0]).toBeLessThan(heights[1])
  expect(heights[1]).toBeLessThan(heights[2])
  expectNoFailures()
})

test("@full-a11y input-group examples pass axe before and after changes", async ({
  page,
}) => {
  const expectNoFailures = monitorPage(page)

  for (const example of examples) {
    await openExample(page, example)
    await expectNoAxeViolations(page)
  }

  await openExample(page, "p-input-group-22")
  await page.getByRole("button", { name: "Clear input" }).click()
  await expectNoAxeViolations(page)

  await openExample(page, "p-input-group-26")
  await page
    .getByRole("textbox", { exact: true, name: "Password" })
    .fill("StrongPass1")
  await page.getByRole("button", { name: "Show password" }).click()
  await expectNoAxeViolations(page)

  expectNoFailures()
})
