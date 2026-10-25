import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Page } from "@playwright/test"

const storagePrefix = "yopem-ui:public-persisted:"

const firstDate = "2025-03-08"

const secondDate = "2025-03-09"

async function openPersistedExample(page: Page) {
  await page.goto("/editor/examples#public-persisted")
  const example = page.getByTestId("editor-example-public-persisted")
  await expect(example).toBeVisible()
  await example
    .getByRole("button", { name: "Live preview", exact: true })
    .click()
  await expect(
    example.getByRole("textbox", { name: "Daily editor", exact: true }),
  ).toHaveAttribute("contenteditable", "true")

  return example
}

test("public-persisted: saves full Lexical JSON by date and keeps it after reset", async ({
  page,
}, testInfo) => {
  const example = await openPersistedExample(page)
  const date = example.getByLabel("Draft date", { exact: true })

  const editor = example.getByRole("textbox", {
    name: "Daily editor",
    exact: true,
  })

  const save = example.getByRole("button", { name: "Save draft", exact: true })
  const load = example.getByRole("button", { name: "Load draft", exact: true })

  await expect(date).toHaveValue(firstDate)
  await editor.fill("Saved on the first date")
  await editor.press("ControlOrMeta+a")
  await example
    .getByRole("toolbar", { name: "Daily editor controls", exact: true })
    .getByRole("button", { name: "Bold", exact: true })
    .click()
  await expect(editor.locator("strong, b")).toHaveText(
    "Saved on the first date",
  )
  await save.click()
  await expect(example.getByRole("status")).toBeVisible()

  const savedBeforeReset = await page.evaluate(
    (key) => window.localStorage.getItem(key),
    `${storagePrefix}${firstDate}`,
  )

  await example
    .getByRole("button", { name: "Reset editor", exact: true })
    .click()
  await expect(editor).toHaveText("Daily draft starter")
  expect(
    await page.evaluate(
      (key) => window.localStorage.getItem(key),
      `${storagePrefix}${firstDate}`,
    ),
  ).toBe(savedBeforeReset)
  await load.click()
  await expect(editor.locator("strong, b")).toHaveText(
    "Saved on the first date",
  )

  await date.fill(secondDate)
  await expect(editor).toHaveAttribute("contenteditable", "true")
  await editor.fill("Saved on the second date")
  await save.click()
  await date.fill(firstDate)
  await expect(editor).toHaveAttribute("contenteditable", "true")
  await load.click()
  await expect(editor).toHaveText("Saved on the first date")
  await date.fill(secondDate)
  await expect(editor).toHaveAttribute("contenteditable", "true")
  await load.click()
  await expect(editor).toHaveText("Saved on the second date")

  await testInfo.attach("public-persisted-final.json", {
    body: await page.evaluate(
      (key) => window.localStorage.getItem(key) ?? "",
      `${storagePrefix}${secondDate}`,
    ),
    contentType: "application/json",
  })
})

test("public-persisted: loads before editing and automatically saves document changes", async ({
  page,
}) => {
  const key = `${storagePrefix}${firstDate}`

  const existing = JSON.stringify({
    root: {
      type: "root",
      version: 1,
      direction: null,
      format: "",
      indent: 0,
      children: [
        {
          type: "paragraph",
          version: 1,
          direction: null,
          format: "",
          indent: 0,
          children: [
            {
              type: "text",
              version: 1,
              detail: 0,
              format: 0,
              mode: "normal",
              style: "",
              text: "Existing saved draft",
            },
          ],
        },
      ],
    },
  })

  await page.addInitScript(
    ({ storageKey, value }) => window.localStorage.setItem(storageKey, value),
    { storageKey: key, value: existing },
  )

  const example = await openPersistedExample(page)

  const editor = example.getByRole("textbox", {
    name: "Daily editor",
    exact: true,
  })

  await expect(editor).toHaveText("Existing saved draft")
  expect(
    await page.evaluate(
      (storageKey) => window.localStorage.getItem(storageKey),
      key,
    ),
  ).toBe(existing)
  await editor.fill("Current editing session")
  await expect
    .poll(() =>
      page.evaluate(
        (storageKey) => window.localStorage.getItem(storageKey),
        key,
      ),
    )
    .toContain("Current editing session")
  await example
    .getByRole("button", { name: "Live preview", exact: true })
    .click()
  await expect(editor).toHaveCount(0)
  await example
    .getByRole("button", { name: "Live preview", exact: true })
    .click()
  await expect(editor).toHaveAttribute("contenteditable", "true")
  await expect(editor).toHaveText("Current editing session")
})

test("public-persisted: rejects corrupt or unavailable storage without replacing content", async ({
  page,
}) => {
  const example = await openPersistedExample(page)

  const editor = example.getByRole("textbox", {
    name: "Daily editor",
    exact: true,
  })

  const load = example.getByRole("button", { name: "Load draft", exact: true })

  await editor.fill("Keep this document")
  await page.evaluate(
    ({ key, value }) => window.localStorage.setItem(key, value),
    {
      key: `${storagePrefix}${firstDate}`,
      value: JSON.stringify({
        root: {
          type: "root",
          version: 1,
          children: [{ type: "unsupported", version: 1 }],
        },
      }),
    },
  )
  await load.click()
  await expect(example.getByRole("alert")).toBeVisible()
  await expect(editor).toHaveText("Keep this document")

  await page.evaluate(() => {
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      get: () => {
        throw new DOMException("Blocked", "SecurityError")
      },
    })
  })
  await editor.fill("Keep this document after storage failure")
  await example.getByRole("button", { name: "Save draft", exact: true }).click()
  await expect(example.getByRole("alert")).toBeVisible()
  await expect(editor).toHaveText("Keep this document after storage failure")

  await load.click()
  await expect(example.getByRole("alert")).toBeVisible()
  await expect(editor).toHaveText("Keep this document after storage failure")
})

test("public-persisted: copied source has consumer imports and a self-contained seed", async ({
  page,
  context,
}, testInfo) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"])
  const example = await openPersistedExample(page)
  await example
    .getByRole("button", { name: "Copy source", exact: true })
    .click()
  const source = await page.evaluate(() => navigator.clipboard.readText())

  expect(source).toContain('from "@/components/editor"')
  expect(source).toContain('from "@/components/editor/document"')
  expect(source).toContain('from "@/components/ui/button"')
  expect(source).not.toMatch(/@registry\/|@yopem-ui\//)
  expect(source).not.toMatch(/\.\/fixtures|\.\/shared/)
  await testInfo.attach("public-persisted-consumer.tsx", {
    body: source,
    contentType: "text/plain",
  })
})

test("@a11y public-persisted: initial and rejected-load states", async ({
  page,
}, testInfo) => {
  const example = await openPersistedExample(page)

  for (const state of ["initial", "rejected-load"] as const) {
    if (state === "rejected-load") {
      await page.evaluate(
        (key) => window.localStorage.setItem(key, "{}"),
        `${storagePrefix}${firstDate}`,
      )
      await example
        .getByRole("button", { name: "Load draft", exact: true })
        .click()
      await expect(example.getByRole("alert")).toBeVisible()
    }

    const report = await new AxeBuilder({ page })
      .include('[data-testid="public-persisted-example"]')
      .analyze()

    await testInfo.attach(`public-persisted-${state}-axe.json`, {
      body: JSON.stringify(report, null, 2),
      contentType: "application/json",
    })
    expect(report.violations).toEqual([])
  }
})
