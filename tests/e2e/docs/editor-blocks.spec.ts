import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

test.beforeEach(async ({ page }) => {
  test.slow()
  await page.goto("/docs/editor")
  await expect(
    page.getByRole("textbox", { name: "Blocks editor", exact: true }),
  ).toHaveAttribute("contenteditable", "true")
})

test("native block typing, metadata, removal and history", async ({
  page,
}, info) => {
  const editor = page.getByRole("textbox", {
    name: "Blocks editor",
    exact: true,
  })

  const toolbar = page.getByRole("toolbar", { name: "Blocks", exact: true })
  await editor.fill("Before")
  await editor.press("End")
  await toolbar
    .getByRole("button", { name: "Insert callout", exact: true })
    .click()
  await editor.pressSequentially("Callout text")
  await expect(editor.locator("aside")).toContainText("Callout text")
  await toolbar
    .getByRole("button", { name: "Callout appearance warning", exact: true })
    .click()
  await expect(editor.locator("aside")).toHaveAttribute(
    "data-appearance",
    "warning",
  )
  await toolbar
    .getByRole("textbox", { name: "Callout icon", exact: true })
    .fill("✅")
  await toolbar.getByRole("button", { name: "Apply icon", exact: true }).click()
  await expect(editor.locator("aside")).toHaveAttribute("data-icon", "✅")
  await toolbar
    .getByRole("button", { name: "Remove block", exact: true })
    .click()
  await expect(editor.locator("aside")).toHaveCount(0)
  await expect(editor).toContainText("Callout text")
  await toolbar.getByRole("button", { name: "Undo", exact: true }).click()
  await expect(editor.locator("aside")).toHaveCount(1)
  await toolbar.getByRole("button", { name: "Redo", exact: true }).click()
  await expect(editor.locator("aside")).toHaveCount(0)
  await editor.press("ControlOrMeta+a")
  await editor.press("Backspace")
  await editor.pressSequentially("Replacement")
  await expect(editor).toHaveText("Replacement")
  await info.attach("blocks-json", {
    body: (await page
      .getByLabel("Blocks JSON", { exact: true })
      .locator("pre")
      .textContent())!,
    contentType: "application/json",
  })
})

test("callout appearance controls render distinct status indicators through roundtrips @a11y", async ({
  page,
}, info) => {
  const editor = page.getByRole("textbox", {
    name: "Blocks editor",
    exact: true,
  })

  const toolbar = page.getByRole("toolbar", { name: "Blocks", exact: true })
  await editor.fill("Appearance marker")
  await toolbar
    .getByRole("button", { name: "Insert callout", exact: true })
    .click()
  await editor.pressSequentially("Status detail")
  const callout = editor.locator("aside")

  const appearances = [
    "neutral",
    "info",
    "success",
    "warning",
    "destructive",
  ] as const

  const indicators: {
    appearance: string
    color: string
    width: number
    style: string
  }[] = []

  for (const appearance of appearances) {
    await toolbar
      .getByRole("button", {
        name: `Callout appearance ${appearance}`,
        exact: true,
      })
      .click()
    await expect(callout).toHaveAttribute("data-appearance", appearance)

    const indicator = await callout.evaluate((element) => {
      const style = getComputedStyle(element)

      return {
        color: style.borderInlineStartColor,
        width: Number.parseFloat(style.borderInlineStartWidth),
        style: style.borderInlineStartStyle,
      }
    })

    expect(indicator.width).toBeGreaterThan(0)
    expect(indicator.style).not.toBe("none")
    indicators.push({ appearance, ...indicator })
  }

  expect(new Set(indicators.map((indicator) => indicator.color)).size).toBe(
    appearances.length,
  )

  for (const format of ["JSON", "HTML"]) {
    await page
      .getByRole("button", { name: `Roundtrip blocks ${format}`, exact: true })
      .click()
    await expect(callout).toHaveAttribute("data-appearance", "destructive")
    await expect(
      page.getByTestId("blocks-example").getByRole("alert"),
    ).toHaveCount(0)
    await expect
      .poll(() =>
        callout.evaluate(
          (element) => getComputedStyle(element).borderInlineStartColor,
        ),
      )
      .toBe(indicators.at(-1)?.color)
  }

  expect(
    (
      await new AxeBuilder({ page })
        .include('[data-testid="blocks-example"]')
        .analyze()
    ).violations,
  ).toEqual([])
  await info.attach("callout-status-indicators.json", {
    body: Buffer.from(JSON.stringify(indicators)),
    contentType: "application/json",
  })
})

test("nested disclosures, keyboard, close caret repair, readonly and host replacement", async ({
  page,
}, info) => {
  const editor = page.getByRole("textbox", {
    name: "Blocks editor",
    exact: true,
  })

  const toolbar = page.getByRole("toolbar", { name: "Blocks", exact: true })
  await editor.click()
  await toolbar
    .getByRole("button", { name: "Insert toggle", exact: true })
    .click()
  await editor.pressSequentially("Summary")
  await editor.press("Enter")
  await editor.pressSequentially("Body")
  await toolbar
    .getByRole("button", { name: "Insert toggle", exact: true })
    .click()
  await editor.pressSequentially("Nested")
  await expect(editor.locator("details details")).toHaveCount(1)
  const summary = editor.locator("summary").first()
  await summary.focus()
  await page.keyboard.press("Space")
  await expect(editor.locator("details").first()).not.toHaveAttribute(
    "open",
    "",
  )
  await expect(summary).toBeFocused()
  await page.keyboard.press("Enter")
  await expect(editor.locator("details").first()).toHaveAttribute("open", "")
  await expect(summary).toBeFocused()
  await editor
    .locator("[data-editor-toggle-body]")
    .first()
    .locator("p")
    .first()
    .click()
  await toolbar
    .getByRole("button", { name: "Toggle disclosure", exact: true })
    .click()
  await editor.pressSequentially(" repaired")
  await expect(
    editor.locator("[data-editor-toggle-summary]").first(),
  ).toContainText("repaired")
  await page
    .getByRole("button", { name: "Read only blocks", exact: true })
    .click()

  const before = await page
    .getByLabel("Blocks JSON", { exact: true })
    .locator("pre")
    .textContent()

  await summary.click({ position: { x: 4, y: 4 } })
  await expect(
    page.getByLabel("Blocks JSON", { exact: true }).locator("pre"),
  ).toHaveText(before!)
  await page
    .getByRole("button", { name: "Replace blocks document", exact: true })
    .click()
  await expect(editor).toContainText("Host replacement")
  await info.attach("blocks-state", {
    body: before!,
    contentType: "application/json",
  })
})

test("semantic roundtrips, axe and responsive evidence @a11y", async ({
  page,
}, info) => {
  const editor = page.getByRole("textbox", {
    name: "Blocks editor",
    exact: true,
  })

  await editor.click()
  await page
    .getByRole("toolbar", { name: "Blocks", exact: true })
    .getByRole("button", { name: "Insert callout", exact: true })
    .click()
  await editor.pressSequentially("Callout")
  await page
    .getByRole("toolbar", { name: "Blocks", exact: true })
    .getByRole("button", { name: "Insert toggle", exact: true })
    .click()
  const title = `Roundtrip ${"longblocktitle".repeat(12)}`
  await editor.pressSequentially(title)

  for (const name of ["Roundtrip blocks JSON", "Roundtrip blocks HTML"]) {
    await page.getByRole("button", { name, exact: true }).click()
    await expect(editor.locator("[data-editor-toggle-summary]")).toHaveText(
      title,
    )
    await expect(editor.locator("aside[data-editor-callout]")).toHaveAttribute(
      "data-appearance",
      "info",
    )
    await expect(editor.locator("aside[data-editor-callout]")).toHaveAttribute(
      "data-icon",
      "💡",
    )
    await expect(
      page.getByTestId("blocks-example").getByRole("alert"),
    ).toHaveCount(0)
  }

  const output = page.getByLabel("Blocks JSON", { exact: true })
  const pane = output.getByRole("group", { name: "Code", exact: true })
  await output
    .getByRole("button", { name: "Copy code", exact: true })
    .press("Tab")
  await expect(pane).toBeFocused()
  await pane.press("ArrowRight")
  await expect
    .poll(() => pane.evaluate((element) => element.scrollLeft))
    .toBeGreaterThan(0)

  for (const state of ["open", "closed", "readonly"]) {
    if (state === "closed") {
      await editor.locator("summary").focus()
      await editor.locator("summary").press("Space")
      await expect(editor.locator("details")).not.toHaveAttribute("open", "")
    }

    if (state === "readonly") {
      await page
        .getByRole("button", { name: "Read only blocks", exact: true })
        .click()
      await editor.locator("summary").focus()
      await editor.locator("summary").press("Enter")
      await expect(editor.locator("details")).toHaveAttribute("open", "")
    }

    expect(
      (
        await new AxeBuilder({ page })
          .include('[data-testid="blocks-example"]')
          .analyze()
      ).violations,
      state,
    ).toEqual([])
  }

  for (const width of [1440, 768, 390]) {
    await page.setViewportSize({ width, height: 900 })
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            document.documentElement.scrollWidth -
            document.documentElement.clientWidth,
        ),
      )
      .toBeLessThanOrEqual(1)
    await expect(editor.locator("[data-editor-toggle-summary]")).toHaveText(
      title,
    )
    await info.attach(`blocks-${width}`, {
      body: await page
        .getByTestId("blocks-example")
        .screenshot({ scale: "css" }),
      contentType: "image/png",
    })
  }
})

test("invalid icon and stale icon action leave host replacement unchanged", async ({
  page,
}) => {
  const editor = page.getByRole("textbox", {
    name: "Blocks editor",
    exact: true,
  })

  const toolbar = page.getByRole("toolbar", { name: "Blocks", exact: true })
  await editor.click()
  await toolbar
    .getByRole("button", { name: "Insert callout", exact: true })
    .click()
  await editor.pressSequentially("Keep")

  const icon = toolbar.getByRole("textbox", {
    name: "Callout icon",
    exact: true,
  })

  await icon.fill("<script>")
  await expect(icon).toHaveAttribute("aria-invalid", "true")
  await expect(
    toolbar.getByRole("button", { name: "Apply icon", exact: true }),
  ).toBeDisabled()
  await icon.fill("✅")
  await page
    .getByRole("button", { name: "Replace blocks document", exact: true })
    .click()
  await expect(
    toolbar.getByRole("button", { name: "Apply icon", exact: true }),
  ).toBeDisabled()
  await expect(editor).toHaveText("Host replacement")
})

test("clipboard preserves marked rich blocks and rejects malformed block HTML", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"])

  const editor = page.getByRole("textbox", {
    name: "Blocks editor",
    exact: true,
  })

  await editor.click()
  await page
    .getByRole("toolbar", { name: "Blocks", exact: true })
    .getByRole("button", { name: "Insert callout", exact: true })
    .click()
  await editor.pressSequentially("Clipboard content")
  await editor.press("ControlOrMeta+a")
  await editor.press("ControlOrMeta+c")
  await editor.press("End")
  await editor.press("ArrowDown")
  await editor.press("ControlOrMeta+v")
  await expect
    .poll(
      async () =>
        ((await editor.textContent())?.match(/Clipboard content/g) ?? [])
          .length,
    )
    .toBe(2)

  const before = await page
    .getByLabel("Blocks JSON", { exact: true })
    .locator("pre")
    .textContent()

  await page.evaluate(async () => {
    await navigator.clipboard.write([
      new ClipboardItem({
        "text/html": new Blob(
          [
            "<details data-editor-toggle><summary>Missing body</summary></details>",
          ],
          { type: "text/html" },
        ),
      }),
    ])
  })
  await editor.press("ControlOrMeta+v")
  await expect(
    page.getByLabel("Blocks JSON", { exact: true }).locator("pre"),
  ).toHaveText(before!)
})
