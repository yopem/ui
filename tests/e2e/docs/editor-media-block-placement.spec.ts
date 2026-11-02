import type { Locator, Page } from "@playwright/test"

import { expect, test } from "@playwright/test"
import { execFile } from "node:child_process"
import { readFile, writeFile } from "node:fs/promises"
import { resolve } from "node:path"
import { promisify } from "node:util"
import { z } from "zod"

const text = (value: string, format = 0) => ({
  type: "text",
  version: 1,
  detail: 0,
  format,
  mode: "normal",
  style: "",
  text: value,
})

const element = (
  type: string,
  children: object[],
  extra: Record<string, string | number | number[] | null> = {},
) => ({
  type,
  version: 1,
  direction: null,
  format: "",
  indent: 0,
  children,
  ...extra,
})

const paragraph = (value: string) =>
  element("paragraph", [text(value)], { textFormat: 0, textStyle: "" })

const blank = element("paragraph", [], { textFormat: 0, textStyle: "" })

const heading = element("heading", [text("Heading target", 1)], { tag: "h2" })

const nestedList = element(
  "list",
  [
    element("listitem", [text("Parent item")], { value: 4 }),
    element(
      "listitem",
      [
        element(
          "list",
          [
            element("listitem", [text("Nested target")], { value: 1 }),
            element("listitem", [text("Nested sibling")], { value: 2 }),
          ],
          { listType: "bullet", start: 1, tag: "ul" },
        ),
      ],
      { value: 5 },
    ),
    element("listitem", [text("Last item")], { value: 5 }),
  ],
  { listType: "number", start: 4, tag: "ol" },
)

const table = element(
  "table",
  [
    element(
      "tablerow",
      [
        element(
          "tablecell",
          [paragraph("Cell target"), paragraph("Cell sibling")],
          {
            headerState: 0,
            colSpan: 2,
            rowSpan: 1,
            backgroundColor: null,
            width: 240,
          },
        ),
      ],
      { height: 48 },
    ),
  ],
  { colWidths: [120, 120] },
)

const quote = element("quote", [text("Quote target")])

const cases = [
  {
    name: "heading",
    node: heading,
    target: "Heading target",
    selected: "Heading",
    index: 1,
  },
  {
    name: "nested list",
    node: nestedList,
    target: "Nested target",
    selected: "Nested",
    index: 1,
  },
  {
    name: "table cell",
    node: table,
    target: "Cell target",
    selected: "Cell",
    index: 1,
  },
  {
    name: "quote",
    node: quote,
    target: "Quote target",
    selected: "Quote",
    index: 1,
  },
] as const

const documentSchema = z.object({
  root: z.looseObject({ children: z.array(z.unknown()) }),
})

async function openFixture(page: Page, output: string) {
  await page.goto("/editor/media-insert-control")

  const styles = await page
    .locator('link[rel="stylesheet"]')
    .evaluateAll((links) =>
      links
        .map((link) => (link instanceof HTMLLinkElement ? link.href : ""))
        .filter(Boolean),
    )

  const fixtureDirectory = resolve("tests/e2e/fixtures/media")
  const bundler = await readFile(resolve(fixtureDirectory, "bundle.ts"), "utf8")

  const fixtureHook = `
    if (code === "KeyQ") {
      const points = JSON.parse(document.documentElement.getAttribute("data-placement-points") ?? "null")
      if (!points) return false
      editor.update(() => {
        const root = $getRoot()
        const text = root.getAllTextNodes()[0]
        const selection = $createRangeSelection()
        selection.anchor.set(points.anchorText ? text.getKey() : root.getKey(), points.anchor, points.anchorText ? "text" : "element")
        selection.focus.set(points.focusText ? text.getKey() : root.getKey(), points.focus, points.focusText ? "text" : "element")
        $setSelection(selection)
      }, { discrete: true, tag: SKIP_DOM_SELECTION_TAG })
      if (points.anchorText || points.focusText) {
        editor.getEditorState().read(() => {
          const root = $getRoot()
          const text = root.getAllTextNodes()[0]
          const parent = text.getParent()
          const selection = $getSelection()
          if (!$isRangeSelection(selection) || !parent) throw new Error("Missing mixed selection")
          const backward = selection.isBackward()
          const end = backward ? selection.anchor : selection.focus
          document.documentElement.setAttribute("data-placement-mixed", JSON.stringify({
            text: { key: text.getKey(), type: text.getType(), content: text.getTextContent(), parentKey: text.getParent()?.getKey() },
            parent: { key: parent.getKey(), type: parent.getType(), parentKey: parent.getParent()?.getKey(), index: parent.getIndexWithinParent() },
            backward,
            anchor: { key: selection.anchor.key, type: selection.anchor.type, offset: selection.anchor.offset },
            focus: { key: selection.focus.key, type: selection.focus.type, offset: selection.focus.offset },
            end: { key: end.key, type: end.type, offset: end.offset },
          }))
        })
      }
      return true
    }
  `

  const instrumented = bundler
    .replaceAll("import.meta.dirname", JSON.stringify(fixtureDirectory))
    .replace(
      'const source = await readFile(path, "utf8")',
      `let source = await readFile(path, "utf8")
       if (path === ${JSON.stringify(resolve(fixtureDirectory, "fixture.tsx"))}) {
         source = source.replace("  $getRoot,", "  $createRangeSelection,\\n  $getRoot,")
         source = source.replace('    if (code === "KeyJ") {', ${JSON.stringify(fixtureHook)} + '    if (code === "KeyJ") {')
       }`,
    )

  const temporaryBundler = `${output}.ts`
  await writeFile(temporaryBundler, instrumented)
  await promisify(execFile)("bun", [temporaryBundler, output])
  const script = await readFile(output, "utf8")
  await page.route("**/__tests__/placement.js", (route) =>
    route.fulfill({ contentType: "text/javascript", body: script }),
  )
  await page.route("**/__tests__/placement", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: `<!doctype html><html lang="en"><head>${styles.map((href) => `<link rel="stylesheet" href="${href}">`).join("")}</head><body><main id="root"></main><script src="/__tests__/placement.js"></script></body></html>`,
    }),
  )
  await page.goto("/__tests__/placement")
  await expect(
    page.getByRole("textbox", { name: "Media content" }),
  ).toBeVisible()
}

async function captureState(page: Page, focus: Locator) {
  const check = page.getByLabel("Selection check")
  const previous = Number(await check.getAttribute("data-state-id"))
  await expect(focus).toBeFocused()
  await focus.press("Control+Alt+j")
  await expect
    .poll(async () => Number(await check.getAttribute("data-state-id")))
    .toBeGreaterThan(previous)

  const state = z
    .object({ document: documentSchema, selection: z.unknown() })
    .parse(JSON.parse((await check.getAttribute("data-state")) ?? "null"))

  return state
}

async function setLexicalPoints(
  editor: Locator,
  points: {
    anchor: number
    focus: number
    anchorText?: boolean
    focusText?: boolean
  },
) {
  await editor.evaluate((root, value) => {
    root.ownerDocument.documentElement.setAttribute(
      "data-placement-points",
      JSON.stringify(value),
    )
  }, points)
  await editor.press("Control+Alt+q")
}

async function snapshot(page: Page, focus: Locator) {
  return (await captureState(page, focus)).document
}

async function selectWord(
  page: Page,
  editor: Locator,
  target: string,
  word: string,
  backward: boolean,
) {
  await editor.getByText(target, { exact: true }).click()
  await editor.press("Home")

  if (backward) for (const _ of word) await editor.press("ArrowRight")

  for (const _ of word)
    await editor.press(backward ? "Shift+ArrowLeft" : "Shift+ArrowRight")
  await expect
    .poll(() => page.evaluate(() => document.getSelection()?.toString()))
    .toBe(word)

  const points = await page.evaluate(() => {
    const selection = document.getSelection()

    return { anchor: selection?.anchorOffset, focus: selection?.focusOffset }
  })

  expect(points).toEqual(
    backward
      ? { anchor: word.length, focus: 0 }
      : { anchor: 0, focus: word.length },
  )
  await expect(editor).toBeFocused()
}

for (const entry of cases) {
  for (const backward of [false, true]) {
    for (const method of ["url", "upload"] as const) {
      test(`${entry.name} ${backward ? "backward" : "forward"} ${method} preserves the full tree and history`, async ({
        page,
      }, info) => {
        await openFixture(page, info.outputPath("placement-fixture.js"))

        const input = {
          root: element("root", [
            paragraph("Before block"),
            entry.node,
            paragraph("Existing after"),
          ]),
        }

        await page.getByLabel("Fixture document").fill(JSON.stringify(input))
        await page
          .getByRole("button", { name: "Load fixture document" })
          .click()
        const editor = page.getByRole("textbox", { name: "Media content" })
        await selectWord(page, editor, entry.target, entry.selected, backward)
        const before = await snapshot(page, editor)
        expect(before.root.children).toHaveLength(3)

        if (entry.name === "nested list") {
          expect(before.root.children[1]).toMatchObject({
            type: "list",
            listType: "number",
            start: 4,
            children: [
              { type: "listitem", children: [{ text: "Parent item" }] },
              {
                type: "listitem",
                children: [
                  {
                    type: "list",
                    listType: "bullet",
                    children: [
                      {
                        type: "listitem",
                        children: [{ text: "Nested target" }],
                      },
                      {
                        type: "listitem",
                        children: [{ text: "Nested sibling" }],
                      },
                    ],
                  },
                ],
              },
              { type: "listitem", children: [{ text: "Last item" }] },
            ],
          })
        }

        if (entry.name === "table cell") {
          expect(before.root.children[1]).toMatchObject({
            type: "table",
            colWidths: [120, 120],
            children: [
              {
                type: "tablerow",
                height: 48,
                children: [
                  { type: "tablecell", colSpan: 2, rowSpan: 1, width: 240 },
                ],
              },
            ],
          })
        }

        await page
          .getByRole("button", { name: "Insert file", exact: true })
          .click()
        const dialog = page.getByRole("dialog", { name: "Insert file" })

        const url =
          method === "url"
            ? "https://media.test/placed.txt"
            : "https://media.test/upload/A-1.txt"

        if (method === "url") {
          await dialog.getByLabel("Media URL").fill(url)
          await dialog.getByLabel("Media URL").press("Enter")
        } else {
          const chooser = page.waitForEvent("filechooser")
          await dialog.getByLabel("Upload media").click()
          await (
            await chooser
          ).setFiles({
            name: "upload-fixture.txt",
            mimeType: "text/plain",
            buffer: Buffer.from("\uFEFFbounded upload fixture\n"),
          })
          await dialog.getByLabel("Media URL").focus()
          await dialog.getByLabel("Media URL").press("Control+Alt+h")
          await expect(
            dialog.getByLabel("Upload host evidence"),
          ).toHaveAttribute("data-pending", "true")
          await dialog.getByLabel("Media URL").press("Control+Alt+o")
        }

        await expect(dialog).toHaveCount(0)
        await expect(editor.locator(`a[href="${url}"]`)).toHaveCount(1)
        await expect(editor).toBeFocused()
        const after = await snapshot(page, editor)

        const media = {
          type: "yopem-media",
          version: 1,
          media: {
            kind: "file",
            url,
            alt: "",
            caption: "",
            name: method === "upload" ? "upload-fixture.txt" : "File",
            width: 320,
            alignment: "start",
          },
        }

        const expected = {
          root: {
            ...before.root,
            children: [
              ...before.root.children.slice(0, entry.index + 1),
              media,
              blank,
              ...before.root.children.slice(entry.index + 1),
            ],
          },
        }

        expect(after).toEqual(expected)
        await expect(page.getByLabel("Selection check")).toHaveAttribute(
          "data-selected-media",
          "true",
        )
        await editor.press("ControlOrMeta+z")
        expect(await snapshot(page, editor)).toEqual(before)
        await editor.press("ControlOrMeta+Shift+z")
        expect(await snapshot(page, editor)).toEqual(expected)
        await info.attach("placement-documents", {
          body: JSON.stringify({ before, after, expected }),
          contentType: "application/json",
        })
      })
    }
  }
}

test("cancelled dialog leaves the complete document unchanged", async ({
  page,
}, info) => {
  await openFixture(page, info.outputPath("placement-fixture.js"))
  await page.getByLabel("Fixture document").fill(
    JSON.stringify({
      root: element("root", [nestedList, paragraph("Existing after")]),
    }),
  )
  await page.getByRole("button", { name: "Load fixture document" }).click()
  const editor = page.getByRole("textbox", { name: "Media content" })
  await selectWord(page, editor, "Nested target", "Nested", true)
  const before = await snapshot(page, editor)
  await page.getByRole("button", { name: "Insert file", exact: true }).click()
  await page
    .getByRole("dialog", { name: "Insert file" })
    .getByLabel("Media URL")
    .press("Escape")
  await expect(editor).toBeFocused()
  expect(await snapshot(page, editor)).toEqual(before)
  await info.attach("cancelled-document", {
    body: JSON.stringify(before),
    contentType: "application/json",
  })
})

for (const backward of [false, true]) {
  test(`cross-block ${backward ? "backward" : "forward"} selection uses ordered end`, async ({
    page,
  }, info) => {
    await openFixture(page, info.outputPath("placement-fixture.js"))

    const initial = {
      root: element("root", [
        paragraph("Alpha"),
        heading,
        paragraph("Existing after"),
      ]),
    }

    await page.getByLabel("Fixture document").fill(JSON.stringify(initial))
    await page.getByRole("button", { name: "Load fixture document" }).click()
    const editor = page.getByRole("textbox", { name: "Media content" })

    if (backward) {
      await editor.getByText("Heading target", { exact: true }).click()
      await editor.press("Home")

      for (let i = 0; i < 3; i++) await editor.press("ArrowRight")

      for (let i = 0; i < 5; i++) await editor.press("Shift+ArrowLeft")
    } else {
      await editor.getByText("Alpha", { exact: true }).click()
      await editor.press("End")
      await editor.press("ArrowLeft")

      for (let i = 0; i < 5; i++) await editor.press("Shift+ArrowRight")
    }

    await expect
      .poll(() => page.evaluate(() => document.getSelection()?.toString()))
      .toContain("Hea")
    const before = await snapshot(page, editor)
    await page.getByRole("button", { name: "Insert file", exact: true }).click()
    const dialog = page.getByRole("dialog", { name: "Insert file" })
    await dialog.getByLabel("Media URL").fill("https://media.test/cross.txt")
    await dialog.getByLabel("Media URL").press("Enter")
    await expect(dialog).toHaveCount(0)
    await expect(editor).toBeFocused()

    const media = {
      type: "yopem-media",
      version: 1,
      media: {
        kind: "file",
        url: "https://media.test/cross.txt",
        alt: "",
        caption: "",
        name: "File",
        width: 320,
        alignment: "start",
      },
    }

    const expected = {
      root: {
        ...before.root,
        children: [
          before.root.children[0],
          before.root.children[1],
          media,
          blank,
          before.root.children[2],
        ],
      },
    }

    expect(await snapshot(page, editor)).toEqual(expected)
    await editor.press("ControlOrMeta+z")
    expect(await snapshot(page, editor)).toEqual(before)
    await editor.press("ControlOrMeta+Shift+z")
    expect(await snapshot(page, editor)).toEqual(expected)
    await info.attach("cross-block-documents", {
      body: JSON.stringify({ before, expected }),
      contentType: "application/json",
    })
  })
}

for (const boundary of [
  { name: "start", anchor: 0, focus: 0, gap: 0 },
  { name: "between siblings", anchor: 1, focus: 1, gap: 1 },
  { name: "end", anchor: 3, focus: 3, gap: 3 },
  { name: "forward range", anchor: 0, focus: 2, gap: 2 },
  { name: "backward range", anchor: 2, focus: 0, gap: 2 },
]) {
  for (const method of ["url", "upload"] as const) {
    test(`root ${boundary.name} ${method} preserves structure and history`, async ({
      page,
    }, info) => {
      await openFixture(page, info.outputPath("placement-fixture.js"))
      await page.getByLabel("Fixture document").fill(
        JSON.stringify({
          root: element("root", [paragraph("Before"), nestedList, table]),
        }),
      )
      await page.getByRole("button", { name: "Load fixture document" }).click()
      const editor = page.getByRole("textbox", { name: "Media content" })
      await editor.focus()

      const native = await editor.evaluate((root, points) => {
        const selection = root.ownerDocument.getSelection()

        if (!selection) throw new Error("Missing native selection")
        selection.setBaseAndExtent(root, points.anchor, root, points.focus)

        return {
          anchorRoot: selection.anchorNode === root,
          anchor: selection.anchorOffset,
          focusRoot: selection.focusNode === root,
          focus: selection.focusOffset,
        }
      }, boundary)

      expect(native).toEqual({
        anchorRoot: true,
        anchor: boundary.anchor,
        focusRoot: true,
        focus: boundary.focus,
      })
      await setLexicalPoints(editor, boundary)
      const before = await captureState(page, editor)
      expect(before.document.root.children).toHaveLength(3)
      expect(before.selection).toMatchObject({
        anchor: { key: "root", type: "element", offset: boundary.anchor },
        focus: { key: "root", type: "element", offset: boundary.focus },
      })
      await page
        .getByRole("button", { name: "Insert file", exact: true })
        .click()
      const dialog = page.getByRole("dialog", { name: "Insert file" })

      const url =
        method === "url"
          ? "https://media.test/root.txt"
          : "https://media.test/upload/A-1.txt"

      if (method === "url") {
        await dialog.getByLabel("Media URL").fill(url)
        await dialog.getByLabel("Media URL").press("Enter")
      } else {
        const chooser = page.waitForEvent("filechooser")
        await dialog.getByLabel("Upload media").click()
        await (
          await chooser
        ).setFiles({
          name: "upload-fixture.txt",
          mimeType: "text/plain",
          buffer: Buffer.from("\uFEFFbounded upload fixture\n"),
        })
        await dialog.getByLabel("Media URL").focus()
        await dialog.getByLabel("Media URL").press("Control+Alt+h")
        await expect(dialog.getByLabel("Upload host evidence")).toHaveAttribute(
          "data-calls",
          "1",
        )
        await expect(dialog.getByLabel("Upload host evidence")).toHaveAttribute(
          "data-pending",
          "true",
        )
        await dialog.getByLabel("Media URL").press("Control+Alt+o")
      }

      await expect(dialog).toHaveCount(0)
      await expect(editor).toBeFocused()
      const after = await captureState(page, editor)

      const expected = {
        root: {
          ...before.document.root,
          children: [
            ...before.document.root.children.slice(0, boundary.gap),
            {
              type: "yopem-media",
              version: 1,
              media: {
                kind: "file",
                url,
                alt: "",
                caption: "",
                name: method === "upload" ? "upload-fixture.txt" : "File",
                width: 320,
                alignment: "start",
              },
            },
            blank,
            ...before.document.root.children.slice(boundary.gap),
          ],
        },
      }

      expect(after.document).toEqual(expected)
      await expect(page.getByLabel("Selection check")).toHaveAttribute(
        "data-selected-media",
        "true",
      )
      await editor.press("ControlOrMeta+z")
      const undone = await captureState(page, editor)
      expect(undone.document).toEqual(before.document)
      await editor.press("ControlOrMeta+Shift+z")
      const redone = await captureState(page, editor)
      expect(redone.document).toEqual(expected)
      await info.attach("root-boundary-evidence", {
        body: JSON.stringify({
          boundary,
          native,
          before,
          after,
          undone,
          redone,
        }),
        contentType: "application/json",
      })
    })
  }
}

for (const backward of [false, true]) {
  test(`mixed ${backward ? "backward" : "forward"} range ends at root boundary`, async ({
    page,
  }, info) => {
    await openFixture(page, info.outputPath("placement-fixture.js"))
    await page.getByLabel("Fixture document").fill(
      JSON.stringify({
        root: element("root", [paragraph("Before"), nestedList, table]),
      }),
    )
    await page.getByRole("button", { name: "Load fixture document" }).click()
    const editor = page.getByRole("textbox", { name: "Media content" })
    await editor.focus()

    const native = await editor.evaluate((root, reverse) => {
      const selection = root.ownerDocument.getSelection()
      const paragraph = root.firstElementChild
      const span = paragraph?.firstElementChild
      const textNode = span?.firstChild

      if (
        !selection ||
        paragraph?.tagName !== "P" ||
        span?.getAttribute("data-lexical-text") !== "true" ||
        span.childNodes.length !== 1 ||
        !textNode ||
        textNode.nodeType !== Node.TEXT_NODE ||
        textNode.textContent !== "Before" ||
        textNode.textContent.length < 2 ||
        root.childNodes.length !== 3
      )
        throw new Error("Invalid native selection target")

      if (reverse) selection.setBaseAndExtent(root, 2, textNode, 2)
      else selection.setBaseAndExtent(textNode, 2, root, 2)

      const range = selection.getRangeAt(0)

      return {
        anchorRoot: selection.anchorNode === root,
        anchorText: selection.anchorNode === textNode,
        focusRoot: selection.focusNode === root,
        focusText: selection.focusNode === textNode,
        anchorOffset: selection.anchorOffset,
        focusOffset: selection.focusOffset,
        direction: selection.direction,
        startText: range.startContainer === textNode,
        startOffset: range.startOffset,
        endRoot: range.endContainer === root,
        endOffset: range.endOffset,
        target: textNode.textContent,
        text: selection.toString(),
      }
    }, backward)

    expect(native).toMatchObject({
      anchorRoot: backward,
      anchorText: !backward,
      focusRoot: !backward,
      focusText: backward,
      anchorOffset: 2,
      focusOffset: 2,
      direction: backward ? "backward" : "forward",
      startText: true,
      startOffset: 2,
      endRoot: true,
      endOffset: 2,
      target: "Before",
    })
    expect(native.text).toContain("fore")
    expect(native.text).toContain("Parent item")
    expect(native.text).toContain("Last item")

    await setLexicalPoints(editor, {
      anchor: 2,
      focus: 2,
      anchorText: !backward,
      focusText: backward,
    })
    const before = await captureState(page, editor)

    const mixed = z
      .object({
        text: z.object({
          key: z.string().min(1),
          type: z.string(),
          content: z.string(),
          parentKey: z.string(),
        }),
        parent: z.object({
          key: z.string().min(1),
          type: z.string(),
          parentKey: z.string(),
          index: z.number(),
        }),
        backward: z.boolean(),
        anchor: z.object({
          key: z.string(),
          type: z.string(),
          offset: z.number(),
        }),
        focus: z.object({
          key: z.string(),
          type: z.string(),
          offset: z.number(),
        }),
        end: z.object({
          key: z.string(),
          type: z.string(),
          offset: z.number(),
        }),
      })
      .parse(
        JSON.parse(
          (await page.locator("html").getAttribute("data-placement-mixed")) ??
            "null",
        ),
      )

    expect(mixed).toMatchObject({
      text: { type: "text", content: "Before" },
      parent: { type: "paragraph", parentKey: "root", index: 0 },
      backward,
      end: { key: "root", type: "element", offset: 2 },
    })
    expect(mixed.text.parentKey).toBe(mixed.parent.key)

    const textPoint = { key: mixed.text.key, type: "text", offset: 2 }
    const rootPoint = { key: "root", type: "element", offset: 2 }

    const points = backward
      ? { anchor: rootPoint, focus: textPoint }
      : { anchor: textPoint, focus: rootPoint }

    expect({ anchor: mixed.anchor, focus: mixed.focus }).toEqual(points)
    expect(before.selection).toMatchObject(points)
    expect(before.document.root.children).toHaveLength(3)
    expect(before.document.root.children[0]).toMatchObject(paragraph("Before"))
    expect(before.document.root.children[1]).toMatchObject({
      type: "list",
      listType: "number",
      children: [
        { type: "listitem", children: [{ text: "Parent item" }] },
        { type: "listitem", children: [{ type: "list" }] },
        { type: "listitem", children: [{ text: "Last item" }] },
      ],
    })
    expect(before.document.root.children[2]).toMatchObject({ type: "table" })

    const gap = 2
    expect(mixed.end.offset).toBe(gap)
    await page.getByRole("button", { name: "Insert file", exact: true }).click()
    const dialog = page.getByRole("dialog", { name: "Insert file" })
    await dialog.getByLabel("Media URL").fill("https://media.test/mixed.txt")
    await dialog.getByLabel("Media URL").press("Enter")
    await expect(dialog).toHaveCount(0)
    await expect(editor).toBeFocused()
    const after = await captureState(page, editor)

    const expected = {
      root: {
        ...before.document.root,
        children: [
          ...before.document.root.children.slice(0, gap),
          {
            type: "yopem-media",
            version: 1,
            media: {
              kind: "file",
              url: "https://media.test/mixed.txt",
              alt: "",
              caption: "",
              name: "File",
              width: 320,
              alignment: "start",
            },
          },
          blank,
          ...before.document.root.children.slice(gap),
        ],
      },
    }

    expect(after.document).toEqual(expected)
    await expect(page.getByLabel("Selection check")).toHaveAttribute(
      "data-selected-media",
      "true",
    )
    await editor.press("ControlOrMeta+z")
    const undone = await captureState(page, editor)
    expect(undone.document).toEqual(before.document)
    await editor.press("ControlOrMeta+Shift+z")
    const redone = await captureState(page, editor)
    expect(redone.document).toEqual(expected)
    await info.attach("mixed-boundary-evidence", {
      body: JSON.stringify({
        native,
        mixed,
        gap,
        before,
        after,
        undone,
        redone,
      }),
      contentType: "application/json",
    })
  })
}

for (const offset of [-1, 4]) {
  test(`invalid root offset ${offset} cannot start an upload`, async ({
    page,
  }, info) => {
    await openFixture(page, info.outputPath("placement-fixture.js"))
    await page.getByLabel("Fixture document").fill(
      JSON.stringify({
        root: element("root", [paragraph("Before"), nestedList, table]),
      }),
    )
    await page.getByRole("button", { name: "Load fixture document" }).click()
    const editor = page.getByRole("textbox", { name: "Media content" })
    await editor.focus()
    const before = await captureState(page, editor)
    await setLexicalPoints(editor, { anchor: offset, focus: offset })
    await page.getByRole("button", { name: "Insert file", exact: true }).click()
    const dialog = page.getByRole("dialog", { name: "Insert file" })
    await expect(dialog.getByLabel("Upload media")).toBeDisabled()
    await expect(
      dialog.getByRole("button", { name: "Insert", exact: true }),
    ).toBeDisabled()
    const input = dialog.getByLabel("Media URL")
    await input.focus()
    await input.press("Control+Alt+h")
    await expect(dialog.getByLabel("Upload host evidence")).toHaveAttribute(
      "data-calls",
      "0",
    )
    await input.press("Escape")
    await expect(dialog).toHaveCount(0)
    await editor.focus()
    await setLexicalPoints(editor, { anchor: 0, focus: 0 })
    const after = await captureState(page, editor)
    expect(after.document).toEqual(before.document)
    await info.attach("invalid-boundary-evidence", {
      body: JSON.stringify({ offset, before, after }),
      contentType: "application/json",
    })
  })
}

for (const guard of ["stale document", "read only"] as const) {
  test(`root boundary delayed upload rejects ${guard}`, async ({
    page,
  }, info) => {
    await openFixture(page, info.outputPath("placement-fixture.js"))
    await page.getByLabel("Fixture document").fill(
      JSON.stringify({
        root: element("root", [nestedList, table, paragraph("After")]),
      }),
    )
    await page.getByRole("button", { name: "Load fixture document" }).click()
    const editor = page.getByRole("textbox", { name: "Media content" })
    await editor.focus()
    await editor.evaluate((root) => {
      const selection = root.ownerDocument.getSelection()

      if (!selection) throw new Error("Missing native selection")
      selection.setBaseAndExtent(root, 1, root, 1)
    })
    await setLexicalPoints(editor, { anchor: 1, focus: 1 })
    const before = await captureState(page, editor)
    expect(before.selection).toMatchObject({
      anchor: { key: "root", type: "element", offset: 1 },
      focus: { key: "root", type: "element", offset: 1 },
    })
    await page.getByRole("button", { name: "Insert file", exact: true }).click()
    const dialog = page.getByRole("dialog", { name: "Insert file" })
    const chooser = page.waitForEvent("filechooser")
    await dialog.getByLabel("Upload media").click()
    await (
      await chooser
    ).setFiles({
      name: "upload-fixture.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("\uFEFFbounded upload fixture\n"),
    })
    const input = dialog.getByLabel("Media URL")
    await input.focus()
    await input.press("Control+Alt+h")
    const evidence = dialog.getByLabel("Upload host evidence")
    await expect(evidence).toHaveAttribute("data-calls", "1")
    await expect(evidence).toHaveAttribute("data-pending", "true")
    await input.press(
      guard === "stale document" ? "Control+Alt+r" : "Control+Alt+e",
    )
    await expect(evidence).toHaveAttribute("data-aborted", "true")
    const guarded = await captureState(page, input)

    if (guard === "read only") expect(guarded.document).toEqual(before.document)
    await input.press("Control+Alt+o")
    await expect(evidence).toHaveAttribute("data-result-id", "1")
    const after = await captureState(page, input)
    expect(after.document).toEqual(guarded.document)
    await expect(evidence).toHaveAttribute("data-calls", "1")
    await info.attach("root-boundary-guard-evidence", {
      body: JSON.stringify({ guard, before, guarded, after }),
      contentType: "application/json",
    })
  })
}

test("empty block is retained before inserted media", async ({
  page,
}, info) => {
  await openFixture(page, info.outputPath("placement-fixture.js"))
  await page.getByLabel("Fixture document").fill(
    JSON.stringify({
      root: element("root", [blank, paragraph("Existing after")]),
    }),
  )
  await page.getByRole("button", { name: "Load fixture document" }).click()
  const editor = page.getByRole("textbox", { name: "Media content" })
  await editor.locator("p").first().click()
  const before = await snapshot(page, editor)
  await page.getByRole("button", { name: "Insert file", exact: true }).click()
  const dialog = page.getByRole("dialog", { name: "Insert file" })
  await dialog.getByLabel("Media URL").fill("https://media.test/empty.txt")
  await dialog.getByLabel("Media URL").press("Enter")
  await expect(dialog).toHaveCount(0)
  await expect(editor).toBeFocused()

  const media = {
    type: "yopem-media",
    version: 1,
    media: {
      kind: "file",
      url: "https://media.test/empty.txt",
      alt: "",
      caption: "",
      name: "File",
      width: 320,
      alignment: "start",
    },
  }

  const expected = {
    root: {
      ...before.root,
      children: [
        before.root.children[0],
        media,
        blank,
        before.root.children[1],
      ],
    },
  }

  expect(await snapshot(page, editor)).toEqual(expected)
  await editor.press("ControlOrMeta+z")
  expect(await snapshot(page, editor)).toEqual(before)
  await editor.press("ControlOrMeta+Shift+z")
  expect(await snapshot(page, editor)).toEqual(expected)
  await info.attach("empty-block-documents", {
    body: JSON.stringify({ before, expected }),
    contentType: "application/json",
  })
})
