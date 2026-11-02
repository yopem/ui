import {
  expect,
  test,
  type Locator,
  type Page,
  type TestInfo,
} from "@playwright/test"
import { execFile } from "node:child_process"
import { readFile } from "node:fs/promises"
import { promisify } from "node:util"

const execute = promisify(execFile)

type Evidence = ReturnType<Window["duplicateDropFixture"]["snapshot"]>

async function openFixture(page: Page, info: TestInfo) {
  const output = info.outputPath("native-duplicate-drop.js")
  await execute("bun", [
    "run",
    "tests/e2e/fixtures/native-duplicate-drop/bundle.ts",
    output,
  ])
  const bundle = await readFile(output, "utf8")
  await page.route("**/__tests__/native-duplicate-drop.js", (route) =>
    route.fulfill({ contentType: "text/javascript", body: bundle }),
  )
  await page.route("**/__tests__/native-duplicate-drop", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: '<!doctype html><html lang="en"><head><title>Native drop fixture</title><style>body{font:20px sans-serif} [contenteditable]{min-height:60px; padding:20px; border:1px solid; margin:20px}</style></head><body><main id="root"></main><script src="/__tests__/native-duplicate-drop.js"></script></body></html>',
    }),
  )
  await page.goto("/__tests__/native-duplicate-drop")
  await expect(page.getByRole("textbox", { name: "source" })).toHaveAttribute(
    "contenteditable",
    "true",
  )
  await expect(page.getByRole("textbox", { name: "target" })).toHaveAttribute(
    "contenteditable",
    "true",
  )
}

function snapshot(page: Page) {
  return page.evaluate(() => window.duplicateDropFixture.snapshot())
}

async function seedHistory(page: Page, editor: Locator, id: string) {
  await editor.click()
  await page.keyboard.press("ControlOrMeta+End")
  await page.keyboard.type("!")
  await expect(editor).toContainText("!")
  await page.keyboard.press("ControlOrMeta+z")
  await expect(editor).not.toContainText("!")
  await expect
    .poll(async () => (await snapshot(page)).editors[id]?.canRedo)
    .toBe("true")
}

function point(editor: Locator, index: number, fraction: number) {
  return editor.evaluate(
    (root, position) => {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
      const text = walker.nextNode()

      if (!text || position.index >= (text.textContent?.length ?? 0))
        throw new Error("Missing text geometry")
      const range = document.createRange()
      range.setStart(text, position.index)
      range.setEnd(text, position.index + 1)
      const rect = range.getBoundingClientRect()

      if (!rect.width || !rect.height) throw new Error("Empty text geometry")

      return {
        x: rect.left + rect.width * position.fraction,
        y: rect.top + rect.height / 2,
      }
    },
    { index, fraction },
  )
}

async function drag(page: Page, destination: "source" | "target") {
  const source = page.getByRole("textbox", { name: "source" })
  const target = page.getByRole("textbox", { name: destination })
  await source.click()
  await page.keyboard.press("Home")

  for (let i = 0; i < "DRAGGED".length; i++)
    await page.keyboard.press("Shift+ArrowRight")
  await expect
    .poll(() => page.evaluate(() => document.getSelection()?.toString()))
    .toBe("DRAGGED")
  const before = await snapshot(page)
  expect(before.editors.source?.selection?.text).toBe("DRAGGED")
  const start = await point(source, 3, 0.5)
  const end = await point(target, destination === "source" ? 18 : 17, 0.9)
  await page.mouse.move(start.x, start.y)
  await page.mouse.down()
  await page.mouse.move(end.x, end.y, { steps: 20 })
  await page.mouse.move(end.x, end.y)
  await page.mouse.up()

  return before
}

function eventRecord(evidence: Evidence, type: string) {
  const item = evidence.events.find(
    (event) => "type" in event && event.type === type,
  )

  expect(
    item,
    `Missing ${type}: native transfer unsupported or not delivered`,
  ).toBeDefined()

  return item
}

async function assertNativeTransfer(
  page: Page,
  evidence: Evidence,
  mode: "valid" | "duplicate",
  target: "source" | "target",
) {
  const expected = await page.evaluate(
    (name) => window.duplicateDropFixture[name],
    mode,
  )

  const source = eventRecord(evidence, "source-payload")
  const start = eventRecord(evidence, "dragstart")
  const drop = eventRecord(evidence, "drop")
  const end = eventRecord(evidence, "dragend")
  expect(start).toMatchObject({ trusted: true })
  expect(source).toMatchObject({
    trusted: true,
    raw: expected,
    marker: expect.any(String),
  })
  expect(source && "marker" in source && source.marker).not.toBe("")
  expect(drop).toMatchObject({
    trusted: true,
    cancelable: true,
    target,
    raw: expected,
    html: "<p>HTML FALLBACK</p>",
    plain: "PLAIN FALLBACK",
    marker: source && "marker" in source ? source.marker : null,
    caret: { offset: target === "source" ? 19 : 18 },
  })
  expect(end).toMatchObject({ trusted: true, dropEffect: expect.any(String) })
}

async function history(page: Page, id: string, action: "undo" | "redo") {
  await page.evaluate(
    ({ id, action }) => window.duplicateDropFixture.history(id, action),
    { id, action },
  )
}

for (const destination of ["source", "target"] as const) {
  for (const mode of ["duplicate", "valid", "host-cancel"] as const) {
    test(`${destination}: ${mode} native drag preserves data and history`, async ({
      page,
      browser,
    }, info) => {
      const checkpoints: Record<string, Evidence> = {}

      try {
        await openFixture(page, info)
        const source = page.getByRole("textbox", { name: "source" })
        const target = page.getByRole("textbox", { name: "target" })
        await seedHistory(page, source, "source")
        await seedHistory(page, target, "target")
        await page.evaluate(
          (value) =>
            window.duplicateDropFixture.configure(
              value === "duplicate" ? "duplicate" : "valid",
              value === "host-cancel",
            ),
          mode,
        )
        checkpoints.before = await drag(page, destination)
        await expect
          .poll(async () =>
            (await snapshot(page)).events.some(
              (event) => "type" in event && event.type === "dragend",
            ),
          )
          .toBe(true)
        checkpoints.after = await snapshot(page)
        await assertNativeTransfer(
          page,
          checkpoints.after,
          mode === "duplicate" ? "duplicate" : "valid",
          destination,
        )

        if (mode === "host-cancel") {
          expect(eventRecord(checkpoints.after, "host-veto")).toMatchObject({
            id: destination,
            trusted: true,
          })
          expect(eventRecord(checkpoints.after, "drop")).toMatchObject({
            prevented: true,
          })
        }

        if (mode !== "valid") {
          expect(checkpoints.after.editors.source?.json).toEqual(
            checkpoints.before.editors.source?.json,
          )
          expect(checkpoints.after.editors.target?.json).toEqual(
            checkpoints.before.editors.target?.json,
          )
          expect(checkpoints.after.editors.source?.canRedo).toBe("true")
          expect(checkpoints.after.editors.target?.canRedo).toBe("true")

          for (const id of ["source", "target"]) {
            await history(page, id, "redo")
            await expect(page.getByRole("textbox", { name: id })).toContainText(
              "!",
            )
            await history(page, id, "undo")
            await expect(
              page.getByRole("textbox", { name: id }),
            ).not.toContainText("!")
          }

          checkpoints.afterHistory = await snapshot(page)
          expect(checkpoints.afterHistory.editors.source?.json).toEqual(
            checkpoints.before.editors.source?.json,
          )
          expect(checkpoints.afterHistory.editors.target?.json).toEqual(
            checkpoints.before.editors.target?.json,
          )
        } else if (destination === "source") {
          await expect(source).toHaveText(" source tailDRAGGED")
          await expect(target).toHaveText("Target destination")
          await history(page, "source", "undo")
          await expect(source).toHaveText("DRAGGED source tail")
          await history(page, "source", "redo")
          await expect(source).toHaveText(" source tailDRAGGED")
        } else {
          await expect(source).toHaveText(" source tail")
          await expect(target).toHaveText("Target destinationDRAGGED")
          await history(page, "target", "undo")
          await expect(target).toHaveText("Target destination")
          await history(page, "source", "undo")
          await expect(source).toHaveText("DRAGGED source tail")
          await history(page, "source", "redo")
          await expect(source).toHaveText(" source tail")
          await history(page, "target", "redo")
          await expect(target).toHaveText("Target destinationDRAGGED")
        }

        if (mode === "valid") {
          checkpoints.afterHistory = await snapshot(page)
          expect(checkpoints.afterHistory.editors.source?.json).toEqual(
            checkpoints.after.editors.source?.json,
          )
          expect(checkpoints.afterHistory.editors.target?.json).toEqual(
            checkpoints.after.editors.target?.json,
          )
        }
      } finally {
        await info.attach("native-duplicate-drop-evidence.json", {
          body: JSON.stringify(
            {
              browser: info.project.name,
              browserVersion: browser.version(),
              platform: process.platform,
              checkpoints,
            },
            null,
            2,
          ),
          contentType: "application/json",
        })
      }
    })
  }
}
