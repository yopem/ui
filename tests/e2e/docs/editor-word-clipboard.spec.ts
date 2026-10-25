import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"
import {
  wordHTML,
  wordImageHTML,
} from "@workspace/tests/editor-word-clipboard/word-html.fixture"

test("pastes Word text, nested lists, and tables at the active selection", async ({
  page,
  context,
}, testInfo) => {
  test.slow()
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
  await editor.fill("Keep original")
  await editor.press("End")
  await editor.press("ControlOrMeta+Shift+ArrowLeft")
  await context.grantPermissions(["clipboard-read", "clipboard-write"], {
    origin: new URL(page.url()).origin,
  })
  await page.evaluate(async (html) => {
    await navigator.clipboard.write([
      new ClipboardItem({
        "text/html": new Blob([html], { type: "text/html" }),
        "text/plain": new Blob(
          ["Word heading First item Nested item Second item"],
          {
            type: "text/plain",
          },
        ),
      }),
    ])
  }, wordHTML)
  await editor.press("ControlOrMeta+V")

  await expect(editor).toContainText("Keep Word heading")
  await expect(editor.getByText("Word heading")).toHaveCSS("font-size", "16px")
  await expect(editor.getByRole("listitem")).toHaveCount(3)
  await expect(editor.getByRole("table")).toBeVisible()
  await expect(editor.getByRole("row")).toHaveCount(2)
  await expect
    .poll(() =>
      editor
        .getByText("Word heading")
        .evaluate(
          (element) =>
            getComputedStyle(element.parentElement ?? element).textAlign,
        ),
    )
    .toBe("center")

  const axe = await new AxeBuilder({ page })
    .include('[data-testid="public-word-clipboard"]')
    .analyze()

  expect(axe.violations).toEqual([])
  await testInfo.attach("word-clipboard-result.json", {
    body: JSON.stringify({
      text: await editor.innerText(),
      lists: await editor.getByRole("list").count(),
      rows: await editor.getByRole("row").count(),
      axeViolations: axe.violations.length,
    }),
    contentType: "application/json",
  })

  await editor.press("ControlOrMeta+z")
  await expect(editor).toHaveText("Keep original")
  await editor.press("ControlOrMeta+Shift+z")
  await expect(editor.getByRole("table")).toBeVisible()
})

test("rejects unresolved Word images without replacing the selection or fetching them", async ({
  page,
  context,
}) => {
  test.slow()
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

  let imageRequests = 0
  page.on("request", (request) => {
    if (request.url().includes("word-image.png")) imageRequests += 1
  })
  await page.route("https://example.invalid/**", (route) =>
    route.fulfill({ status: 204, body: "" }),
  )
  await context.grantPermissions(["clipboard-read", "clipboard-write"], {
    origin: new URL(page.url()).origin,
  })
  await expect(editor).toHaveAttribute("contenteditable", "true")
  await editor.fill("Keep original")
  await editor.press("End")
  await editor.press("ControlOrMeta+Shift+ArrowLeft")
  await page.evaluate(
    async (html) => {
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([html], { type: "text/html" }),
          "text/plain": new Blob(["Keep Word image text"], {
            type: "text/plain",
          }),
        }),
      ])
    },
    wordImageHTML.replace(
      "file:///C:/Users/word/image.png",
      "https://example.invalid/word-image.png",
    ),
  )
  await editor.press("ControlOrMeta+V")

  await expect(example.getByRole("alert")).toBeVisible()
  await expect(editor).toHaveText("Keep original")
  await expect
    .poll(() => page.evaluate(() => window.getSelection()?.toString() ?? ""))
    .toBe("original")
  expect(imageRequests).toBe(0)
})
