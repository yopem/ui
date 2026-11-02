import type { Locator, Page } from "@playwright/test"

import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

const file = {
  name: "report.txt",
  mimeType: "text/plain",
  buffer: Buffer.from("hello"),
}

async function openPlaceholderExample(
  page: Page,
  slug = "media-placeholder-element",
) {
  await page.goto(`/editor/${slug}`)

  for (const number of [1, 2])
    await expect(
      page.getByRole("textbox", {
        name: `Placeholder content ${number}`,
        exact: true,
      }),
    ).toHaveAttribute("contenteditable", "true")
}

test("@a11y native media placeholder selection, typed errors, retry, history and two roots", async ({
  page,
}, testInfo) => {
  await openPlaceholderExample(page)

  const first = page.getByRole("region", {
    name: "Media placeholder example 1",
    exact: true,
  })

  const second = page.getByRole("region", {
    name: "Media placeholder example 2",
    exact: true,
  })

  await first.getByRole("textbox", { name: "Placeholder content 1" }).click()
  await first
    .getByRole("button", { name: "Insert upload placeholder", exact: true })
    .click()
  const node = first.locator('[data-slot="editor-media-placeholder"]')
  const input = node.getByLabel("Select upload file", { exact: true })
  await input.focus()
  const chooser = page.waitForEvent("filechooser")
  await input.press("Enter")
  await (await chooser).setFiles(file)
  await expect(node.getByRole("progressbar")).toHaveAttribute(
    "aria-valuenow",
    "35",
  )
  await expect(
    second.locator('[data-slot="editor-media-placeholder"]'),
  ).toHaveCount(0)
  expect(
    (
      await new AxeBuilder({ page })
        .include('[aria-label="Media placeholder example 1"]')
        .analyze()
    ).violations,
  ).toEqual([])
  await first.getByRole("button", { name: "Fail upload", exact: true }).click()
  await expect(node.getByRole("alert")).toHaveAttribute(
    "data-upload-error",
    "upload",
  )
  expect(
    (
      await new AxeBuilder({ page })
        .include('[aria-label="Media placeholder example 1"]')
        .analyze()
    ).violations,
  ).toEqual([])
  await node.getByRole("button", { name: "Retry upload", exact: true }).click()
  await first
    .getByRole("button", { name: "Complete upload", exact: true })
    .click()
  await expect(node).toHaveCount(0)
  await expect(first.locator('[data-slot="editor-media"]')).toHaveCount(1)
  await first.getByRole("button", { name: "Undo", exact: true }).click()
  await expect(node).toHaveCount(1)
  await expect(
    node.getByRole("button", { name: "Retry upload", exact: true }),
  ).toBeDisabled()
  await first.getByRole("button", { name: "Redo", exact: true }).click()
  await expect(first.locator('[data-slot="editor-media"]')).toHaveCount(1)
  await page.screenshot({
    path: testInfo.outputPath("media-placeholder-success.png"),
    fullPage: true,
  })
})

test("pending cancel and undo reject late success; restored files require explicit selection", async ({
  page,
}) => {
  await openPlaceholderExample(page)

  const fixture = page.getByRole("region", {
    name: "Media placeholder example 1",
    exact: true,
  })

  await fixture.getByRole("textbox", { name: "Placeholder content 1" }).click()
  await fixture
    .getByRole("button", { name: "Insert upload placeholder", exact: true })
    .click()
  const node = fixture.locator('[data-slot="editor-media-placeholder"]')
  const choose = page.waitForEvent("filechooser")
  await node.getByLabel("Select upload file", { exact: true }).click()
  await (await choose).setFiles(file)
  await node.getByRole("button", { name: "Cancel upload", exact: true }).click()
  await expect(
    node.getByLabel("Select upload file", { exact: true }),
  ).toBeDisabled()
  await fixture
    .getByRole("button", { name: "Complete upload", exact: true })
    .click()
  await expect(fixture.locator('[data-slot="editor-media"]')).toHaveCount(0)
  await expect(
    node.getByLabel("Select upload file", { exact: true }),
  ).toBeEnabled()
  await node
    .getByLabel("Select upload file", { exact: true })
    .setInputFiles(file)
  await fixture.getByRole("button", { name: "Undo", exact: true }).click()
  await fixture
    .getByRole("button", { name: "Complete upload", exact: true })
    .click()
  await expect(fixture.locator('[data-slot="editor-media"]')).toHaveCount(0)
  await fixture.getByRole("button", { name: "Redo", exact: true }).click()
  await expect(node).toHaveCount(1)
  await expect(
    node.getByRole("button", { name: "Retry upload", exact: true }),
  ).toBeDisabled()
  await fixture
    .getByRole("button", { name: "Reload document", exact: true })
    .click()
  await expect(
    node.getByLabel("Select upload file", { exact: true }),
  ).toBeEnabled()
  await fixture
    .getByRole("button", { name: "Toggle read only", exact: true })
    .click()
  await expect(
    node.getByLabel("Select upload file", { exact: true }),
  ).toBeDisabled()
})

async function copyPlaceholder(page: Page, source: Locator) {
  const content = source.getByRole("textbox", { name: "Placeholder content 2" })
  await content.fill("Source keep")
  await source
    .getByRole("button", { name: "Insert upload placeholder", exact: true })
    .click()
  await content.focus()
  await content
    .locator(":scope > div")
    .first()
    .evaluate((element) => {
      const document = element.ownerDocument
      const selection = document.getSelection()

      if (!selection) throw new Error("Missing native selection")
      const range = document.createRange()
      range.selectNode(element)
      selection.removeAllRanges()
      selection.addRange(range)
    })
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => requestAnimationFrame(() => resolve())),
  )
  await page.keyboard.press("ControlOrMeta+c")

  return page.evaluate(async () => {
    const items = await navigator.clipboard.read()
    const item = items.find((entry) => entry.types.includes("text/html"))

    if (!item) throw new Error("Missing native placeholder HTML")

    return (await item.getType("text/html")).text()
  })
}

async function writeHTMLClipboard(page: Page, html: string) {
  await page.evaluate(
    (value) =>
      navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([value], { type: "text/html" }),
        }),
      ]),
    html,
  )
}

async function exportedDocument(fixture: Locator) {
  await fixture
    .getByRole("button", { name: "Export document", exact: true })
    .click()

  const source = await fixture
    .locator('[data-slot="placeholder-document-export"]')
    .textContent()

  expect(JSON.parse(source ?? "")).toMatchObject({ root: { type: "root" } })

  return source
}

for (const format of ["native", "html"] as const) {
  test(`native copy and ${format} paste enforce combined placeholder bounds before replacement`, async ({
    page,
    context,
  }, testInfo) => {
    await openPlaceholderExample(page)
    await context.grantPermissions(["clipboard-read", "clipboard-write"])

    const source = page.getByRole("region", {
      name: "Media placeholder example 2",
      exact: true,
    })

    const target = page.getByRole("region", {
      name: "Media placeholder example 1",
      exact: true,
    })

    const html = await copyPlaceholder(page, source)
    expect(html).toContain("data-editor-media-placeholder")

    if (format === "html") await writeHTMLClipboard(page, html)

    const content = target.getByRole("textbox", {
      name: "Placeholder content 1",
    })

    const nodes = target.locator('[data-slot="editor-media-placeholder"]')
    await content.fill("Keep selected")
    await content.press("End")
    await content.press("Enter")
    await content.evaluate((element) => {
      element.addEventListener(
        "paste",
        (event) => {
          if (event instanceof ClipboardEvent) {
            element.setAttribute(
              "data-paste-types",
              JSON.stringify(event.clipboardData?.types),
            )
            element.setAttribute(
              "data-paste-native",
              event.clipboardData?.getData("application/x-lexical-editor") ??
                "",
            )
          }
        },
        { capture: true, once: true },
      )
    })

    for (let count = 1; count <= 16; count++) {
      await page.keyboard.press("ControlOrMeta+v")
      await expect(nodes).toHaveCount(count)
    }

    if (format === "native") {
      await expect(content).toHaveAttribute(
        "data-paste-types",
        /application\/x-lexical-editor/,
      )
      expect(
        JSON.parse((await content.getAttribute("data-paste-native")) ?? ""),
      ).toMatchObject({
        namespace: "yopem-ui-editor",
        nodes: [
          {
            type: "editor-media-placeholder",
            version: 1,
            uploadKind: "file",
          },
        ],
      })
    } else
      await expect(content).not.toHaveAttribute(
        "data-paste-types",
        /application\/x-lexical-editor/,
      )
    const before = await exportedDocument(target)
    expect(before).toContain('"editor-media-placeholder"')
    await content.focus()
    await page.keyboard.press("ControlOrMeta+End")
    await page.keyboard.press("ControlOrMeta+v")
    await expect(nodes).toHaveCount(16)
    expect(await exportedDocument(target)).toBe(before)
    const paragraph = content.locator(":scope > p").first()
    await paragraph.click()
    await page.keyboard.press("Home")
    await page.keyboard.press("Shift+End")
    await page.keyboard.press("ControlOrMeta+v")
    await expect(nodes).toHaveCount(16)
    await expect(paragraph).toHaveText("Keep selected")
    expect(await exportedDocument(target)).toBe(before)
    await expect(
      source.locator('[data-slot="editor-media-placeholder"]'),
    ).toHaveCount(1)

    await content.focus()
    await page.keyboard.press("ControlOrMeta+a")
    await page.keyboard.press("ControlOrMeta+v")
    await expect(nodes).toHaveCount(1)
    await target.getByRole("button", { name: "Undo", exact: true }).click()
    await expect(nodes).toHaveCount(16)
    await target.getByRole("button", { name: "Redo", exact: true }).click()
    await expect(nodes).toHaveCount(1)
    await target
      .getByRole("button", { name: "Reload document", exact: true })
      .click()
    await expect(nodes).toHaveCount(1)
    await nodes
      .getByLabel("Select upload file", { exact: true })
      .setInputFiles(file)
    await target
      .getByRole("button", { name: "Complete upload", exact: true })
      .click()
    await expect(nodes).toHaveCount(0)
    await expect(target.locator('[data-slot="editor-media"]')).toHaveCount(1)
    const exported = await exportedDocument(target)
    expect(exported).toContain('"yopem-media"')
    await testInfo.attach(`placeholder-${format}-document.json`, {
      body: exported ?? "",
      contentType: "application/json",
    })
    await page.screenshot({
      path: testInfo.outputPath(`placeholder-${format}-clipboard.png`),
      fullPage: true,
    })
  })
}

for (const container of ["list", "table"] as const) {
  test(`copied placeholder cannot replace selected ${container} content or bypass host paste cancellation`, async ({
    page,
    context,
  }, testInfo) => {
    await openPlaceholderExample(page)
    await context.grantPermissions(["clipboard-read", "clipboard-write"])

    const source = page.getByRole("region", {
      name: "Media placeholder example 2",
      exact: true,
    })

    const target = page.getByRole("region", {
      name: "Media placeholder example 1",
      exact: true,
    })

    const html = await copyPlaceholder(page, source)

    const content = target.getByRole("textbox", {
      name: "Placeholder content 1",
    })

    await writeHTMLClipboard(
      page,
      container === "list"
        ? "<ul><li>Keep nested</li></ul>"
        : "<table><tbody><tr><td><p>Keep nested</p></td></tr></tbody></table>",
    )
    await content.click()
    await page.keyboard.press("ControlOrMeta+v")
    const nested = content.locator(container === "list" ? "li" : "td").first()
    await expect(nested).toHaveText("Keep nested")
    const before = await exportedDocument(target)
    await writeHTMLClipboard(page, html)
    await nested.click()
    await page.keyboard.press("Home")
    await page.keyboard.press("Shift+End")
    await page.keyboard.press("ControlOrMeta+v")
    await expect(
      target.locator('[data-slot="editor-media-placeholder"]'),
    ).toHaveCount(0)
    await expect(nested).toHaveText("Keep nested")
    expect(await exportedDocument(target)).toBe(before)

    await content.focus()
    await page.keyboard.press("ControlOrMeta+a")
    await page.keyboard.press("Backspace")
    const empty = await exportedDocument(target)
    await content.focus()
    await content.evaluate((element) => {
      element.addEventListener(
        "paste",
        (event) => {
          event.preventDefault()
          event.stopImmediatePropagation()
        },
        { capture: true, once: true },
      )
    })
    await page.keyboard.press("ControlOrMeta+v")
    expect(await exportedDocument(target)).toBe(empty)
    await content.focus()
    await page.keyboard.press("ControlOrMeta+v")
    await expect(
      target.locator('[data-slot="editor-media-placeholder"]'),
    ).toHaveCount(1)
    await testInfo.attach(`placeholder-${container}-preserved.json`, {
      body: before ?? "",
      contentType: "application/json",
    })
  })
}

for (const slug of [
  "media-placeholder-status",
  "media-upload-notification",
  "media-placeholder-file-input",
  "media-placeholder-retry-button",
  "media-placeholder-cancel-button",
  "media-placeholder-remove-button",
  "media-placeholder-insert-button",
]) {
  test(`@a11y ${slug} composed preview`, async ({ page }) => {
    await openPlaceholderExample(page, slug)

    const fixture = page.getByRole("region", {
      name: "Media placeholder example 1",
      exact: true,
    })

    await fixture
      .getByRole("textbox", { name: "Placeholder content 1" })
      .click()
    await fixture
      .getByRole("button", { name: "Insert upload placeholder", exact: true })
      .click()
    await expect(
      fixture.locator('[data-slot="editor-media-placeholder"]'),
    ).toHaveCount(1)
    expect(
      (
        await new AxeBuilder({ page })
          .include('[aria-label="Media placeholder example 1"]')
          .analyze()
      ).violations,
    ).toEqual([])
  })
}
