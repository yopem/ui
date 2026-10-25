import type { Frame, Locator, Page } from "@playwright/test"

import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

declare global {
  interface Window {
    editorAiInlineFixture: {
      text(this: void, text: string): void
      finish(this: void, signal: "complete" | "error"): void
    }
  }
}

async function expectAiCalls(target: Page | Frame, count: number) {
  await expect
    .poll(
      async () =>
        Number(
          await target
            .locator("html")
            .getAttribute("data-editor-ai-fixture-calls"),
        ) || 0,
    )
    .toBe(count)
}

async function installAiStream(page: Page) {
  await page.addInitScript(() => {
    const originalFetch = window.fetch.bind(window)
    const encoder = new TextEncoder()

    let streamController:
      | ReadableStreamDefaultController<Uint8Array>
      | undefined

    let calls = 0

    window.editorAiInlineFixture = {
      text(text) {
        streamController?.enqueue(
          encoder.encode(`event: text\ndata: ${JSON.stringify({ text })}\n\n`),
        )
      },
      finish(signal) {
        const message =
          signal === "complete"
            ? 'event: complete\ndata: {"version":1}\n\n'
            : 'event: error\ndata: {"code":"provider_unavailable"}\n\n'

        streamController?.enqueue(encoder.encode(message))
        streamController?.close()
        streamController = undefined
      },
    }

    function fixtureFetch(input: RequestInfo | URL, init?: RequestInit) {
      const url = new URL(
        input instanceof Request ? input.url : String(input),
        window.location.href,
      )

      if (url.pathname !== "/__fixture-ai") return originalFetch(input, init)

      calls += 1
      document.documentElement.dataset.editorAiFixtureCalls = String(calls)
      document.documentElement.dataset.editorAiFixtureCsrf =
        new Headers(init?.headers).get("x-csrf-token") ?? ""

      return Promise.resolve(
        new Response(
          new ReadableStream<Uint8Array>({
            start(controller) {
              streamController = controller
              init?.signal?.addEventListener(
                "abort",
                () => {
                  controller.error(new DOMException("Aborted", "AbortError"))
                  streamController = undefined
                },
                { once: true },
              )
            },
            cancel() {
              streamController = undefined
            },
          }),
          { headers: { "content-type": "text/event-stream" } },
        ),
      )
    }

    Object.defineProperty(window, "fetch", {
      configurable: true,
      value: fixtureFetch,
      writable: true,
    })
  })
}

async function configureExample(target: Page | Frame) {
  const example = target.getByTestId("editor-example-public-ai")
  await expect(example).toBeVisible()
  await example.getByRole("button", { name: "Live preview" }).click()

  const setup = example.getByRole("region", { name: "AI host setup" })
  await setup.getByLabel("Host endpoint").fill("/__fixture-ai")
  await setup.getByLabel("Host document ID").fill("fixture-document")
  await setup.getByLabel("Host CSRF token").fill("fixture-csrf")
  await setup.getByRole("button", { name: "Configure AI" }).click()

  const editor = setup.getByRole("textbox", { name: "Public AI editor" })
  await expect(editor).toHaveAttribute("contenteditable", "true")

  return { editor, example, setup }
}

async function beginSelectionRequest(target: Page | Frame, editor: Locator) {
  await editor.fill("Keep this source")
  await editor.press("ControlOrMeta+a")

  const floatingToolbar = target.getByRole("toolbar", {
    name: "Selection AI commands",
  })

  await expect(floatingToolbar).toBeVisible()
  await expectAiCalls(target, 0)

  await floatingToolbar
    .getByRole("button", { name: "Ask about selection", exact: true })
    .click()

  const dialog = target.getByRole("dialog", { name: "AI command menu" })
  await expect(dialog).toBeVisible()
  await expectAiCalls(target, 0)
  const search = dialog.getByRole("textbox", { name: "Search AI commands" })
  await search.fill("Improve")
  await search.press("Enter")
  await expect(
    dialog.locator('[data-slot="editor-ai-menu-status"]'),
  ).toHaveAttribute("data-state", "streaming")
  await expectAiCalls(target, 1)
  await expect(target.locator("html")).toHaveAttribute(
    "data-editor-ai-fixture-csrf",
    "fixture-csrf",
  )

  return dialog
}

async function sendText(target: Page | Frame, text: string) {
  await target.evaluate((value) => {
    window.editorAiInlineFixture.text(value)
  }, text)
}

async function sendSignal(target: Page | Frame, signal: "complete" | "error") {
  await target.evaluate((value) => {
    window.editorAiInlineFixture.finish(value)
  }, signal)
}

test("@a11y selection AI streams a plain preview and applies only after clean EOF approval", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 760 })
  await installAiStream(page)
  await page.goto("/editor/examples#public-ai")
  const { editor, example } = await configureExample(page)
  const dialog = await beginSelectionRequest(page, editor)
  const untrusted = "<script>window.didRun = true</script><Callout />"

  const proposal = [
    untrusted,
    "x".repeat(319 - Array.from(untrusted).length),
    "😀",
    "x".repeat(300),
  ].join("")

  const preview = page.locator('[data-slot="editor-ai-inline-preview"]')

  await sendText(page, proposal)
  await expect(preview).toBeVisible()
  await expect(preview).toHaveAttribute("aria-hidden", "true")
  await expect(preview).toContainText("<script>window.didRun = true</script>")
  await expect(preview).toContainText("😀…")
  await expect(preview.locator("script, callout")).toHaveCount(0)
  await expect(editor).toHaveText("Keep this source")
  expect(
    await page.evaluate(() =>
      Object.prototype.hasOwnProperty.call(window, "didRun"),
    ),
  ).toBe(false)
  await expect
    .poll(async () => (await preview.textContent())?.endsWith("…"))
    .toBe(true)
  await expect
    .poll(async () => (await preview.textContent())?.length ?? 0)
    .toBeLessThan(proposal.length)
  await expect(dialog.locator('[aria-label="AI proposal"]')).toContainText(
    proposal,
  )
  await expect(preview.locator("button, input, a, [tabindex]")).toHaveCount(0)
  await expect(
    dialog.getByRole("button", { name: "Replace selection" }),
  ).toHaveCount(0)
  await expect
    .poll(() =>
      dialog.evaluate((element) =>
        element.contains(element.ownerDocument.activeElement),
      ),
    )
    .toBe(true)
  const axeWhileStreaming = await new AxeBuilder({ page }).analyze()
  expect(axeWhileStreaming.violations).toEqual([])

  const bounds = await preview.evaluate((element) => {
    const rect = element.getBoundingClientRect()
    const view = element.ownerDocument.defaultView

    return {
      bottom: rect.bottom,
      height: view?.innerHeight ?? 0,
      left: rect.left,
      right: rect.right,
      top: rect.top,
      width: view?.innerWidth ?? 0,
    }
  })

  expect(bounds.left).toBeGreaterThanOrEqual(0)
  expect(bounds.right).toBeLessThanOrEqual(bounds.width)
  expect(bounds.top).toBeGreaterThanOrEqual(0)
  expect(bounds.bottom).toBeLessThanOrEqual(bounds.height)

  await sendSignal(page, "complete")
  await expect(
    dialog.locator('[data-slot="editor-ai-menu-status"]'),
  ).toHaveAttribute("data-state", "ready")
  await expect(dialog.locator('[aria-label="AI proposal"]')).toContainText(
    proposal,
  )
  await dialog.getByRole("button", { name: "Replace selection" }).click()
  await expect(editor).toHaveText(proposal)
  await expect(editor.locator("script, callout")).toHaveCount(0)
  expect(
    await page.evaluate(() =>
      Object.prototype.hasOwnProperty.call(window, "didRun"),
    ),
  ).toBe(false)
  await expect(preview).toHaveCount(0)
  await example
    .getByRole("toolbar", { name: "AI tools" })
    .getByRole("button", { name: "Undo" })
    .click()
  await expect(editor).toHaveText("Keep this source")
  await expectAiCalls(page, 1)
})

test("abort, read-only changes, and stream errors clear the transient preview", async ({
  page,
}) => {
  await installAiStream(page)
  await page.goto("/editor/examples#public-ai")
  const { editor } = await configureExample(page)
  let dialog = await beginSelectionRequest(page, editor)
  let preview = page.locator('[data-slot="editor-ai-inline-preview"]')

  await sendText(page, "partial before abort")
  await expect(preview).toBeVisible()
  await dialog.getByRole("button", { name: "Stop" }).click()
  await expect(preview).toHaveCount(0)
  await expect(editor).toHaveText("Keep this source")
  await dialog.getByRole("button", { name: "Close" }).click()

  await editor.fill("Keep this source")
  dialog = await beginSelectionRequest(page, editor)
  preview = page.locator('[data-slot="editor-ai-inline-preview"]')
  await sendText(page, "partial before read-only")
  await expect(preview).toBeVisible()
  await page.keyboard.press("Alt+Shift+r")
  await expect(editor).toHaveAttribute("contenteditable", "false")
  await expect(preview).toHaveCount(0)
  await expect(editor).toHaveText("Keep this source")
  await page.keyboard.press("Escape")
  await page.keyboard.press("Alt+Shift+r")
  await expect(editor).toHaveAttribute("contenteditable", "true")

  await editor.fill("Keep this source")
  dialog = await beginSelectionRequest(page, editor)
  preview = page.locator('[data-slot="editor-ai-inline-preview"]')
  await sendText(page, "partial before error")
  await expect(preview).toBeVisible()
  await sendSignal(page, "error")
  await expect(
    dialog.locator('[data-slot="editor-ai-menu-status"]'),
  ).toHaveAttribute("data-state", "failed")
  await expect(preview).toHaveCount(0)
  await expect(editor).toHaveText("Keep this source")
})

test("preview portal follows iframe owner document and remains within its viewport", async ({
  page,
}) => {
  await installAiStream(page)
  await page.goto("/editor/examples")
  await page.evaluate(() => {
    const frame = document.createElement("iframe")
    frame.title = "AI preview frame"
    frame.name = "ai-preview-frame"
    frame.width = "390"
    frame.height = "720"
    frame.src = "/editor/examples#public-ai"
    document.body.append(frame)
  })

  const frame = page.frame({ name: "ai-preview-frame" })

  if (!frame) throw new Error("AI preview frame did not load.")

  const { editor } = await configureExample(frame)
  const dialog = await beginSelectionRequest(frame, editor)
  const preview = frame.locator('[data-slot="editor-ai-inline-preview"]')
  await sendText(frame, "iframe proposal")
  await expect(preview).toBeVisible()

  const geometry = await preview.evaluate((element) => {
    const rect = element.getBoundingClientRect()
    const view = element.ownerDocument.defaultView

    return {
      bottom: rect.bottom,
      height: view?.innerHeight ?? 0,
      left: rect.left,
      ownerDocumentMatches: element.ownerDocument === view?.document,
      right: rect.right,
      top: rect.top,
      width: view?.innerWidth ?? 0,
    }
  })

  expect(geometry.ownerDocumentMatches).toBe(true)
  expect(geometry.left).toBeGreaterThanOrEqual(0)
  expect(geometry.right).toBeLessThanOrEqual(geometry.width)
  expect(geometry.top).toBeGreaterThanOrEqual(0)
  expect(geometry.bottom).toBeLessThanOrEqual(geometry.height)
  await expect(dialog).toBeVisible()
  await expect
    .poll(() =>
      dialog.evaluate((element) =>
        element.contains(element.ownerDocument.activeElement),
      ),
    )
    .toBe(true)
  await expect(preview.locator("button, input, a, [tabindex]")).toHaveCount(0)
})
