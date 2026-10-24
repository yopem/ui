import { chromium } from "@playwright/test"
import assert from "node:assert/strict"
import fs from "node:fs/promises"

const port = await fs.readFile("probe-port.txt", "utf8")

const browser = await chromium.launch({ channel: "chromium", headless: true })

const context = await browser.newContext({
  permissions: ["clipboard-read", "clipboard-write"],
})

const page = await context.newPage()

const records = []

const failures = []

for (const input of [
  "code",
  '<ol start="4"><li>Item</li></ol>',
  '<aside data-editor-callout data-appearance="info" data-icon="info"><p>Callout</p></aside>',
  "<details data-editor-toggle open><summary>Title</summary><div data-editor-toggle-body><p>Body</p></div></details>",
  "<table><tr><td><p>Cell</p></td></tr></table>",
]) {
  await page.goto(`http://127.0.0.1:${port}/?cross=1`)
  await page.waitForFunction(function clipboardAction() {
    return Boolean(window.probe)
  })
  await page.evaluate(function clipboardAction(input) {
    window.probe.setup(input)
    window.probe.seedTarget()
  }, input)
  await page.locator("#source").click()
  await page.evaluate(function clipboardAction() {
    window.probe.selectAll()
  })
  await page.keyboard.press("ControlOrMeta+c")
  await page.waitForFunction(async function clipboardReady() {
    const expected = window.probe.states().copies.at(-1)?.["text/plain"]

    return (
      expected !== undefined &&
      (await navigator.clipboard.readText()) === expected
    )
  })

  for (const target of ["native", "helper"]) {
    await page.locator("#" + target).click()
    await page.keyboard.press("ControlOrMeta+v")
    await page.waitForTimeout(100)
  }

  const state = await page.evaluate(function clipboardAction() {
    return window.probe.states()
  })

  records.push({ input, state })

  try {
    assert(state.copies[0]["application/x-lexical-editor"])
    assert.deepEqual(
      state.editors[2],
      state.editors[1],
      input + ": cross-schema fallback",
    )
    assert.deepEqual(state.errors, [])
  } catch (error) {
    failures.push(error.message)
  }
}

await page.goto(`http://127.0.0.1:${port}/?missing=1`)

await page.waitForFunction(function clipboardAction() {
  return Boolean(window.probe)
})

await page.locator("#helper").click()

await page.evaluate(function clipboardAction() {
  window.probe.seedTarget()
})

const before = await page.evaluate(function clipboardAction() {
  return window.probe.states()
})

const node = {
  type: "code",
  version: 1,
  language: "javascript",
  children: [
    {
      type: "text",
      version: 1,
      text: "Unregistered",
      format: 0,
      detail: 0,
      mode: "normal",
      style: "",
    },
  ],
  direction: null,
  format: "",
  indent: 0,
}

await page.evaluate(function clipboardAction(node) {
  window.probe.pastePayload({
    "application/x-lexical-editor": JSON.stringify({
      namespace: "clipboard-probe",
      nodes: [node],
    }),
    "text/plain": "Unsafe fallback",
  })
}, node)

await page.waitForTimeout(100)

const after = await page.evaluate(function clipboardAction() {
  return window.probe.states()
})

records.push({ missing: true, before, after })

try {
  assert.deepEqual(
    after.editors[2],
    before.editors[2],
    "unregistered target: partial mutation",
  )
} catch (error) {
  failures.push(error.message)
}

await browser.close()

await fs.writeFile(
  "clipboard-cross-schema.json",
  JSON.stringify({ records, failures }, null, 2),
)

assert.deepEqual(failures, [])
