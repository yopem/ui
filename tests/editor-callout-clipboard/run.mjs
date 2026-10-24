import { chromium, expect } from "@playwright/test"
import assert from "node:assert/strict"
import { mkdir, writeFile } from "node:fs/promises"
import { createRequire } from "node:module"

const installed = createRequire(
  new URL("../../packages/editor/package.json", import.meta.url),
)

const native = createRequire(installed.resolve("@lexical/rich-text"))

const build = await Bun.build({
  entrypoints: [new URL("./fixture.mjs", import.meta.url).pathname],
  target: "browser",
  plugins: [
    {
      name: "readonly-installed-dependencies",
      setup(builder) {
        builder.onResolve({ filter: /^@editor\// }, ({ path }) => ({
          path: new URL(
            `../../packages/editor/src/${path.split("/").at(-1)}.ts`,
            import.meta.url,
          ).pathname,
        }))
        builder.onResolve(
          { filter: /^(@lexical\/|lexical$|zod$)/ },
          ({ path }) => {
            let resolved

            try {
              resolved = installed.resolve(path)
            } catch {
              resolved = native.resolve(path)
            }

            return { path: resolved }
          },
        )
      },
    },
  ],
})

assert.equal(
  build.success,
  true,
  build.logs.map((entry) => entry.message).join("\n"),
)

const script = await build.outputs[0].text()

const server = Bun.serve({
  port: 0,
  hostname: "127.0.0.1",
  fetch(request) {
    return new URL(request.url).pathname === "/fixture.js"
      ? new Response(script, { headers: { "Content-Type": "text/javascript" } })
      : new Response(
          '<!doctype html><html lang="en"><head><title>Clipboard regression</title></head><body><script type="module" src="/fixture.js"></script></body></html>',
          { headers: { "Content-Type": "text/html" } },
        )
  },
})

const browser = await chromium.launch({
  headless: true,
  executablePath:
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ??
    chromium.executablePath(),
})

const context = await browser.newContext({
  permissions: ["clipboard-read", "clipboard-write"],
})

const page = await context.newPage()

const errors = []

page.on("pageerror", (error) => errors.push(error.message))

const results = []

function callout(body) {
  return `<aside data-editor-callout data-appearance="info" data-icon="💡">${body}</aside>`
}

const toggle =
  '<section data-editor-toggle><div data-editor-toggle-summary><b>Title</b></div><details data-editor-toggle-body open><summary data-editor-toggle-control contenteditable="false"></summary><div data-editor-toggle-content><p>Body</p></div></details></section>'

const scenarios = [
  ["single", "<p><b>Rich callout</b></p>"],
  ["multiple", "<p><b>Rich callout</b></p><p>Second</p>"],
  [
    "rich",
    `<h2>Heading</h2><p><b>Rich callout</b><i> Italic</i></p><ul><li>List item</li></ul><table><tbody><tr><td><p>Cell</p></td></tr></tbody></table>${toggle}<p></p>`,
  ],
  ["empty", "<p></p><p></p>"],
]

async function load(html) {
  await page.evaluate((html) => window.fixture.load("source", html), html)
  await page.locator("#source").click()
}

async function selectWhole(backward = false) {
  await page
    .locator("#source aside")
    .first()
    .evaluate((node, backward) => {
      const range = document.createRange()
      range.selectNode(node)
      const selection = document.getSelection()

      if (!selection) throw new Error("Missing selection")
      selection.removeAllRanges()
      selection.addRange(range)

      if (backward)
        selection.setBaseAndExtent(
          range.endContainer,
          range.endOffset,
          range.startContainer,
          range.startOffset,
        )
    }, backward)
  await page.waitForTimeout(60)
}

async function copy(key = "c") {
  await page.keyboard.press(`Control+${key}`)

  return page.evaluate(async () => {
    const entries = await navigator.clipboard.read()
    const item = entries.find((entry) => entry.types.includes("text/html"))

    if (!item) throw new Error("No clipboard HTML")
    const html = await (await item.getType("text/html")).text()

    const payload = window.fixture.payload()
    const event = window.fixture.clipboardEvents.at(-1)

    if (window.fixture.source.isEditable() && !event?.lexical)
      throw new Error("Missing native clipboard JSON")

    if (
      event?.lexical &&
      event.lexical !== payload.data["application/x-lexical-editor"]
    )
      throw new Error("Native clipboard JSON differs from export")

    return { html, payload }
  })
}

try {
  await page.goto(server.url.href)
  await page.locator("#source").waitFor()

  for (const position of ["before", "after"]) {
    for (const mode of ["veto", "custom", "track"]) {
      await page.goto(
        `${server.url.href}?cut=${mode}&position=${position}&policy=observe`,
      )
      await page.locator("#source").waitFor()
      await load(
        `<p>Source prefix</p>${callout("<p><b>Rich callout</b></p><p>Second</p>")}`,
      )
      await selectWhole()
      await page.evaluate(async () => {
        await navigator.clipboard.writeText("Clipboard keep")
        window.fixture.calls.length = 0
      })

      const before = await page.evaluate(() => ({
        state: window.fixture.state(),
        history: window.fixture.history(),
      }))

      await page.keyboard.press("ControlOrMeta+x")
      await page.waitForTimeout(80)

      const actual = await page.evaluate(async () => ({
        state: window.fixture.state(),
        history: window.fixture.history(),
        calls: window.fixture.calls,
        cutCalls: window.fixture.cutCalls,
        registration: window.fixture.registration,
        clipboard: await navigator.clipboard.readText(),
        event: window.fixture.clipboardEvents.at(-1),
        json: window.fixture.json(),
        updateTags: window.fixture.updateTags,
        cutTag: window.fixture.cutTag,
      }))

      const result = { name: `cut-policy-${position}-${mode}`, before, actual }

      try {
        assert.deepEqual(
          actual.registration.slice(0, 2),
          position === "before" ? ["host", "helper"] : ["helper", "host"],
        )
        assert.deepEqual(actual.cutCalls, [mode])

        if (mode === "track") {
          await expect(page.locator("#source aside")).toHaveCount(0)
          assert.equal(actual.calls.length, 8)
          assert(actual.event.html.includes("data-editor-callout"))
          assert(actual.updateTags.some((tags) => tags.includes(actual.cutTag)))
          await page.keyboard.press("ControlOrMeta+z")
          await expect(page.locator("#source aside")).toHaveCount(1)
          await page.keyboard.press("ControlOrMeta+y")
          await expect(page.locator("#source aside")).toHaveCount(0)
        } else {
          assert.equal(actual.state, before.state)
          assert.deepEqual(actual.history, before.history)
          assert.deepEqual(actual.calls, [])
          assert.equal(
            actual.clipboard,
            mode === "veto" ? "Clipboard keep" : "Host owns cut",
          )
          assert.equal(actual.event.html, "")
          assert.equal(actual.event.lexical, "")
        }

        result.status = "passed"
      } catch (error) {
        result.status = "failed"
        result.failure = String(error)
      }

      results.push(result)
    }
  }

  for (const [name, html] of [
    [
      "rich-document",
      `<h2><b>Heading</b></h2><ul><li>List item</li></ul><blockquote><i>Quote</i></blockquote>${callout("<p><b>Rich callout</b></p><p>Second</p>")}`,
    ],
    [
      "one-callout-document",
      callout("<p><b>Rich callout</b></p><p>Second</p>"),
    ],
    ["empty-callout-document", callout("<p></p><p></p>")],
  ]) {
    for (const backward of [false, true]) {
      await page.goto(`${server.url.href}?policy=observe`)
      await page.locator("#source").waitFor()
      await load(html)
      await page.keyboard.press("ControlOrMeta+a")
      await page.locator("#source").evaluate((root, backward) => {
        const selection = document.getSelection()

        if (!selection?.rangeCount) throw new Error("Missing select-all range")

        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
          acceptNode(node) {
            return node.parentElement.closest('[contenteditable="false"]')
              ? NodeFilter.FILTER_REJECT
              : NodeFilter.FILTER_ACCEPT
          },
        })

        const first = walker.nextNode()
        let last = first

        for (let node = walker.nextNode(); node; node = walker.nextNode())
          last = node

        if (first && last)
          selection.setBaseAndExtent(
            backward ? last : first,
            backward ? last.textContent.length : 0,
            backward ? first : last,
            backward ? 0 : last.textContent.length,
          )
        else if (backward) {
          const range = selection.getRangeAt(0)
          selection.setBaseAndExtent(
            range.endContainer,
            range.endOffset,
            range.startContainer,
            range.startOffset,
          )
        }
      }, backward)
      await page.waitForTimeout(60)

      const before = await page.evaluate(() => ({
        json: window.fixture.json(),
        state: JSON.parse(window.fixture.state()),
        history: window.fixture.history(),
      }))

      await page.evaluate(() => {
        window.fixture.calls.length = 0
      })
      await page.keyboard.press("ControlOrMeta+x")
      await page.waitForTimeout(80)

      const actual = await page.evaluate(() => ({
        json: window.fixture.json(),
        event: window.fixture.clipboardEvents.at(-1),
        calls: [...window.fixture.calls],
        history: window.fixture.history(),
        html: document.getElementById("source").innerHTML,
      }))

      const result = { name, backward, before, actual }

      try {
        if (name !== "empty-callout-document") {
          assert.equal(before.state.anchor.type, "text")
          assert.equal(before.state.focus.type, "text")
        }

        assert.equal(
          JSON.stringify(JSON.parse(actual.event.lexical).nodes),
          JSON.stringify(before.json.root.children),
        )
        assert.equal(actual.calls.length, 8)
        assert.equal(actual.json.root.children.length, 1)
        assert.equal(actual.json.root.children[0].type, "paragraph")
        assert.deepEqual(actual.json.root.children[0].children, [])
        assert.equal(actual.history.undo.length, before.history.undo.length + 1)
        await page.keyboard.press("ControlOrMeta+z")
        assert.deepEqual(
          await page.evaluate(() => window.fixture.json()),
          before.json,
        )
        await page.keyboard.press("ControlOrMeta+y")
        assert.deepEqual(
          await page.evaluate(() => window.fixture.json()),
          actual.json,
        )
        await page.keyboard.press("ControlOrMeta+v")
        await page.waitForTimeout(80)
        const pasted = await page.evaluate(() => window.fixture.json())
        assert.deepEqual(pasted.root.children, before.json.root.children)
        result.pasted = pasted
        results.push({ ...result, status: "passed" })
      } catch (error) {
        results.push({ ...result, status: "failed", failure: String(error) })
      }
    }
  }

  for (const policy of [
    "veto-earlier",
    "veto-later",
    "stop-earlier",
    "stop-later",
    "transform",
    "observe",
  ]) {
    for (const action of ["c", "x"]) {
      await page.goto(`${server.url.href}?policy=${policy}`)
      await page.locator("#source").waitFor()
      await load(
        `<p>Source prefix</p>${callout("<p><b>Rich callout</b></p><p>Second</p>")}<p>Secret suffix</p>`,
      )
      await selectWhole()
      const before = await page.evaluate(() => window.fixture.state())

      const exported = await page.evaluate(() => {
        window.fixture.calls.length = 0
        const result = window.fixture.payload().data

        return {
          result,
          calls: [...window.fixture.calls],
          state: window.fixture.state(),
        }
      })

      assert.equal(exported.state, before)

      function check(data, counts) {
        for (const mime of [
          "text/html",
          "application/x-lexical-editor",
          "text/plain",
          "application/x-host",
        ])
          for (const position of ["earlier", "later"])
            assert.equal(
              counts.filter(
                (call) => call.mime === mime && call.position === position,
              ).length,
              policy === "stop-later" &&
                position === "earlier" &&
                ["text/html", "application/x-lexical-editor"].includes(mime)
                ? 0
                : 1,
              `${policy}:${action}:${position}:${mime}`,
            )
        assert.equal(data.extra, "host:earlier:later")
        assert.equal(data.plain, "Rich callout\nSecond\n")

        if (policy.startsWith("veto") || policy.startsWith("stop")) {
          assert.equal(data.html, "")
          assert.equal(data.lexical, "")
        } else {
          assert(data.html.includes("data-editor-callout"))
          assert.equal(JSON.parse(data.lexical).nodes[0].children.length, 2)

          if (policy === "transform") {
            assert(
              data.html.includes("Safe callout") &&
                data.html.includes("Filtered") &&
                !data.html.includes("Rich callout") &&
                !data.html.includes("Second"),
            )
            assert(
              data.lexical.includes("Safe callout") &&
                data.lexical.includes("Filtered") &&
                !data.lexical.includes("Rich callout") &&
                !data.lexical.includes("Second"),
            )
          }
        }
      }

      check(
        {
          html: exported.result["text/html"] ?? "",
          lexical: exported.result["application/x-lexical-editor"] ?? "",
          plain: exported.result["text/plain"],
          extra: exported.result["application/x-host"],
        },
        exported.calls,
      )
      assert(
        exported.calls
          .filter((call) => call.position === "later")
          .every((call) => call.live),
      )
      await page.evaluate(() => {
        window.fixture.calls.length = 0
      })
      await page.keyboard.press(`Control+${action}`)

      const event = await page.evaluate(() => ({
        data: window.fixture.clipboardEvents.at(-1),
        calls: window.fixture.calls,
      }))

      check(event.data, event.calls)

      if (action === "c")
        assert.equal(await page.evaluate(() => window.fixture.state()), before)
      else {
        await expect(page.locator("#source aside")).toHaveCount(0)
        await expect(page.locator("#source")).toContainText("Source prefix")
        await expect(page.locator("#source")).toContainText("Secret suffix")
        await page.keyboard.press("Control+z")
        await expect(page.locator("#source aside")).toContainText(
          "Rich callout",
        )
        await page.keyboard.press("Control+y")
        await expect(page.locator("#source aside")).toHaveCount(0)
      }

      results.push({
        name: `policy-${policy}-${action}`,
        status: "passed",
        exported,
        event,
      })
    }
  }

  await page.goto(`${server.url.href}?policy=observe`)
  await page.locator("#source").waitFor()
  await load(`<p>Source prefix</p>${callout("<p>Node selected</p>")}`)

  const nodeSelected = await page.evaluate(() => {
    window.fixture.selectNode()
    const before = window.fixture.state()
    window.fixture.calls.length = 0
    const data = window.fixture.payload().data

    return {
      before,
      after: window.fixture.state(),
      data,
      calls: window.fixture.calls,
    }
  })

  assert.equal(nodeSelected.before, nodeSelected.after)
  assert.equal(
    JSON.parse(nodeSelected.data["application/x-lexical-editor"]).nodes[0].type,
    "editor-callout",
  )
  assert(nodeSelected.calls.every((call) => call.live))
  assert.equal(nodeSelected.calls.length, 8)
  results.push({
    name: "node-selection-fallback",
    status: "passed",
    nodeSelected,
  })
  await page.goto(server.url.href)
  await page.locator("#source").waitFor()

  for (const [name, body] of scenarios) {
    for (const backward of [false, true]) {
      await load(
        `<p>Source prefix</p>${callout(body)}${name === "single" ? "" : "<p>Secret suffix</p>"}`,
      )
      await selectWhole(backward)
      const before = await page.evaluate(() => window.fixture.payload())
      const { html, payload } = await copy()

      const structure = await page.evaluate((html) => {
        const doc = new DOMParser().parseFromString(html, "text/html")
        const aside = doc.querySelector("aside[data-editor-callout]")

        return {
          appearance: aside?.getAttribute("data-appearance"),
          icon: aside?.getAttribute("data-icon"),
          tags: Array.from(aside?.children ?? [], (element) => element.tagName),
          bold: aside?.querySelector("b,strong")?.textContent,
          text: doc.body.textContent,
        }
      }, html)

      assert.equal(structure.appearance, "info")
      assert.equal(structure.icon, "💡")
      assert(
        !structure.text.includes("Source prefix") &&
          !structure.text.includes("Secret suffix"),
      )

      if (name !== "empty") assert.equal(structure.bold, "Rich callout")
      const exported = JSON.parse(payload.data["application/x-lexical-editor"])
      assert.equal(
        JSON.stringify(
          exported.nodes.filter((node) => node.type === "editor-callout"),
        ),
        JSON.stringify(before.json.root.children.slice(1, 2)),
      )
      assert.deepEqual(payload.json, before.json)
      assert.deepEqual(payload.selection, before.selection)

      if (name === "rich")
        assert.deepEqual(structure.tags, [
          "H2",
          "P",
          "UL",
          "TABLE",
          "SECTION",
          "P",
        ])

      for (const id of ["same", "target"]) {
        await page.evaluate(
          (id) => window.fixture.load(id, "<p>Target keep</p>"),
          id,
        )
        await page.locator(`#${id}`).click()
        await page.keyboard.press("Control+End")
        await page.keyboard.press("Enter")
        await page.keyboard.press("Control+v")
        await expect(page.locator(`#${id}`)).toContainText("Target keep")

        if (name !== "empty")
          await expect(
            page.locator(`#${id} strong`).filter({ hasText: "Rich callout" }),
          ).toBeVisible()
        await expect(page.locator(`#${id}`)).not.toContainText("Source prefix")

        if (id === "same")
          await expect(page.locator("#same aside")).toHaveCount(1)
      }

      results.push({
        name,
        backward,
        status: "passed",
        html,
        lexical: exported,
      })
    }
  }

  for (const backward of [false, true]) {
    await load(
      `<p>Source prefix</p>${callout("<p><b>Rich callout</b> Hidden</p>")}<p>Secret suffix</p>`,
    )
    await page.locator("#source aside strong").evaluate((node, backward) => {
      const text = node.firstChild
      const selection = document.getSelection()

      if (!text || !selection) throw new Error("Missing text")
      selection.setBaseAndExtent(text, backward ? 6 : 1, text, backward ? 1 : 6)
    }, backward)
    await page.waitForTimeout(60)
    const { html } = await copy()
    assert(
      !html.includes("data-editor-callout") &&
        !html.includes("Hidden") &&
        !html.includes("Source prefix"),
    )
    assert(html.includes("ich c"))
    results.push({ name: "partial", backward, status: "passed", html })
  }

  for (const backward of [false, true]) {
    await load(
      `<p>Source prefix</p>${callout("<p><b>Rich callout</b></p><p>Second</p>")}<p>Secret suffix</p>`,
    )
    await page.locator("#source").evaluate((root, backward) => {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
      const start = walker.nextNode()
      let end = start

      for (let node = walker.nextNode(); node; node = walker.nextNode())
        end = node
      const selection = document.getSelection()

      if (!start || !end || !selection) throw new Error("Missing boundary")
      selection.setBaseAndExtent(
        backward ? end : start,
        backward ? 6 : 7,
        backward ? start : end,
        backward ? 7 : 6,
      )
    }, backward)
    await page.waitForTimeout(60)
    const { html, payload } = await copy()
    assert(
      html.includes("data-editor-callout") &&
        html.includes("prefix") &&
        html.includes("Secret"),
    )
    assert(!html.includes("Source ") && !html.includes("suffix"))
    const nodes = JSON.parse(payload.data["application/x-lexical-editor"]).nodes
    assert.equal(nodes[1].type, "editor-callout")
    assert.equal(nodes[1].children.length, 2)
    results.push({ name: "mixed", backward, status: "passed", html })
  }

  for (const mode of ["text", "paragraph", "mixed-partial"]) {
    for (const backward of [false, true]) {
      await load(
        `<p>Source prefix</p>${callout("<p><b>Rich callout</b></p><p>Hidden</p>")}<p>Secret suffix</p>`,
      )
      await page.locator("#source").evaluate(
        (root, { mode, backward }) => {
          const paragraph = root.querySelector("aside p")
          const text = paragraph?.querySelector("strong")?.firstChild
          const prefix = root.querySelector("p span")?.firstChild
          const selection = document.getSelection()

          if (!paragraph || !text || !prefix || !selection)
            throw new Error("Missing boundary")

          const start =
            mode === "paragraph"
              ? paragraph
              : mode === "mixed-partial"
                ? prefix
                : text

          const end = mode === "paragraph" ? paragraph : text
          const a = mode === "mixed-partial" ? 7 : 0
          const b = mode === "paragraph" ? 1 : mode === "mixed-partial" ? 6 : 12
          selection.setBaseAndExtent(
            backward ? end : start,
            backward ? b : a,
            backward ? start : end,
            backward ? a : b,
          )
        },
        { mode, backward },
      )
      await page.waitForTimeout(60)
      const { html, payload } = await copy()
      assert(
        !html.includes("Hidden") && !html.includes("Secret suffix"),
        `${mode}:${backward}:${html}`,
      )
      const lexical = payload.data["application/x-lexical-editor"]
      assert(!lexical.includes("Hidden") && !lexical.includes("Secret suffix"))

      if (mode === "mixed-partial") {
        assert(
          html.includes("prefix") &&
            html.includes("Rich c") &&
            !html.includes("callout</"),
        )
        assert(
          lexical.includes("Rich c") &&
            !lexical.includes('"text":"Rich callout"'),
        )
      } else {
        assert(
          !html.includes("data-editor-callout") &&
            !lexical.includes("editor-callout"),
        )
      }

      results.push({ name: mode, backward, status: "passed", html })
    }
  }

  for (const mode of ["text", "paragraph"]) {
    await load(`<p>Source prefix</p>${callout("<p><b>Rich callout</b></p>")}`)
    await page.locator("#source aside p").evaluate((paragraph, mode) => {
      const text = paragraph.querySelector("strong")?.firstChild
      const selection = document.getSelection()

      if (!text || !selection) throw new Error("Missing text")
      selection.setBaseAndExtent(
        mode === "text" ? text : paragraph,
        0,
        mode === "text" ? text : paragraph,
        mode === "text" ? 12 : 1,
      )
    }, mode)
    await page.waitForTimeout(60)
    const { html, payload } = await copy()
    assert(html.includes("data-editor-callout"))
    assert.equal(
      JSON.parse(payload.data["application/x-lexical-editor"]).nodes[0].type,
      "editor-callout",
    )
    results.push({ name: `whole-${mode}`, status: "passed", html })
  }

  await load(
    `<p>Source prefix</p>${callout("<p><b>Rich callout</b></p><p>Second</p>")}<p>Secret suffix</p>`,
  )
  await selectWhole()
  await page.keyboard.press("Control+x")

  const cutData = await page.evaluate(() =>
    window.fixture.clipboardEvents.at(-1),
  )

  assert(
    cutData.html.includes("data-editor-callout") &&
      cutData.html.includes("Second"),
  )

  const cutNode = JSON.parse(cutData.lexical).nodes.find(
    (node) => node.type === "editor-callout",
  )

  assert.equal(cutNode.children.length, 2)

  await expect(page.locator("#source aside")).toHaveCount(0)
  await expect(page.locator("#source")).toContainText("Source prefix")
  await expect(page.locator("#source")).toContainText("Secret suffix")
  await page.keyboard.press("Control+z")
  await expect(page.locator("#source aside")).toContainText("Second")
  await page.keyboard.press("Control+y")
  await expect(page.locator("#source aside")).toHaveCount(0)
  results.push({ name: "cut-undo-redo", status: "passed" })

  for (const kind of ["partial", "mixed"]) {
    await load(
      `<p>Source prefix</p>${callout("<p><b>Rich callout</b></p><p>Hidden</p>")}<p>Secret suffix</p>`,
    )
    await page.locator("#source").evaluate((root, kind) => {
      const strong = root.querySelector("strong")?.firstChild
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
      const first = walker.nextNode()
      let last = first

      for (let node = walker.nextNode(); node; node = walker.nextNode())
        last = node
      const selection = document.getSelection()

      if (!strong || !first || !last || !selection)
        throw new Error("Missing cut boundary")
      selection.setBaseAndExtent(
        kind === "partial" ? strong : first,
        kind === "partial" ? 1 : 7,
        kind === "partial" ? strong : last,
        6,
      )
    }, kind)
    await page.waitForTimeout(60)
    await page.keyboard.press("Control+x")

    if (kind === "partial") {
      await expect(page.locator("#source aside")).toContainText("Rallout")
      await expect(page.locator("#source aside")).toContainText("Hidden")
    } else {
      await expect(page.locator("#source aside")).toHaveCount(0)
      await expect(page.locator("#source")).toContainText("Source")
      await expect(page.locator("#source")).toContainText("suffix")
    }

    await page.keyboard.press("Control+z")
    await expect(page.locator("#source aside")).toContainText("Rich callout")
    await expect(page.locator("#source aside")).toContainText("Hidden")
    results.push({ name: `${kind}-cut-undo`, status: "passed" })
  }

  await load(`<p>Source prefix</p>${callout("<p><b>Rich callout</b></p>")}`)
  await page.evaluate(() => {
    window.fixture.source.setEditable(false)
    document.getElementById("source").contentEditable = "false"
  })
  await selectWhole()
  const readonlyBefore = await page.locator("#source").innerHTML()
  const readonlyCopy = await copy()
  assert(readonlyCopy.html.includes("data-editor-callout"))
  await page.keyboard.press("Control+x")
  assert.equal(await page.locator("#source").innerHTML(), readonlyBefore)
  results.push({ name: "readonly-copy-cut", status: "passed" })
  assert.deepEqual(errors, [])
  assert.deepEqual(
    results.flatMap(({ name, backward, failure, status }) =>
      status === "passed" ? [] : [{ name, backward, failure }],
    ),
    [],
  )
} finally {
  try {
    await browser.close()
  } finally {
    await server.stop(true)

    const report = new URL(
      "../../test-results/editor-callout-clipboard/report.json",
      import.meta.url,
    )

    await mkdir(new URL(".", report), { recursive: true })
    await writeFile(report, JSON.stringify({ results, errors }, null, 2))
  }
}

console.info(`${results.length} clipboard scenarios passed`)
