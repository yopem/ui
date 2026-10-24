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

await page.goto(`http://127.0.0.1:${port}`)

await page.waitForFunction(function clipboardAction() {
  return Boolean(window.probe)
})

const cases = [
  ["code", "code"],
  ["metadata", "metadata"],
  ["highlight-code", "code-highlight"],
  ["highlight-code-partial", "code-highlight"],
  [
    "merged-table",
    '<table><tr data-editor-row-height="64"><td colspan="2" data-editor-border="hidden"><p><strong>Merged cell</strong></p></td></tr><tr><td data-editor-border="hidden"><p>A</p></td><td data-editor-border="hidden"><p>B</p></td></tr></table>',
  ],
  [
    "toggle-body-partial",
    "<details data-editor-toggle open><summary>Title</summary><div data-editor-toggle-body><p><strong>Body text</strong></p></div></details>",
  ],
  ["code-prefix", "code"],
  ["code-partial", "code"],
  ["list-partial", '<ol start="4"><li><strong>First item</strong></li></ol>'],
  [
    "table-partial",
    "<table><tr><td><p><strong>Cell text</strong></p></td></tr></table>",
  ],
  [
    "callout-partial",
    '<aside data-editor-callout data-appearance="info" data-icon="info"><p><strong>Callout text</strong></p></aside>',
  ],
  [
    "toggle-partial",
    "<details data-editor-toggle open><summary><strong>Title text</strong></summary><div data-editor-toggle-body><p>Body text</p></div></details>",
  ],
  [
    "rich",
    '<h2>Title</h2><p><strong>Bold</strong> <a href="https://example.com">Link</a></p><ul><li>Item</li></ul><table><tr><td><p>Cell</p></td></tr></table>',
  ],
  ["list", '<ol start="4"><li><strong>First</strong></li><li>Second</li></ol>'],
  [
    "toggle",
    '<details data-editor-toggle open><summary><strong>Title <a href="https://example.com">link</a></strong></summary><div data-editor-toggle-body><p>Toggle body</p></div></details>',
  ],
  ["fragment", "<p><strong>Rich fragment</strong></p>"],
  [
    "link-partial",
    '<p><a href="https://example.com"><strong>Link text</strong></a></p>',
  ],
  [
    "table",
    "<table><tr><td><p>Cell A</p></td><td><p>Cell B</p></td></tr></table>",
  ],
  [
    "style",
    '<p style="line-height: 2; text-indent: 20px"><span style="color: red; font-size: 20px">Styled</span></p>',
  ],
  [
    "blocks",
    '<aside data-editor-callout="" data-appearance="info" data-icon="info"><p>Callout</p></aside>',
  ],
]

const records = []

const failures = []

const emptyTargets = new Set([
  "code",
  "highlight-code",
  "metadata",
  "merged-table",
  "rich",
  "list",
  "toggle",
  "table",
  "style",
  "blocks",
])

for (const [name, input] of cases.flatMap(function targetVariants([
  name,
  input,
]) {
  return name !== "code" && emptyTargets.has(name)
    ? [
        [name, input],
        [`${name}-prefix`, input],
      ]
    : [[name, input]]
})) {
  await page.reload()
  await page.waitForFunction(function clipboardAction() {
    return Boolean(window.probe)
  })
  await page.evaluate(
    function clipboardAction(value) {
      window.probe.setup(value.input)

      if (value.seed) window.probe.seedTarget()
    },
    { input, seed: !emptyTargets.has(name) },
  )
  await page.locator("#source").click()

  if (name === "rich" || name === "rich-prefix")
    await page.keyboard.press("ControlOrMeta+a")
  else if (name === "toggle-body-partial")
    await page.evaluate(function selectBody() {
      window.probe.tailSelection()
    })
  else if (name === "fragment" || name.endsWith("-partial"))
    await page.evaluate(function clipboardAction() {
      window.probe.textSelection()
    })
  else
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

  const before = await page.evaluate(function clipboardAction() {
    return window.probe.states()
  })

  await page.locator("#native").click()
  await page.keyboard.press("ControlOrMeta+v")
  await page.waitForTimeout(100)
  await page.locator("#helper").click()
  await page.keyboard.press("ControlOrMeta+v")
  await page.waitForTimeout(100)

  const pasted = await page.evaluate(function clipboardAction() {
    return window.probe.states()
  })

  await page.keyboard.press("ControlOrMeta+z")
  await page.waitForTimeout(100)

  const undone = await page.evaluate(function clipboardAction() {
    return window.probe.states()
  })

  await page.keyboard.press("ControlOrMeta+Shift+z")
  await page.waitForTimeout(100)

  const redone = await page.evaluate(function clipboardAction() {
    return window.probe.states()
  })

  records.push({ name, before, pasted, undone, redone })
}

await fs.writeFile(
  "clipboard-evidence.json",
  JSON.stringify({ runtime, records }, null, 2),
)

await page.screenshot({ path: `${process.cwd()}/clipboard-probe.png` })

await browser.close()

for (const record of records) {
  try {
    assert(
      record.pasted.copies[0]["application/x-lexical-editor"],
      `${record.name}: native copy payload missing`,
    )
    assert(
      record.pasted.copies[0]["text/html"],
      `${record.name}: HTML copy payload missing`,
    )
    assert.deepEqual(
      record.pasted.editors[1],
      record.pasted.editors[2],
      `${record.name}: native/helper JSON mismatch`,
    )
    assert.deepEqual(
      record.redone.editors[2],
      record.pasted.editors[2],
      `${record.name}: redo mismatch`,
    )
    assert.deepEqual(
      record.undone.editors[2],
      record.before.editors[2],
      `${record.name}: undo did not restore the target prefix`,
    )
    assert.deepEqual(
      record.pasted.errors,
      [],
      `${record.name}: conversion errors`,
    )
  } catch (error) {
    failures.push(error.message)
  }
}

assert.equal(runtime.length, 0)

const metadata = records.find((record) => record.name === "metadata")

assert.equal(
  metadata.before.editors[0].root.children[0].$?.customClipboardState,
  "kept",
)

assert.equal(
  metadata.pasted.editors[1].root.children[0].$?.customClipboardState,
  "kept",
)

const styled = records.find((record) => record.name === "style")

assert(styled.pasted.editors[0].root.children[0].$?.editorBlockPresentation)

assert.deepEqual(
  styled.pasted.editors[1].root.children[0].$,
  styled.pasted.editors[0].root.children[0].$,
)

const merged = records.find((record) => record.name === "merged-table")

const sourceTable = merged.pasted.editors[0].root.children.find(
  (node) => node.type === "table",
)

const nativeTable = merged.pasted.editors[1].root.children.find(
  (node) => node.type === "table",
)

assert.equal(sourceTable.children[0].height, 64)

assert.equal(nativeTable.children[0].height, sourceTable.children[0].height)

assert.equal(nativeTable.children[0].children[0].colSpan, 2)

assert(sourceTable.children[0].children[0].$)

assert.deepEqual(
  nativeTable.children[0].children[0].$,
  sourceTable.children[0].children[0].$,
)

assert.equal(records[0].pasted.copyContext[0].selection, "NodeSelection")

const copiedCode = JSON.parse(
  records[0].pasted.copies[0]["application/x-lexical-editor"],
)

assert.deepEqual(copiedCode.nodes.find((node) => node.type === "code").$, {
  codeWrap: false,
  codeLineNumbers: true,
})

assert.deepEqual(records[0].pasted.editors[0].root.children[0].$, {
  codeWrap: false,
  codeLineNumbers: true,
})

assert.deepEqual(
  records[0].pasted.editors[1].root.children.find(
    (node) => node.type === "code",
  ).$,
  {
    codeWrap: false,
    codeLineNumbers: true,
  },
)

await fs.writeFile(
  "clipboard-assertions.json",
  JSON.stringify({ failures }, null, 2),
)

assert.deepEqual(failures, [])

console.info("Native clipboard parity and history assertions passed")
