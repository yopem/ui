import { chromium } from "@playwright/test"
import assert from "node:assert/strict"
import fs from "node:fs/promises"

const port = await fs.readFile("probe-port.txt", "utf8")

const browser = await chromium.launch({ channel: "chromium", headless: true })

const page = await browser.newPage()

const records = []

const failures = []

for (const mime of ["html", "plain", "uri"])
  for (const mode of ["delegate", "veto", "redact"])
    for (const order of ["before", "after"]) {
      await page.goto(
        `http://127.0.0.1:${port}/?mime=${mime}&mode=${mode}&order=${order}`,
      )
      await page.waitForFunction(function clipboardAction() {
        return Boolean(window.probe)
      })
      await page.locator("#helper").click()
      await page.evaluate(
        function clipboardAction(payload) {
          window.probe.seedTarget()
          window.probe.pastePayload(payload)
        },
        mime === "html"
          ? { "text/html": "<p>Original</p>" }
          : mime === "plain"
            ? { "text/plain": "Original\n\tline" }
            : { "text/uri-list": "https://example.com/Original" },
      )
      await page.waitForTimeout(100)

      const state = await page.evaluate(function clipboardAction() {
        return window.probe.states()
      })

      records.push({ mime, mode, order, state })

      try {
        assert.deepEqual(
          state.mimeCalls,
          [mode],
          `${mode}/${order}: native MIME policy must run exactly once`,
        )
        const json = JSON.stringify(state.editors[2])
        assert(json.includes("Keep original"))
        assert.equal(json.includes("Original"), mode === "delegate")
        assert.equal(json.includes("Redacted"), mode === "redact")
      } catch (error) {
        failures.push(error.message)
      }
    }

const evidence = JSON.parse(
  await fs.readFile("clipboard-evidence.json", "utf8"),
)

const nativeCode = evidence.records.find((record) => record.name === "code")
  .pasted.copies[0]["application/x-lexical-editor"]

assert(nativeCode)

for (const invalid of [false, true])
  for (const mode of ["delegate", "veto", "redact"])
    for (const order of ["before", "after"]) {
      await page.goto(
        `http://127.0.0.1:${port}/?json-policy=1&mode=${mode}&order=${order}`,
      )
      await page.waitForFunction(function clipboardAction() {
        return Boolean(window.probe)
      })
      await page.locator("#helper").click()
      await page.evaluate(
        function clipboardAction(payload) {
          window.probe.seedTarget()
          window.probe.pastePayload(payload)
        },
        {
          "application/x-lexical-editor": invalid ? "{bad" : nativeCode,
          "text/html": "<p>Fallback</p>",
        },
      )
      await page.waitForTimeout(100)

      const state = await page.evaluate(function clipboardAction() {
        return window.probe.states()
      })

      records.push({ mime: "json", invalid, mode, order, state })

      try {
        assert.deepEqual(
          state.mimeCalls,
          [mode],
          `${invalid}/${mode}/${order}: JSON policy exactly once`,
        )
        const json = JSON.stringify(state.editors[2])
        assert(json.includes("Keep original"))
        assert.equal(json.includes("Redacted"), mode === "redact")
        assert.equal(json.includes("Fallback"), invalid && mode === "delegate")
        assert.equal(
          json.includes("const answer = 42"),
          !invalid && mode === "delegate",
        )
      } catch (error) {
        failures.push(error.message)
      }
    }

for (const order of ["before", "after"]) {
  await page.goto(
    `http://127.0.0.1:${port}/?html-first=1&mode=delegate&order=${order}`,
  )
  await page.waitForFunction(function ready() {
    return Boolean(window.probe)
  })
  await page.locator("#helper").click()
  await page.evaluate(
    function paste(payload) {
      window.probe.seedTarget()
      window.probe.pastePayload(payload)
    },
    {
      "application/x-lexical-editor": nativeCode,
      "text/html": "<p>Fallback</p>",
    },
  )
  await page.waitForTimeout(100)

  const state = await page.evaluate(function readState() {
    return window.probe.states()
  })

  records.push({ mime: "html-priority", mode: "delegate", order, state })

  try {
    assert.deepEqual(state.mimeCalls, ["delegate"])
    const json = JSON.stringify(state.editors[2])
    assert(json.includes("Fallback"))
    assert(json.includes("Keep original"))
    assert(!json.includes("const answer = 42"))
  } catch (error) {
    failures.push(error.message)
  }
}

await browser.close()

await fs.writeFile(
  "clipboard-protocol.json",
  JSON.stringify({ records, failures }, null, 2),
)

assert.deepEqual(failures, [])
