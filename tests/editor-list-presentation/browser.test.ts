import AxeBuilder from "@axe-core/playwright"
import { transformSync } from "@babel/core"
import { chromium, expect as expectPage } from "@playwright/test"
import { expect, test } from "bun:test"
import { mkdir, readFile, writeFile } from "node:fs/promises"
import { resolve } from "node:path"

const root = resolve(import.meta.dirname, "../..")

const output = resolve(root, "test-results/editor-list-presentation")

test("native list presentation controls preserve mixed lists and local roundtrips", async () => {
  await mkdir(output, { recursive: true })
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

            const source = await readFile(path, "utf8")

            const transformed = transformSync(source, {
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

  if (!bundle) throw new Error("Missing list presentation browser bundle")
  const script = await bundle.text()

  const server = Bun.serve({
    hostname: "127.0.0.1",
    port: 0,
    fetch(request) {
      if (new URL(request.url).pathname === "/fixture.js")
        return new Response(script, {
          headers: { "Content-Type": "text/javascript" },
        })

      return new Response(
        '<!doctype html><html lang="en"><head><title>List presentation</title></head><body><main id="root"></main><script src="/fixture.js"></script></body></html>',
        { headers: { "Content-Type": "text/html" } },
      )
    },
  })

  const browser = await chromium.launch({ channel: "chromium", headless: true })

  try {
    const page = await browser.newPage()
    const errors: string[] = []
    page.on("pageerror", (error) => errors.push(error.message))
    await page.goto(server.url.href)

    const editor = page.getByRole("textbox", {
      name: "List presentation editor",
      exact: true,
    })

    const marker = page.getByLabel("List marker", { exact: true })
    const start = page.getByLabel("Ordered list start", { exact: true })

    await expectPage(editor).toContainText("Nested item")
    await expectPage(marker).toBeDisabled()
    await expectPage(start).toBeDisabled()

    await editor.getByText("Bullet one", { exact: true }).click()
    await expectPage(marker).toBeEnabled()
    await marker.focus()
    await page.keyboard.press("ArrowDown")
    await page.keyboard.press("ArrowDown")
    await page.keyboard.press("Enter")
    await expectPage(
      editor.locator('ul[data-editor-list-marker="circle"]'),
    ).toHaveCount(1)
    await editor.focus()
    await page.keyboard.press("ControlOrMeta+z")
    await expectPage(editor.locator("ul[data-editor-list-marker]")).toHaveCount(
      0,
    )
    await page.keyboard.press("ControlOrMeta+Shift+z")
    await expectPage(
      editor.locator('ul[data-editor-list-marker="circle"]'),
    ).toHaveCount(1)

    await editor.getByText("Ordered item", { exact: true }).click()
    await expectPage(start).toBeEnabled()
    await start.focus()
    await start.fill("0")
    await expectPage(editor.locator("ol").last()).toHaveAttribute("start", "0")
    await start.fill("-3")
    await expectPage(editor.locator("ol").last()).toHaveAttribute("start", "-3")
    await editor.focus()
    await page.keyboard.press("ControlOrMeta+z")
    await expectPage(editor.locator("ol").last()).toHaveAttribute("start", "0")
    await page.keyboard.press("ControlOrMeta+Shift+z")
    await expectPage(editor.locator("ol").last()).toHaveAttribute("start", "-3")

    const axe = await new AxeBuilder({ page }).include("#root").analyze()
    expect(axe.violations).toEqual([])

    await page
      .getByRole("button", { name: "Roundtrip JSON", exact: true })
      .click()
    const json = await page.getByTestId("json-output").textContent()
    expect(json).toContain('"yopemListMarker":"circle"')
    expect(json).toContain('"start":-3')
    await expectPage(
      editor.locator('ul[data-editor-list-marker="circle"]'),
    ).toHaveCount(1)

    await page
      .getByRole("button", { name: "Roundtrip HTML", exact: true })
      .click()
    const html = await page.getByTestId("html-output").textContent()
    expect(html).toContain('data-editor-list-marker="circle"')
    expect(html).toContain('start="-3"')
    await expectPage(
      editor
        .locator('ul[data-editor-list-marker="circle"] > li')
        .filter({ hasText: "Parent item" })
        .locator("ol"),
    ).toHaveCount(1)
    await expectPage(editor.locator('li[role="checkbox"]')).toHaveCount(1)

    await page
      .getByRole("button", { name: "Toggle read-only", exact: true })
      .click()
    await expectPage(editor).toHaveAttribute("contenteditable", "false")
    await expectPage(marker).toBeDisabled()
    await expectPage(start).toBeDisabled()
    await page
      .getByRole("button", { name: "Toggle read-only", exact: true })
      .click()

    await editor.getByText("Bullet one", { exact: true }).click()
    await marker.focus()
    await page
      .getByRole("button", { name: "Replace document", exact: true })
      .click()
    await expectPage(editor).toHaveText("Replacement paragraph")
    await expectPage(marker).toBeDisabled()
    await expectPage(start).toBeDisabled()

    await page.screenshot({
      path: resolve(output, "mixed-list-presentation.png"),
      scale: "css",
    })
    expect(errors).toEqual([])
    await writeFile(
      resolve(output, "report.json"),
      JSON.stringify(
        {
          markers: [
            "disc",
            "circle",
            "square",
            "decimal",
            "lower-alpha",
            "upper-alpha",
            "lower-roman",
            "upper-roman",
          ],
          orderedStarts: [0, -3],
          jsonRoundtrip: json,
          htmlRoundtrip: html,
          nestedListPreserved: true,
          checklistPreserved: true,
          readOnlyDisabledControls: true,
          staleSelectionDisabledControls: true,
          axeViolations: axe.violations.length,
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
})
