import AxeBuilder from "@axe-core/playwright"
import {
  expect,
  test,
  type Locator,
  type Page,
  type TestInfo,
} from "@playwright/test"
import { z } from "zod"

async function choosePage(page: Page, title: string) {
  const workspace = page.getByTestId("notion-like-workspace")

  const trigger = workspace.getByRole("button", {
    name: "Open workspace pages",
    exact: true,
  })

  if (await trigger.isVisible()) {
    await trigger.click()
    await page
      .getByRole("dialog", { name: "Workspace pages", exact: true })
      .getByRole("button", { name: title, exact: true })
      .click()
  } else {
    await workspace
      .getByRole("navigation", { name: "Workspace pages", exact: true })
      .getByRole("button", { name: title, exact: true })
      .click()
  }

  await expect(
    workspace.getByRole("textbox", { name: "Page title", exact: true }),
  ).toHaveValue(title)
}

async function openOutline(page: Page) {
  await page.goto("/editor/examples/notion-like")
  await choosePage(page, "Table of Contents")
  const workspace = page.getByTestId("notion-like-workspace")

  const editor = workspace.getByRole("textbox", {
    name: "Workspace document",
    exact: true,
  })

  const outline = workspace.getByRole("navigation", {
    name: "Page outline",
    exact: true,
  })

  const contents = editor.getByRole("navigation", {
    name: "Table of contents",
    exact: true,
  })

  await expect(editor).toHaveAttribute("contenteditable", "true")
  await expect(outline).toBeVisible()
  await expect(outline.getByText("Page outline", { exact: true })).toBeVisible()
  await expect(contents).toBeVisible()
  await expect(outline).not.toContainText("Table of contents")

  return { workspace, editor, outline, contents }
}

async function copyDocument(workspace: Locator) {
  const page = workspace.page()
  await page.evaluate(() => navigator.clipboard.writeText(""))
  await workspace
    .getByRole("button", { name: "Copy page JSON", exact: true })
    .click()
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .not.toBe("")

  return z
    .object({ root: z.looseObject({ type: z.literal("root") }) })
    .parse(
      JSON.parse(await page.evaluate(() => navigator.clipboard.readText())),
    )
}

async function capture(page: Page, info: TestInfo, label: string) {
  const report = await new AxeBuilder({ page }).analyze()
  await info.attach(`${label}-axe.json`, {
    body: JSON.stringify(report, null, 2),
    contentType: "application/json",
  })
  await info.attach(`${label}.png`, {
    body: await page.screenshot({ fullPage: true, scale: "css" }),
    contentType: "image/png",
  })
  expect(report.violations).toEqual([])
}

test.beforeEach(async ({ context, baseURL }) => {
  if (!baseURL) throw new Error("The docs baseURL is required.")
  await context.grantPermissions(["clipboard-read", "clipboard-write"], {
    origin: new URL(baseURL).origin,
  })
})

test("outline tracks edits, undo and redo without adding document history @a11y", async ({
  page,
}, info) => {
  const { workspace, editor, outline, contents } = await openOutline(page)

  const heading = editor.getByRole("heading", {
    name: "Document outline",
    exact: true,
  })

  await outline
    .getByRole("button", { name: "Document outline", exact: true })
    .click()
  await expect(heading).toBeFocused()
  await page.keyboard.insertText("Changed ")
  const changed = "Changed Document outline"
  await expect(
    outline.getByRole("button", { name: changed, exact: true }),
  ).toBeVisible()
  await expect(
    contents.getByRole("link", { name: changed, exact: true }),
  ).toBeVisible()
  const changedDocument = await copyDocument(workspace)
  const url = page.url()
  await outline.getByRole("button", { name: "Next steps", exact: true }).click()
  await expect(
    editor.getByRole("heading", { name: "Next steps", exact: true }),
  ).toBeFocused()
  expect(page.url()).toBe(url)
  expect(await copyDocument(workspace)).toEqual(changedDocument)
  await workspace.getByRole("button", { name: "Undo", exact: true }).click()
  await expect(
    outline.getByRole("button", { name: "Document outline", exact: true }),
  ).toBeVisible()
  await expect(
    contents.getByRole("link", { name: "Document outline", exact: true }),
  ).toBeVisible()
  await workspace.getByRole("button", { name: "Redo", exact: true }).click()
  await expect(
    outline.getByRole("button", { name: changed, exact: true }),
  ).toBeVisible()
  await expect(
    contents.getByRole("link", { name: changed, exact: true }),
  ).toBeVisible()
  expect(await copyDocument(workspace)).toEqual(changedDocument)
  await capture(page, info, "outline-editable")
  await choosePage(page, "Playground")
  await expect(
    workspace.getByRole("navigation", { name: "Page outline", exact: true }),
  ).toHaveCount(0)
  await choosePage(page, "Table of Contents")
  await expect(
    outline.getByRole("button", { name: changed, exact: true }),
  ).toBeVisible()
  expect(await copyDocument(workspace)).toEqual(changedDocument)
})

test("outline supports keyboard and read-only focus within responsive workspace @a11y", async ({
  page,
}, info) => {
  await page.emulateMedia({ reducedMotion: "reduce" })
  const { workspace, editor, outline } = await openOutline(page)

  const selected = outline.getByRole("button", {
    name: "Document outline",
    exact: true,
  })

  await selected.click()
  await expect(selected).toHaveAttribute("aria-current", "location")
  const before = await copyDocument(workspace)
  await workspace
    .getByRole("button", { name: "Make workspace read-only", exact: true })
    .click()
  await expect(editor).toHaveAttribute("contenteditable", "false")
  await expect(outline.locator('[aria-current="location"]')).toHaveCount(0)
  const entry = outline.getByRole("button", { name: "Next steps", exact: true })
  await entry.focus()
  await expect(entry).toBeFocused()
  await page.keyboard.press("Enter")
  await expect(
    editor.getByRole("heading", { name: "Next steps", exact: true }),
  ).toBeFocused()
  await expect(outline.locator('[aria-current="location"]')).toHaveCount(0)
  await outline
    .getByRole("button", { name: "Document outline", exact: true })
    .focus()
  await page.keyboard.press("Space")
  await expect(
    editor.getByRole("heading", { name: "Document outline", exact: true }),
  ).toBeFocused()
  expect(await copyDocument(workspace)).toEqual(before)
  await outline.scrollIntoViewIfNeeded()

  const contained = await outline.evaluate((element) => {
    const workspace = element.closest('[data-testid="notion-like-workspace"]')

    if (!workspace) return false
    const outer = workspace.getBoundingClientRect()
    const inner = element.getBoundingClientRect()

    return (
      inner.left >= outer.left &&
      inner.right <= outer.right &&
      inner.top >= outer.top &&
      inner.bottom <= outer.bottom
    )
  })

  expect(contained).toBe(true)
  await capture(page, info, "outline-readonly")
  await workspace
    .getByRole("button", { name: "Edit workspace", exact: true })
    .click()
  await expect(editor).toHaveAttribute("contenteditable", "true")
  expect(await copyDocument(workspace)).toEqual(before)
})

for (const [direction, text] of [
  ["rtl", "عنوانطويلجدا".repeat(24)],
  ["ltr", "UnbrokenHeading".repeat(24)],
] as const) {
  for (const width of [320, 1280]) {
    test(`${direction} unbroken heading wraps within editor at ${width}px`, async ({
      page,
    }, info) => {
      await page.setViewportSize({ width, height: 720 })
      const { workspace, editor, outline } = await openOutline(page)

      const viewport = workspace.getByRole("group", {
        name: "Page document",
        exact: true,
      })

      await outline
        .getByRole("button", { name: "Document outline", exact: true })
        .click()
      await page.keyboard.insertText(text)

      const heading = editor.getByRole("heading", {
        name: `${text}Document outline`,
        exact: true,
      })

      await expect(heading).toBeFocused()
      await expect(heading).toHaveText(`${text}Document outline`)

      const metrics = await heading.evaluate((element) => {
        const editor = element.closest('[data-slot="editor-content"]')
        const viewport = element.closest('[data-slot="scroll-area-viewport"]')

        if (!editor || !viewport) throw new Error("Missing editor viewport")
        const range = document.createRange()
        range.selectNodeContents(element)

        const lines = Array.from(range.getClientRects()).filter(
          (rect) => rect.width > 0 && rect.height > 0,
        )

        const headingRect = element.getBoundingClientRect()
        const editorRect = editor.getBoundingClientRect()
        const viewportRect = viewport.getBoundingClientRect()

        return {
          lines: new Set(lines.map((rect) => Math.round(rect.top))).size,
          textContained: lines.every(
            (rect) =>
              rect.left >= headingRect.left - 1 &&
              rect.right <= headingRect.right + 1 &&
              rect.left >= editorRect.left - 1 &&
              rect.right <= editorRect.right + 1 &&
              rect.left >= viewportRect.left - 1 &&
              rect.right <= viewportRect.right + 1,
          ),
          editorContained:
            editorRect.left >= viewportRect.left - 1 &&
            editorRect.right <= viewportRect.right + 1,
          headingScrollWidth: element.scrollWidth,
          headingClientWidth: element.clientWidth,
          editorScrollWidth: editor.scrollWidth,
          editorClientWidth: editor.clientWidth,
          viewportScrollWidth: viewport.scrollWidth,
          viewportClientWidth: viewport.clientWidth,
        }
      })

      expect(metrics.lines).toBeGreaterThan(1)
      expect(metrics.textContained).toBe(true)
      expect(metrics.editorContained).toBe(true)
      expect(metrics.headingScrollWidth).toBeLessThanOrEqual(
        metrics.headingClientWidth + 1,
      )
      expect(metrics.editorScrollWidth).toBeLessThanOrEqual(
        metrics.editorClientWidth + 1,
      )
      expect(metrics.viewportScrollWidth).toBeLessThanOrEqual(
        metrics.viewportClientWidth + 1,
      )
      await expect(viewport).toBeVisible()
      const savedDocument = await copyDocument(workspace)
      await outline
        .getByRole("button", { name: "Next steps", exact: true })
        .click()
      await expect(
        editor.getByRole("heading", { name: "Next steps", exact: true }),
      ).toBeFocused()
      expect(await copyDocument(workspace)).toEqual(savedDocument)
      await info.attach(`heading-${direction}-${width}.json`, {
        body: JSON.stringify(metrics, null, 2),
        contentType: "application/json",
      })
      await info.attach(`heading-${direction}-${width}.png`, {
        body: await page.screenshot({ scale: "css" }),
        contentType: "image/png",
      })
    })
  }
}

test.describe("coarse-pointer outline", () => {
  test.use({ hasTouch: true, isMobile: true })

  test("outline keeps wrapped RTL headings inside coarse-pointer targets", async ({
    page,
  }, info) => {
    await page.setViewportSize({ width: 320, height: 600 })
    await page.emulateMedia({ reducedMotion: "reduce" })
    const { workspace, editor, outline } = await openOutline(page)

    const original = outline.getByRole("button", {
      name: "Document outline",
      exact: true,
    })

    await original.click()
    await page.keyboard.insertText("عنوانطويلجدا".repeat(12))
    await page.keyboard.press("Shift+Enter")
    await page.keyboard.insertText("سطر إضافي طويل ".repeat(5))
    await outline.evaluate((element) => element.setAttribute("dir", "rtl"))
    const entry = outline.getByRole("button", { name: /عنوانطويلجدا/ })
    await expect(entry).toBeVisible()

    const metrics = await entry.evaluate((button) => {
      const range = document.createRange()
      range.selectNodeContents(button)
      const rect = button.getBoundingClientRect()
      const lines = Array.from(range.getClientRects())

      const next = button
        .closest("li")
        ?.nextElementSibling?.getBoundingClientRect()

      const outline = button.closest("nav")?.getBoundingClientRect()

      return {
        height: rect.height,
        lines: lines.length,
        textContained: lines.every(
          (line) =>
            line.top >= rect.top - 1 &&
            line.bottom <= rect.bottom + 1 &&
            line.left >= rect.left - 1 &&
            line.right <= rect.right + 1,
        ),
        nextContained: !!next && rect.bottom <= next.top + 1,
        inlineContained:
          !!outline &&
          rect.left >= outline.left - 1 &&
          rect.right <= outline.right + 1,
        coarse: matchMedia("(pointer: coarse)").matches,
      }
    })

    expect(metrics.lines).toBeGreaterThan(1)
    expect(metrics.textContained).toBe(true)
    expect(metrics.nextContained).toBe(true)
    expect(metrics.inlineContained).toBe(true)
    expect(metrics.coarse).toBe(true)
    expect(metrics.height).toBeGreaterThanOrEqual(44)
    await entry.click()
    await expect(
      editor.getByRole("heading", { name: /عنوانطويلجدا/ }),
    ).toBeFocused()
    await capture(page, info, "outline-long-rtl")
    await expect(workspace).toBeVisible()
  })
})

test("outline honors a host click veto and scrolls the document viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 500 })
  await page.emulateMedia({ reducedMotion: "reduce" })
  const { workspace, editor, outline } = await openOutline(page)
  await outline
    .getByRole("button", { name: "Document outline", exact: true })
    .click()
  await page.keyboard.insertText("Long heading text ".repeat(80))
  const entry = outline.getByRole("button", { name: "Next steps", exact: true })

  const heading = editor.getByRole("heading", {
    name: "Next steps",
    exact: true,
  })

  const viewport = workspace.getByRole("group", {
    name: "Page document",
    exact: true,
  })

  await entry.evaluate((button) => {
    button.addEventListener(
      "click",
      (event) => {
        button.setAttribute("data-host-cancelled", String(event.isTrusted))
        event.preventDefault()
      },
      { capture: true, once: true },
    )
  })
  await entry.click()
  await expect(entry).toHaveAttribute("data-host-cancelled", "true")
  await expect(heading).not.toBeFocused()
  await entry.focus()

  const before = await viewport.evaluate((element) => ({
    scrollTop: element.scrollTop,
    windowY: window.scrollY,
    scrollHeight: element.scrollHeight,
    clientHeight: element.clientHeight,
  }))

  expect(before.scrollHeight).toBeGreaterThan(before.clientHeight)
  await page.keyboard.press("Enter")
  await expect(heading).toBeFocused()
  await expect
    .poll(() => viewport.evaluate((element) => element.scrollTop))
    .toBeGreaterThan(before.scrollTop)

  const after = await viewport.evaluate((element) => ({
    windowY: window.scrollY,
    top: element.getBoundingClientRect().top,
    bottom: element.getBoundingClientRect().bottom,
  }))

  const target = await heading.boundingBox()
  expect(target).not.toBeNull()

  if (!target) throw new Error("Missing heading geometry")
  expect(target.y).toBeGreaterThanOrEqual(after.top - 1)
  expect(target.y).toBeLessThan(after.bottom)
  expect(after.windowY).toBe(before.windowY)
})

test("separate editor roots do not retain removed or other-page targets", async ({
  page,
  context,
}) => {
  const first = await openOutline(page)
  const other = await context.newPage()
  const second = await openOutline(other)
  await first.outline
    .getByRole("button", { name: "Document outline", exact: true })
    .click()
  await page.keyboard.insertText("First ")
  await expect(
    first.outline.getByRole("button", {
      name: "First Document outline",
      exact: true,
    }),
  ).toBeVisible()
  await expect(
    second.outline.getByRole("button", {
      name: "Document outline",
      exact: true,
    }),
  ).toBeVisible()
  await second.outline
    .getByRole("button", { name: "Next steps", exact: true })
    .click()
  await expect(
    second.editor.getByRole("heading", { name: "Next steps", exact: true }),
  ).toBeFocused()
  await expect(
    first.outline.getByRole("button", { name: "Next steps", exact: true }),
  ).toBeVisible()
  await first.outline
    .getByRole("button", { name: "First Document outline", exact: true })
    .click()
  await page.keyboard.press("Home")
  await page.keyboard.press("Shift+End")
  await page.keyboard.press("Backspace")
  await expect(
    first.outline.getByRole("button", {
      name: "First Document outline",
      exact: true,
    }),
  ).toHaveCount(0)
  await expect(
    second.outline.getByRole("button", {
      name: "Document outline",
      exact: true,
    }),
  ).toBeVisible()
  await choosePage(page, "Playground")
  await expect(first.outline).toHaveCount(0)
  await second.outline
    .getByRole("button", { name: "Document outline", exact: true })
    .click()
  await expect(
    second.editor.getByRole("heading", {
      name: "Document outline",
      exact: true,
    }),
  ).toBeFocused()
})

test("outline renders heading text literally and omits empty headings", async ({
  page,
}) => {
  const { editor, outline } = await openOutline(page)
  const literal = '<img src="https://example.invalid/test">'
  await outline
    .getByRole("button", { name: "Document outline", exact: true })
    .click()
  await page.keyboard.insertText(literal)
  await expect(
    outline.getByRole("button", {
      name: `${literal}Document outline`,
      exact: true,
    }),
  ).toBeVisible()
  await expect(outline.locator("img")).toHaveCount(0)

  const heading = editor.getByRole("heading", {
    name: `${literal}Document outline`,
    exact: true,
  })

  await expect(heading).toHaveText(`${literal}Document outline`)
  await expect(heading.locator("img")).toHaveCount(0)
  await expect(
    editor.locator('img[src="https://example.invalid/test"]'),
  ).toHaveCount(0)
  await outline.getByRole("button", { name: "Next steps", exact: true }).click()
  await page.keyboard.press("Home")
  await page.keyboard.press("Shift+End")
  await page.keyboard.press("Backspace")
  await expect(
    outline.getByRole("button", { name: "Next steps", exact: true }),
  ).toHaveCount(0)
})

test("published example uses installed consumer TOC entry", async ({
  request,
}) => {
  const inventoryResponse = await request.get("/api/editor-examples.json")
  expect(inventoryResponse.ok()).toBe(true)

  const inventory: { examples: { slug: string; installNames: string[] }[] } =
    await inventoryResponse.json()

  expect(
    inventory.examples.find((item) => item.slug === "notion-like")
      ?.installNames,
  ).toContain("editor-toc")
  const response = await request.get("/editor/examples.md")
  expect(response.ok()).toBe(true)
  const source = await response.text()

  const section = source
    .split("## Notion-like local workspace\n")[1]
    ?.split("\n## ")[0]

  expect(section).toBeDefined()
  expect(section).toContain("@/components/editor/toc")
  expect(section).not.toContain("@yopem-ui/editor/toc")
})
