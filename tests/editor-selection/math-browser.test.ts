import { chromium, expect as expectPage } from "@playwright/test"
import { test, expect } from "bun:test"
import { mkdir, writeFile } from "node:fs/promises"
import { resolve } from "node:path"

test("isolated browser renders native MathML without external resources", async () => {
  const output = resolve(
    import.meta.dirname,
    "../../test-results/editor-math-native",
  )

  await mkdir(output, { recursive: true })

  const build = await Bun.build({
    entrypoints: [resolve(import.meta.dirname, "math-browser.fixture.ts")],
    target: "browser",
    tsconfig: resolve(import.meta.dirname, "../tsconfig.json"),
    format: "iife",
    outdir: output,
  })

  expect(build.success).toBe(true)
  const browser = await chromium.launch({ channel: "chromium", headless: true })

  try {
    const page = await browser.newPage()
    const external: string[] = []
    const errors: string[] = []
    page.on("request", (request) => external.push(request.url()))
    page.on("pageerror", (error) => errors.push(error.message))
    await page.setContent(
      '<main><button id="readonly">Read only</button><button id="editable">Edit</button><div id="editor" contenteditable="true" role="textbox" aria-label="Math fixture"></div></main>',
    )
    await page.addScriptTag({
      path: resolve(output, "math-browser.fixture.js"),
    })
    await expectPage(
      page.locator('[data-editor-math="inline"] math'),
    ).toHaveCount(1)
    await expectPage(
      page.locator('[data-editor-math="block"] math'),
    ).toHaveCount(1)
    await expectPage(page.locator('[aria-invalid="true"]')).toHaveText(
      "Invalid TeX expression",
    )
    await expectPage(
      page.getByRole("textbox", { name: "Math fixture" }),
    ).toContainText("Before")
    expect(external).toEqual([])
    expect(errors).toEqual([])
    await page.screenshot({ path: resolve(output, "native-math.png") })
    await page.getByRole("button", { name: "Read only", exact: true }).click()
    await page.locator('[data-editor-math="inline"]').click()
    await page.keyboard.press("Delete")
    await expectPage(page.locator('[data-editor-math="inline"]')).toHaveCount(1)
    await page.getByRole("button", { name: "Edit", exact: true }).click()
    await page.locator('[data-editor-math="inline"]').focus()
    await page.keyboard.press("Delete")
    await expectPage(page.locator('[data-editor-math="inline"]')).toHaveCount(0)
    await writeFile(
      resolve(output, "report.json"),
      JSON.stringify(
        {
          external,
          errors,
          mathML: await page.locator("math").count(),
          invalid: await page.locator('[aria-invalid="true"]').count(),
          html: await page.locator("main").innerHTML(),
        },
        null,
        2,
      ),
    )
  } finally {
    await browser.close()
  }
}, 30000)
