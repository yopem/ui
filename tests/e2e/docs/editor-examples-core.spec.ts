import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

const slugs = [
  "basic-marks",
  "basic-nodes",
  "link",
  "installation-next-01-editor",
  "installation-next-02-marks",
  "installation-next-03-elements",
  "editor-default",
  "editor-disabled",
  "editor-full-width",
] as const

test.beforeEach(async ({ page }) => {
  await page.goto("/editor/examples")
  await expect(page.getByTestId("editor-examples-core")).toBeVisible()
  await expect(
    page.getByRole("button", { name: "Search documentation", exact: true }),
  ).toBeEnabled()
})

test("basic-marks: composes marks with native keyboard input and history", async ({
  page,
}, testInfo) => {
  const example = page.getByTestId("editor-example-basic-marks")
  await example
    .getByRole("button", { name: "Live preview", exact: true })
    .click()
  const editor = example.getByRole("textbox")
  await expect(editor).toHaveAttribute("contenteditable", "true")
  const toolbar = example.getByRole("toolbar")
  const bold = toolbar.getByRole("button", { name: "Bold", exact: true })
  await editor.fill("Foundation")
  await editor.press("ControlOrMeta+a")
  await expect(editor.locator("strong, b")).toHaveText("Foundation")
  await expect(bold).toHaveAttribute("aria-pressed", "true")
  await bold.click()
  await expect(bold).toHaveAttribute("aria-pressed", "false")
  await expect(editor.locator("strong, b")).toHaveCount(0)
  await expect(editor).toHaveText("Foundation")
  await bold.click()
  await expect(bold).toHaveAttribute("aria-pressed", "true")
  await expect(editor.locator("strong, b")).toHaveText("Foundation")
  await editor.press("ControlOrMeta+i")
  await editor.press("ControlOrMeta+u")
  await expect(editor.locator("strong, b")).toHaveText("Foundation")
  await expect(bold).toHaveAttribute("aria-pressed", "true")
  await expect(editor.locator("strong, b")).toHaveCSS("font-style", "italic")
  await expect(editor.locator("strong, b")).toHaveCSS(
    "text-decoration-line",
    /underline/,
  )
  await expect(
    toolbar.getByRole("button", { name: "Italic", exact: true }),
  ).toHaveAttribute("aria-pressed", "true")
  await expect(
    toolbar.getByRole("button", { name: "Underline", exact: true }),
  ).toHaveAttribute("aria-pressed", "true")

  for (const name of [
    "Strikethrough",
    "Inline code",
    "Highlight",
    "Subscript",
    "Superscript",
  ]) {
    await toolbar.getByRole("button", { name, exact: true }).click()
    await expect(
      toolbar.getByRole("button", { name, exact: true }),
    ).toHaveAttribute("aria-pressed", "true")
    await expect(editor).toHaveText("Foundation")
  }

  await expect(
    toolbar.getByRole("button", { name: "Subscript", exact: true }),
  ).toHaveAttribute("aria-pressed", "false")
  await toolbar.getByRole("button", { name: "Undo", exact: true }).click()
  await expect(
    toolbar.getByRole("button", { name: "Superscript", exact: true }),
  ).toHaveAttribute("aria-pressed", "false")
  await toolbar.getByRole("button", { name: "Redo", exact: true }).click()
  await expect(
    toolbar.getByRole("button", { name: "Superscript", exact: true }),
  ).toHaveAttribute("aria-pressed", "true")
  await testInfo.attach("basic-marks.html", {
    body: await editor.innerHTML(),
    contentType: "text/html",
  })
})

for (const slug of ["basic-nodes", "installation-next-03-elements"] as const) {
  test(`${slug}: changes heading levels, quote, paragraph and marks without losing text`, async ({
    page,
  }, testInfo) => {
    const example = page.getByTestId(`editor-example-${slug}`)
    await example
      .getByRole("button", { name: "Live preview", exact: true })
      .click()
    const editor = example.getByRole("textbox")
    await expect(editor).toHaveAttribute("contenteditable", "true")
    const toolbar = example.getByRole("toolbar")
    await expect(editor.locator("h1")).toBeVisible()
    await expect(editor.locator("blockquote")).toBeVisible()
    await expect(editor.locator("strong, b").first()).toBeVisible()
    await editor.fill("Selected block")
    await editor.press("ControlOrMeta+a")

    for (const [name, tag] of [
      ["Heading 1", "h1"],
      ["Heading 2", "h2"],
      ["Heading 3", "h3"],
      ["Quote", "blockquote"],
      ["Paragraph", "p"],
    ]) {
      await toolbar.getByRole("button", { name, exact: true }).click()
      await expect(editor.locator(tag)).toHaveText("Selected block")
    }

    await editor.press("ControlOrMeta+a")
    await toolbar.getByRole("button", { name: "Bold", exact: true }).click()
    await expect(editor.locator("strong, b")).toHaveText("Selected block")
    await testInfo.attach(`${slug}.html`, {
      body: await editor.innerHTML(),
      contentType: "text/html",
    })
  })
}

test("basic-nodes: inserts native horizontal rule and supports history", async ({
  page,
}, testInfo) => {
  const example = page.getByTestId("editor-example-basic-nodes")
  await example
    .getByRole("button", { name: "Live preview", exact: true })
    .click()
  const editor = example.getByRole("textbox")
  await expect(editor).toHaveAttribute("contenteditable", "true")
  const toolbar = example.getByRole("toolbar")
  await editor.fill("Before rule")
  await editor.press("ControlOrMeta+End")
  await toolbar
    .getByRole("button", { name: "Insert horizontal rule", exact: true })
    .click()
  await expect(editor.getByRole("separator")).toHaveCount(1)
  await expect(editor).toContainText("Before rule")
  await toolbar.getByRole("button", { name: "Undo", exact: true }).click()
  await expect(editor.getByRole("separator")).toHaveCount(0)
  await toolbar.getByRole("button", { name: "Redo", exact: true }).click()
  await expect(editor.getByRole("separator")).toHaveCount(1)
  await testInfo.attach("horizontal-rule.html", {
    body: await editor.innerHTML(),
    contentType: "text/html",
  })
})

test("installation-next-01-editor: starts empty and accepts native rich text", async ({
  page,
}) => {
  const example = page.getByTestId("editor-example-installation-next-01-editor")
  await example
    .getByRole("button", { name: "Live preview", exact: true })
    .click()
  const editor = example.getByRole("textbox")
  await expect(editor).toHaveAttribute("contenteditable", "true")
  await expect(editor).toHaveText("")
  await expect(example.getByRole("toolbar")).toHaveCount(0)
  await editor.fill("Minimal document")
  await editor.press("ControlOrMeta+a")
  await editor.press("ControlOrMeta+b")
  await expect(editor.locator("strong, b")).toHaveText("Minimal document")
})

test("installation-next-02-marks: seeded marks support keyboard toolbar operation", async ({
  page,
}) => {
  const example = page.getByTestId("editor-example-installation-next-02-marks")
  await example
    .getByRole("button", { name: "Live preview", exact: true })
    .click()
  const editor = example.getByRole("textbox")
  await expect(editor).toHaveAttribute("contenteditable", "true")
  const toolbar = example.getByRole("toolbar")
  await expect(editor.locator("strong, b")).toHaveText("Bold seed")
  await editor.fill("Keyboard selection")
  await editor.press("ControlOrMeta+a")
  const bold = toolbar.getByRole("button", { name: "Bold", exact: true })
  await expect(editor.locator("strong, b")).toHaveText("Keyboard selection")
  await expect(bold).toHaveAttribute("aria-pressed", "true")
  await bold.focus()
  await bold.press("Enter")
  await expect(editor).toBeFocused()
  await expect(bold).toHaveAttribute("aria-pressed", "false")
  await expect(editor.locator("strong, b")).toHaveCount(0)
  await expect(editor).toHaveText("Keyboard selection")
  await bold.focus()
  await bold.press("Enter")
  await expect(editor).toBeFocused()
  await expect(bold).toHaveAttribute("aria-pressed", "true")
  await expect(editor.locator("strong, b")).toHaveText("Keyboard selection")
  await editor.press("ControlOrMeta+i")
  await editor.press("ControlOrMeta+u")
  await expect(editor.locator("strong, b")).toHaveText("Keyboard selection")
  await expect(bold).toHaveAttribute("aria-pressed", "true")
  await expect(editor.locator("strong, b")).toHaveCSS("font-style", "italic")
  await expect(editor.locator("strong, b")).toHaveCSS(
    "text-decoration-line",
    /underline/,
  )
  await expect(
    toolbar.getByRole("button", { name: "Italic", exact: true }),
  ).toHaveAttribute("aria-pressed", "true")
  await expect(
    toolbar.getByRole("button", { name: "Underline", exact: true }),
  ).toHaveAttribute("aria-pressed", "true")
})

test("link: creates, edits, removes, rejects unsafe URLs and cancels", async ({
  page,
}, testInfo) => {
  const example = page.getByTestId("editor-example-link")
  await example
    .getByRole("button", { name: "Live preview", exact: true })
    .click()
  const editor = example.getByRole("textbox")
  await expect(editor).toHaveAttribute("contenteditable", "true")
  const linkButton = example.getByRole("button", { name: "Link", exact: true })
  await editor.fill("Link target")
  await editor.press("ControlOrMeta+a")
  await linkButton.click()
  const url = page.getByRole("textbox", { name: "Link URL", exact: true })
  await url.fill("javascript:alert(1)")
  await page.getByRole("button", { name: "Apply link", exact: true }).click()
  await expect(page.getByRole("alert")).toBeVisible()
  await expect(editor.locator("a")).toHaveCount(0)
  await url.fill("https://example.com/first")
  await page.getByRole("button", { name: "Apply link", exact: true }).click()
  await expect(editor.locator("a")).toHaveAttribute(
    "href",
    "https://example.com/first",
  )
  await expect(editor).toBeFocused()
  await editor.press("ControlOrMeta+a")
  await linkButton.click()
  await url.fill("https://example.com/second")
  await page.getByRole("button", { name: "Apply link", exact: true }).click()
  await expect(editor.locator("a")).toHaveAttribute(
    "href",
    "https://example.com/second",
  )
  await editor.press("ControlOrMeta+a")
  await linkButton.click()
  await page.getByRole("button", { name: "Remove link", exact: true }).click()
  await expect(editor.locator("a")).toHaveCount(0)
  await expect(editor).toHaveText("Link target")
  await editor.press("ControlOrMeta+a")
  await linkButton.click()
  await url.fill("https://example.com/cancelled")
  await url.press("Escape")
  await expect(url).toBeHidden()
  await expect(editor.locator("a")).toHaveCount(0)
  await testInfo.attach("link.html", {
    body: await editor.innerHTML(),
    contentType: "text/html",
  })
})

test("link: pastes safe URL over selected text through native clipboard", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"])
  const example = page.getByTestId("editor-example-link")
  await example
    .getByRole("button", { name: "Live preview", exact: true })
    .click()
  const editor = example.getByRole("textbox")
  await expect(editor).toHaveAttribute("contenteditable", "true")
  await editor.fill("Keep selected text")
  await editor.press("ControlOrMeta+a")
  await page.evaluate(() =>
    navigator.clipboard.writeText("https://example.com/pasted"),
  )
  await editor.press("ControlOrMeta+v")
  await expect(editor.locator("a")).toHaveAttribute(
    "href",
    "https://example.com/pasted",
  )
  await expect(editor.locator("a")).toHaveText("Keep selected text")
})

for (const slug of ["editor-default", "editor-full-width"] as const) {
  test(`${slug}: house preset edits blocks, lists and history`, async ({
    page,
  }) => {
    const example = page.getByTestId(`editor-example-${slug}`)
    await example
      .getByRole("button", { name: "Live preview", exact: true })
      .click()
    const editor = example.getByRole("textbox")
    await expect(editor).toHaveAttribute("contenteditable", "true")
    const toolbar = example.getByRole("toolbar")
    await editor.fill("Preset content")
    await toolbar
      .getByRole("button", { name: "Heading 2", exact: true })
      .click()
    await expect(editor.locator("h2")).toHaveText("Preset content")
    await toolbar
      .getByRole("button", { name: "Bullet list", exact: true })
      .click()
    await expect(editor.locator("ul li")).toHaveText("Preset content")
    await toolbar.getByRole("button", { name: "Undo", exact: true }).click()
    await expect(editor.locator("h2")).toHaveText("Preset content")
    await toolbar.getByRole("button", { name: "Redo", exact: true }).click()
    await expect(editor.locator("ul li")).toHaveText("Preset content")
  })
}

test("editor-disabled: prevents mutation and removes editor from tab order", async ({
  page,
}) => {
  const example = page.getByTestId("editor-example-editor-disabled")
  await example
    .getByRole("button", { name: "Live preview", exact: true })
    .click()
  const editor = example.getByRole("textbox")
  await expect(editor).toHaveAttribute("contenteditable", "false")
  await expect(editor).toHaveAttribute("aria-disabled", "true")
  await expect(editor).toHaveAttribute("aria-readonly", "true")
  await expect(editor).toHaveAttribute("tabindex", "-1")
  await expect(editor).toHaveText("")
  await expect(editor).toHaveAttribute(
    "aria-placeholder",
    "Editing is disabled.",
  )
  await editor.scrollIntoViewIfNeeded()
  await expect(editor).toBeVisible()
  const bounds = await editor.boundingBox()
  expect(bounds).not.toBeNull()

  if (!bounds) throw new Error("Disabled editor has no bounding box")

  const point = {
    x: bounds.x + bounds.width / 2,
    y: bounds.y + bounds.height / 2,
  }

  expect(
    await editor.evaluate(
      (element, { x, y }) =>
        element.contains(element.ownerDocument.elementFromPoint(x, y)),
      point,
    ),
  ).toBe(true)
  await page.mouse.click(point.x, point.y)
  await expect(editor).toBeFocused()
  await page.keyboard.type("Must not appear")
  await expect(editor).toHaveText("")

  const buttons = example.getByRole("toolbar").getByRole("button")
  await expect(buttons).toHaveCount(5)

  for (const button of await buttons.all()) {
    await expect(button).toBeDisabled()
  }

  const livePreview = example.getByRole("button", {
    name: "Live preview",
    exact: true,
  })

  const copySource = example.getByRole("button", {
    name: "Copy source",
    exact: true,
  })

  await livePreview.focus()
  await expect(livePreview).toBeFocused()

  for (const [key, target] of [
    ["Tab", copySource],
    ["Shift+Tab", livePreview],
  ] as const) {
    for (let step = 0; step < 8; step++) {
      await page.keyboard.press(key)
      await expect(editor).not.toBeFocused()

      if (
        await target.evaluate(
          (element) => element.ownerDocument.activeElement === element,
        )
      )
        break
    }

    await expect(target).toBeFocused()
  }

  await expect(editor).toHaveText("")
})

test("gallery starts with basics and resets a closed live preview", async ({
  page,
}, testInfo) => {
  const gallery = page.getByTestId("editor-examples-core")

  const first = gallery
    .locator('section[data-testid^="editor-example-"]')
    .first()

  await expect(first).toHaveAttribute(
    "data-testid",
    "editor-example-basic-marks",
  )
  await first.getByRole("button", { name: "Live preview", exact: true }).click()
  const editor = first.getByRole("textbox")
  await expect(editor).toHaveAttribute("data-lexical-editor", "true")
  const initialText = await editor.textContent()
  expect(initialText).toBeTruthy()
  await editor.fill("Unsaved gallery draft")
  const next = page.getByTestId("editor-example-basic-nodes")
  await next.getByRole("button", { name: "Live preview", exact: true }).click()
  await expect(next.getByRole("textbox")).toBeVisible()
  await expect(first.getByRole("textbox", { includeHidden: true })).toHaveCount(
    0,
  )
  await expect(gallery.getByRole("textbox")).toHaveCount(1)
  await first.getByRole("button", { name: "Live preview", exact: true }).click()
  await expect(next.getByRole("textbox", { includeHidden: true })).toHaveCount(
    0,
  )
  await expect(editor).toHaveText(initialText ?? "")
  await testInfo.attach("gallery-first-live-preview.png", {
    body: await first.screenshot({ scale: "css" }),
    contentType: "image/png",
  })
  await testInfo.attach("gallery-preview-reset.html", {
    body: await first.innerHTML(),
    contentType: "text/html",
  })
})

test("gallery keeps limits and installation available without a live editor", async ({
  page,
}, testInfo) => {
  const example = page.getByTestId("editor-example-basic-marks")

  const trigger = example.getByRole("button", {
    name: "Limits and setup",
    exact: true,
  })

  await expect(trigger).toHaveAttribute("aria-expanded", "false")
  await trigger.click()

  const details = example.getByRole("region", {
    name: / limits and installation$/,
  })

  await expect(details).toBeVisible()
  await expect(details).toHaveAttribute(
    "id",
    (await trigger.getAttribute("aria-controls")) ?? "",
  )
  await expect(
    example.getByRole("textbox", { includeHidden: true }),
  ).toHaveCount(0)

  const report = await new AxeBuilder({ page })
    .include('[data-testid="editor-example-basic-marks"]')
    .analyze()

  await testInfo.attach("gallery-details-axe.json", {
    body: JSON.stringify(report),
    contentType: "application/json",
  })
  expect(report.violations).toEqual([])
})

for (const width of [390, 768, 1440]) {
  test(`@a11y core gallery: ${width}px containment and accessible controls`, async ({
    page,
  }, testInfo) => {
    test.slow()
    await page.setViewportSize({ width, height: 1000 })

    for (const slug of slugs) {
      const example = page.getByTestId(`editor-example-${slug}`)
      await example
        .getByRole("button", { name: "Live preview", exact: true })
        .click()
      await expect(example.getByRole("textbox")).toBeVisible()
      await expect(
        page.getByTestId("editor-examples-core").getByRole("textbox"),
      ).toHaveCount(1)
      const bounds = await example.boundingBox()
      expect(bounds).not.toBeNull()

      if (bounds) {
        expect(bounds.x).toBeGreaterThanOrEqual(0)
        expect(bounds.x + bounds.width).toBeLessThanOrEqual(width + 1)
      }

      const previewReport = await new AxeBuilder({ page })
        .include(`[data-testid="editor-example-${slug}"]`)
        .options({ resultTypes: ["violations", "incomplete"] })
        .analyze()

      await testInfo.attach(`core-${slug}-${width}-axe.json`, {
        body: JSON.stringify(previewReport),
        contentType: "application/json",
      })
      expect(previewReport.violations).toEqual([])
    }

    const report = await new AxeBuilder({ page })
      .include('[data-testid="editor-examples-core"]')
      .options({ resultTypes: ["violations", "incomplete"] })
      .analyze()

    await testInfo.attach(`core-${width}-axe.json`, {
      body: JSON.stringify(report, null, 2),
      contentType: "application/json",
    })
    expect(report.violations).toEqual([])
    await page.evaluate(() =>
      window.scrollTo({ top: 0, left: 0, behavior: "instant" }),
    )
    await testInfo.attach(`core-${width}.png`, {
      body: await page.screenshot({ fullPage: true, scale: "css" }),
      contentType: "image/png",
    })
  })
}

test("core gallery: copies complete consumer composition through native clipboard", async ({
  page,
  context,
}, testInfo) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"])

  for (const slug of slugs) {
    const example = page.getByTestId(`editor-example-${slug}`)
    await example
      .getByRole("button", { name: "Copy source", exact: true })
      .click()
    await expect(
      example.getByRole("button", { name: "Copy source", exact: true }),
    ).toHaveText("Copy source")
    await expect(example.locator('[data-slot="clipboard-status"]')).toHaveText(
      "Copied to clipboard",
    )
    const source = await page.evaluate(() => navigator.clipboard.readText())
    expect(source).toContain('"use client"')
    expect(source).toContain('from "@/components/editor"')
    expect(source).not.toMatch(
      /@registry\/|@yopem-ui\/|\.\/fixtures|\.\/shared/,
    )
    await testInfo.attach(`${slug}.tsx`, {
      body: source,
      contentType: "text/plain",
    })
  }
})
