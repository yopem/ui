import { chromium } from "@playwright/test"
import assert from "node:assert/strict"
import fs from "node:fs/promises"

const port = await fs.readFile("probe-port.txt", "utf8")

const browser = await chromium.launch({ channel: "chromium", headless: true })

const context = await browser.newContext({
  permissions: ["clipboard-read", "clipboard-write"],
})

const page = await context.newPage()

const runtime = []

page.on("pageerror", function clipboardAction(error) {
  runtime.push(error.message)
})

async function reset() {
  await page.goto(`http://127.0.0.1:${port}/?n=${Math.random()}`)
  await page.waitForFunction(function clipboardAction() {
    return Boolean(window.probe)
  })
  await page.locator("#helper").click()
  await page.evaluate(function clipboardAction() {
    window.probe.seedTarget()
  })
}

const records = []

for (const [name, payload] of Object.entries({
  malformed: {
    "application/x-lexical-editor": "{bad",
    "text/html": "<p>Fallback</p>",
  },
  "cross-schema": {
    "application/x-lexical-editor": JSON.stringify({
      namespace: "other",
      nodes: [{ type: "unknown", version: 1 }],
    }),
    "text/html": "<p>Fallback</p>",
  },
  "unknown-with-html": {
    "application/x-lexical-editor": JSON.stringify({
      namespace: "clipboard-probe",
      nodes: [{ type: "unknown", version: 1 }],
    }),
    "text/html": "<p>Fallback</p>",
  },
  "malformed-without-html": {
    "application/x-lexical-editor": "{bad",
    "text/plain": "Unsafe fallback",
  },
  "foreign-without-html": {
    "application/x-lexical-editor": JSON.stringify({
      namespace: "other",
      nodes: [
        {
          type: "text",
          version: 1,
          text: "Foreign",
          format: 0,
          detail: 0,
          mode: "normal",
          style: "",
        },
      ],
    }),
    "text/plain": "Unsafe fallback",
  },
  "html-equals-plain": {
    "application/x-lexical-editor": "{bad",
    "text/html": "Unsafe fallback",
    "text/plain": "Unsafe fallback",
  },
  "malformed-uri-only": {
    "application/x-lexical-editor": "{bad",
    "text/uri-list": "https://example.com/Unsafe",
  },
  "unknown-without-html": {
    "application/x-lexical-editor": JSON.stringify({
      namespace: "clipboard-probe",
      nodes: [{ type: "unknown", version: 1 }],
    }),
    "text/plain": "Unsafe fallback",
  },
  "unsafe-json-and-html": {
    "application/x-lexical-editor": JSON.stringify({
      namespace: "clipboard-probe",
      nodes: [{ type: "unknown", version: 1 }],
    }),
    "text/html": '<p><a href="javascript:alert(1)">Bad</a></p>',
  },
})) {
  await reset()

  const before = await page.evaluate(function clipboardAction() {
    return window.probe.states()
  })

  await page.evaluate(function clipboardAction(value) {
    window.probe.pastePayload(value)
  }, payload)
  await page.waitForTimeout(100)
  records.push({
    name,
    payload,
    before,
    after: await page.evaluate(function clipboardAction() {
      return window.probe.states()
    }),
  })
}

const paragraph = {
  type: "paragraph",
  version: 1,
  children: [
    {
      type: "text",
      version: 1,
      text: "Valid sibling",
      format: 0,
      detail: 0,
      mode: "normal",
      style: "",
    },
  ],
  direction: null,
  format: "",
  indent: 0,
  textFormat: 0,
  textStyle: "",
}

const invalidNodes = {
  "late-unknown": [paragraph, { type: "unknown", version: 1 }],
  "unsafe-url": [
    {
      type: "link",
      version: 1,
      url: "javascript:alert(1)",
      children: [paragraph.children[0]],
      direction: null,
      format: "",
      indent: 0,
    },
  ],
  "unsafe-style": [{ ...paragraph, textStyle: "position: fixed" }],
  "bad-table": [{ type: "table", version: 1, children: [paragraph] }],
  "bad-block": [
    { type: "editor-toggle", version: 1, open: true, children: [paragraph] },
  ],
  "bad-state": [{ ...paragraph, $: { codeLineNumbers: true } }],
  "byte-budget": [
    {
      ...paragraph,
      children: [{ ...paragraph.children[0], text: "x".repeat(1048577) }],
    },
  ],
  "depth-budget": [JSON.parse("[".repeat(70) + "0" + "]".repeat(70))],
  "structure-budget": Array.from({ length: 65537 }, () => []),
  "bad-envelope": null,
}

for (const [name, nodes] of Object.entries(invalidNodes))
  for (const fallback of [false, true]) {
    await reset()

    const before = await page.evaluate(function clipboardAction() {
      return window.probe.states()
    })

    const payload = {
      "application/x-lexical-editor": JSON.stringify({
        namespace: "clipboard-probe",
        nodes,
      }),
    }

    if (fallback) payload["text/html"] = "<p>Fallback</p>"
    else payload["text/plain"] = "Unsafe fallback"
    await page.evaluate(function clipboardAction(value) {
      window.probe.pastePayload(value)
    }, payload)
    await page.waitForTimeout(100)

    const after = await page.evaluate(function clipboardAction() {
      return window.probe.states()
    })

    records.push({ name: "adversarial-" + name, fallback, before, after })
  }

for (const priority of ["high", "critical"])
  for (const order of ["before", "after"]) {
    await reset()
    await page.evaluate(
      function clipboardAction(value) {
        window.probe.veto(value.priority, value.order)
      },
      { priority, order },
    )
    await page.evaluate(function clipboardAction() {
      window.probe.pastePayload({ "text/html": "<p>Vetoed</p>" })
    })
    await page.waitForTimeout(100)
    records.push({
      name: `${priority}-${order}`,
      after: await page.evaluate(function clipboardAction() {
        return window.probe.states()
      }),
    })
  }

const nativeMetadataPayload = {
  "application/x-lexical-editor": JSON.stringify({
    namespace: "clipboard-probe",
    nodes: [
      {
        type: "text",
        version: 1,
        text: "Cleanup",
        format: 0,
        detail: 0,
        mode: "normal",
        style: "position: fixed",
        $: { customClipboardState: "kept" },
      },
    ],
  }),
}

for (const action of ["readonly", "cancel", "unregister", "reconnect"]) {
  await reset()

  const before = await page.evaluate(function beforeAction() {
    return window.probe.states()
  })

  await page.evaluate(function clipboardAction(value) {
    window.probe[value]()
  }, action)
  await page.locator("#helper").click()
  await page.evaluate(
    function clipboardAction(value) {
      window.probe.pastePayload(
        value.action === "unregister" || value.action === "reconnect"
          ? value.payload
          : { "text/html": "<p>Policy</p>" },
      )
    },
    { action, payload: nativeMetadataPayload },
  )
  await page.waitForTimeout(100)
  records.push({
    name: action,
    before,
    after: await page.evaluate(function clipboardAction() {
      return window.probe.states()
    }),
  })
}

await reset()

await page.locator("#helper").click()

await page.evaluate(function directImport(payload) {
  window.probe.pastePayload(payload, true)
}, nativeMetadataPayload)

records.push({
  name: "direct-import",
  after: await page.evaluate(function directState() {
    return window.probe.states()
  }),
})

await reset()

await page.evaluate(function clipboardAction() {
  window.probe.setup("<p>Fragment text</p>")
})

await page.locator("#source").click()

await page.evaluate(function clipboardAction() {
  window.probe.textSelection()
})

await page.keyboard.press("ControlOrMeta+c")

for (const id of ["native", "helper"]) {
  await page.locator(`#${id}`).click()
  await page.keyboard.press("ControlOrMeta+v")
  await page.waitForTimeout(100)
}

records.push({
  name: "native-fragment",
  after: await page.evaluate(function clipboardAction() {
    return window.probe.states()
  }),
})

await fs.writeFile(
  "clipboard-safety.json",
  JSON.stringify({ runtime, records }, null, 2),
)

await browser.close()

console.info(
  `Saved ${records.length} safety observations; ${runtime.length} runtime errors`,
)

function text(state) {
  return JSON.stringify(state.root)
}

const failures = []

for (const record of records) {
  try {
    const after = record.after.editors[2]

    if (record.name.startsWith("adversarial-"))
      assert.deepEqual(
        after,
        record.before.editors[2],
        record.name + ": partial mutation",
      )

    if (record.name === "cross-schema") {
      assert(
        text(after).includes("Fallback"),
        record.name + ": missing safe fallback",
      )
      assert(
        text(after).includes("Keep original"),
        record.name + ": lost prefix",
      )
    }

    if (
      [
        "unknown-without-html",
        "malformed",
        "unknown-with-html",
        "unsafe-json-and-html",
        "malformed-without-html",
        "foreign-without-html",
        "html-equals-plain",
        "malformed-uri-only",
      ].includes(record.name)
    )
      assert.deepEqual(
        after,
        record.before.editors[2],
        record.name + ": destructive rejection",
      )

    if (/^(high|critical)-/.test(record.name)) {
      assert(
        !text(after).includes("Vetoed"),
        record.name + ": bypassed host veto",
      )
      assert.equal(
        record.after.errors.filter((error) => error === "host-veto").length,
        1,
        record.name + ": host veto must run exactly once",
      )
    }

    if (record.name === "reconnect")
      assert.equal(
        record.after.errors.length,
        1,
        "reconnected boundary must reject invalid JSON once",
      )

    if (
      record.name === "readonly" ||
      record.name === "cancel" ||
      record.name === "reconnect"
    )
      assert.deepEqual(
        after,
        record.before.editors[2],
        record.name + ": mutation",
      )

    if (record.name === "direct-import") {
      assert(
        !text(after).includes("Cleanup"),
        "direct import bypassed validation",
      )
      assert.equal(record.after.errors.length, 1)
    }

    if (record.name === "unregister") {
      assert(text(after).includes("Cleanup"), "cleanup failed")
      assert(
        text(after).includes("customClipboardState"),
        "cleanup did not restore native JSON import",
      )
      assert(
        text(after).includes("position: fixed"),
        "native import was still bounded",
      )
    }

    if (record.name === "native-fragment")
      assert.deepEqual(
        after.root.children.at(-1),
        record.after.editors[1].root.children.at(-1),
        "partial fragment parity",
      )
  } catch (error) {
    failures.push(error.message)
  }
}

await fs.writeFile(
  "clipboard-safety-assertions.json",
  JSON.stringify({ failures }, null, 2),
)

assert.equal(runtime.length, 0)

assert.deepEqual(failures, [])
