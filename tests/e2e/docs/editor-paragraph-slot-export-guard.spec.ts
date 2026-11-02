import type { Page, TestInfo } from "@playwright/test"
import type { SlotFixture } from "@workspace/tests/e2e/fixtures/slot-sidecar/fixture"

import { expect, test } from "@playwright/test"
import { execFile } from "node:child_process"
import { readFile } from "node:fs/promises"
import { promisify } from "node:util"
import { z } from "zod"

declare global {
  interface Window {
    slotFixture: SlotFixture
  }
}

const execute = promisify(execFile)

const diagnostic = "Portable export cannot retain paragraph slots."

async function openFixture(page: Page, info: TestInfo) {
  const bundle = info.outputPath("slot-fixture.js")
  await execute("bun", ["tests/e2e/fixtures/slot-sidecar/bundle.ts", bundle], {
    cwd: process.cwd(),
    maxBuffer: 10 * 1024 * 1024,
  })
  const script = await readFile(bundle, "utf8")
  await page.route("**/__paragraph-slot-guard__/fixture.js", (route) =>
    route.fulfill({ contentType: "text/javascript", body: script }),
  )
  await page.route("**/__paragraph-slot-guard__/", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: '<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Paragraph slot guard</title></head><body style="background: white"><main><h1>Paragraph slot guard</h1><div id="editable" data-empty contenteditable="true" role="textbox" aria-label="Editor" aria-multiline="true"></div><div id="static"></div></main><script src="/__paragraph-slot-guard__/fixture.js"></script></body></html>',
    }),
  )
  await page.goto("/__paragraph-slot-guard__/")
  const editor = page.getByRole("textbox", { name: "Editor" })
  await expect(editor).toHaveAttribute("contenteditable", "true")
  expect(await editor.evaluate((element) => element.isConnected)).toBe(true)
  await page.waitForFunction(() => Boolean(window.slotFixture))
}

async function selectHost(page: Page) {
  await page
    .getByRole("textbox", { name: "Editor" })
    .getByText("Host paragraph", { exact: true })
    .click()
  await page.keyboard.press("Home")

  for (let index = 0; index < 3; index++)
    await page.keyboard.press("Shift+ArrowRight")
  await expect
    .poll(() => page.evaluate(() => window.slotFixture.snapshot().domSelection))
    .toBe("Hos")
  await expect
    .poll(() => page.evaluate(() => window.slotFixture.snapshot().selection))
    .not.toBeNull()

  const before = await page.evaluate(() => {
    window.slotFixture.saveState()

    return window.slotFixture.snapshot()
  })

  expect(before.selection?.anchor.type).toBe("text")
  expect(before.selection?.focus.type).toBe("text")
  expect(before.selection?.anchor.key).toBe(before.selection?.focus.key)
  expect(before.selection?.anchor.offset).toBe(0)
  expect(before.selection?.focus.offset).toBe(3)
  expect(before.selection?.backward).toBe(false)

  return before
}

const textNode = z.object({ text: z.string() })

const paragraph = z.object({
  type: z.literal("paragraph"),
  children: z.array(textNode),
  $slots: z
    .object({ note: z.object({ children: z.array(textNode) }) })
    .optional(),
})

const documentSchema = z.object({
  root: z.object({
    children: z.array(paragraph),
    $slots: z.object({
      note: z.object({
        type: z.string(),
        children: z.array(z.unknown()),
      }),
    }),
  }),
})

for (const location of ["direct", "nested"] as const) {
  test(`${location} paragraph slot rejects portable exports without changing selection`, async ({
    page,
  }, info) => {
    await openFixture(page, info)
    await page.evaluate(
      (value) => window.slotFixture.seedParagraphGuard(value),
      location,
    )
    const before = await selectHost(page)

    const result = await page.evaluate(() => {
      const json = window.slotFixture.export("json")
      const parsed = window.slotFixture.parse(json, "json")
      const afterJson = window.slotFixture.snapshot()
      const sameAfterJson = window.slotFixture.hasSavedState()

      const attempts = (["html", "markdown", "standalone"] as const).map(
        (format) => {
          let error: {
            name: string
            message: string
            diagnostics: unknown
          } | null = null

          let output: string | null = null

          try {
            output =
              format === "standalone"
                ? window.slotFixture.standalone()
                : window.slotFixture.export(format)
          } catch (caught) {
            if (caught instanceof Error)
              error = {
                name: caught.name,
                message: caught.message,
                diagnostics:
                  "diagnostics" in caught ? caught.diagnostics : null,
              }
            else
              error = {
                name: "non-Error",
                message: String(caught),
                diagnostics: null,
              }
          }

          return {
            format,
            output,
            error,
            snapshot: window.slotFixture.snapshot(),
            sameState: window.slotFixture.hasSavedState(),
          }
        },
      )

      return { json, parsed, afterJson, sameAfterJson, attempts }
    })

    await info.attach("guard-evidence.json", {
      body: JSON.stringify({ location, before, ...result }, null, 2),
      contentType: "application/json",
    })
    await page.screenshot({
      path: info.outputPath("selection.png"),
      scale: "css",
    })
    expect(JSON.parse(result.json)).toEqual(before.document)
    expect(result.parsed).toEqual(before.document)
    expect(result.afterJson).toEqual(before)
    expect(result.sameAfterJson).toBe(true)
    const document = documentSchema.parse(JSON.parse(result.json))
    const host = document.root.children[0]
    expect(host?.children[0]?.text).toBe("Host paragraph")

    if (location === "direct") {
      expect(host?.$slots?.note.children[0]?.text).toBe("Slot content")
      expect(document.root.$slots.note.type).toBe("paragraph")
      expect(textNode.parse(document.root.$slots.note.children[0]).text).toBe(
        "Root slot",
      )
    } else {
      expect(host?.$slots).toBeUndefined()
      expect(document.root.$slots.note.type).toBe("quote")
      const owner = paragraph.parse(document.root.$slots.note.children[0])
      expect(owner.children[0]?.text).toBe("Nested owner")
      expect(owner.$slots?.note.children[0]?.text).toBe("Slot content")
    }

    for (const attempt of result.attempts) {
      expect(attempt.output, attempt.format).toBeNull()
      expect(attempt.error, attempt.format).toEqual({
        name: "DocumentError",
        message: diagnostic,
        diagnostics: [diagnostic],
      })
      expect(attempt.snapshot, attempt.format).toEqual(before)
      expect(attempt.sameState, attempt.format).toBe(true)
    }
  })
}

test("legacy direct root and quote wrappers retain their owners", async ({
  page,
}, info) => {
  await openFixture(page, info)

  const html =
    '<p>Host paragraph</p><div data-editor-slot="note"><p>Root</p></div><blockquote><p>Quote</p><div data-editor-slot="note"><p>Nested</p></div></blockquote>'

  await page.evaluate(
    (source) => window.slotFixture.import(source, "html"),
    html,
  )
  const before = await selectHost(page)

  const result = await page.evaluate(() => {
    const outputs = (["html", "markdown"] as const).map((format) => {
      const source = window.slotFixture.export(format)

      return {
        format,
        source,
        parsed: window.slotFixture.parse(source, format),
      }
    })

    const standalone = window.slotFixture.standalone()

    return {
      outputs,
      standalone,
      snapshot: window.slotFixture.snapshot(),
      sameState: window.slotFixture.hasSavedState(),
    }
  })

  await info.attach("legacy-evidence.json", {
    body: JSON.stringify({ before, ...result }, null, 2),
    contentType: "application/json",
  })

  const legacySchema = z.object({
    root: z.object({
      $slots: z.object({ note: z.object({ children: z.array(textNode) }) }),
      children: z.array(
        z.object({
          $slots: z
            .object({ note: z.object({ children: z.array(textNode) }) })
            .optional(),
        }),
      ),
    }),
  })

  const legacy = legacySchema.parse(before.document)
  expect(legacy.root.$slots.note.children[0]?.text).toBe("Root")
  expect(legacy.root.children[1]?.$slots?.note.children[0]?.text).toBe("Nested")

  for (const output of result.outputs)
    expect(output.parsed, output.format).toEqual(before.document)
  expect(result.standalone).toContain("Host paragraph")
  expect(result.snapshot).toEqual(before)
  expect(result.sameState).toBe(true)
})
