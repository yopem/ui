import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"
import { createHash } from "node:crypto"
import { readFile } from "node:fs/promises"

const upstreamCommit = "32142be14e71684bc39bf41f405086ad387feecf"

const upstreamPath =
  "apps/www/src/__tests__/package-integration/docx/lists.html"

const upstreamSHA256 =
  "e997f7402ecb5fca0c33c5bde6071b5ee54b599818c82fef3b74b6ce5b670fb0"

const plainTextFallback = "Pinned public fixture fallback"

const maxClipboardBytes = 1_048_576

const approvedImageURL = "https://word-images.example.test/approved.png"

const approvedImageSource = "file:///document/image001.png"

const approvedImageBytes = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=",
  "base64",
)

test("explicit image lookup resolves one approved source without an image fetch during setup", async ({
  page,
  context,
}) => {
  test.slow()

  let imageRequests = 0
  await page.route(approvedImageURL, async (route) => {
    imageRequests += 1
    await route.fulfill({ contentType: "image/png", body: approvedImageBytes })
  })
  await page.goto("/editor/examples#public-word-clipboard", {
    waitUntil: "domcontentloaded",
  })
  const card = page.getByTestId("editor-example-public-word-clipboard")
  await card.getByRole("button", { name: "Live preview", exact: true }).click()
  const example = page.getByTestId("public-word-clipboard")

  const editor = example.getByRole("textbox", {
    name: "Word clipboard editor",
    exact: true,
  })

  await expect(editor).toHaveAttribute("contenteditable", "true")
  await editor.fill("This local document resets after image setup")
  await example
    .getByLabel("Exact Word image source", { exact: true })
    .fill(approvedImageSource)
  await example
    .getByLabel("Approved HTTPS image URL", { exact: true })
    .fill(approvedImageURL)
  await example
    .getByLabel("Approved image alternative text", { exact: true })
    .fill("Approved document image")
  await example
    .getByRole("button", { name: "Apply image lookup and reset", exact: true })
    .click()
  await expect(editor).toHaveAttribute("contenteditable", "true")
  await expect(editor).toHaveText("")
  expect(imageRequests).toBe(0)
  await context.grantPermissions(["clipboard-read", "clipboard-write"], {
    origin: new URL(page.url()).origin,
  })
  await page.evaluate(async (source) => {
    await navigator.clipboard.write([
      new ClipboardItem({
        "text/html": new Blob(
          [
            `<p class="MsoNormal">Image lookup <img src="${source}" alt="Source image"></p>`,
          ],
          { type: "text/html" },
        ),
        "text/plain": new Blob(["Image lookup"], { type: "text/plain" }),
      }),
    ])
  }, approvedImageSource)
  await editor.click()
  await editor.press("ControlOrMeta+V")

  const image = editor.getByRole("img", {
    name: "Approved document image",
    exact: true,
  })

  await expect(image).toHaveAttribute("src", approvedImageURL)
  await expect(image).toHaveJSProperty("naturalWidth", 1)
  await expect(example.getByRole("alert")).toHaveCount(0)
  expect(imageRequests).toBe(1)

  const axe = await new AxeBuilder({ page })
    .include('[data-testid="public-word-clipboard"]')
    .analyze()

  expect(axe.violations).toEqual([])
})

test("exact pinned Word-shaped HTML pastes and invalid metadata fails closed", async ({
  page,
  context,
}, testInfo) => {
  test.slow()

  const fixture = await readFile(
    new URL(
      "../../editor-word-clipboard/fixtures/plate-word-lists.html.fixture",
      import.meta.url,
    ),
    "utf8",
  )

  expect(createHash("sha256").update(fixture).digest("hex")).toBe(
    upstreamSHA256,
  )
  expect(Buffer.byteLength(fixture, "utf8")).toBeLessThanOrEqual(
    maxClipboardBytes,
  )

  await page.goto("/editor/examples#public-word-clipboard", {
    waitUntil: "domcontentloaded",
  })
  const card = page.getByTestId("editor-example-public-word-clipboard")
  await card.getByRole("button", { name: "Live preview", exact: true }).click()
  const example = page.getByTestId("public-word-clipboard")

  const editor = example.getByRole("textbox", {
    name: "Word clipboard editor",
    exact: true,
  })

  await expect(editor).toBeVisible()
  await expect(editor).toHaveAttribute("contenteditable", "true")
  await context.grantPermissions(["clipboard-read", "clipboard-write"], {
    origin: new URL(page.url()).origin,
  })

  let imageRequests = 0
  page.on("request", (pageRequest) => {
    if (pageRequest.resourceType() === "image") imageRequests += 1
  })

  await editor.fill("Keep original")
  await editor.press("End")
  await editor.press("ControlOrMeta+Shift+ArrowLeft")
  expect(
    await page.evaluate(() => window.getSelection()?.toString() ?? ""),
  ).toBe("original")

  await page.evaluate(
    async ({ html, plainText }) => {
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([html], { type: "text/html" }),
          "text/plain": new Blob([plainText], { type: "text/plain" }),
        }),
      ])
    },
    { html: fixture, plainText: plainTextFallback },
  )

  const clipboard = await page.evaluate(async () => {
    const clipboard: {
      read(options?: { unsanitized?: string[] }): ReturnType<Clipboard["read"]>
    } = navigator.clipboard

    const item = (await clipboard.read({ unsanitized: ["text/html"] }))[0]

    if (!item) return null
    const html = await (await item.getType("text/html")).text()
    const plainText = await (await item.getType("text/plain")).text()

    return {
      officeStylesRetained: /mso-list\s*:/i.test(html),
      shellStyleRetained: /word-wrap:\s*break-word/i.test(html),
      plainText,
    }
  })

  expect(clipboard).toEqual({
    officeStylesRetained: true,
    shellStyleRetained: true,
    plainText: plainTextFallback,
  })
  await editor.press("ControlOrMeta+V")

  await expect(example.getByRole("alert")).toHaveCount(0)
  await expect(editor).toHaveAttribute("contenteditable", "true")
  await expect(editor.locator("h2")).toHaveText("Some nested lists")
  await expect(editor.getByText("Sub paragraph", { exact: true })).toBeVisible()
  await expect(editor).toContainText(
    "Different list adjacent to the one above.",
  )
  await expect(editor).toContainText("Keep")
  await expect(editor).not.toContainText("original")
  await expect(editor).not.toContainText(plainTextFallback)

  const listItems = await editor.locator("li").evaluateAll((items) =>
    items.map((item) =>
      Array.from(item.childNodes)
        .filter(
          (child) =>
            !(
              child instanceof HTMLElement &&
              ["OL", "UL"].includes(child.tagName)
            ),
        )
        .map((child) => child.textContent ?? "")
        .join("")
        .replace(/\s+/g, " ")
        .trim(),
    ),
  )

  expect(listItems).toEqual([
    "one",
    "two",
    "a",
    "b",
    "one",
    "two",
    "three",
    "four",
    "Same list",
    "Different list adjacent to the one above.",
  ])

  const listStructure = await editor.locator("ol, ul").evaluateAll((lists) =>
    lists.map((list) => {
      let depth = 0

      for (
        let parent = list.parentElement;
        parent;
        parent = parent.parentElement
      )
        if (["OL", "UL"].includes(parent.tagName)) depth += 1

      return {
        type: list.tagName.toLowerCase(),
        marker: list.getAttribute("data-editor-list-marker"),
        start: list instanceof HTMLOListElement ? list.start : null,
        depth,
      }
    }),
  )

  expect(listStructure).toEqual([
    { type: "ol", marker: "decimal", start: 1, depth: 0 },
    { type: "ol", marker: "lower-alpha", start: 1, depth: 1 },
    { type: "ul", marker: "disc", start: null, depth: 0 },
    { type: "ul", marker: "disc", start: null, depth: 1 },
    { type: "ul", marker: "disc", start: null, depth: 2 },
    { type: "ul", marker: "disc", start: null, depth: 0 },
    { type: "ul", marker: "disc", start: null, depth: 0 },
  ])

  const axe = await new AxeBuilder({ page })
    .include('[data-testid="public-word-clipboard"]')
    .analyze()

  expect(axe.violations).toEqual([])
  await expect(
    example.getByRole("button", { name: "Undo", exact: true }),
  ).toBeEnabled()
  await example.getByRole("button", { name: "Undo", exact: true }).click()
  await expect(editor).toHaveText("Keep original")
  await expect(
    example.getByRole("button", { name: "Redo", exact: true }),
  ).toBeEnabled()
  await example.getByRole("button", { name: "Redo", exact: true }).click()
  await expect(editor.locator("h2")).toHaveText("Some nested lists")

  const acceptedText = await editor.innerText()
  await example
    .getByRole("button", {
      name: "Make Word clipboard editor read-only",
      exact: true,
    })
    .click()
  await expect(editor).toHaveAttribute("contenteditable", "false")
  await editor.press("ControlOrMeta+V")
  expect(await editor.innerText()).toBe(acceptedText)
  await expect(editor.locator("h2")).toHaveText("Some nested lists")
  await expect(editor.locator("ol, ul")).toHaveCount(listStructure.length)

  const readonlyAxe = await new AxeBuilder({ page })
    .include('[data-testid="public-word-clipboard"]')
    .analyze()

  expect(readonlyAxe.violations).toEqual([])
  await example
    .getByRole("button", {
      name: "Make Word clipboard editor editable",
      exact: true,
    })
    .click()
  await expect(editor).toHaveAttribute("contenteditable", "true")

  const html = fixture.replace(
    /<\/body>/i,
    '<p class="MsoNormal" style="mso-style-qformat:maybe">Invalid metadata</p></body>',
  )

  expect(html).not.toBe(fixture)
  const byteLength = Buffer.byteLength(html, "utf8")

  expect(byteLength).toBeLessThanOrEqual(maxClipboardBytes)
  expect(html).toMatch(/name="Generator"\s+content="Microsoft Word 15"/)
  expect(html).toMatch(/@list\s+l\d+/i)
  expect(html).toMatch(/mso-list\s*:/i)

  await editor.fill("Keep original")
  await editor.press("End")
  await editor.press("ControlOrMeta+Shift+ArrowLeft")
  expect(
    await page.evaluate(() => window.getSelection()?.toString() ?? ""),
  ).toBe("original")
  await page.evaluate(
    async ({ invalidHTML, plainText }) => {
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([invalidHTML], { type: "text/html" }),
          "text/plain": new Blob([plainText], { type: "text/plain" }),
        }),
      ])
    },
    { invalidHTML: html, plainText: plainTextFallback },
  )
  await editor.press("ControlOrMeta+V")

  await expect(example.getByRole("alert")).toBeVisible()
  await expect(editor).toHaveText("Keep original")
  expect(
    await page.evaluate(() => window.getSelection()?.toString() ?? ""),
  ).toBe("original")
  expect(imageRequests).toBe(0)

  await testInfo.attach("pinned-word-shaped-source-result.json", {
    body: JSON.stringify({
      upstreamCommit,
      upstreamPath,
      license: "MIT",
      captureProvenance:
        "Public Word 15-shaped HTML; original capture details and companion MIME payload are unknown",
      clipboardWorkflow:
        "Synthetic browser clipboard insertion of the exact unchanged local HTML source",
      sourceSHA256: upstreamSHA256,
      sourceBytes: Buffer.byteLength(fixture, "utf8"),
      clipboardReadback: clipboard,
      baselineAdmitted: true,
      baselineVisibleText: listItems,
      listStructure,
      axeViolations: axe.violations.length,
      malformedMetadata: "mso-style-qformat:maybe",
      invalidSourceBytes: byteLength,
      imageRequests,
      documentPreserved: true,
      selectionPreserved: true,
      undoRedoVerified: true,
      editorEditable: true,
      readOnlyTransition: "not exposed by the authorized gallery example",
    }),
    contentType: "application/json",
  })
})
