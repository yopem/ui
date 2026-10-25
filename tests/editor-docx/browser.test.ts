import AxeBuilder from "@axe-core/playwright"
import { transformSync } from "@babel/core"
import { createDocumentEditor } from "@editor/document/convert"
import { exportDocx, parseDocx } from "@editor/docx"
import { chromium, expect as expectPage } from "@playwright/test"
import { importDocument } from "@yopem-ui/editor/document"
import { expect, test } from "bun:test"
import { mkdir, readFile, writeFile } from "node:fs/promises"
import { resolve } from "node:path"

const root = resolve(import.meta.dirname, "../..")

const output = resolve(root, "test-results/editor-docx")

const mimeType =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

const sample =
  '<h2>DOCX browser report</h2><p><strong>Bold content</strong> and <a href="https://example.test/report">a safe link</a>.</p><ul><li>One</li><li>Two</li></ul><table><tr><th>Field</th><th>Value</th></tr><tr><td>State</td><td>Ready</td></tr></table>'

test("public DOCX controls import and download real OpenXML without external requests", async () => {
  await mkdir(output, { recursive: true })
  const source = createDocumentEditor()
  importDocument(source, sample, "html")
  const input = exportDocx(source)
  const fixture = resolve(import.meta.dirname, "browser-fixture.tsx")

  const build = await Bun.build({
    entrypoints: [fixture],
    target: "browser",
    format: "iife",
    tsconfig: resolve(root, "tests/tsconfig.json"),
    plugins: [
      {
        name: "stylex-test-transform",
        setup(builder) {
          builder.onLoad({ filter: /\.[jt]sx?$/ }, async ({ path }) => {
            if (
              !path.startsWith(resolve(root, "packages/editor/src")) &&
              !path.startsWith(resolve(root, "packages/registry/src"))
            )
              return

            const sourceText = await readFile(path, "utf8")

            const transformed = transformSync(sourceText, {
              filename: path,
              configFile: false,
              babelrc: false,
              plugins: [
                [
                  "@stylexjs/babel-plugin",
                  {
                    dev: false,
                    unstable_moduleResolution: {
                      type: "commonJS",
                      rootDir: root,
                    },
                  },
                ],
              ],
            })

            if (!transformed?.code)
              throw new Error(`Could not transform ${path}`)

            return {
              contents: transformed.code,
              loader: path.endsWith(".tsx") ? "tsx" : "ts",
            }
          })
        },
      },
    ],
  })

  expect(build.success).toBe(true)
  const bundle = build.outputs[0]

  if (!bundle) throw new Error("Missing DOCX browser bundle")
  const script = await bundle.text()
  await writeFile(resolve(output, "input.docx"), input)

  const server = Bun.serve({
    hostname: "127.0.0.1",
    port: 0,
    fetch(request) {
      if (new URL(request.url).pathname === "/fixture.js")
        return new Response(script, {
          headers: { "Content-Type": "text/javascript" },
        })

      return new Response(
        '<!doctype html><html lang="en"><head><title>DOCX test</title></head><body><main id="root"></main><script src="/fixture.js"></script></body></html>',
        { headers: { "Content-Type": "text/html" } },
      )
    },
  })

  const browser = await chromium.launch({ channel: "chromium", headless: true })

  try {
    const page = await browser.newPage()
    const requests: string[] = []
    const errors: string[] = []
    page.on("request", (request) => requests.push(request.url()))
    page.on("pageerror", (error) => errors.push(error.message))
    await page.goto(server.url.href)

    const editor = page.getByRole("textbox", {
      name: "DOCX editor",
      exact: true,
    })

    const inputFile = page.getByLabel("Word document file", { exact: true })

    await expectPage(editor).toContainText("Original content")
    await inputFile.setInputFiles({
      name: "report.docx",
      mimeType,
      buffer: Buffer.from(input),
    })
    await page
      .getByRole("button", { name: "Import Word document", exact: true })
      .click()
    await expectPage(
      editor.getByRole("heading", { name: "DOCX browser report" }),
    ).toBeVisible()
    await expectPage(editor.locator("strong")).toHaveText("Bold content")
    await expectPage(
      editor.getByRole("link", { name: "a safe link" }),
    ).toHaveAttribute("href", "https://example.test/report")
    await expectPage(editor.getByRole("table").locator("th, td")).toHaveCount(4)

    const axe = await new AxeBuilder({ page }).include("#root").analyze()
    expect(axe.violations).toEqual([])

    const pending = page.waitForEvent("download")
    await page
      .getByRole("button", { name: "Download Word document", exact: true })
      .click()
    const download = await pending
    const downloaded = resolve(output, download.suggestedFilename())
    await download.saveAs(downloaded)
    expect(await download.failure()).toBeNull()
    const bytes = new Uint8Array(await readFile(downloaded))
    const decoded = JSON.stringify(await parseDocx(bytes))
    expect(bytes[0]).toBe(0x50)
    expect(bytes[1]).toBe(0x4b)
    expect(decoded).toContain("DOCX browser report")

    await inputFile.setInputFiles({
      name: "invalid.docx",
      mimeType,
      buffer: Buffer.from("not a ZIP archive"),
    })
    await page
      .getByRole("button", { name: "Import Word document", exact: true })
      .click()
    await expectPage(page.getByRole("alert")).toBeVisible()
    await expectPage(
      editor.getByRole("heading", { name: "DOCX browser report" }),
    ).toBeVisible()

    expect(
      requests.every(
        (url) => new URL(url).origin === new URL(server.url).origin,
      ),
    ).toBe(true)
    expect(errors).toEqual([])
    await writeFile(
      resolve(output, "report.json"),
      JSON.stringify(
        {
          inputBytes: input.byteLength,
          downloadedBytes: bytes.byteLength,
          importedHeading: "DOCX browser report",
          axeViolations: axe.violations.length,
          externalRequests: requests.filter(
            (url) => new URL(url).origin !== new URL(server.url).origin,
          ),
          errors,
          preservedAfterInvalidImport: await editor.textContent(),
          html: await editor.evaluate((element) => element.innerHTML),
        },
        null,
        2,
      ),
    )
  } finally {
    await browser.close()
    await server.stop(true)
  }
}, 90_000)
