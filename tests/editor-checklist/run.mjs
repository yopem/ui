import AxeBuilder from "@axe-core/playwright"
import { chromium, expect } from "@playwright/test"
import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const directory = path.dirname(fileURLToPath(import.meta.url))

const output = path.resolve(
  process.env.CHECKLIST_ARTIFACTS ?? "test-results/editor-checklist",
)

await mkdir(output, { recursive: true })

await writeFile(
  `${output}/tsconfig.json`,
  JSON.stringify({
    compilerOptions: {
      paths: {
        "@editor/*": [path.resolve(directory, "../../packages/editor/src/*")],
      },
    },
  }),
)

execFileSync(
  "bun",
  [
    "build",
    path.join(directory, "harness.mjs"),
    "--target=browser",
    `--tsconfig-override=${output}/tsconfig.json`,
    `--outfile=${output}/harness.js`,
  ],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      NODE_PATH: path.resolve(directory, "../../packages/editor/node_modules"),
    },
  },
)

await writeFile(
  `${output}/index.html`,
  `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Native checklist workflow</title><style>body{color:#222;background:#fff;font:16px sans-serif}li{position:relative;min-height:24px;padding-inline-start:24px;list-style:none}li::before{content:"";position:absolute;left:0;top:4px;width:16px;height:16px}.native-check{position:absolute;inset-inline-start:0;inset-block-start:4px;width:16px;height:16px;margin:0}input:focus-visible{outline:2px solid #222} [contenteditable]{min-height:100px}</style></head><body><main><h1>Native checklist workflow</h1><button id="before">Before editor</button><div contenteditable="true" role="textbox" aria-label="Checklist editor" aria-multiline="true"></div><button id="after">After editor</button></main><script src="./harness.js"></script></body></html>`,
)

const browser = await chromium.launch({ channel: "chromium" })

const context = await browser.newContext({
  permissions: ["clipboard-read", "clipboard-write"],
})

await context.tracing.start({
  screenshots: true,
  snapshots: true,
  sources: true,
})

const page = await context.newPage()

const errors = []

page.on("pageerror", (error) => errors.push(error.message))

const evidence = { browserVersion: browser.version(), scenarios: [], scans: [] }

function state() {
  return page.evaluate(() => window.checklist.snapshot())
}

async function checked(value) {
  await expect(page.getByRole("checkbox").first()).toBeChecked({
    checked: value,
  })
  await expect(page.getByRole("checkbox").first()).toHaveAttribute(
    "aria-checked",
    String(value),
  )
  await expect
    .poll(async () => (await state()).json.root.children[0].children[0].checked)
    .toBe(value)
}

try {
  await page.goto(pathToFileURL(`${output}/index.html`).href)
  const editor = page.getByRole("textbox", { name: "Checklist editor" })
  const checkbox = page.getByRole("checkbox").first()
  await expect(checkbox).toHaveAccessibleName("Checklist item")
  await expect(editor.locator("ul > li")).not.toHaveAttribute(
    "role",
    "checkbox",
  )

  const emptyScan = await new AxeBuilder({ page }).analyze()
  evidence.scans.push({ state: "empty", violations: emptyScan.violations })
  assert.deepEqual(emptyScan.violations, [])
  evidence.scenarios.push("empty checklist Axe")
  await page.evaluate(() => window.checklist.reset("Task"))
  await expect(checkbox).toHaveAccessibleName("Task")
  const savedSelection = await page.evaluate(() => window.checklist.selection())
  assert.ok(savedSelection)
  await checkbox.click({ position: { x: 8, y: 8 } })
  await checked(true)
  await expect(checkbox).toBeFocused()
  await checkbox.press("Space")
  await checked(false)
  assert.deepEqual(
    await page.evaluate(() => window.checklist.selection()),
    savedSelection,
  )
  await page.locator("#before").focus()
  await page.keyboard.press("Tab")
  await expect(editor).toBeFocused()
  await page.keyboard.press("Tab")
  await expect(checkbox).toBeFocused()
  evidence.scenarios.push("pointer, Space, Tab, accessible name, JSON")
  await page.evaluate(() => window.checklist.undo())
  await checked(true)
  await page.evaluate(() => window.checklist.redo())
  await checked(false)
  evidence.scenarios.push("undo/redo checkbox state")
  await checkbox.press("Escape")
  await expect(editor).toBeFocused()
  await page.keyboard.press("End")
  await page.keyboard.type(" with spaces")
  await expect(editor).toContainText("Task with spaces")
  await expect(checkbox).toHaveAccessibleName("Task with spaces")
  await checked(false)
  await checkbox.focus()
  await page.keyboard.press("x")
  await expect(editor).toBeFocused()
  await expect(editor).toContainText("Task with spacesx")
  await checked(false)
  await editor.press("Backspace")
  await expect(editor).toContainText("Task with spaces")
  await page.keyboard.press("Enter")
  await page.keyboard.type("Second")
  await expect(page.getByRole("checkbox")).toHaveCount(2)
  await page.evaluate(() => window.checklist.indent())
  await expect(editor.locator("ul ul")).toHaveCount(1)
  await expect(page.getByRole("checkbox")).toHaveCount(2)
  await page.evaluate(() => window.checklist.outdent())
  await expect(editor.locator("ul ul")).toHaveCount(0)
  await expect(page.getByRole("checkbox")).toHaveCount(2)
  await page.evaluate(() => window.checklist.indent())
  await expect(editor.locator("ul ul")).toHaveCount(1)
  await page.getByRole("checkbox").first().focus()
  await page.keyboard.press("ArrowDown")
  await expect(page.getByRole("checkbox").nth(1)).toBeFocused()
  await page.keyboard.press("ArrowUp")
  await expect(page.getByRole("checkbox").first()).toBeFocused()
  await page.keyboard.press("ArrowRight")
  await expect(editor).toBeFocused()
  await page.keyboard.press("Home")
  await page.keyboard.press("ArrowLeft")
  await expect(checkbox).toBeFocused()
  await checkbox.click()
  await checked(true)
  evidence.scenarios.push("text spaces, Enter, indent, nested arrow navigation")

  const nestedScan = await new AxeBuilder({ page }).analyze()
  evidence.scans.push({
    state: "nested mixed checked",
    violations: nestedScan.violations,
  })
  assert.deepEqual(nestedScan.violations, [])
  const exported = await state()
  assert.doesNotMatch(exported.html, /<input|native-check|Checklist item/)
  assert.doesNotMatch(exported.markdown, /native-check|Checklist item/)
  await page.evaluate((html) => window.checklist.paste(html), exported.html)
  await expect(page.getByRole("checkbox")).toHaveCount(2)
  assert.equal((await state()).text, exported.text)
  await checked(true)
  await page.evaluate(
    (markdown) => window.checklist.markdown(markdown),
    exported.markdown,
  )
  await expect(page.getByRole("checkbox")).toHaveCount(2)
  await checked(true)
  assert.equal((await state()).text, exported.text)
  await page.evaluate((json) => window.checklist.json(json), exported.json)
  await expect(page.getByRole("checkbox")).toHaveCount(2)
  assert.deepEqual((await state()).json, exported.json)
  await editor.click()
  await page.keyboard.press("ControlOrMeta+a")
  await page.keyboard.press("ControlOrMeta+c")

  const clipboard = await page.evaluate(async () => {
    const items = await navigator.clipboard.read()
    const item = items.find((value) => value.types.includes("text/html"))

    return item ? (await item.getType("text/html")).text() : ""
  })

  assert.match(clipboard, /Task with spaces/)
  assert.doesNotMatch(clipboard, /<input|native-check|Checklist item/)
  await page.keyboard.press("ControlOrMeta+v")
  await expect(page.getByRole("checkbox")).toHaveCount(2)
  evidence.scenarios.push(
    "HTML and explicit checklist Markdown round trips, JSON round trip, native clipboard copy/paste",
  )
  await page.evaluate(
    (html) => window.checklist.paste(`${html}<p>Separator</p>${html}`),
    exported.html,
  )
  await expect(page.getByRole("checkbox")).toHaveCount(4)
  await page.getByRole("checkbox").nth(1).focus()
  await page.keyboard.press("ArrowDown")
  await expect(page.getByRole("checkbox").nth(1)).toBeFocused()
  await page.getByRole("checkbox").nth(2).focus()
  await page.keyboard.press("ArrowUp")
  await expect(page.getByRole("checkbox").nth(2)).toBeFocused()
  await page.evaluate((html) => window.checklist.paste(html), exported.html)
  await expect(page.getByRole("checkbox")).toHaveCount(2)
  evidence.scenarios.push("arrow navigation stays within native list tree")
  await page.evaluate(() => window.checklist.editable(false))
  await expect(checkbox).toBeDisabled()
  const readonly = await state()
  const readonlyScan = await new AxeBuilder({ page }).analyze()
  evidence.scans.push({ readonly: true, violations: readonlyScan.violations })
  assert.deepEqual(readonlyScan.violations, [])
  const readonlyBounds = await checkbox.boundingBox()
  assert.ok(readonlyBounds)
  await page.mouse.click(readonlyBounds.x + 8, readonlyBounds.y + 8)
  await editor.click()
  await page.keyboard.press("Space")
  assert.deepEqual(await state(), readonly)
  await page.evaluate(() => window.checklist.editable(true))
  await expect(checkbox).toBeEnabled()
  await page.evaluate(() => window.checklist.paragraph())
  await expect(page.getByRole("checkbox")).toHaveCount(0)
  await page.evaluate(() => {
    window.checklist.detach()
    window.checklist.attach()
    window.checklist.reset("Reset")
  })
  await expect(page.getByRole("checkbox")).toHaveCount(1)
  await expect(checkbox).toHaveAccessibleName("Reset")
  await checkbox.click()
  await checked(true)
  evidence.scenarios.push(
    "read-only, enable, paragraph conversion, root detach/reattach, reset",
  )
  const finalScan = await new AxeBuilder({ page }).analyze()
  evidence.scans.push({ final: true, violations: finalScan.violations })
  assert.deepEqual(finalScan.violations, [])
  assert.deepEqual(errors, [])
  evidence.final = await state()
  evidence.status = "passed"
} catch (error) {
  evidence.status = "failed"
  evidence.failure = String(error.stack ?? error)
  throw error
} finally {
  evidence.errors = errors
  await page.screenshot({ path: `${output}/final.png` })
  await writeFile(`${output}/report.json`, JSON.stringify(evidence, null, 2))
  await context.tracing.stop({ path: `${output}/trace.zip` })
  await browser.close()
}
