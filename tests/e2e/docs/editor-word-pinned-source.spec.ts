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

test("unsupported metadata in pinned Word-shaped lists fails closed", async ({
  page,
  context,
}, testInfo) => {
  test.slow()

  const fixture = await readFile(
    new URL(
      "../../editor-word-clipboard/fixtures/plate-word-lists.html",
      import.meta.url,
    ),
    "utf8",
  )

  expect(createHash("sha256").update(fixture).digest("hex")).toBe(
    upstreamSHA256,
  )

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
  await context.grantPermissions(["clipboard-read", "clipboard-write"], {
    origin: new URL(page.url()).origin,
  })
  await editor.fill("Keep original")
  await editor.press("End")
  await editor.press("ControlOrMeta+Shift+ArrowLeft")

  let imageRequests = 0
  page.on("request", (pageRequest) => {
    if (pageRequest.resourceType() === "image") imageRequests += 1
  })
  await page.evaluate(
    async ({ html: clipboardHTML, plainText }) => {
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([clipboardHTML], { type: "text/html" }),
          "text/plain": new Blob([plainText], { type: "text/plain" }),
        }),
      ])
    },
    { html, plainText: plainTextFallback },
  )
  await editor.press("ControlOrMeta+V")

  await expect(example.getByRole("alert")).toBeVisible()
  await expect(editor).toHaveText("Keep original")
  expect(await editor.innerText()).not.toContain(plainTextFallback)

  const selectedText = await page.evaluate(
    () => window.getSelection()?.toString() ?? "",
  )

  expect(selectedText).toBe("original")
  expect(imageRequests).toBe(0)

  await testInfo.attach("pinned-word-shaped-source-result.json", {
    body: JSON.stringify({
      upstreamCommit,
      upstreamPath,
      license: "MIT",
      captureProvenance: "not documented",
      sourceSHA256: upstreamSHA256,
      insertedUnsupportedMetadata: "mso-style-qformat:maybe",
      sourceBytes: byteLength,
      imageRequests,
      documentPreserved: true,
      selectionPreserved: true,
    }),
    contentType: "application/json",
  })
})
