import { createHeadlessEditor } from "@lexical/headless"
import { chromium } from "@playwright/test"
import {
  documentNodes,
  htmlDocument,
  importDocument,
} from "@yopem-ui/editor/document"
import { expect, test } from "bun:test"
import { mkdir, writeFile } from "node:fs/promises"
import { resolve } from "node:path"

const artifacts = resolve(
  import.meta.dirname,
  "../../test-results/editor-document-accessible",
)

test("standalone disclosure keeps closed title links outside keyboard control", async () => {
  const editor = createHeadlessEditor({
    namespace: "standalone-accessible",
    nodes: documentNodes,
    onError(error) {
      throw error
    },
  })

  importDocument(
    editor,
    '<details data-editor-toggle><summary><strong>Rich <a href="https://example.test/#destination">title</a></strong></summary><div data-editor-toggle-body><p>Hidden body</p><details data-editor-toggle open><summary>Nested</summary><div data-editor-toggle-body><p>Nested body</p></div></details></div></details><p>Destination</p>',
    "html",
  )
  const html = htmlDocument(editor, "Accessible document")
  await mkdir(artifacts, { recursive: true })
  await writeFile(resolve(artifacts, "standalone.html"), html)

  const server = Bun.serve({
    hostname: "127.0.0.1",
    port: 0,
    fetch() {
      return new Response(html, { headers: { "Content-Type": "text/html" } })
    },
  })

  const browser = await chromium.launch({ channel: "chromium", headless: true })

  try {
    const page = await browser.newPage()
    const errors: string[] = []
    page.on("pageerror", (error) => errors.push(error.message))
    await page.goto(server.url.href)
    const link = page.getByRole("link", { name: "title", exact: true })
    const control = page.locator("summary[data-editor-toggle-control]").first()
    const body = page.getByText("Hidden body", { exact: true })
    expect(await link.isVisible()).toBe(true)
    expect(await body.isVisible()).toBe(false)
    expect(await page.locator("summary a").count()).toBe(0)
    await link.focus()
    await page.keyboard.press("Tab")
    expect(
      await control.evaluate((element) => element === document.activeElement),
    ).toBe(true)
    expect(await control.getAttribute("aria-label")).toBe("Rich title")
    await page.screenshot({
      path: resolve(artifacts, "closed.png"),
      scale: "css",
    })
    await page.keyboard.press("Enter")
    expect(await body.isVisible()).toBe(true)
    expect(
      await page.getByText("Nested body", { exact: true }).isVisible(),
    ).toBe(true)
    const controlBox = await control.boundingBox()
    expect(controlBox?.height).toBeGreaterThanOrEqual(44)
    await page.screenshot({
      path: resolve(artifacts, "open.png"),
      scale: "css",
    })
    await page.keyboard.press("Space")
    expect(await body.isVisible()).toBe(false)
    await page.route("https://example.test/**", (route) =>
      route.fulfill({ body: html, contentType: "text/html" }),
    )
    await link.click()
    expect(new URL(page.url()).origin).toBe("https://example.test")
    expect(new URL(page.url()).hash).toBe("#destination")
    expect(await body.isVisible()).toBe(false)
    expect(errors).toEqual([])
    await writeFile(
      resolve(artifacts, "checks.json"),
      JSON.stringify(
        {
          url: server.url.href,
          closedTitleLink: true,
          keyboard: ["Tab", "Enter", "Space"],
          nestedDisclosure: true,
          controlBox,
          errors,
        },
        null,
        2,
      ),
    )
  } finally {
    await browser.close()
    await server.stop(true)
  }
}, 30_000)
