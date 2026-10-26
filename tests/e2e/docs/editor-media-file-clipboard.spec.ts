import type { Page } from "@playwright/test"

import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

const imageData =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP4z8DwHwAFAAH/iZk9HQAAAABJRU5ErkJggg=="

async function writeImageClipboard(page: Page) {
  await page.evaluate(async (base64) => {
    const binary = atob(base64)

    const bytes = Uint8Array.from(binary, (character) =>
      character.charCodeAt(0),
    )

    const image = new Blob([bytes], { type: "image/png" })

    await navigator.clipboard.write([new ClipboardItem({ "image/png": image })])
  }, imageData)
}

async function writeRichImageClipboard(page: Page) {
  await page.evaluate(async (base64) => {
    const binary = atob(base64)

    const bytes = Uint8Array.from(binary, (character) =>
      character.charCodeAt(0),
    )

    await navigator.clipboard.write([
      new ClipboardItem({
        "image/png": new Blob([bytes], { type: "image/png" }),
        "text/html": new Blob(["<p><strong>Native rich data</strong></p>"], {
          type: "text/html",
        }),
        "text/plain": new Blob(["Native rich data"], {
          type: "text/plain",
        }),
      }),
    ])
  }, imageData)
}

async function openMediaClipboard(page: Page) {
  await page.goto("/editor/media-file-clipboard", {
    waitUntil: "domcontentloaded",
  })
  await expect(
    page.getByRole("region", { name: "Media file clipboard editor" }),
  ).toBeVisible()
  await expect(
    page.getByRole("textbox", {
      name: "Media file clipboard content",
      exact: true,
    }),
  ).toHaveAttribute("contenteditable", "true")
  await expect(
    page.getByRole("textbox", {
      name: "Unconfigured media content",
      exact: true,
    }),
  ).toHaveAttribute("contenteditable", "true")
}

test("uploads one pasted file and fails closed without host upload", async ({
  page,
  context,
}, testInfo) => {
  test.slow()
  await openMediaClipboard(page)
  await context.grantPermissions(["clipboard-read", "clipboard-write"], {
    origin: new URL(page.url()).origin,
  })

  await page.clock.install({ time: new Date("2030-01-01T00:00:00Z") })
  await page.clock.pauseAt(new Date("2030-01-01T00:01:00Z"))

  const configured = page.getByRole("region", {
    name: "Media file clipboard editor",
    exact: true,
  })

  const editor = configured.getByRole("textbox", {
    name: "Media file clipboard content",
    exact: true,
  })

  await editor.fill("Keep original")
  await editor.press("End")
  await writeImageClipboard(page)
  await editor.press("ControlOrMeta+V")

  await expect(
    page.getByRole("progressbar", { name: "Media file upload", exact: true }),
  ).toBeVisible()
  await page.clock.resume()
  const media = editor.locator('[data-slot="editor-media"]')
  await expect(media).toHaveCount(1)
  await expect(media.locator("img")).toHaveAttribute(
    "src",
    "https://ui.yopem.com/favicon.svg",
  )
  await expect(editor).toContainText("Keep original")

  await editor.press("ControlOrMeta+A")
  await editor.press("Backspace")
  await expect(media).toHaveCount(0)
  await editor.fill("Keep rich data")
  await editor.press("End")
  await writeRichImageClipboard(page)
  await editor.press("ControlOrMeta+V")
  await expect(editor).toContainText("Native rich data")
  await expect(media).toHaveCount(0)
  await expect(
    page.getByRole("progressbar", { name: "Media file upload" }),
  ).toHaveCount(0)

  const report = await new AxeBuilder({ page })
    .include('[aria-label="Media file clipboard editor"]')
    .analyze()

  expect(report.violations).toEqual([])
  await testInfo.attach("media-file-clipboard-axe.json", {
    body: JSON.stringify(report),
    contentType: "application/json",
  })

  const unconfigured = page.getByRole("region", {
    name: "Unconfigured media file editor",
    exact: true,
  })

  const unconfiguredEditor = unconfigured.getByRole("textbox", {
    name: "Unconfigured media content",
    exact: true,
  })

  await unconfiguredEditor.fill("No upload configured")
  await unconfiguredEditor.press("End")
  await writeImageClipboard(page)
  await unconfiguredEditor.press("ControlOrMeta+V")
  await expect(unconfigured.locator('[data-slot="editor-media"]')).toHaveCount(
    0,
  )
  await expect(
    unconfigured.getByRole("progressbar", { name: "Media file upload" }),
  ).toHaveCount(0)
  await expect(unconfiguredEditor).toContainText("No upload configured")
})

test("cancelled and stale uploads do not replace selected content", async ({
  page,
  context,
}) => {
  test.slow()
  await openMediaClipboard(page)
  await context.grantPermissions(["clipboard-read", "clipboard-write"], {
    origin: new URL(page.url()).origin,
  })
  await page.clock.install({ time: new Date("2030-01-01T00:00:00Z") })
  await page.clock.pauseAt(new Date("2030-01-01T00:01:00Z"))

  const region = page.getByRole("region", {
    name: "Media file clipboard editor",
    exact: true,
  })

  const editor = region.getByRole("textbox", {
    name: "Media file clipboard content",
    exact: true,
  })

  const media = editor.locator('[data-slot="editor-media"]')
  await editor.fill("Keep original")
  await editor.press("End")
  await writeImageClipboard(page)
  await editor.press("ControlOrMeta+V")

  const cancel = region.getByRole("button", {
    name: "Cancel upload",
    exact: true,
  })

  await expect(cancel).toBeVisible()
  await cancel.click()
  await expect(media).toHaveCount(0)
  await expect(editor).toHaveText("Keep original")

  await editor.press("ControlOrMeta+V")
  await expect(cancel).toBeVisible()
  await editor.press("End")
  await editor.type(" changed")
  await expect(cancel).toHaveCount(0)
  await expect(media).toHaveCount(0)
  await expect(editor).toHaveText("Keep original changed")
  await page.clock.resume()
})

test("moving the caret cancels a pending file insertion without changing content", async ({
  page,
  context,
}) => {
  test.slow()
  await openMediaClipboard(page)
  await context.grantPermissions(["clipboard-read", "clipboard-write"], {
    origin: new URL(page.url()).origin,
  })
  await page.clock.install({ time: new Date("2030-01-01T00:00:00Z") })
  await page.clock.pauseAt(new Date("2030-01-01T00:01:00Z"))

  const region = page.getByRole("region", {
    name: "Media file clipboard editor",
    exact: true,
  })

  const editor = region.getByRole("textbox", {
    name: "Media file clipboard content",
    exact: true,
  })

  await editor.fill("Keep original")
  await editor.press("End")
  await writeImageClipboard(page)
  await editor.press("ControlOrMeta+V")
  await expect(
    region.getByRole("button", { name: "Cancel upload", exact: true }),
  ).toBeVisible()
  await editor.press("ArrowLeft")
  await expect(
    region.getByRole("button", { name: "Cancel upload", exact: true }),
  ).toHaveCount(0)
  await page.clock.runFor(1000)
  await expect(editor.locator('[data-slot="editor-media"]')).toHaveCount(0)
  await expect(editor).toHaveText("Keep original")
  await expect(editor).toBeFocused()
  await editor.press("X")
  await expect(editor).toHaveText("Keep originaXl")
  await page.clock.resume()
})

test("validates file drop coordinates and accepts files inside the editor", async ({
  page,
}) => {
  test.slow()
  await openMediaClipboard(page)

  const region = page.getByRole("region", {
    name: "Media file clipboard editor",
    exact: true,
  })

  const editor = region.getByRole("textbox", {
    name: "Media file clipboard content",
    exact: true,
  })

  await editor.fill("Keep original")

  const point = await editor.evaluate((element) => {
    const range = element.ownerDocument.createRange()
    range.selectNodeContents(element)
    const bounds = range.getBoundingClientRect()

    return { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 }
  })

  const invalidDropPrevented = await page.evaluate(() => {
    const editor = document.querySelector(
      '[aria-label="Media file clipboard content"]',
    )

    if (!editor) throw new Error("Editor is missing")
    const transfer = new DataTransfer()
    transfer.items.add(
      new File(["image"], "outside.png", { type: "image/png" }),
    )

    const event = new DragEvent("drop", {
      bubbles: true,
      cancelable: true,
      clientX: -1,
      clientY: -1,
      dataTransfer: transfer,
    })

    editor.dispatchEvent(event)

    return event.defaultPrevented
  })

  expect(invalidDropPrevented).toBe(true)
  await expect(editor.locator('[data-slot="editor-media"]')).toHaveCount(0)

  await page.evaluate(({ x, y }) => {
    const editor = document.querySelector(
      '[aria-label="Media file clipboard content"]',
    )

    if (!editor) throw new Error("Editor is missing")
    const transfer = new DataTransfer()
    transfer.items.add(
      new File(["image"], "dropped.png", { type: "image/png" }),
    )
    editor.dispatchEvent(
      new DragEvent("drop", {
        bubbles: true,
        cancelable: true,
        clientX: x,
        clientY: y,
        dataTransfer: transfer,
      }),
    )
  }, point)

  await expect(editor.locator('[data-slot="editor-media"]')).toHaveCount(1)
  await expect(editor).toContainText("Keep original")
})
