import AxeBuilder from "@axe-core/playwright"
import {
  expect,
  test,
  type Locator,
  type Page,
  type Request,
} from "@playwright/test"

const cursorAiHostOrigin = process.env.CURSOR_OVERLAY_AI_HOST_ORIGIN

const cursorAiHostEndpoint = process.env.CURSOR_OVERLAY_AI_HOST_ENDPOINT

const cursorAiDocumentId = process.env.CURSOR_OVERLAY_AI_DOCUMENT_ID

const cursorAiCsrfToken = process.env.CURSOR_OVERLAY_AI_CSRF_TOKEN

interface CursorAiFixture {
  origin: string
  endpoint: string
  documentId: string
  csrf: string
}

const cursorAiFixture: CursorAiFixture | undefined =
  cursorAiHostOrigin &&
  cursorAiHostEndpoint &&
  cursorAiDocumentId &&
  cursorAiCsrfToken &&
  process.env.CURSOR_OVERLAY_AI_HOST_PERMISSION === "ai:invoke"
    ? {
        origin: cursorAiHostOrigin,
        endpoint: cursorAiHostEndpoint,
        documentId: cursorAiDocumentId,
        csrf: cursorAiCsrfToken,
      }
    : undefined

const cursorAiDelayedStream =
  process.env.CURSOR_OVERLAY_AI_DELAYED_STREAM === "1"

async function openExample(page: Page, origin?: string) {
  await page.goto(
    origin
      ? new URL("/editor/examples#public-cursors", origin).href
      : "/editor/examples#public-cursors",
  )
  const example = page.getByTestId("editor-example-public-cursors")
  await example
    .getByRole("button", { name: "Live preview", exact: true })
    .click()

  const editor = example.getByRole("textbox", {
    name: "Public cursor overlay editor",
    exact: true,
  })

  await expect(editor).toHaveAttribute("contenteditable", "true")
  await expect(
    example.getByRole("button", { name: "Rewrite", exact: true }),
  ).toHaveCount(0)

  return { example, editor }
}

function getHostOrigin(fixture: CursorAiFixture) {
  let origin: string

  try {
    const url = new URL(fixture.origin)

    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      url.pathname !== "/" ||
      url.search ||
      url.hash
    )
      throw new Error()

    origin = url.origin
  } catch {
    throw new Error(
      "Host origin must be a plain HTTPS origin without credentials, path, query, or fragment.",
    )
  }

  getHostEndpointUrl(fixture, origin)

  return origin
}

function getHostEndpointUrl(fixture: CursorAiFixture, origin: string) {
  try {
    const url = new URL(fixture.endpoint, origin)

    if (
      url.origin !== origin ||
      url.username ||
      url.password ||
      url.search ||
      url.hash
    )
      throw new Error()

    return url.href
  } catch {
    throw new Error(
      "Host endpoint must be same-origin and must not include credentials, a query, or a fragment.",
    )
  }
}

async function configureAi(example: Locator, fixture: CursorAiFixture) {
  await example.getByLabel("Host endpoint").fill(fixture.endpoint)
  await example.getByLabel("Host document ID").fill(fixture.documentId)
  await example.getByLabel("Host CSRF token").fill(fixture.csrf)
  await example.getByRole("button", { name: "Configure AI" }).click()
  await expect(
    example.getByRole("button", { name: "Rewrite", exact: true }),
  ).toBeVisible()
  await expect(example.getByLabel("Host endpoint")).toBeDisabled()
  await expect(example.getByLabel("Host document ID")).toBeDisabled()
  await expect(example.getByLabel("Host CSRF token")).toBeDisabled()
}

async function openRewritePanel(page: Page, example: Locator, editor: Locator) {
  await editor.click()
  await page.keyboard.press("ControlOrMeta+a")
  await example.getByRole("button", { name: "Rewrite", exact: true }).click()

  return page.getByRole("dialog")
}

async function dispatchNativeDrop(page: Page, target: Locator) {
  const box = await page.locator('[data-slot="editor-content"]').boundingBox()

  if (!box) throw new Error("Editor content has no layout box")

  const session = await page.context().newCDPSession(page)
  const x = box.x + Math.min(40, box.width / 2)
  const y = box.y + Math.min(20, box.height / 2)

  const data = {
    items: [{ mimeType: "text/plain", data: "Native drop payload" }],
    dragOperationsMask: 1,
  }

  await session.send("Input.dispatchDragEvent", {
    type: "dragEnter",
    x,
    y,
    data,
  })
  await session.send("Input.dispatchDragEvent", {
    type: "dragOver",
    x,
    y,
    data,
  })
  await expect(target).toBeVisible()
  await session.send("Input.dispatchDragEvent", {
    type: "drop",
    x,
    y,
    data,
  })
  await session.detach()
}

async function dispatchNativeDragOver(page: Page) {
  const box = await page.locator('[data-slot="editor-content"]').boundingBox()

  if (!box) throw new Error("Editor content has no layout box")

  const session = await page.context().newCDPSession(page)
  const x = box.x + Math.min(40, box.width / 2)
  const y = box.y + Math.min(20, box.height / 2)

  const data = {
    items: [{ mimeType: "text/plain", data: "Read-only drag payload" }],
    dragOperationsMask: 1,
  }

  await session.send("Input.dispatchDragEvent", {
    type: "dragEnter",
    x,
    y,
    data,
  })
  await session.send("Input.dispatchDragEvent", {
    type: "dragOver",
    x,
    y,
    data,
  })
  await expect(
    page.locator('[data-slot="editor-cursor-drag-caret"]'),
  ).toHaveCount(0)
  await session.send("Input.dispatchDragEvent", {
    type: "dragCancel",
    x,
    y,
    data,
  })
  await session.detach()
}

test("native drop paints caret, inserts text, and clears caret", async ({
  page,
}) => {
  const { editor } = await openExample(page)
  const caret = page.locator('[data-slot="editor-cursor-drag-caret"]')

  await dispatchNativeDrop(page, caret)

  await expect(editor).toContainText("Native drop payload")
  await expect(caret).toHaveCount(0)
})

test("selection paint follows keyboard focus and editor lifecycle", async ({
  page,
}) => {
  const { example, editor } = await openExample(page)

  const selectionPaint = page.locator(
    'body [data-slot="editor-cursor-selection"]',
  )

  const toolbarControl = example.getByRole("button", {
    name: "Focused toolbar control",
    exact: true,
  })

  const readOnlyControl = example.getByRole("button", {
    name: "Make editor read-only",
    exact: true,
  })

  await editor
    .getByText("Select this text, then move focus to the toolbar.")
    .click()
  await page.keyboard.press("ControlOrMeta+a")
  await page.keyboard.press("Shift+Tab")
  await expect(toolbarControl).toBeFocused()
  await expect(selectionPaint.first()).toBeVisible()

  await readOnlyControl.click()
  await expect(editor).toHaveAttribute("contenteditable", "false")
  await expect(selectionPaint).toHaveCount(0)
  await dispatchNativeDragOver(page)

  await example.getByRole("button", { name: "Restore editing" }).click()
  await expect(editor).toHaveAttribute("contenteditable", "true")
  await editor
    .getByText("Select this text, then move focus to the toolbar.")
    .click()
  await page.keyboard.press("ControlOrMeta+a")
  await expect(selectionPaint.first()).toBeVisible()

  await example.getByRole("button", { name: "Unmount cursor overlay" }).click()
  await expect(selectionPaint).toHaveCount(0)
  await example.getByRole("button", { name: "Mount cursor overlay" }).click()
  await expect(selectionPaint.first()).toBeVisible()
})

test("cursor example has no axe violations or narrow viewport overflow", async ({
  page,
}) => {
  const { example } = await openExample(page)

  for (const width of [375, 1280]) {
    await page.setViewportSize({ width, height: 900 })
    await expect
      .poll(() =>
        example.evaluate(
          (element) => element.scrollWidth <= element.clientWidth,
        ),
      )
      .toBe(true)

    const report = await new AxeBuilder({ page })
      .include('[data-testid="editor-example-public-cursors"]')
      .analyze()

    expect(report.violations).toEqual([])
  }
})

test("AI stays hidden until a valid same-origin host config exists", async ({
  page,
}) => {
  const { example, editor } = await openExample(page)

  await example
    .getByLabel("Host endpoint")
    .fill("https://invalid.example/__cursor-overlay-ai")
  await example.getByLabel("Host document ID").fill("cursor-overlay-test")
  await example.getByLabel("Host CSRF token").fill("invalid-fixture-only")
  await example.getByRole("button", { name: "Configure AI" }).click()

  await expect(example.getByRole("alert")).toBeVisible()
  await expect(
    example.getByRole("button", { name: "Rewrite", exact: true }),
  ).toHaveCount(0)
  await expect(editor).toHaveAttribute("contenteditable", "true")
  await editor.fill("Editing works before AI setup.")
  await expect(editor).toContainText("Editing works before AI setup.")
})

test.describe("real-host cursor and AI integration", () => {
  test.use({ trace: "off" })

  test("AI panel focus retains selection paint without starting a request", async ({
    page,
  }) => {
    test.skip(
      !cursorAiFixture,
      "Requires CURSOR_OVERLAY_AI_HOST_ORIGIN, CURSOR_OVERLAY_AI_HOST_ENDPOINT, CURSOR_OVERLAY_AI_DOCUMENT_ID, CURSOR_OVERLAY_AI_CSRF_TOKEN, and CURSOR_OVERLAY_AI_HOST_PERMISSION=ai:invoke.",
    )

    if (!cursorAiFixture) return

    const origin = getHostOrigin(cursorAiFixture)
    const endpointUrl = getHostEndpointUrl(cursorAiFixture, origin)
    let requests = 0

    function countHostRequests(request: Request) {
      if (request.url() === endpointUrl) requests += 1
    }

    page.on("request", countHostRequests)

    try {
      const { example, editor } = await openExample(page, origin)
      await configureAi(example, cursorAiFixture)
      await editor.fill("Select this text and open the AI panel.")
      const dialog = await openRewritePanel(page, example, editor)

      await expect(dialog.getByLabel("AI instruction")).toBeFocused()
      await expect(
        page.locator('body [data-slot="editor-cursor-selection"]').first(),
      ).toBeVisible()
      expect(requests).toBe(0)
    } finally {
      page.off("request", countHostRequests)
    }
  })

  test("pending real-host proposal becomes stale after document mutation", async ({
    page,
  }) => {
    test.skip(
      !cursorAiFixture,
      "Requires explicit same-origin HTTPS host, document, CSRF, and ai:invoke fixture configuration.",
    )
    test.skip(
      !cursorAiDelayedStream,
      "Requires CURSOR_OVERLAY_AI_DELAYED_STREAM=1 and a host stream that stays open for mutation.",
    )

    if (!cursorAiFixture || !cursorAiDelayedStream) return

    test.setTimeout(90_000)
    const origin = getHostOrigin(cursorAiFixture)
    const { example, editor } = await openExample(page, origin)
    await configureAi(example, cursorAiFixture)
    await editor.fill("Original document text.")
    const dialog = await openRewritePanel(page, example, editor)

    await dialog.getByLabel("AI instruction").fill("Rewrite the selection")
    await dialog.getByRole("button", { name: "Request proposal" }).click()
    await expect(dialog.locator("output")).toHaveText("streaming")
    await editor.fill("Host changed document text while request was pending.")
    await expect(dialog.locator("output")).toHaveText("stale")
    await expect(dialog.getByLabel("AI proposal")).toBeEmpty()
    await expect(
      dialog.getByRole("button", { name: "Approve proposal" }),
    ).toBeDisabled()
    await expect(editor).toHaveText(
      "Host changed document text while request was pending.",
    )
  })

  test("ready real-host proposal cannot apply after document mutation", async ({
    page,
  }) => {
    test.skip(
      !cursorAiFixture,
      "Requires CURSOR_OVERLAY_AI_HOST_ORIGIN, CURSOR_OVERLAY_AI_HOST_ENDPOINT, CURSOR_OVERLAY_AI_DOCUMENT_ID, CURSOR_OVERLAY_AI_CSRF_TOKEN, and CURSOR_OVERLAY_AI_HOST_PERMISSION=ai:invoke.",
    )

    if (!cursorAiFixture) return

    test.setTimeout(90_000)
    const origin = getHostOrigin(cursorAiFixture)
    const { example, editor } = await openExample(page, origin)
    await configureAi(example, cursorAiFixture)
    await editor.fill("Original document text.")
    const dialog = await openRewritePanel(page, example, editor)

    await dialog.getByLabel("AI instruction").fill("Rewrite the selection")
    await dialog.getByRole("button", { name: "Request proposal" }).click()
    const approve = dialog.getByRole("button", { name: "Approve proposal" })
    await expect(approve).toBeEnabled()
    await editor.fill("Host changed document text before approval.")
    await expect(dialog.locator("output")).toHaveText("stale")
    await expect(dialog.getByLabel("AI proposal")).toBeEmpty()
    await expect(approve).toBeDisabled()
    await expect(editor).toHaveText(
      "Host changed document text before approval.",
    )
  })

  test("cancelling a real-host request does not apply or retry", async ({
    page,
  }) => {
    test.skip(
      !cursorAiFixture,
      "Requires explicit same-origin HTTPS host, document, CSRF, and ai:invoke fixture configuration.",
    )
    test.skip(
      !cursorAiDelayedStream,
      "Requires CURSOR_OVERLAY_AI_DELAYED_STREAM=1 and a host stream that stays open for cancellation.",
    )

    if (!cursorAiFixture || !cursorAiDelayedStream) return

    test.setTimeout(90_000)
    const origin = getHostOrigin(cursorAiFixture)
    const endpointUrl = getHostEndpointUrl(cursorAiFixture, origin)
    let requests = 0

    function countHostRequests(request: Request) {
      if (request.url() === endpointUrl) requests += 1
    }

    page.on("request", countHostRequests)

    try {
      const { example, editor } = await openExample(page, origin)
      await configureAi(example, cursorAiFixture)
      await editor.fill("Keep this document unchanged.")
      const dialog = await openRewritePanel(page, example, editor)

      await dialog.getByLabel("AI instruction").fill("Draft a proposal")
      await dialog.getByRole("button", { name: "Request proposal" }).click()
      await expect(dialog.locator("output")).toHaveText("streaming")
      await expect.poll(() => requests).toBe(1)
      await dialog.getByRole("button", { name: "Cancel request" }).click()
      await expect(dialog.locator("output")).toHaveText("cancelled")
      await expect(dialog.getByRole("alert")).toBeVisible()
      await expect(
        dialog.getByRole("button", { name: "Approve proposal" }),
      ).toBeDisabled()
      await expect(editor).toHaveText("Keep this document unchanged.")
      expect(requests).toBe(1)
    } finally {
      page.off("request", countHostRequests)
    }
  })
})
