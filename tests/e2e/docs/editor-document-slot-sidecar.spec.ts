import type { Page, TestInfo } from "@playwright/test"
import type { SlotFixture } from "@workspace/tests/e2e/fixtures/slot-sidecar/fixture"

import AxeBuilder from "@axe-core/playwright"
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

const payloadSchema = z.object({
  version: z.literal(1),
  root: z.unknown(),
  slots: z.array(
    z.object({
      owner: z.array(z.tuple([z.string(), z.union([z.string(), z.number()])])),
      name: z.string(),
      value: z.unknown(),
    }),
  ),
})

async function openFixture(page: Page, info: TestInfo) {
  const bundle = info.outputPath("slot-sidecar-fixture.js")
  await execute("bun", ["tests/e2e/fixtures/slot-sidecar/bundle.ts", bundle], {
    cwd: process.cwd(),
    maxBuffer: 10 * 1024 * 1024,
  })
  const script = await readFile(bundle, "utf8")
  await page.route("**/__slot-sidecar__/fixture.js", (route) =>
    route.fulfill({ contentType: "text/javascript", body: script }),
  )
  await page.route("**/__slot-sidecar__/", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: '<!doctype html><html lang="en"><head><title>Slot fixture</title></head><body><main><h1>Slot fixture</h1><div id="editable" role="textbox" aria-label="Editor" aria-multiline="true"></div><div id="static"></div></main><script src="/__slot-sidecar__/fixture.js"></script></body></html>',
    }),
  )
  await page.goto("/__slot-sidecar__/")
  await expect(page.getByRole("textbox", { name: "Editor" })).toBeVisible()
  await page.waitForFunction(() => Boolean(window.slotFixture))
}

async function selectHost(page: Page, backward = false) {
  const editor = page.getByRole("textbox", { name: "Editor" })
  await editor.getByText("Host paragraph", { exact: true }).click()
  await page.keyboard.press("Home")

  if (backward) {
    for (let i = 0; i < 3; i++) await page.keyboard.press("ArrowRight")
  }

  for (let i = 0; i < 3; i++)
    await page.keyboard.press(backward ? "Shift+ArrowLeft" : "Shift+ArrowRight")
  await expect
    .poll(() => page.evaluate(() => window.slotFixture.snapshot().domSelection))
    .toBe("Hos")
  const state = await page.evaluate(() => window.slotFixture.snapshot())
  expect(state.selection).not.toBeNull()
  expect(state.selection?.backward).toBe(backward)

  return state
}

function decode(source: string) {
  const match = source.match(
    /<div data-editor-document-sidecar="1" hidden>([A-Za-z0-9_-]+)<\/div>/,
  )

  if (!match?.[1]) throw new Error("Missing sidecar")
  const json = Buffer.from(match[1], "base64url").toString("utf8")

  return {
    encoded: match[1],
    json,
    payload: payloadSchema.parse(JSON.parse(json)),
  }
}

function withPayload(source: string, json: string) {
  const { encoded } = decode(source)

  return source.replace(encoded, Buffer.from(json).toString("base64url"))
}

const expectedOwners = [
  { owner: [["child", 0]], name: "contents" },
  {
    owner: [
      ["child", 0],
      ["slot", "contents"],
    ],
    name: "note",
  },
  { owner: [["child", 0]], name: "note" },
  {
    owner: [
      ["child", 0],
      ["slot", "note"],
    ],
    name: "note",
  },
  {
    owner: [
      ["child", 1],
      ["child", 0],
      ["child", 0],
    ],
    name: "note",
  },
  {
    owner: [
      ["child", 1],
      ["child", 0],
    ],
    name: "note",
  },
  { owner: [["child", 1]], name: "note" },
  { owner: [["child", 2]], name: "note" },
  { owner: [["child", 3]], name: "note" },
  { owner: [], name: "note" },
]

for (const format of ["html", "markdown"] as const) {
  test(`${format} round trip preserves native slot paths and selection`, async ({
    page,
  }, info) => {
    await openFixture(page, info)
    const before = await selectHost(page)

    const source = await page.evaluate(
      (value) => window.slotFixture.export(value),
      format,
    )

    await info.attach(`portable.${format === "html" ? "html" : "md"}`, {
      body: source,
      contentType: format === "html" ? "text/html" : "text/markdown",
    })
    await info.attach("native.json", {
      body: JSON.stringify(before.document, null, 2),
      contentType: "application/json",
    })
    expect(
      decode(source).payload.slots.map(({ owner, name }) => ({ owner, name })),
    ).toEqual(expectedOwners)

    if (format === "markdown") expect(source).toMatch(/^[^\r\n]+\n$/)
    expect(
      await page.evaluate(
        ([text, kind]) => window.slotFixture.parse(text, kind),
        [source, format] as const,
      ),
    ).toEqual(before.document)
    const equivalent = source.replace("Host paragraph", "H&#111;st paragraph")
    expect(equivalent).not.toBe(source)
    expect(
      await page.evaluate(
        ([text, kind]) => window.slotFixture.parse(text, kind),
        [equivalent, format] as const,
      ),
    ).toEqual(before.document)
    expect(await page.evaluate(() => window.slotFixture.snapshot())).toEqual(
      before,
    )
    await page.evaluate(
      ([text, kind]) => window.slotFixture.import(text, kind),
      [source, format] as const,
    )
    expect(
      (await page.evaluate(() => window.slotFixture.snapshot())).document,
    ).toEqual(before.document)
  })
}

test("rejects hostile envelopes without changing native document or selection", async ({
  page,
}, info) => {
  await openFixture(page, info)
  const before = await selectHost(page, true)

  for (const format of ["html", "markdown"] as const) {
    const source = await page.evaluate(
      (kind) => window.slotFixture.export(kind),
      format,
    )

    const { payload, json, encoded } = decode(source)

    const duplicate = {
      ...payload,
      slots: [...payload.slots, payload.slots[0]],
    }

    const reversed = { ...payload, slots: [...payload.slots].reverse() }

    const missingOwner = {
      ...payload,
      slots: payload.slots.map((slot, index) =>
        index === 0 ? { ...slot, owner: [["child", 9999]] } : slot,
      ),
    }

    const cases = [
      source.replace(
        'data-editor-document-slots="1"',
        'data-editor-document-slots="2"',
      ),
      `<!--outside-->${source}`,
      source.replace(
        'data-editor-document-body="1"',
        'data-editor-document-body="1" data-editor-document-body="1"',
      ),
      source.replace("Host paragraph", "Changed paragraph"),
      source.replace(encoded, `${encoded}=`),
      source.replace(encoded, "_w"),
      source.replace(encoded, "a"),
      source.replace(
        'data-editor-document-sidecar="1"',
        'data-editor-document-sidecar="1" data-extra="1"',
      ),
      withPayload(source, JSON.stringify(duplicate)),
      withPayload(source, JSON.stringify(reversed)),
      withPayload(source, JSON.stringify(missingOwner)),
      withPayload(
        source,
        JSON.stringify({ ...payload, slots: payload.slots.slice(1) }),
      ),
      withPayload(
        source,
        JSON.stringify({
          ...payload,
          slots: payload.slots.map((slot, index) =>
            index === 0 ? { ...slot, owner: [["child", "0"]] } : slot,
          ),
        }),
      ),
      withPayload(
        source,
        JSON.stringify({
          ...payload,
          slots: payload.slots.map((slot, index) =>
            index === 0 ? { ...slot, name: "constructor" } : slot,
          ),
        }),
      ),
      withPayload(
        source,
        JSON.stringify({
          ...payload,
          slots: payload.slots.map((slot, index) =>
            index === 0
              ? {
                  ...slot,
                  value: { type: "text", version: 1, text: "not a block" },
                }
              : slot,
          ),
        }),
      ),
      withPayload(
        source,
        json.replace('"version":1', '"version":1,"\\u0076ersion":1'),
      ),
      source.replace(
        'data-editor-document-body="1">',
        'data-editor-document-body="1"><div data-editor-slot="note"></div>',
      ),
      `${source}${"x".repeat(1_048_577)}`,
    ]

    for (const [index, invalid] of cases.entries()) {
      expect(invalid, `${format} mutation ${index}`).not.toBe(source)

      const result = await page.evaluate(
        ([text, kind]) => {
          try {
            window.slotFixture.import(text, kind)

            return "accepted"
          } catch (error) {
            return error instanceof Error ? error.name : "error"
          }
        },
        [invalid, format] as const,
      )

      expect(result, `${format} invalid case ${index}`).not.toBe("accepted")
      expect(
        await page.evaluate(() => window.slotFixture.snapshot()),
        `${format} invalid case ${index}`,
      ).toEqual(before)
    }
  }
})

test("legacy direct wrappers keep their owners", async ({ page }) => {
  await openFixture(page, test.info())

  const legacy =
    '<p>Host</p><div data-editor-slot="note"><p>Root</p></div><blockquote><p>Quote</p><div data-editor-slot="note"><p>Nested</p></div></blockquote>'

  const result = await page.evaluate((html) => {
    window.slotFixture.import(html, "html")

    return window.slotFixture.snapshot().document
  }, legacy)

  const schema = z.object({
    root: z.object({
      $slots: z.object({ note: z.unknown() }),
      children: z.array(
        z.object({ $slots: z.object({ note: z.unknown() }).optional() }),
      ),
    }),
  })

  const parsed = schema.parse(result)
  expect(parsed.root.$slots.note).toBeDefined()
  expect(parsed.root.children[1]?.$slots?.note).toBeDefined()
  const portable = await page.evaluate(() => window.slotFixture.export("html"))
  expect(
    await page.evaluate(
      (html) => window.slotFixture.parse(html, "html"),
      portable,
    ),
  ).toEqual(result)
})

test("read-only and native undo preserve document", async ({ page }, info) => {
  await openFixture(page, info)
  const initial = await selectHost(page)
  const html = await page.evaluate(() => window.slotFixture.export("html"))
  await page.evaluate(() => window.slotFixture.editable(false))

  const beforeReadOnly = await page.evaluate(() =>
    window.slotFixture.snapshot(),
  )

  const rejected = await page.evaluate((source) => {
    try {
      window.slotFixture.import(source, "html")

      return false
    } catch {
      return true
    }
  }, html)

  expect(rejected).toBe(true)
  expect(await page.evaluate(() => window.slotFixture.snapshot())).toEqual(
    beforeReadOnly,
  )
  await page.getByRole("textbox", { name: "Editor" }).focus()
  await page.keyboard.type("Read-only input")
  expect(
    (await page.evaluate(() => window.slotFixture.snapshot())).document,
  ).toEqual(beforeReadOnly.document)
  await page.evaluate(() => window.slotFixture.editable(true))
  await selectHost(page)
  await page.keyboard.type("Edit")
  await expect(page.getByRole("textbox", { name: "Editor" })).toContainText(
    "Edit",
  )
  await page.keyboard.press("Control+z")
  await expect
    .poll(
      async () =>
        (await page.evaluate(() => window.slotFixture.snapshot())).document,
    )
    .toEqual(initial.document)
})

test("undo restores slots after a successful document replacement", async ({
  page,
}, info) => {
  await openFixture(page, info)
  const before = await selectHost(page)
  await page.evaluate(() =>
    window.slotFixture.import("Replacement", "markdown"),
  )
  const editor = page.getByRole("textbox", { name: "Editor" })
  await expect(editor).toContainText("Replacement")
  await editor.focus()
  await page.keyboard.press("Control+z")
  await expect
    .poll(
      async () =>
        (await page.evaluate(() => window.slotFixture.snapshot())).document,
    )
    .toEqual(before.document)
})

test("static projections keep logical links unique in two instances @a11y", async ({
  page,
}, info) => {
  await openFixture(page, info)
  const html = await page.evaluate(() => window.slotFixture.export("html"))
  const standalone = await page.evaluate(() => window.slotFixture.standalone())
  await info.attach("portable.html", { body: html, contentType: "text/html" })
  await info.attach("standalone.html", {
    body: standalone,
    contentType: "text/html",
  })
  expect(standalone).not.toContain("data-editor-document-sidecar")

  const standaloneLinks = await page.evaluate((markup) => {
    const document = new DOMParser().parseFromString(markup, "text/html")

    return [...document.querySelectorAll('nav a[href^="#"]')].map((link) => {
      const href = link.getAttribute("href") ?? ""

      return {
        text: link.textContent,
        targets: document.querySelectorAll(
          `[id=${JSON.stringify(href.slice(1))}]`,
        ).length,
      }
    })
  }, standalone)

  expect(standaloneLinks.length).toBeGreaterThan(0)
  expect(standaloneLinks.every((link) => link.targets === 1)).toBe(true)
  await page.evaluate((source) => window.slotFixture.renderStatic(source), html)

  const expected = [
    "Nested TOC heading",
    "Nested heading",
    "Cell heading",
    "TOC heading",
    "Math heading",
    "Final heading",
    "Root heading",
  ]

  for (const name of ["First document", "Second document"]) {
    const region = page.getByRole("region", { name, exact: true })
    await expect(region).toBeVisible()
    await expect(region.locator("[data-editor-document-sidecar]")).toHaveCount(
      0,
    )
    await expect(
      region.getByRole("region", { name: "Slot note on root", exact: true }),
    ).toBeVisible()
    await expect(
      region.locator("p section, table section, nav section"),
    ).toHaveCount(0)

    for (const nav of await region.getByRole("navigation").all()) {
      await expect(nav.getByRole("link")).toHaveText(expected)

      for (const link of await nav.getByRole("link").all()) {
        const href = await link.getAttribute("href")
        expect(href).toMatch(/^#(?:first|second)--/)
        await expect(
          page.locator(`[id=${JSON.stringify(href?.slice(1))}]`),
        ).toHaveCount(1)
        await link.click()
        await expect(page).toHaveURL(new RegExp(`${href}$`))
      }
    }

    await expect(region.getByRole("navigation")).not.toHaveCount(0)
  }

  const report = await new AxeBuilder({ page }).analyze()
  await info.attach("axe.json", {
    body: JSON.stringify(report, null, 2),
    contentType: "application/json",
  })
  expect(report.violations).toEqual([])
  await page.screenshot({
    path: info.outputPath("slot-projection.png"),
    fullPage: true,
    scale: "css",
  })
})
