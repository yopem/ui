import type { Locator, Page, TestInfo } from "@playwright/test"

import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"
import { execFile } from "node:child_process"
import { mkdir, readFile, writeFile } from "node:fs/promises"
import { dirname, resolve } from "node:path"
import { promisify } from "node:util"
import { z } from "zod"

const fixturePath = "/__tests__/media-upload"

const fixtureName = "upload-fixture.txt"

const fixtureBytes = "\uFEFFbounded upload fixture\n"

async function openFixture(page: Page, direct = false) {
  const response = await page.goto("/editor/media-insert-control")
  expect(response?.ok()).toBe(true)

  const publicTrigger = page.getByRole("button", {
    name: "Insert file",
    exact: true,
    includeHidden: true,
  })

  await expect(publicTrigger).toBeVisible()

  const publicStyles = await page.evaluate(() => {
    const stylesheets = Array.from(
      document.querySelectorAll('link[rel="stylesheet"]'),
    )
      .map((link) => (link instanceof HTMLLinkElement ? link.href : ""))
      .filter((href) => {
        const url = new URL(href, location.href)

        return (
          url.origin === location.origin &&
          url.pathname.startsWith("/assets/") &&
          url.pathname.endsWith(".css")
        )
      })

    const loaded = Array.from(document.styleSheets).filter(
      (sheet) =>
        sheet.href &&
        stylesheets.includes(sheet.href) &&
        sheet.cssRules.length > 0,
    )

    const root = document.documentElement
    const computed = getComputedStyle(root)

    return {
      stylesheets,
      loaded: loaded.map((sheet) => sheet.href),
      className: root.className,
      theme: root.dataset.theme,
      background: computed.getPropertyValue("--background").trim(),
      primary: computed.getPropertyValue("--primary").trim(),
    }
  })

  expect(publicStyles.stylesheets.length).toBeGreaterThan(0)
  expect(publicStyles.loaded).toEqual(publicStyles.stylesheets)

  for (const href of publicStyles.stylesheets) {
    const stylesheet = await page.request.get(href)
    expect(stylesheet.ok()).toBe(true)
    expect(stylesheet.headers()["content-type"]).toContain("text/css")
    expect((await stylesheet.body()).length).toBeGreaterThan(0)
  }

  expect(publicStyles.background).not.toBe("")
  expect(publicStyles.primary).not.toBe("")
  expect(["light", "dark"]).toContain(publicStyles.theme)

  await publicTrigger.click()

  const publicInput = page
    .getByRole("dialog", { name: "Insert file", exact: true })
    .getByLabel("Media URL")

  await expect(publicInput).toBeVisible()
  await expect(publicTrigger).toBeAttached()
  await expect(publicTrigger).toHaveCSS("display", "flex")
  await expect(publicTrigger).toHaveCSS("min-height", "44px")
  await expect(publicInput).toHaveCSS("min-height", "44px")

  const triggerStyle = await publicTrigger.evaluate((element) => {
    const style = getComputedStyle(element)

    return {
      display: style.display,
      minHeight: style.minHeight,
      fontFamily: style.fontFamily,
    }
  })

  const inputStyle = await publicInput.evaluate((element) => {
    const style = getComputedStyle(element)

    return { minHeight: style.minHeight, fontFamily: style.fontFamily }
  })

  expect(inputStyle.minHeight).toBe("44px")
  const output = test.info().outputPath("media-upload-fixture.js")
  await mkdir(dirname(output), { recursive: true })
  await promisify(execFile)("bun", [
    resolve("tests/e2e/fixtures/media/bundle.ts"),
    output,
  ])
  const fixtureScript = await readFile(output, "utf8")

  const escapeAttribute = (value: string) =>
    value
      .replaceAll("&", "&amp;")
      .replaceAll('"', "&quot;")
      .replaceAll("<", "&lt;")

  const links = publicStyles.stylesheets
    .map((href) => `<link rel="stylesheet" href="${escapeAttribute(href)}">`)
    .join("")

  await page.route(`**${fixturePath}`, (route) =>
    route.fulfill({
      contentType: "text/html",
      body: `<!doctype html><html lang="en" class="${escapeAttribute(publicStyles.className)}" data-theme="${escapeAttribute(publicStyles.theme ?? "")}"><head><meta name="viewport" content="width=device-width, initial-scale=1"><title>Media upload fixture</title>${links}</head><body><main id="root"></main><script src="/__tests__/media-upload.js"></script></body></html>`,
    }),
  )
  await page.route("**/__tests__/media-upload.js", (route) =>
    route.fulfill({ contentType: "text/javascript", body: fixtureScript }),
  )
  const fixtureResponse = await page.goto(fixturePath)
  expect(fixtureResponse?.ok()).toBe(true)

  const fixtureStyles = await page.evaluate(() => {
    const sheets = Array.from(document.styleSheets)
      .filter((sheet) => sheet.href && sheet.cssRules.length > 0)
      .map((sheet) => sheet.href)

    const style = getComputedStyle(document.documentElement)

    return {
      sheets,
      background: style.getPropertyValue("--background").trim(),
      primary: style.getPropertyValue("--primary").trim(),
    }
  })

  expect(fixtureStyles.sheets).toEqual(publicStyles.stylesheets)
  expect(fixtureStyles.background).toBe(publicStyles.background)
  expect(fixtureStyles.primary).toBe(publicStyles.primary)

  const fixtureTrigger = page.getByRole("button", {
    name: "Insert file",
    exact: true,
  })

  await expect(fixtureTrigger).toBeVisible()
  await expect(fixtureTrigger).toHaveCSS("display", triggerStyle.display)
  await expect(fixtureTrigger).toHaveCSS("min-height", triggerStyle.minHeight)
  await expect(fixtureTrigger).toHaveCSS("font-family", triggerStyle.fontFamily)

  if (direct) return
  await fixtureTrigger.click()

  const fixtureInput = page
    .getByRole("dialog", { name: "Insert file", exact: true })
    .getByLabel("Media URL")

  await expect(fixtureInput).toHaveCSS("min-height", inputStyle.minHeight)
  await expect(fixtureInput).toHaveCSS("font-family", inputStyle.fontFamily)
  await fixtureInput.press("Escape")
  await expect(fixtureInput).toHaveCount(0)
}

const original = "Before selected after"

const structuredDocument = {
  root: {
    type: "root",
    version: 1,
    direction: null,
    format: "",
    indent: 0,
    children: [
      {
        type: "paragraph",
        version: 1,
        direction: null,
        format: "",
        indent: 0,
        textFormat: 0,
        textStyle: "",
        children: [
          {
            type: "text",
            version: 1,
            detail: 0,
            format: 1,
            mode: "normal",
            style: "",
            text: "Formatted heading",
          },
        ],
      },
      {
        type: "paragraph",
        version: 1,
        direction: null,
        format: "",
        indent: 0,
        textFormat: 0,
        textStyle: "",
        children: [
          {
            type: "text",
            version: 1,
            detail: 0,
            format: 0,
            mode: "normal",
            style: "",
            text: original,
          },
        ],
      },
    ],
  },
}

const selectedStructuredDocument = {
  ...structuredDocument,
  root: {
    ...structuredDocument.root,
    children: structuredDocument.root.children.map((paragraph, index) =>
      index === 0 ? { ...paragraph, textFormat: 1 } : paragraph,
    ),
  },
}

const structuredSnapshotSchema = z.looseObject({
  root: z.looseObject({
    children: z.array(
      z.looseObject({
        children: z.array(z.looseObject({ text: z.string() })),
      }),
    ),
  }),
})

interface RequestRecording {
  urls: string[]
  overflow: boolean
  externalControlExpected?: boolean
}

const recordings = new WeakMap<Page, RequestRecording>()

const externalControl = "https://media.test/upload-observation-control"

test.afterEach(async ({ page }, info) => {
  const recording = recordings.get(page)

  if (!recording) return
  await info.attach("upload-requests", {
    body: JSON.stringify(recording),
    contentType: "application/json",
  })
  expect(recording.overflow).toBe(false)

  if (recording.externalControlExpected)
    expect(
      recording.urls.filter((url) => url === externalControl),
    ).toHaveLength(1)

  expect(
    recording.urls.filter(
      (url) =>
        new URL(url).origin !== new URL(page.url()).origin &&
        !(recording.externalControlExpected && url === externalControl),
    ),
  ).toEqual([])
})

const selectionSchema = z.object({
  anchor: z.object({ key: z.string(), offset: z.number(), type: z.string() }),
  focus: z.object({ key: z.string(), offset: z.number(), type: z.string() }),
  text: z.string(),
})

async function captureState(check: Locator) {
  const schema = z.object({
    document: z.unknown(),
    selection: selectionSchema.nullable(),
  })

  return schema.parse(
    JSON.parse((await check.getAttribute("data-state")) ?? "null"),
  )
}

function captureBrowserSelection(page: Page) {
  return page.evaluate(() => {
    const selection = document.getSelection()

    if (!selection) return null

    function point(node: Node | null, offset: number) {
      if (!node) return null

      const path: number[] = []
      let current: Node | null = node

      while (current?.parentNode) {
        path.unshift(
          Array.prototype.indexOf.call(current.parentNode.childNodes, current),
        )
        current = current.parentNode
      }

      return { path, offset }
    }

    return {
      anchor: point(selection.anchorNode, selection.anchorOffset),
      focus: point(selection.focusNode, selection.focusOffset),
      text: selection.toString(),
      collapsed: selection.isCollapsed,
    }
  })
}

async function pressFixtureShortcut(target: Locator, key: string) {
  const page = target.page()
  const root = page.locator("html")

  const previous = z
    .object({ id: z.number() })
    .parse(
      JSON.parse(
        (await root.getAttribute("data-native-shortcut")) ?? '{"id":0}',
      ),
    )

  await expect(target).toBeFocused()
  expect(
    await target.evaluate(
      (element) =>
        Boolean(element.closest('section[aria-label="Media editor"]')) ||
        Boolean(element.closest('[role="dialog"]')),
    ),
  ).toBe(true)
  await target.press(`Control+Alt+${key}`)

  const event = z
    .object({
      id: z.number(),
      code: z.string(),
      trusted: z.boolean(),
      focused: z.boolean(),
    })
    .parse(
      JSON.parse((await root.getAttribute("data-native-shortcut")) ?? "null"),
    )

  expect(event.id).toBeGreaterThan(previous.id)
  expect(event).toMatchObject({
    code: `Key${key.toUpperCase()}`,
    trusted: true,
    focused: true,
  })
}

async function snapshotFromEditor(page: Page, check: Locator) {
  const previous = Number(await check.getAttribute("data-state-id"))
  const dialog = page.getByRole("dialog", { name: "Insert file", exact: true })

  if (await dialog.isVisible()) await dialog.getByLabel("Media URL").focus()
  await pressFixtureShortcut(page.locator(":focus"), "j")
  await expect
    .poll(async () => Number(await check.getAttribute("data-state-id")))
    .toBeGreaterThan(previous)
}

function uploadUrl(config: "A" | "B", id: number) {
  return `https://media.test/upload/${config}-${id}.txt`
}

async function prepareSelection(
  page: Page,
  structured = false,
  direct = false,
) {
  await page.route("**/*", (route) =>
    new URL(route.request().url()).hostname === "localhost"
      ? route.continue()
      : route.abort(),
  )
  await openFixture(page, direct)

  const recording: RequestRecording = { urls: [], overflow: false }

  recordings.set(page, recording)
  page.on("request", (request) => {
    if (recording.urls.length < 100) recording.urls.push(request.url())
    else recording.overflow = true
  })

  const editor = page.locator(
    'section[aria-label="Media editor"] [data-slot="editor-content"]',
  )

  await expect(editor).toHaveCount(1)
  await expect(
    page.getByRole("textbox", { name: "Media content", exact: true }),
  ).toBeVisible()

  if (structured) {
    await page.getByRole("button", { name: "Load structured document" }).click()
    await editor.locator("p").last().click()
  } else await editor.fill(original)

  await editor.press("Home")

  for (let index = 0; index < 7; index++) await editor.press("ArrowRight")

  for (let index = 0; index < 8; index++) await editor.press("Shift+ArrowRight")
  expect(await page.evaluate(() => document.getSelection()?.toString())).toBe(
    "selected",
  )
  let structuredBaseline: z.infer<typeof structuredSnapshotSchema> | undefined

  if (structured) {
    await expect(editor).toBeFocused()
    const check = page.locator('[aria-label="Selection check"]')
    await expect
      .poll(async () => {
        await snapshotFromEditor(page, check)

        return (await captureState(check)).document
      })
      .toEqual(selectedStructuredDocument)
    const baseline = await captureState(check)
    expect(baseline.selection?.text).toBe("selected")
    structuredBaseline = structuredSnapshotSchema.parse(baseline.document)
  }

  return { editor, structuredBaseline }
}

async function prepare(page: Page, structured = false) {
  const { editor, structuredBaseline } = await prepareSelection(
    page,
    structured,
  )

  await page.getByRole("button", { name: "Insert file", exact: true }).click()
  const dialog = page.getByRole("dialog", { name: "Insert file", exact: true })
  await expect(dialog).toBeVisible()

  const check = page.getByLabel("Selection check", { exact: true })

  const originalSelection = selectionSchema.parse(
    JSON.parse((await check.getAttribute("data-original-state")) ?? "null"),
  )

  expect(originalSelection.text).toBe("selected")

  if (structured)
    expect(originalSelection).toEqual((await captureState(check)).selection)

  await expect(
    dialog.getByRole("button", { name: "Insert", exact: true }),
  ).toBeEnabled()
  await expect(dialog.getByLabel("Upload media")).toBeEnabled()
  await shortcut(dialog, "h")
  await expect(dialog.getByLabel("Upload host evidence")).toBeVisible()

  return { editor, dialog, structuredBaseline }
}

async function chooseFile(page: Page, dialog: Locator, info: TestInfo) {
  const evidence = page.getByLabel("Upload host evidence").first()
  const previous = Number(await evidence.getAttribute("data-calls"))
  const path = info.outputPath(fixtureName)
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, fixtureBytes)
  const chooser = page.waitForEvent("filechooser")
  await dialog.getByLabel("Upload media").click()
  await (await chooser).setFiles(path)

  await expect(evidence).toHaveAttribute("data-calls", String(previous + 1))
  await expect(evidence).toHaveAttribute("data-same-file", "true")
  await expect(evidence).toHaveAttribute("data-file-name-match", "true")
  await expect(evidence).toHaveAttribute("data-file-bytes-match", "true")
  await expect(evidence).toHaveAttribute("data-file-own-name", "false")
}

async function shortcut(dialog: Locator, key: string) {
  const evidence = dialog.page().getByLabel("Upload host evidence").first()

  const id = ["o", "f", "i"].includes(key)
    ? await evidence.getAttribute("data-calls")
    : null

  const input = dialog.getByLabel("Media URL")
  await input.focus()
  await pressFixtureShortcut(input, key)

  if (id !== null) {
    await expect(evidence).toHaveAttribute("data-result-id", id)
    await expect(evidence).toHaveAttribute("data-file-unchanged", "true")
  }
}

async function cancelDeliveries(evidence: Locator) {
  return z
    .array(z.number())
    .parse(
      JSON.parse(
        (await evidence.getAttribute("data-cancel-event-ids")) ?? "null",
      ),
    )
}

async function expectSavedFile(page: Page, url: string) {
  await page.getByRole("button", { name: "Capture document JSON" }).click()
  const output = await page.getByLabel("Document JSON").textContent()

  const document = z
    .object({
      root: z.object({
        children: z.array(
          z.object({
            type: z.string(),
            children: z.optional(z.array(z.looseObject({ text: z.string() }))),
            media: z.optional(
              z.object({ kind: z.string(), url: z.string(), name: z.string() }),
            ),
          }),
        ),
      }),
    })
    .parse(JSON.parse(output ?? "null"))

  const media = document.root.children.filter(
    (node) => node.type === "yopem-media",
  )

  expect(media).toHaveLength(1)
  expect(media[0]?.media).toEqual({ kind: "file", url, name: fixtureName })
  expect(document.root.children.map((node) => node.type)).toEqual([
    "paragraph",
    "yopem-media",
    "paragraph",
  ])
  expect(document.root.children[0]?.children?.map((node) => node.text)).toEqual(
    [original],
  )
  expect(
    document.root.children
      .slice(2)
      .every((node) => node.children?.length === 0),
  ).toBe(true)
}

async function expectPlacedMedia(page: Page, editor: Locator, url: string) {
  const check = page.locator('[aria-label="Selection check"]')
  await expect(editor).toBeFocused()
  await snapshotFromEditor(page, check)
  await expect(check).toHaveAttribute("data-selected-media", "true")

  const document = (await captureState(check)).document

  const parsed = z
    .looseObject({
      root: z.looseObject({
        children: z.array(
          z.looseObject({
            type: z.string(),
            children: z.array(z.looseObject({ text: z.string() })).optional(),
            media: z
              .looseObject({ kind: z.string(), url: z.string() })
              .optional(),
          }),
        ),
      }),
    })
    .parse(document)

  expect(parsed.root.children.map((node) => node.type)).toEqual([
    "paragraph",
    "paragraph",
    "yopem-media",
    "paragraph",
  ])
  expect(parsed.root.children.slice(0, 2)).toEqual(
    selectedStructuredDocument.root.children,
  )
  expect(parsed.root.children[2]?.media).toMatchObject({ kind: "file", url })
  expect(parsed.root.children[3]?.children).toEqual([])
  await expect(editor).toBeFocused()

  return document
}

async function expectNoMedia(editor: Locator) {
  await expect(editor).toHaveCount(1)
  await expect(editor.locator('[data-slot="editor-media"]')).toHaveCount(0)
  await expect(editor).toHaveText(original)
}

async function selectNewNativeTarget(
  page: Page,
  editor: Locator,
  word: "Before" | "after" = "Before",
) {
  const paragraph = editor.locator("p").filter({ hasText: word }).first()
  await paragraph.scrollIntoViewIfNeeded()
  await paragraph.click()
  await expect(editor).toBeFocused()
  await editor.press(word === "Before" ? "Home" : "ControlOrMeta+End")

  for (const _character of word)
    await editor.press(
      word === "Before" ? "Shift+ArrowRight" : "Shift+ArrowLeft",
    )
  await expect
    .poll(() =>
      editor.evaluate(
        (root, { expected, length }) => {
          const selection = root.ownerDocument.getSelection()

          return Boolean(
            selection &&
            !selection.isCollapsed &&
            selection.anchorNode &&
            selection.focusNode &&
            root.contains(selection.anchorNode) &&
            root.contains(selection.focusNode) &&
            selection.anchorNode === selection.focusNode &&
            selection.anchorNode.nodeType === Node.TEXT_NODE &&
            selection.anchorOffset === (expected === "Before" ? 0 : length) &&
            selection.focusOffset ===
              (expected === "Before"
                ? expected.length
                : length - expected.length) &&
            selection.toString() === expected,
          )
        },
        { expected: word, length: original.length },
      ),
    )
    .toBe(true)
  const check = page.locator('[aria-label="Selection check"]')
  await snapshotFromEditor(page, check)
  const state = await captureState(check)
  await expect(check).toHaveAttribute("data-selection-in-editor", "true")
  expect(state.selection?.text).toBe(word)
  expect(state.selection?.anchor).toMatchObject({
    type: "text",
    offset: word === "Before" ? 0 : original.length,
  })
  expect(state.selection?.focus).toMatchObject({
    key: state.selection?.anchor.key,
    type: "text",
    offset: word === "Before" ? word.length : original.length - word.length,
  })
  await expect(editor).toBeFocused()

  return state
}

async function expectCapturedTarget(
  page: Page,
  dialog: Locator,
  selection: z.infer<typeof selectionSchema> | null,
) {
  expect(selection).not.toBeNull()
  const check = page.getByLabel("Selection check", { exact: true })
  expect(
    selectionSchema.parse(
      JSON.parse((await check.getAttribute("data-original-state")) ?? "null"),
    ),
  ).toEqual(selection)
  await snapshotFromEditor(page, check)
  expect((await captureState(check)).selection).toEqual(selection)
  await expect(dialog.getByLabel("Media URL")).toBeFocused()
  await expect(
    dialog.getByRole("button", { name: "Insert", exact: true }),
  ).toBeEnabled()
  await expect(dialog.getByLabel("Upload media")).toBeEnabled()
}

async function expectReleasedAfterInsertion(page: Page, editor: Locator) {
  await selectNewNativeTarget(page, editor)
  await page.getByRole("button", { name: "Insert file", exact: true }).click()
  const dialog = page.getByRole("dialog", { name: "Insert file", exact: true })
  await expect(dialog.getByLabel("Upload media")).toBeEnabled()
  await dialog.getByLabel("Media URL").press("Escape")
  await expect(dialog).toHaveCount(0)
}

async function freshUpload(page: Page, editor: Locator, info: TestInfo) {
  const freshUrl = uploadUrl("B", 2)
  const paragraph = editor.locator("p").filter({ hasText: original })
  await paragraph.scrollIntoViewIfNeeded()
  await paragraph.click()
  await editor.press("ControlOrMeta+End")
  await expect(editor).toBeFocused()
  await expect
    .poll(() =>
      editor.evaluate((root, text) => {
        const selection = root.ownerDocument.getSelection()

        return Boolean(
          selection?.isCollapsed &&
          selection.anchorNode &&
          root.contains(selection.anchorNode) &&
          selection.anchorNode.nodeType === Node.TEXT_NODE &&
          selection.anchorNode.textContent === text &&
          selection.anchorOffset === text.length &&
          selection.focusNode === selection.anchorNode &&
          selection.focusOffset === text.length,
        )
      }, original),
    )
    .toBe(true)
  const check = page.locator('[aria-label="Selection check"]')
  await snapshotFromEditor(page, check)
  const target = await captureState(check)
  await expect(check).toHaveAttribute("data-selection-in-editor", "true")
  expect(target.selection).not.toBeNull()
  expect(target.selection?.anchor).toEqual(target.selection?.focus)
  expect(target.selection?.anchor).toMatchObject({
    type: "text",
    offset: original.length,
  })
  expect(target.selection?.text).toBe("")
  await expect(editor).toBeFocused()
  await page.getByRole("button", { name: "Insert file", exact: true }).click()
  const dialog = page.getByRole("dialog", { name: "Insert file", exact: true })
  await shortcut(dialog, "h")
  await shortcut(dialog, "b")
  await expect(dialog.getByLabel("Media URL")).toBeFocused()
  await snapshotFromEditor(page, check)
  expect(await captureState(check)).toEqual(target)
  await expect(check).toHaveAttribute("data-selection-in-editor", "true")
  await expect(dialog.getByLabel("Upload media")).toBeEnabled()
  await chooseFile(page, dialog, info)
  await expect(dialog.getByLabel("Upload host evidence")).toHaveAttribute(
    "data-pending",
    "true",
  )
  await expect(dialog.getByLabel("Upload media")).toBeDisabled()
  await shortcut(dialog, "o")
  await expect(dialog).toHaveCount(0)
  const media = editor.locator('[data-slot="editor-media"]')
  await expect(media).toHaveCount(1)
  await expect(media.locator(`a[href="${freshUrl}"]`)).toHaveCount(1)
  await expect
    .poll(() =>
      media.evaluate((node) => {
        const root = node.closest('[data-slot="editor-content"]')

        if (!root) return null
        const before = document.createRange()
        before.selectNodeContents(root)
        before.setEndBefore(node)
        const after = document.createRange()
        after.selectNodeContents(root)
        after.setStartAfter(node)

        return { before: before.toString(), after: after.toString() }
      }),
    )
    .toEqual({ before: original, after: "" })
  await expect(editor).toBeFocused()
  await snapshotFromEditor(page, check)
  await expect(check).toHaveAttribute("data-selected-media", "true")
  await expect(editor).toBeFocused()
  await expect(page.getByLabel("Upload host evidence")).toHaveAttribute(
    "data-invoked",
    "B",
  )
  await expect(page.getByLabel("Upload host evidence")).toHaveAttribute(
    "data-file-unchanged",
    "true",
  )
  await expect(media.locator(`a[href="${freshUrl}"]`)).toHaveText(fixtureName)
  await expectSavedFile(page, freshUrl)
  await expectReleasedAfterInsertion(page, editor)
  await editor.focus()
  await editor.press("ControlOrMeta+z")
  await expect(media).toHaveCount(0)
  await expect(editor).toHaveText(original)
  await editor.press("ControlOrMeta+Shift+z")
  await expect(media.locator(`a[href="${freshUrl}"]`)).toHaveCount(1)
  await expect(media.locator(`a[href="${freshUrl}"]`)).toHaveText(fixtureName)
  await expectSavedFile(page, freshUrl)
  await expect(page.getByLabel("Upload host evidence")).toHaveAttribute(
    "data-calls",
    "2",
  )
}

for (const [kind, base] of [
  ["tweet", "https://x.com/example/status/123456789"],
  ["iframe", "https://example.com/embed"],
] as const) {
  for (const suffix of ["?", "#", "?#", "?token=secret", "#fragment"]) {
    test(`${kind} insertion rejects literal delimiters before mutation: ${suffix}`, async ({
      page,
    }, info) => {
      const { editor, structuredBaseline } = await prepareSelection(
        page,
        true,
        true,
      )

      const recording = recordings.get(page)

      if (!recording || !structuredBaseline) throw new Error("Missing baseline")
      await page.route("**/__tests__/request-control", (route) =>
        route.fulfill({ contentType: "text/plain", body: "observed" }),
      )
      expect(
        await page.evaluate(async () =>
          (await fetch("/__tests__/request-control")).text(),
        ),
      ).toBe("observed")
      expect(
        recording.urls.some((url) =>
          url.endsWith("/__tests__/request-control"),
        ),
      ).toBe(true)
      recording.externalControlExpected = true
      await page.route(externalControl, (route) =>
        route.fulfill({
          contentType: "text/plain",
          headers: { "access-control-allow-origin": "*" },
          body: "observed external control",
        }),
      )
      expect(
        await page.evaluate(
          async (url) => (await fetch(url)).text(),
          externalControl,
        ),
      ).toBe("observed external control")
      expect(
        recording.urls.filter((url) => url === externalControl),
      ).toHaveLength(1)
      const start = recording.urls.length
      const check = page.getByLabel("Selection check", { exact: true })
      await expect(editor).toBeFocused()
      expect(
        await editor.evaluate((root) => {
          const selection = root.ownerDocument.getSelection()

          return Boolean(
            selection &&
            !selection.isCollapsed &&
            selection.anchorNode &&
            selection.anchorNode === selection.focusNode &&
            root.contains(selection.anchorNode) &&
            selection.anchorNode.nodeType === Node.TEXT_NODE &&
            selection.anchorNode.textContent === "Before selected after" &&
            selection.anchorOffset === 7 &&
            selection.focusOffset === 15 &&
            selection.toString() === "selected",
          )
        }),
      ).toBe(true)
      await snapshotFromEditor(page, check)
      const before = await captureState(check)
      const selection = selectionSchema.parse(before.selection)
      expect(before.document).toEqual(structuredBaseline)
      expect(selection).toEqual({
        anchor: { key: selection.anchor.key, offset: 7, type: "text" },
        focus: { key: selection.anchor.key, offset: 15, type: "text" },
        text: "selected",
      })
      await expect(check).toHaveAttribute("data-selection-in-editor", "true")
      await page
        .getByRole("button", { name: `Insert ${kind}`, exact: true })
        .click()

      const capture = z
        .object({
          id: z.number(),
          kind: z.string(),
          selection: selectionSchema,
        })
        .parse(
          JSON.parse(
            (await check.getAttribute("data-trigger-capture")) ?? "null",
          ),
        )

      expect(capture).toEqual({ id: 1, kind: `Insert ${kind}`, selection })

      const embedDialog = page.getByRole("dialog", {
        name: `Insert ${kind}`,
        exact: true,
      })

      const input = embedDialog.getByLabel("Media URL")
      await expect(input).toBeFocused()
      await expect(embedDialog.getByRole("alert")).toHaveCount(0)
      await expect(
        embedDialog.getByRole("button", { name: "Insert", exact: true }),
      ).toBeEnabled()
      await snapshotFromEditor(page, check)
      expect(await captureState(check)).toEqual(before)
      await input.evaluate((element) => {
        const form = element.closest("form")

        if (!form || !(element instanceof HTMLInputElement))
          throw new Error("Missing media form")
        form.addEventListener(
          "submit",
          (event) => {
            const submitter =
              event instanceof SubmitEvent ? event.submitter : null

            form.dataset.testSubmit = JSON.stringify({
              trusted: event.isTrusted,
              value: element.value,
              submitter: submitter?.textContent?.trim(),
            })
          },
          { once: true, capture: true },
        )
      })
      await input.fill(base + suffix)
      expect(
        await input.evaluate(
          (element) =>
            element instanceof HTMLInputElement && element.validity.valid,
        ),
      ).toBe(true)
      await embedDialog
        .getByRole("button", { name: "Insert", exact: true })
        .click()

      const submit = z
        .object({
          trusted: z.boolean(),
          value: z.string(),
          submitter: z.string(),
        })
        .parse(
          JSON.parse(
            (await input
              .locator("xpath=ancestor::form")
              .getAttribute("data-test-submit")) ?? "null",
          ),
        )

      expect(submit).toEqual({
        trusted: true,
        value: base + suffix,
        submitter: "Insert",
      })
      await expect(input).toHaveAttribute("aria-invalid", "true")
      await snapshotFromEditor(page, check)
      expect(await captureState(check)).toEqual(before)
      await expect(editor.locator('[data-slot="editor-media"]')).toHaveCount(0)
      await page.waitForTimeout(500)
      expect(
        recording.urls
          .slice(start)
          .filter((url) => new URL(url).hostname !== "localhost"),
      ).toEqual([])
      await input.fill(base)
      await embedDialog
        .getByRole("button", { name: "Insert", exact: true })
        .click()
      await expect(embedDialog).toHaveCount(0)
      await expect(editor.locator('[data-slot="editor-media"]')).toHaveCount(1)
      await snapshotFromEditor(page, check)
      await expect(check).toHaveAttribute("data-selected-media", "true")

      const inserted = z
        .looseObject({
          root: z.looseObject({ children: z.array(z.unknown()) }),
        })
        .parse((await captureState(check)).document)

      expect(inserted.root.children).toHaveLength(4)
      expect(inserted.root.children[2]).toEqual({
        type: "yopem-media",
        version: 1,
        media: {
          kind: "embed",
          embedType: kind,
          url: base,
          alt: "",
          caption: "",
          name: "File",
          width: 320,
          alignment: "start",
        },
      })
      expect(inserted.root.children[3]).toEqual({
        ...structuredBaseline.root.children[1],
        children: [],
      })
      expect({
        ...inserted,
        root: {
          ...inserted.root,
          children: inserted.root.children.slice(0, 2),
        },
      }).toEqual(structuredBaseline)
      await editor.press("ControlOrMeta+z")
      await snapshotFromEditor(page, check)
      expect((await captureState(check)).document).toEqual(structuredBaseline)
      await editor.press("ControlOrMeta+Shift+z")
      await expect(editor.locator('[data-slot="editor-media"]')).toHaveCount(1)
      await snapshotFromEditor(page, check)
      expect((await captureState(check)).document).toEqual(inserted)
      const fresh = await selectNewNativeTarget(page, editor)
      expect(fresh.document).toEqual(inserted)
      const freshNative = await captureBrowserSelection(page)
      expect(freshNative).toMatchObject({ text: "Before", collapsed: false })
      await page
        .getByRole("button", { name: `Insert ${kind}`, exact: true })
        .click()
      await expect(embedDialog).toBeVisible()
      await expect(input).not.toHaveAttribute("aria-invalid", "true")
      await expect(embedDialog.getByRole("alert")).toHaveCount(0)
      const retryStart = recording.urls.length
      await input.fill(base + suffix)
      expect(
        await input.evaluate(
          (element) =>
            element instanceof HTMLInputElement && element.validity.valid,
        ),
      ).toBe(true)
      await embedDialog
        .getByRole("button", { name: "Insert", exact: true })
        .click()
      await expect(embedDialog).toBeVisible()
      await expect(input).toHaveAttribute("aria-invalid", "true")
      await input.focus()
      await snapshotFromEditor(page, check)
      expect((await captureState(check)).document).toEqual(inserted)
      expect(await captureState(check)).toEqual(fresh)
      await expect(input).toBeFocused()
      await expect(editor.locator('[data-slot="editor-media"]')).toHaveCount(1)
      await page.waitForTimeout(500)
      expect(
        recording.urls
          .slice(retryStart)
          .filter((url) => new URL(url).hostname !== "localhost"),
      ).toEqual([])
      await input.press("Escape")
      await expect(embedDialog).toHaveCount(0)
      await expect(editor).toBeFocused()
      expect(await captureBrowserSelection(page)).toEqual(freshNative)
      await snapshotFromEditor(page, check)
      expect(await captureState(check)).toEqual(fresh)
      await info.attach(`${kind}-delimiter.json`, {
        body: JSON.stringify({
          before,
          capture,
          submit,
          inserted,
          requests: recording.urls,
        }),
        contentType: "application/json",
      })
    })
  }
}

for (const kind of ["tweet", "iframe"] as const) {
  test(`file dialog Escape preserves native selection for ${kind} insertion`, async ({
    page,
  }, info) => {
    const { editor, structuredBaseline } = await prepareSelection(
      page,
      true,
      true,
    )

    if (!structuredBaseline) throw new Error("Missing baseline")
    const nativeSelection = await captureBrowserSelection(page)
    expect(nativeSelection).toMatchObject({
      anchor: { offset: 7 },
      focus: { offset: 15 },
      text: "selected",
      collapsed: false,
    })
    const check = page.getByLabel("Selection check", { exact: true })

    const originalSelection = selectionSchema.parse(
      (await captureState(check)).selection,
    )

    await page.getByRole("button", { name: "Insert file", exact: true }).click()

    const fileDialog = page.getByRole("dialog", {
      name: "Insert file",
      exact: true,
    })

    await expect(fileDialog).toBeVisible()
    await fileDialog.getByLabel("Media URL").press("Escape")
    await expect(fileDialog).toHaveCount(0)
    await expect(editor).toBeFocused()
    expect(await captureBrowserSelection(page)).toEqual(nativeSelection)
    await page
      .getByRole("button", { name: `Insert ${kind}`, exact: true })
      .click()

    const dialog = page.getByRole("dialog", {
      name: `Insert ${kind}`,
      exact: true,
    })

    const captured = z
      .object({ kind: z.string(), selection: selectionSchema })
      .parse(
        JSON.parse(
          (await check.getAttribute("data-trigger-capture")) ?? "null",
        ),
      )

    expect(captured.kind).toBe(`Insert ${kind}`)
    expect(captured.selection).toEqual(originalSelection)
    await dialog
      .getByLabel("Media URL")
      .fill(
        kind === "tweet"
          ? "https://x.com/example/status/123456789"
          : "https://example.com/embed",
      )
    await dialog.getByRole("button", { name: "Insert", exact: true }).click()
    await expect(dialog).toHaveCount(0)
    await expect(editor.locator('[data-slot="editor-media"]')).toHaveCount(1)
    await editor.press("ControlOrMeta+z")
    await snapshotFromEditor(page, check)
    expect((await captureState(check)).document).toEqual(structuredBaseline)
    await info.attach(`${kind}-file-dialog-transition.json`, {
      body: JSON.stringify({ nativeSelection, captured, structuredBaseline }),
      contentType: "application/json",
    })
  })
}

for (const suffix of ["?", "#"] as const) {
  test(`upload result with empty ${suffix} preserves the document and permits encoded retry`, async ({
    page,
  }, info) => {
    const { editor, dialog, structuredBaseline } = await prepare(page, true)
    const recording = recordings.get(page)

    if (!recording || !structuredBaseline) throw new Error("Missing baseline")
    await page.route("https://media.test/**", (route) => route.abort())
    await page.route("**/__tests__/request-control", (route) =>
      route.fulfill({ contentType: "text/plain", body: "observed" }),
    )
    expect(
      await page.evaluate(async () =>
        (await fetch("/__tests__/request-control")).text(),
      ),
    ).toBe("observed")
    expect(
      recording.urls.some((url) => url.endsWith("/__tests__/request-control")),
    ).toBe(true)
    const start = recording.urls.length
    const check = page.getByLabel("Selection check", { exact: true })

    const selection = selectionSchema.parse(
      JSON.parse((await check.getAttribute("data-original-state")) ?? "null"),
    )

    const evidence = dialog.getByLabel("Upload host evidence")
    await dialog
      .getByLabel("Upload result URL")
      .fill(`https://media.test/upload/result.txt${suffix}`)
    await chooseFile(page, dialog, info)
    await expect(evidence).toHaveAttribute("data-change-trusted", "true")
    await expect(evidence).toHaveAttribute("data-input-trusted", "true")
    await shortcut(dialog, "o")
    await expect(dialog.getByRole("alert")).toContainText("Check the URL")
    await expect(dialog.getByLabel("Upload media")).toBeEnabled()
    await snapshotFromEditor(page, check)
    expect(await captureState(check)).toEqual({
      document: structuredBaseline,
      selection,
    })
    await expect(editor.locator('[data-slot="editor-media"]')).toHaveCount(0)
    await page.waitForTimeout(500)
    expect(
      recording.urls
        .slice(start)
        .filter((url) => new URL(url).hostname === "media.test"),
    ).toEqual([])
    const encodedUrl = "https://media.test/upload/a%3Fb%23c.txt"
    await dialog.getByLabel("Upload result URL").fill(encodedUrl)
    await chooseFile(page, dialog, info)
    await shortcut(dialog, "o")
    await expect(dialog).toHaveCount(0)
    const inserted = await expectPlacedMedia(page, editor, encodedUrl)

    const expectedInserted = {
      ...structuredBaseline,
      root: {
        ...structuredBaseline.root,
        children: [
          ...structuredBaseline.root.children,
          {
            type: "yopem-media",
            version: 1,
            media: {
              kind: "file",
              url: encodedUrl,
              alt: "",
              caption: "",
              name: fixtureName,
              width: 320,
              alignment: "start",
            },
          },
          { ...structuredBaseline.root.children[1], children: [] },
        ],
      },
    }

    expect(inserted).toEqual(expectedInserted)
    await editor.press("ControlOrMeta+z")
    await snapshotFromEditor(page, check)
    expect((await captureState(check)).document).toEqual(structuredBaseline)
    await editor.press("ControlOrMeta+Shift+z")
    await snapshotFromEditor(page, check)
    expect((await captureState(check)).document).toEqual(inserted)
    expect((await captureState(check)).document).toEqual(expectedInserted)
    await expect(page.getByLabel("Upload host evidence")).toHaveAttribute(
      "data-calls",
      "2",
    )
    const fresh = await selectNewNativeTarget(page, editor)
    expect(fresh.document).toEqual(inserted)
    const freshNative = await captureBrowserSelection(page)
    expect(freshNative).toMatchObject({ text: "Before", collapsed: false })
    await page.getByRole("button", { name: "Insert file", exact: true }).click()
    await expect(dialog).toBeVisible()
    await expect(dialog.getByRole("alert")).toHaveCount(0)
    await expect(dialog.getByLabel("Media URL")).not.toHaveAttribute(
      "aria-invalid",
      "true",
    )
    await shortcut(dialog, "h")
    const retryStart = recording.urls.length
    await dialog
      .getByLabel("Upload result URL")
      .fill(`https://media.test/upload/result.txt${suffix}`)
    await chooseFile(page, dialog, info)
    await shortcut(dialog, "o")
    await expect(dialog.getByRole("alert")).toContainText("Check the URL")
    await snapshotFromEditor(page, check)
    expect((await captureState(check)).document).toEqual(inserted)
    expect(await captureState(check)).toEqual(fresh)
    await expect(dialog.getByLabel("Media URL")).toBeFocused()
    await expect(editor.locator('[data-slot="editor-media"]')).toHaveCount(1)
    await page.waitForTimeout(500)
    expect(
      recording.urls
        .slice(retryStart)
        .filter((url) => new URL(url).hostname === "media.test"),
    ).toEqual([])
    await dialog.getByLabel("Media URL").press("Escape")
    await expect(dialog).toHaveCount(0)
    await expect(editor).toBeFocused()
    expect(await captureBrowserSelection(page)).toEqual(freshNative)
    await snapshotFromEditor(page, check)
    expect(await captureState(check)).toEqual(fresh)
    await info.attach(
      `delimiter-upload-${suffix === "?" ? "query" : "fragment"}.json`,
      {
        body: JSON.stringify({
          selection,
          structuredBaseline,
          inserted,
          requests: recording.urls,
        }),
        contentType: "application/json",
      },
    )
  })
}

test("rejected delimiter upload keeps an existing host history step", async ({
  page,
}, info) => {
  const { editor, dialog, structuredBaseline } = await prepare(page, true)
  const check = page.getByLabel("Selection check", { exact: true })
  await shortcut(dialog, "t")
  await snapshotFromEditor(page, check)
  const changed = (await captureState(check)).document
  expect(changed).not.toEqual(structuredBaseline)
  await expect(editor).toContainText("Changed heading")
  await dialog.getByLabel("Media URL").press("Escape")
  const target = await selectNewNativeTarget(page, editor, "after")
  expect(target.document).toEqual(changed)
  await page.getByRole("button", { name: "Insert file", exact: true }).click()
  await shortcut(dialog, "h")
  await dialog
    .getByLabel("Upload result URL")
    .fill("https://media.test/upload/history.txt#")
  await chooseFile(page, dialog, info)
  await expect(dialog.getByLabel("Upload host evidence")).toHaveAttribute(
    "data-change-trusted",
    "true",
  )
  await shortcut(dialog, "o")
  await expect(dialog.getByRole("alert")).toContainText("Check the URL")
  await snapshotFromEditor(page, check)
  expect(await captureState(check)).toEqual(target)
  await dialog.getByLabel("Media URL").press("Escape")
  await expect(editor).toBeFocused()
  await editor.press("ControlOrMeta+z")
  await snapshotFromEditor(page, check)
  expect((await captureState(check)).document).toEqual(structuredBaseline)
  await editor.press("ControlOrMeta+Shift+z")
  await snapshotFromEditor(page, check)
  expect((await captureState(check)).document).toEqual(changed)
  await expect(editor.locator('[data-slot="editor-media"]')).toHaveCount(0)
  await info.attach("delimiter-prior-history.json", {
    body: JSON.stringify({ structuredBaseline, target, changed }),
    contentType: "application/json",
  })
})

for (const invalidation of ["host", "readonly"] as const) {
  for (const [resultKind, staleUrl] of [
    ["valid", "https://media.test/upload/stale.txt"],
    ["delimiter", "https://media.test/upload/stale.txt?"],
  ] as const) {
    test(`${invalidation} invalidates a pending ${resultKind} upload result`, async ({
      page,
    }, info) => {
      const { editor, dialog, structuredBaseline } = await prepare(page, true)
      const check = page.getByLabel("Selection check", { exact: true })
      const evidence = dialog.getByLabel("Upload host evidence")
      await dialog.getByLabel("Upload result URL").fill(staleUrl)
      await chooseFile(page, dialog, info)
      await expect(evidence).toHaveAttribute("data-change-trusted", "true")
      await expect(evidence).toHaveAttribute("data-pending", "true")
      await expect(evidence).toHaveAttribute("data-invoked", "A")
      await shortcut(dialog, invalidation === "host" ? "b" : "e")
      await expect(evidence).toHaveAttribute("data-aborted", "true")
      await expect(evidence).toHaveAttribute("data-pending", "true")

      if (invalidation === "readonly") {
        await expect(editor).toHaveAttribute("contenteditable", "false")
        await shortcut(dialog, "e")
        await expect(editor).toHaveAttribute("contenteditable", "true")
      }

      await shortcut(dialog, "o")
      await expect(evidence).toHaveAttribute("data-result-id", "1")
      await snapshotFromEditor(page, check)
      expect((await captureState(check)).document).toEqual(structuredBaseline)
      await expect(editor.locator('[data-slot="editor-media"]')).toHaveCount(0)
      await dialog.getByLabel("Media URL").press("Escape")
      await selectNewNativeTarget(page, editor, "after")
      await page
        .getByRole("button", { name: "Insert file", exact: true })
        .click()
      await shortcut(dialog, "h")
      await dialog
        .getByLabel("Upload result URL")
        .fill("https://media.test/upload/fresh%3F%23.txt")
      await chooseFile(page, dialog, info)
      await shortcut(dialog, "o")

      const inserted = await expectPlacedMedia(
        page,
        editor,
        "https://media.test/upload/fresh%3F%23.txt",
      )

      await editor.press("ControlOrMeta+z")
      await snapshotFromEditor(page, check)
      expect((await captureState(check)).document).toEqual(structuredBaseline)
      await editor.press("ControlOrMeta+Shift+z")
      await snapshotFromEditor(page, check)
      expect((await captureState(check)).document).toEqual(inserted)
      await expect(page.getByLabel("Upload host evidence")).toHaveAttribute(
        "data-invoked",
        invalidation === "host" ? "B" : "A",
      )
      await info.attach(`${resultKind}-${invalidation}.json`, {
        body: JSON.stringify({
          staleUrl,
          structuredBaseline,
          inserted,
          requests: recordings.get(page),
        }),
        contentType: "application/json",
      })
    })
  }
}

test("mutation listener requestSubmit rejects a stale URL target", async ({
  page,
}, info) => {
  const { editor, dialog, structuredBaseline } = await prepare(page, true)

  if (!structuredBaseline) throw new Error("Missing structured baseline")

  const check = page.locator('[aria-label="Selection check"]')

  const selection = selectionSchema.parse(
    JSON.parse((await check.getAttribute("data-original-state")) ?? "null"),
  )

  const url = "https://media.test/url-policy/reentrant-file.txt"
  await dialog.getByLabel("Media URL").fill(url)
  await expect(
    dialog.getByRole("button", { name: "Insert", exact: true }),
  ).toBeEnabled()
  await shortcut(dialog, "w")

  const evidence = z
    .object({
      order: z.array(z.string()),
      submitCount: z.number(),
      submitTrusted: z.boolean(),
      submitPrevented: z.boolean(),
      selection: selectionSchema,
      committedChanged: z.boolean(),
    })
    .parse(
      JSON.parse(
        (await page
          .locator("html")
          .getAttribute("data-url-mutation-reentry")) ?? "null",
      ),
    )

  expect(evidence.order).toEqual([
    "update:start",
    "mutation:start",
    "submit:capture",
    "submit:return",
    "mutation:end",
    "update:listener",
    "update:return",
  ])
  expect(evidence).toMatchObject({
    submitCount: 1,
    submitPrevented: true,
    selection,
    committedChanged: true,
  })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByLabel("Media URL")).toHaveAttribute(
    "aria-invalid",
    "true",
  )
  await expect(
    dialog.getByRole("button", { name: "Insert", exact: true }),
  ).toBeDisabled()
  await snapshotFromEditor(page, check)
  const after = await captureState(check)
  expect(after.selection).toEqual(selection)
  expect(after.document).toEqual({
    ...structuredBaseline,
    root: {
      ...structuredBaseline.root,
      children: structuredBaseline.root.children.map((paragraph, index) =>
        index === 0
          ? {
              ...paragraph,
              children: paragraph.children.map((node) => ({
                ...node,
                text: "Changed heading",
              })),
            }
          : paragraph,
      ),
    },
  })
  await expect(editor.locator('[data-slot="editor-media"]')).toHaveCount(0)
  expect(
    recordings.get(page)?.urls.filter((request) => request === url),
  ).toEqual([])
  await dialog.getByLabel("Media URL").press("Escape")
  await expect(editor).toBeFocused()
  await editor.press("ControlOrMeta+z")
  await expect(editor).toContainText("Formatted heading")
  await expect(editor.locator('[data-slot="editor-media"]')).toHaveCount(0)
  await editor.press("ControlOrMeta+Shift+z")
  await expect(editor).toContainText("Changed heading")
  await expect(editor.locator('[data-slot="editor-media"]')).toHaveCount(0)
  await selectNewNativeTarget(page, editor, "after")
  await page.getByRole("button", { name: "Insert file", exact: true }).click()
  await dialog.getByLabel("Media URL").fill(url)
  await dialog.getByRole("button", { name: "Insert", exact: true }).click()
  await expect(dialog).toHaveCount(0)
  await expect(editor.locator(`a[href="${url}"]`)).toHaveCount(1)
  await expect(editor).toContainText("Changed heading")
  await expect(editor).toContainText(original)
  await editor.press("ControlOrMeta+z")
  await expect(editor.locator('[data-slot="editor-media"]')).toHaveCount(0)
  await expect(editor).toContainText("Changed heading")
  await editor.press("ControlOrMeta+Shift+z")
  await expect(editor.locator(`a[href="${url}"]`)).toHaveCount(1)
  await expect(editor).toContainText("Changed heading")
  await info.attach("url-mutation-reentry.json", {
    body: JSON.stringify({ evidence, after, requests: recordings.get(page) }),
    contentType: "application/json",
  })
})

for (const [mode, key] of [
  ["selection-only", "l"],
  ["no-op", "y"],
] as const) {
  test(`${mode} commit permits URL insertion`, async ({ page }, info) => {
    const { editor, dialog } = await prepare(page, true)
    const check = page.locator('[aria-label="Selection check"]')

    const selection = selectionSchema.parse(
      JSON.parse((await check.getAttribute("data-original-state")) ?? "null"),
    )

    const url = `https://media.test/url-policy/clean-${mode}.txt`
    await dialog.getByLabel("Media URL").fill(url)
    await shortcut(dialog, key)
    await expect(page.locator("html")).toHaveAttribute(
      "data-clean-commit-changed",
      "true",
    )
    await expect(page.locator("html")).toHaveAttribute(
      "data-clean-commit-finished",
      "1",
    )
    await snapshotFromEditor(page, check)
    expect((await captureState(check)).selection).toEqual(selection)
    await expect(
      dialog.getByRole("button", { name: "Insert", exact: true }),
    ).toBeEnabled()
    await dialog.getByRole("button", { name: "Insert", exact: true }).click()
    await expect(dialog).toHaveCount(0)
    const document = await expectPlacedMedia(page, editor, url)
    await info.attach(`clean-url-${mode}.json`, {
      body: JSON.stringify({ selection, document }),
      contentType: "application/json",
    })
  })
}

for (const word of ["Before", "after"] as const) {
  test(`clean selection invalidation permits a fresh ${word} URL session`, async ({
    page,
  }, info) => {
    const { editor, dialog, structuredBaseline } = await prepare(page, true)
    const check = page.getByLabel("Selection check", { exact: true })

    const originalSelection = selectionSchema.parse(
      JSON.parse((await check.getAttribute("data-original-state")) ?? "null"),
    )

    await shortcut(dialog, "s")

    const commit = z
      .object({
        changed: z.boolean(),
        updates: z.array(
          z.object({
            previous: z.boolean(),
            current: z.boolean(),
            dirty: z.number(),
          }),
        ),
      })
      .parse(
        JSON.parse(
          (await page.locator("html").getAttribute("data-selection-commit")) ??
            "null",
        ),
      )

    expect(commit.changed).toBe(true)
    expect(commit.updates).toContainEqual({
      previous: true,
      current: true,
      dirty: 0,
    })
    await snapshotFromEditor(page, check)

    const invalidated = await captureState(check)
    expect(invalidated.document).toEqual(structuredBaseline)
    expect(selectionSchema.parse(invalidated.selection)).toEqual({
      anchor: { key: originalSelection.anchor.key, offset: 16, type: "text" },
      focus: { key: originalSelection.anchor.key, offset: 21, type: "text" },
      text: "after",
    })
    expect(invalidated.selection).not.toEqual(originalSelection)
    await expect(
      dialog.getByRole("button", { name: "Insert", exact: true }),
    ).toBeDisabled()
    await expect(dialog.getByLabel("Upload media")).toBeDisabled()
    await dialog.getByLabel("Media URL").press("Escape")
    await expect(dialog).toHaveCount(0)
    const fresh = await selectNewNativeTarget(page, editor, word)
    expect(fresh.document).toEqual(structuredBaseline)

    const previousCapture = JSON.parse(
      (await check.getAttribute("data-trigger-capture")) ?? "null",
    )

    const previousId = z.object({ id: z.number() }).parse(previousCapture).id
    await page.getByRole("button", { name: "Insert file", exact: true }).click()

    const capture = z
      .object({ id: z.number(), kind: z.string(), selection: selectionSchema })
      .parse(
        JSON.parse(
          (await check.getAttribute("data-trigger-capture")) ?? "null",
        ),
      )

    expect(capture.id).toBeGreaterThan(previousId)
    expect(capture).toMatchObject({
      kind: "Insert file",
      selection: selectionSchema.parse(fresh.selection),
    })
    await expectCapturedTarget(page, dialog, fresh.selection)

    for (const [index, key] of ["l", "y"].entries()) {
      await shortcut(dialog, key)
      await expect(page.locator("html")).toHaveAttribute(
        "data-clean-commit-changed",
        "true",
      )
      await expect(page.locator("html")).toHaveAttribute(
        "data-clean-commit-finished",
        String(index + 1),
      )
      await expect(dialog.getByLabel("Upload media")).toBeEnabled()
    }

    const url = `https://media.test/recovered-${word}.txt`
    await dialog.getByLabel("Media URL").fill(url)
    await expect(
      dialog.getByRole("button", { name: "Insert", exact: true }),
    ).toBeEnabled()
    await dialog.getByRole("button", { name: "Insert", exact: true }).click()

    const inserted = await expectPlacedMedia(page, editor, url)
    await editor.press("ControlOrMeta+z")
    await snapshotFromEditor(page, check)
    expect((await captureState(check)).document).toEqual(structuredBaseline)
    await editor.press("ControlOrMeta+Shift+z")
    await snapshotFromEditor(page, check)
    expect((await captureState(check)).document).toEqual(inserted)
    await info.attach(`recovered-${word}.json`, {
      body: JSON.stringify({
        originalSelection,
        commit,
        invalidated,
        fresh,
        previousId,
        capture,
        inserted,
      }),
      contentType: "application/json",
    })
  })
}

test("clean selection invalidates a pending old upload and preserves the fresh lease", async ({
  page,
}, info) => {
  const { editor, dialog, structuredBaseline } = await prepare(page, true)
  const check = page.getByLabel("Selection check", { exact: true })

  const oldSelection = selectionSchema.parse(
    JSON.parse((await check.getAttribute("data-original-state")) ?? "null"),
  )

  await chooseFile(page, dialog, info)
  const evidence = dialog.getByLabel("Upload host evidence")

  await expect(evidence).toHaveAttribute("data-calls", "1")
  await expect(evidence).toHaveAttribute("data-pending", "true")
  await shortcut(dialog, "s")
  await expect(evidence).toHaveAttribute("data-aborted", "true")
  await expect(evidence).toHaveAttribute("data-pending", "true")

  const commit = z
    .object({
      changed: z.boolean(),
      updates: z.array(
        z.object({
          previous: z.boolean(),
          current: z.boolean(),
          dirty: z.number(),
        }),
      ),
    })
    .parse(
      JSON.parse(
        (await page.locator("html").getAttribute("data-selection-commit")) ??
          "null",
      ),
    )

  expect(commit.changed).toBe(true)
  expect(commit.updates).toContainEqual({
    previous: true,
    current: true,
    dirty: 0,
  })
  await snapshotFromEditor(page, check)
  const invalidated = await captureState(check)
  expect(invalidated.document).toEqual(structuredBaseline)
  expect(selectionSchema.parse(invalidated.selection)).toEqual({
    anchor: { key: oldSelection.anchor.key, offset: 16, type: "text" },
    focus: { key: oldSelection.anchor.key, offset: 21, type: "text" },
    text: "after",
  })
  expect(invalidated.selection).not.toEqual(oldSelection)
  await expect(dialog.getByLabel("Upload media")).toBeDisabled()
  await expect(
    dialog.getByRole("button", { name: "Insert", exact: true }),
  ).toBeDisabled()
  await dialog.getByLabel("Media URL").press("Escape")
  await expect(dialog).toHaveCount(0)
  const fresh = await selectNewNativeTarget(page, editor, "Before")
  expect(fresh.document).toEqual(structuredBaseline)

  const previousId = z
    .object({ id: z.number() })
    .parse(
      JSON.parse((await check.getAttribute("data-trigger-capture")) ?? "null"),
    ).id

  await page.getByRole("button", { name: "Insert file", exact: true }).click()

  const capture = z
    .object({ id: z.number(), kind: z.string(), selection: selectionSchema })
    .parse(
      JSON.parse((await check.getAttribute("data-trigger-capture")) ?? "null"),
    )

  expect(capture.id).toBeGreaterThan(previousId)
  expect(capture).toMatchObject({
    kind: "Insert file",
    selection: selectionSchema.parse(fresh.selection),
  })
  await shortcut(dialog, "h")
  expect(
    selectionSchema.parse(
      JSON.parse((await check.getAttribute("data-original-state")) ?? "null"),
    ),
  ).toEqual(fresh.selection)
  await expect(dialog.getByLabel("Media URL")).toBeFocused()
  await snapshotFromEditor(page, check)
  expect(await captureState(check)).toEqual(fresh)
  await expect(
    dialog.getByRole("button", { name: "Insert", exact: true }),
  ).toBeEnabled()
  await expect(dialog.getByLabel("Upload media")).toBeDisabled()
  await expect(evidence).toHaveAttribute("data-calls", "1")
  await expect(evidence).toHaveAttribute("data-pending", "true")
  await shortcut(dialog, "o")
  await expect(evidence).toHaveAttribute("data-result-id", "1")
  await expect(evidence).toHaveAttribute("data-pending", "false")
  expect(
    recordings.get(page)?.urls.filter((url) => url === uploadUrl("A", 1)),
  ).toEqual([])
  await expect(dialog.getByLabel("Upload media")).toBeEnabled()
  await expect(
    dialog.getByRole("button", { name: "Insert", exact: true }),
  ).toBeEnabled()
  await snapshotFromEditor(page, check)
  expect(await captureState(check)).toEqual(fresh)
  await expect(editor.locator('[data-slot="editor-media"]')).toHaveCount(0)
  await chooseFile(page, dialog, info)
  await expect(evidence).toHaveAttribute("data-calls", "2")
  await expect(evidence).toHaveAttribute("data-pending", "true")
  await shortcut(dialog, "o")

  const hostEvidence = page
    .getByRole("region", { name: "Media editor", exact: true })
    .getByLabel("Upload host evidence", { exact: true })

  await expect(hostEvidence).toHaveCount(1)
  await expect(hostEvidence).toHaveAttribute("data-result-id", "2")
  const inserted = await expectPlacedMedia(page, editor, uploadUrl("A", 2))
  await editor.press("ControlOrMeta+z")
  await snapshotFromEditor(page, check)
  expect((await captureState(check)).document).toEqual(structuredBaseline)
  await editor.press("ControlOrMeta+Shift+z")
  await snapshotFromEditor(page, check)
  expect((await captureState(check)).document).toEqual(inserted)
  await info.attach("clean-invalidated-upload.json", {
    body: JSON.stringify({
      oldSelection,
      commit,
      invalidated,
      fresh,
      previousId,
      capture,
      inserted,
      requests: recordings.get(page),
    }),
    contentType: "application/json",
  })
})

test("dirty mutation reentry remains rejected after clean selection recovery", async ({
  page,
}, info) => {
  const { editor, dialog, structuredBaseline } = await prepare(page, true)
  await shortcut(dialog, "s")
  await expect(
    dialog.getByRole("button", { name: "Insert", exact: true }),
  ).toBeDisabled()
  await dialog.getByLabel("Media URL").press("Escape")
  const fresh = await selectNewNativeTarget(page, editor, "after")
  expect(fresh.document).toEqual(structuredBaseline)
  await page.getByRole("button", { name: "Insert file", exact: true }).click()

  await expectCapturedTarget(page, dialog, fresh.selection)
  const url = "https://media.test/recovered-dirty.txt"
  await dialog.getByLabel("Media URL").fill(url)
  await expect(
    dialog.getByRole("button", { name: "Insert", exact: true }),
  ).toBeEnabled()
  await shortcut(dialog, "w")

  const evidence = z
    .object({
      order: z.array(z.string()),
      submitCount: z.number(),
      submitPrevented: z.boolean(),
      selection: selectionSchema,
      committedChanged: z.boolean(),
    })
    .parse(
      JSON.parse(
        (await page
          .locator("html")
          .getAttribute("data-url-mutation-reentry")) ?? "null",
      ),
    )

  expect(evidence.order).toEqual([
    "update:start",
    "mutation:start",
    "submit:capture",
    "submit:return",
    "mutation:end",
    "update:listener",
    "update:return",
  ])
  expect(evidence).toMatchObject({
    submitCount: 1,
    submitPrevented: true,
    selection: fresh.selection,
    committedChanged: true,
  })
  await expect(editor).toContainText("Changed heading")
  await expect(editor.locator('[data-slot="editor-media"]')).toHaveCount(0)
  await expect(
    dialog.getByRole("button", { name: "Insert", exact: true }),
  ).toBeDisabled()
  expect(
    recordings.get(page)?.urls.filter((request) => request === url),
  ).toEqual([])
  await info.attach("recovered-dirty-reentry.json", {
    body: JSON.stringify({ fresh, evidence, requests: recordings.get(page) }),
    contentType: "application/json",
  })
})

test("untrusted programmatic change after clean recovery rejects stale upload and permits fresh retry", async ({
  page,
}, info) => {
  const { editor, dialog, structuredBaseline } = await prepare(page, true)
  await shortcut(dialog, "s")

  const commit = z
    .object({
      changed: z.boolean(),
      updates: z.array(
        z.object({
          previous: z.boolean(),
          current: z.boolean(),
          dirty: z.number(),
        }),
      ),
    })
    .parse(
      JSON.parse(
        (await page.locator("html").getAttribute("data-selection-commit")) ??
          "null",
      ),
    )

  expect(commit.changed).toBe(true)
  expect(commit.updates).toContainEqual({
    previous: true,
    current: true,
    dirty: 0,
  })
  await expect(dialog.getByLabel("Upload media")).toBeDisabled()
  await dialog.getByLabel("Media URL").press("Escape")
  const fresh = await selectNewNativeTarget(page, editor, "after")
  expect(fresh.document).toEqual(structuredBaseline)
  await page.getByRole("button", { name: "Insert file", exact: true }).click()
  await expectCapturedTarget(page, dialog, fresh.selection)
  await shortcut(dialog, "m")

  const reentry = z
    .object({
      delivered: z.boolean(),
      trusted: z.boolean(),
      captured: z.boolean(),
      filesBefore: z.number(),
      filesAfter: z.number(),
      selection: selectionSchema,
      calls: z.number(),
    })
    .parse(
      JSON.parse(
        (await page.locator("html").getAttribute("data-mutation-reentry")) ??
          "null",
      ),
    )

  expect(
    reentry.filesAfter,
    "Inconclusive: product file-change consumption was not observed",
  ).toBe(0)
  expect(reentry).toEqual({
    delivered: true,
    trusted: false,
    captured: true,
    filesBefore: 1,
    filesAfter: 0,
    selection: fresh.selection,
    calls: 0,
  })
  await expect(page.locator("html")).not.toHaveAttribute("data-upload-entries")
  await expect(dialog.getByLabel("Upload media")).toBeDisabled()
  await expect(editor).toContainText("Changed heading")
  await expect(editor.locator('[data-slot="editor-media"]')).toHaveCount(0)
  await dialog.getByLabel("Media URL").press("Escape")
  await selectNewNativeTarget(page, editor, "after")
  await page.getByRole("button", { name: "Insert file", exact: true }).click()
  await shortcut(dialog, "h")
  await chooseFile(page, dialog, info)
  await expect(page.locator("html")).toHaveAttribute("data-upload-entries", "1")
  await shortcut(dialog, "o")
  await expect(editor.locator(`a[href="${uploadUrl("A", 1)}"]`)).toHaveCount(1)
  await expect(editor).toContainText("Changed heading")
  await info.attach("recovered-programmatic-upload-reentry.json", {
    body: JSON.stringify({
      commit,
      fresh,
      reentry,
      requests: recordings.get(page),
    }),
    contentType: "application/json",
  })
})

test("constructed file change reaches upload on a live target", async ({
  page,
}, info) => {
  const { editor, dialog } = await prepare(page, true)
  await shortcut(dialog, "g")

  const evidence = z
    .object({
      trusted: z.boolean(),
      captured: z.boolean(),
      filesBefore: z.number(),
      filesAfter: z.number(),
      calls: z.number(),
    })
    .parse(
      JSON.parse(
        (await page.locator("html").getAttribute("data-positive-change")) ??
          "null",
      ),
    )

  expect(evidence).toEqual({
    trusted: false,
    captured: true,
    filesBefore: 1,
    filesAfter: 0,
    calls: 1,
  })
  await expect(dialog.getByLabel("Upload host evidence")).toHaveAttribute(
    "data-pending",
    "true",
  )
  await dialog.getByRole("button", { name: "Cancel upload" }).click()
  await expect(dialog.getByLabel("Upload host evidence")).toHaveAttribute(
    "data-aborted",
    "true",
  )
  await dialog.getByRole("button", { name: "Resolve upload" }).click()
  await expect(dialog.getByLabel("Upload host evidence")).toHaveAttribute(
    "data-result-id",
    "1",
  )
  await expect(dialog.getByLabel("Upload media")).toBeEnabled()
  await expect(editor.locator('[data-slot="editor-media"]')).toHaveCount(0)
  await info.attach("constructed-positive-control.json", {
    body: JSON.stringify(evidence),
    contentType: "application/json",
  })
})

test("mutation listener constructed change cannot start stale upload", async ({
  page,
}, info) => {
  const { editor, dialog, structuredBaseline } = await prepare(page, true)

  if (!structuredBaseline) throw new Error("Missing structured baseline")

  const check = page.locator('[aria-label="Selection check"]')

  const selection = selectionSchema.parse(
    JSON.parse((await check.getAttribute("data-original-state")) ?? "null"),
  )

  await shortcut(dialog, "m")

  const reentry = z
    .object({
      delivered: z.boolean(),
      trusted: z.boolean(),
      captured: z.boolean(),
      filesBefore: z.number(),
      filesAfter: z.number(),
      selection: selectionSchema,
      calls: z.number(),
    })
    .parse(
      JSON.parse(
        (await page.locator("html").getAttribute("data-mutation-reentry")) ??
          "null",
      ),
    )

  expect(
    reentry.filesAfter,
    "Inconclusive: product file-change consumption was not observed",
  ).toBe(0)
  expect(reentry).toEqual({
    delivered: true,
    trusted: false,
    captured: true,
    filesBefore: 1,
    filesAfter: 0,
    selection,
    calls: 0,
  })
  await expect(page.locator("html")).not.toHaveAttribute("data-upload-entries")
  await snapshotFromEditor(page, check)
  const after = await captureState(check)
  expect(after.selection).toEqual(selection)
  expect(after.document).toEqual({
    ...structuredBaseline,
    root: {
      ...structuredBaseline.root,
      children: structuredBaseline.root.children.map((paragraph, index) =>
        index === 0
          ? {
              ...paragraph,
              children: paragraph.children.map((node) => ({
                ...node,
                text: "Changed heading",
              })),
            }
          : paragraph,
      ),
    },
  })
  await expect(editor.locator('[data-slot="editor-media"]')).toHaveCount(0)
  await dialog.getByLabel("Media URL").press("Escape")
  await selectNewNativeTarget(page, editor, "after")
  await page.getByRole("button", { name: "Insert file", exact: true }).click()
  await shortcut(dialog, "h")
  await chooseFile(page, dialog, info)
  await expect(page.locator("html")).toHaveAttribute("data-upload-entries", "1")
  await shortcut(dialog, "o")
  await expect(editor.locator('[data-slot="editor-media"]')).toHaveCount(1)
  await expect(editor).toContainText("Changed heading")
  await expect(editor).toContainText(original)
})

for (const [mode, key] of [
  ["selection-only", "l"],
  ["no-op", "y"],
] as const) {
  test(`${mode} commit permits stable upload`, async ({ page }, info) => {
    const { editor, dialog } = await prepare(page, true)
    const check = page.locator('[aria-label="Selection check"]')

    const selection = selectionSchema.parse(
      JSON.parse((await check.getAttribute("data-original-state")) ?? "null"),
    )

    await shortcut(dialog, key)
    await expect(page.locator("html")).toHaveAttribute(
      "data-clean-commit-changed",
      "true",
    )
    await expect(page.locator("html")).toHaveAttribute(
      "data-clean-commit-finished",
      "1",
    )
    await snapshotFromEditor(page, check)
    expect((await captureState(check)).selection).toEqual(selection)
    await chooseFile(page, dialog, info)
    await expect(page.locator("html")).toHaveAttribute(
      "data-upload-entries",
      "1",
    )
    await shortcut(dialog, "o")
    await expectPlacedMedia(page, editor, uploadUrl("A", 1))
  })
}

test("queued same-selection host edit blocks upload admission", async ({
  page,
}, info) => {
  const { editor, dialog, structuredBaseline } = await prepare(page, true)

  if (!structuredBaseline) throw new Error("Missing structured baseline")

  const check = page.locator('[aria-label="Selection check"]')

  const selection = selectionSchema.parse(
    JSON.parse((await check.getAttribute("data-original-state")) ?? "null"),
  )

  await shortcut(dialog, "q")
  const evidence = dialog.getByLabel("Upload host evidence")
  await expect(evidence).toHaveAttribute("data-capture-mode", "edit")
  const path = info.outputPath(fixtureName)
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, fixtureBytes)
  const chooser = page.waitForEvent("filechooser")
  await dialog.getByLabel("Upload media").click()
  await (await chooser).setFiles(path)
  await expect(evidence).toHaveAttribute("data-change-trusted", "true")
  await expect(evidence).toHaveAttribute("data-capture-ran", "true")
  await expect(evidence).toHaveAttribute("data-capture-same-selection", "true")
  await expect(editor).toContainText("Changed heading")
  await snapshotFromEditor(page, check)
  const after = await captureState(check)
  expect(after.selection).toEqual(selection)
  expect(after.document).toEqual({
    ...structuredBaseline,
    root: {
      ...structuredBaseline.root,
      children: structuredBaseline.root.children.map((paragraph, index) =>
        index === 0
          ? {
              ...paragraph,
              children: paragraph.children.map((node) => ({
                ...node,
                text: "Changed heading",
              })),
            }
          : paragraph,
      ),
    },
  })
  await expect(evidence).toHaveAttribute("data-calls", "0")
  await expect(editor.locator('[data-slot="editor-media"]')).toHaveCount(0)
})

test("queued no-op permits a clean upload and pending host result", async ({
  page,
}, info) => {
  const { editor, dialog } = await prepare(page, true)
  await shortcut(dialog, "n")
  const evidence = dialog.getByLabel("Upload host evidence")
  await expect(evidence).toHaveAttribute("data-capture-mode", "noop")
  await chooseFile(page, dialog, info)
  await expect(evidence).toHaveAttribute("data-capture-ran", "true")
  await expect(evidence).toHaveAttribute("data-capture-same-selection", "true")
  await expect(evidence).toHaveAttribute("data-pending", "true")
  await expect(dialog.getByLabel("Upload media")).toBeDisabled()
  await shortcut(dialog, "o")
  await expect(dialog).toHaveCount(0)
  await expectPlacedMedia(page, editor, uploadUrl("A", 1))
})

test("trusted host veto preserves pending upload; allowed cancellation rejects late completion", async ({
  page,
}, info) => {
  const { editor, dialog } = await prepare(page)
  await chooseFile(page, dialog, info)
  const evidence = dialog.getByLabel("Upload host evidence")
  await expect(evidence).toHaveAttribute("data-calls", "1")
  await expect(evidence).toHaveAttribute("data-change-trusted", "true")
  await expect(evidence).toHaveAttribute("data-change-cancelable", "false")
  await expect(evidence).toHaveAttribute("data-input-trusted", "true")
  await expect(evidence).toHaveAttribute("data-input-cancelable", "false")
  await expect(evidence).toHaveAttribute("data-same-file", "true")
  await expect(evidence).toHaveAttribute("data-file-name-match", "true")
  await expect(evidence).toHaveAttribute("data-file-bytes-match", "true")
  await expect(evidence).toHaveAttribute("data-file-own-name", "false")
  await expect(page.locator("body")).not.toContainText(fixtureName)
  expect(await page.locator("body").innerHTML()).not.toContain(fixtureName)
  expect(await page.locator("body").innerHTML()).not.toContain(
    "bounded upload fixture",
  )
  await expect(evidence).toHaveAttribute("data-shortcut-trusted", "true")
  await expect(evidence).toHaveAttribute("data-pending", "true")

  const pendingReport = await new AxeBuilder({ page })
    .include('[role="dialog"]')
    .analyze()

  await info.attach("upload-pending-axe", {
    body: JSON.stringify(pendingReport),
    contentType: "application/json",
  })

  expect(pendingReport.violations).toEqual([])
  const pendingPageReport = await new AxeBuilder({ page }).analyze()
  await info.attach("upload-pending-page-axe", {
    body: JSON.stringify(pendingPageReport),
    contentType: "application/json",
  })
  expect(pendingPageReport.violations).toEqual([])
  await shortcut(dialog, "v")
  await dialog.getByRole("button", { name: "Cancel upload" }).click()
  await expect(evidence).toHaveAttribute("data-cancel-trusted", "true")
  await expect(evidence).toHaveAttribute("data-cancel-prevented", "true")
  await expect(evidence).toHaveAttribute("data-aborted", "false")
  await expect(evidence).toHaveAttribute("data-pending", "true")

  const firstDeliveries = await cancelDeliveries(evidence)

  await info.attach("first-cancel-event-identities", {
    body: JSON.stringify({
      native: JSON.parse(
        (await page.locator("html").getAttribute("data-native-cancel-ids")) ??
          "null",
      ),
      records: JSON.parse(
        (await evidence.getAttribute("data-cancel-records")) ?? "null",
      ),
    }),
    contentType: "application/json",
  })
  expect(firstDeliveries.length).toBeGreaterThan(0)
  expect(firstDeliveries.every((id) => id === 1)).toBe(true)
  await expect(evidence).toHaveAttribute(
    "data-cancel-count",
    String(firstDeliveries.length),
  )
  expect(
    JSON.parse((await evidence.getAttribute("data-cancel-records")) ?? "null"),
  ).toEqual(
    firstDeliveries.map((id) => ({
      id,
      trusted: true,
      cancelable: true,
      prevented: true,
    })),
  )
  await expect(page.locator("html")).toHaveAttribute(
    "data-native-cancel-ids",
    "[1]",
  )
  await expect(evidence).toHaveAttribute(
    "data-cancel-deliveries",
    String(firstDeliveries.length),
  )
  await expect(evidence).toHaveAttribute("data-cancel-cancelable", "true")
  await expect(
    dialog.getByRole("button", { name: "Cancel upload" }),
  ).toBeVisible()
  await shortcut(dialog, "v")
  await dialog.getByRole("button", { name: "Cancel upload" }).click()
  await expect(evidence).toHaveAttribute("data-aborted", "true")

  const deliveries = await cancelDeliveries(evidence)

  await info.attach("cancel-event-identities", {
    body: JSON.stringify({
      native: JSON.parse(
        (await page.locator("html").getAttribute("data-native-cancel-ids")) ??
          "null",
      ),
      records: JSON.parse(
        (await evidence.getAttribute("data-cancel-records")) ?? "null",
      ),
    }),
    contentType: "application/json",
  })
  expect(deliveries.slice(0, firstDeliveries.length)).toEqual(firstDeliveries)
  expect(deliveries.length).toBeGreaterThan(firstDeliveries.length)
  expect(deliveries.slice(firstDeliveries.length).every((id) => id === 2)).toBe(
    true,
  )
  await expect(evidence).toHaveAttribute(
    "data-cancel-count",
    String(deliveries.length),
  )
  expect(
    JSON.parse((await evidence.getAttribute("data-cancel-records")) ?? "null"),
  ).toEqual(
    deliveries.map((id) => ({
      id,
      trusted: true,
      cancelable: true,
      prevented: id === 1,
    })),
  )
  await expect(page.locator("html")).toHaveAttribute(
    "data-native-cancel-ids",
    "[1,2]",
  )
  await expect(evidence).toHaveAttribute(
    "data-cancel-deliveries",
    String(deliveries.length),
  )
  expect(
    deliveries
      .slice(firstDeliveries.length)
      .every((id) => id !== firstDeliveries[0]),
  ).toBe(true)
  await expect(evidence).toHaveAttribute("data-cancel-trusted", "true")
  await expect(evidence).toHaveAttribute("data-cancel-prevented", "false")
  await expect(dialog.getByLabel("Upload media")).toBeDisabled()
  await shortcut(dialog, "o")
  await expect(dialog.getByLabel("Upload media")).toBeEnabled()
  await expect(evidence).toHaveAttribute("data-pending", "false")
  await expect(evidence).toHaveAttribute("data-file-unchanged", "true")
  await expect(dialog).toBeVisible()
  await expectNoMedia(editor)

  const report = await new AxeBuilder({ page })
    .include('[role="dialog"]')
    .analyze()

  await info.attach("upload-dialog-axe", {
    body: JSON.stringify(report),
    contentType: "application/json",
  })
  expect(report.violations).toEqual([])
})

test("public preview URL, dialog, and copied source remain usable", async ({
  page,
  context,
}, info) => {
  await page.goto("/editor/media-insert-control")
  await expect(
    page.getByRole("button", { name: "Enable simulated upload" }),
  ).toHaveCount(0)
  await expect(page.getByLabel("Upload host evidence")).toHaveCount(0)
  const report = await new AxeBuilder({ page }).analyze()

  await info.attach("default-preview-axe", {
    body: JSON.stringify(report),
    contentType: "application/json",
  })

  expect(report.violations).toEqual([])

  const editor = page.locator(
    'section[aria-label="Media editor"] [data-slot="editor-content"]',
  )

  await expect(editor).toHaveCount(1)
  await expect(editor).toBeVisible()
  await editor.fill(original)
  await editor.press("End")
  await page.getByRole("button", { name: "Insert file", exact: true }).click()
  const dialog = page.getByRole("dialog", { name: "Insert file", exact: true })
  const input = dialog.getByLabel("Media URL")
  await expect(dialog).toBeVisible()
  await expect(page.getByLabel("Upload media")).toHaveCount(0)
  const dialogReport = await new AxeBuilder({ page }).analyze()
  await info.attach("public-open-dialog-axe", {
    body: JSON.stringify(dialogReport),
    contentType: "application/json",
  })
  expect(dialogReport.violations).toEqual([])
  await input.fill("https://media.test/public.txt?token=secret")
  await input.press("Enter")
  await expect(input).toHaveAttribute("aria-invalid", "true")
  await expect(editor).toHaveCount(1)
  await expect(editor).toBeAttached()
  await expect(editor.locator('[data-slot="editor-media"]')).toHaveCount(0)
  await input.press("Escape")
  await expect(dialog).toHaveCount(0)
  await expect(editor).toBeFocused()
  await page.getByRole("button", { name: "Insert file", exact: true }).click()
  await input.fill("https://media.test/public.txt")
  await input.press("Enter")
  await expect(dialog).toHaveCount(0)
  await expect(
    editor.locator('a[href="https://media.test/public.txt"]'),
  ).toHaveCount(1)
  await expect(editor).toBeFocused()
  await context.grantPermissions(["clipboard-read", "clipboard-write"])
  await page.evaluate(() => navigator.clipboard.writeText("Clipboard sentinel"))
  await page
    .getByRole("button", { name: "Copy MediaInsertControl usage", exact: true })
    .click()
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .not.toBe("Clipboard sentinel")
  const source = await page.evaluate(() => navigator.clipboard.readText())
  expect(source).toContain("MediaInsertControl")
  expect(source).toContain("@/components/editor/media")
  expect(source).not.toMatch(/@workspace|@registry|@yopem-ui|catalog\//u)
})

test("late completion cannot change a new URL session", async ({
  page,
}, info) => {
  const { editor, dialog } = await prepare(page)
  await chooseFile(page, dialog, info)
  await expect(editor).toHaveCount(1)
  const before = await editor.innerHTML()
  await dialog.getByLabel("Media URL").press("Escape")
  await expect(dialog).toHaveCount(0)
  await selectNewNativeTarget(page, editor)
  await page.getByRole("button", { name: "Insert file", exact: true }).click()
  const input = dialog.getByLabel("Media URL")
  await input.fill("https://media.test/new-session.txt")
  await shortcut(dialog, "h")
  const evidence = dialog.getByLabel("Upload host evidence")
  await expect(evidence).toHaveAttribute("data-pending", "true")
  await expect(dialog.getByLabel("Upload media")).toBeDisabled()
  await shortcut(dialog, "o")
  await expect(evidence).toHaveAttribute("data-pending", "false")
  await expect(dialog.getByLabel("Upload media")).toBeEnabled()
  await expect(dialog).toBeVisible()
  await expect(input).toHaveValue("https://media.test/new-session.txt")
  await expect(input).toBeFocused()
  expect(await editor.innerHTML()).toBe(before)
  await expectNoMedia(editor)
  await input.press("Escape")
  await freshUpload(page, editor, info)
})

test("stale result preserves structured document, changed selection, focus, and history", async ({
  page,
}, info) => {
  const { editor, dialog, structuredBaseline } = await prepare(page, true)

  if (!structuredBaseline) throw new Error("Missing structured baseline")
  await chooseFile(page, dialog, info)
  const input = dialog.getByLabel("Media URL")
  const check = page.locator('[aria-label="Selection check"]')

  const originalSelection = selectionSchema.parse(
    JSON.parse((await check.getAttribute("data-original-state")) ?? "null"),
  )

  expect(originalSelection.text).toBe("selected")
  await shortcut(dialog, "s")
  await shortcut(dialog, "c")
  await expect(check).toHaveAttribute("data-original-selected", "true")
  await expect(check).toHaveAttribute("data-check-valid", "true")
  await expect(editor).toHaveCount(1)
  await snapshotFromEditor(page, check)
  const before = await captureState(check)
  expect(before.document).toEqual(structuredBaseline)
  expect(before.selection?.text).toBe("after")
  expect(before.selection).not.toEqual(originalSelection)
  await expect(
    dialog.getByRole("button", { name: "Insert", exact: true }),
  ).toBeDisabled()
  await expect(dialog.getByLabel("Upload media")).toBeDisabled()
  await expect(input).toBeFocused()
  const selectionAtDecision = await captureBrowserSelection(page)
  const checkId = Number(await check.getAttribute("data-check-id"))
  await shortcut(dialog, "o")
  await page.evaluate(
    () => new Promise<void>((resolve) => setTimeout(resolve, 0)),
  )
  await expect(dialog).toBeVisible()
  await expect(input).toBeFocused()
  await expect(dialog.getByLabel("Media upload")).toHaveCount(0)
  await expect(
    dialog.getByRole("button", { name: "Insert", exact: true }),
  ).toBeDisabled()
  await expect(dialog.getByLabel("Upload media")).toBeDisabled()
  await shortcut(dialog, "c")
  await expect
    .poll(async () => Number(await check.getAttribute("data-check-id")))
    .toBeGreaterThan(checkId)
  await expect(check).toHaveAttribute("data-check-valid", "true")
  await snapshotFromEditor(page, check)
  expect(await captureState(check)).toEqual(before)
  expect(await captureBrowserSelection(page)).toEqual(selectionAtDecision)
  await expect(editor.locator('[data-slot="editor-media"]')).toHaveCount(0)
  await input.press("Escape")
  await expect(dialog).toHaveCount(0)
  const freshTarget = await selectNewNativeTarget(page, editor, "after")
  expect(freshTarget.document).toEqual(before.document)
  await page.getByRole("button", { name: "Insert file", exact: true }).click()
  await shortcut(dialog, "h")
  expect(
    JSON.parse((await check.getAttribute("data-original-state")) ?? "null"),
  ).toEqual(freshTarget.selection)
  const browserSelection = await captureBrowserSelection(page)
  await expect(dialog.getByLabel("Upload media")).toBeEnabled()
  await snapshotFromEditor(page, check)
  expect(await captureState(check)).toEqual(freshTarget)
  expect(await captureBrowserSelection(page)).toEqual(browserSelection)
  await expect(input).toBeFocused()
  await expect(editor.locator('[data-slot="editor-media"]')).toHaveCount(0)
  await input.fill("https://media.test/fresh-selection.txt")
  await input.press("Enter")
  await expect(dialog).toHaveCount(0)
  const freshMedia = editor.locator('[data-slot="editor-media"]')
  await expect(
    freshMedia.locator('a[href="https://media.test/fresh-selection.txt"]'),
  ).toHaveCount(1)

  const insertedDocument = await expectPlacedMedia(
    page,
    editor,
    "https://media.test/fresh-selection.txt",
  )

  await editor.press("ControlOrMeta+z")
  await expect(freshMedia).toHaveCount(0)
  await snapshotFromEditor(page, check)
  expect((await captureState(check)).document).toEqual(before.document)
  await editor.press("ControlOrMeta+Shift+z")
  await snapshotFromEditor(page, check)
  expect((await captureState(check)).document).toEqual(insertedDocument)
  await editor.press("ControlOrMeta+z")
  await snapshotFromEditor(page, check)
  expect((await captureState(check)).document).toEqual(before.document)
  await selectNewNativeTarget(page, editor, "after")
  await page.keyboard.type("DEMO")
  await expect(editor).toContainText("Before selected DEMO")
  await snapshotFromEditor(page, check)

  const changedDocument = {
    ...structuredBaseline,
    root: {
      ...structuredBaseline.root,
      children: structuredBaseline.root.children.map((paragraph, index) =>
        index === 1
          ? {
              ...paragraph,
              children: paragraph.children.map((node) => ({
                ...node,
                text: "Before selected DEMO",
              })),
            }
          : paragraph,
      ),
    },
  }

  const intermediateDocument = {
    ...changedDocument,
    root: {
      ...changedDocument.root,
      children: changedDocument.root.children.map((paragraph, index) =>
        index === 1
          ? {
              ...paragraph,
              children: paragraph.children.map((node) => ({
                ...node,
                text: "Before selected D",
              })),
            }
          : paragraph,
      ),
    },
  }

  expect((await captureState(check)).document).toEqual(changedDocument)
  await editor.focus()
  await editor.press("ControlOrMeta+z")
  await snapshotFromEditor(page, check)
  const firstUndo = (await captureState(check)).document
  await info.attach("replacement-first-undo-document", {
    body: JSON.stringify(firstUndo),
    contentType: "application/json",
  })
  expect(firstUndo).toEqual(intermediateDocument)
  await editor.press("ControlOrMeta+z")
  await snapshotFromEditor(page, check)
  expect((await captureState(check)).document).toEqual(before.document)
  await editor.press("ControlOrMeta+Shift+z")
  await snapshotFromEditor(page, check)
  expect((await captureState(check)).document).toEqual(intermediateDocument)
  await editor.press("ControlOrMeta+Shift+z")
  await snapshotFromEditor(page, check)
  expect((await captureState(check)).document).toEqual(changedDocument)
  await editor.press("ControlOrMeta+z")
  await snapshotFromEditor(page, check)
  expect((await captureState(check)).document).toEqual(intermediateDocument)
  await editor.press("ControlOrMeta+z")
  await snapshotFromEditor(page, check)
  expect((await captureState(check)).document).toEqual(before.document)
  await editor.press("ControlOrMeta+Shift+z")
  await snapshotFromEditor(page, check)
  expect((await captureState(check)).document).toEqual(intermediateDocument)
  await editor.press("ControlOrMeta+Shift+z")
  await snapshotFromEditor(page, check)
  expect((await captureState(check)).document).toEqual(changedDocument)
})

test("dirty document rejects an old upload with its original selection intact", async ({
  page,
}, info) => {
  const { editor, dialog, structuredBaseline } = await prepare(page, true)

  if (!structuredBaseline) throw new Error("Missing structured baseline")
  await chooseFile(page, dialog, info)
  const check = page.locator('[aria-label="Selection check"]')

  const originalSelection = selectionSchema.parse(
    JSON.parse((await check.getAttribute("data-original-state")) ?? "null"),
  )

  expect(originalSelection.text).toBe("selected")
  await shortcut(dialog, "t")
  await snapshotFromEditor(page, check)
  const before = await captureState(check)

  const changedDocument = {
    ...structuredBaseline,
    root: {
      ...structuredBaseline.root,
      children: structuredBaseline.root.children.map((paragraph, index) =>
        index === 0
          ? {
              ...paragraph,
              children: paragraph.children.map((node) => ({
                ...node,
                text: "Changed heading",
              })),
            }
          : paragraph,
      ),
    },
  }

  expect(before.document).toEqual(changedDocument)
  expect(before.selection).toEqual(originalSelection)
  const input = dialog.getByLabel("Media URL")
  await expect(input).toBeFocused()
  await expect(
    dialog.getByRole("button", { name: "Insert", exact: true }),
  ).toBeDisabled()
  await expect(dialog.getByLabel("Upload media")).toBeDisabled()
  await shortcut(dialog, "o")
  await page.evaluate(
    () => new Promise<void>((resolve) => setTimeout(resolve, 0)),
  )
  await expect(dialog).toBeVisible()
  await expect(input).toBeFocused()
  await expect(dialog.getByLabel("Media upload")).toHaveCount(0)
  await expect(
    dialog.getByRole("button", { name: "Insert", exact: true }),
  ).toBeDisabled()
  await expect(dialog.getByLabel("Upload media")).toBeDisabled()
  await snapshotFromEditor(page, check)
  expect(await captureState(check)).toEqual(before)
  await expect(editor).toHaveCount(1)
  await expect(editor.locator('[data-slot="editor-media"]')).toHaveCount(0)
  await input.press("Escape")
  await expect(dialog).toHaveCount(0)
  await page.getByRole("button", { name: "Insert file", exact: true }).click()
  await expect(dialog.getByLabel("Upload media")).toBeEnabled()
  await dialog.getByLabel("Media URL").press("Escape")
  await editor.focus()
  await editor.press("ControlOrMeta+z")
  await snapshotFromEditor(page, check)
  expect((await captureState(check)).document).toEqual(structuredBaseline)
  await editor.press("ControlOrMeta+Shift+z")
  await snapshotFromEditor(page, check)
  expect((await captureState(check)).document).toEqual(changedDocument)
})

test("changed document rejects old result without changing structured history", async ({
  page,
}, info) => {
  const { editor, dialog } = await prepare(page)
  await chooseFile(page, dialog, info)
  const check = page.locator('[aria-label="Selection check"]')

  const originalSelection = selectionSchema.parse(
    JSON.parse((await check.getAttribute("data-original-state")) ?? "null"),
  )

  expect(originalSelection.text).toBe("selected")
  await snapshotFromEditor(page, check)
  const originalDocument = (await captureState(check)).document
  await shortcut(dialog, "k")
  await shortcut(dialog, "s")
  await shortcut(dialog, "c")
  await expect(check).toHaveAttribute("data-original-selected", "true")
  await expect(check).toHaveAttribute("data-check-valid", "true")
  await snapshotFromEditor(page, check)
  const changed = await captureState(check)
  expect(changed.document).toEqual(selectedStructuredDocument)
  expect(changed.selection?.text).toBe("after")
  expect(changed.selection).not.toEqual(originalSelection)
  const input = dialog.getByLabel("Media URL")
  await expect(
    dialog.getByRole("button", { name: "Insert", exact: true }),
  ).toBeDisabled()
  await expect(dialog.getByLabel("Upload media")).toBeDisabled()
  await expect(input).toBeFocused()
  const selectionAtDecision = await captureBrowserSelection(page)
  const checkId = Number(await check.getAttribute("data-check-id"))
  await shortcut(dialog, "o")
  await page.evaluate(
    () => new Promise<void>((resolve) => setTimeout(resolve, 0)),
  )
  await expect(dialog).toBeVisible()
  await expect(input).toBeFocused()
  await expect(dialog.getByLabel("Media upload")).toHaveCount(0)
  await expect(
    dialog.getByRole("button", { name: "Insert", exact: true }),
  ).toBeDisabled()
  await expect(dialog.getByLabel("Upload media")).toBeDisabled()
  await shortcut(dialog, "c")
  await expect
    .poll(async () => Number(await check.getAttribute("data-check-id")))
    .toBeGreaterThan(checkId)
  await expect(check).toHaveAttribute("data-check-valid", "true")
  await snapshotFromEditor(page, check)
  expect(await captureState(check)).toEqual(changed)
  expect(await captureBrowserSelection(page)).toEqual(selectionAtDecision)
  await expect(editor).toHaveCount(1)
  await expect(editor.locator('[data-slot="editor-media"]')).toHaveCount(0)
  await input.press("Escape")
  await expect(dialog).toHaveCount(0)
  const freshTarget = await selectNewNativeTarget(page, editor, "after")
  expect(freshTarget.document).toEqual(changed.document)
  await page.getByRole("button", { name: "Insert file", exact: true }).click()
  await shortcut(dialog, "h")
  expect(
    JSON.parse((await check.getAttribute("data-original-state")) ?? "null"),
  ).toEqual(freshTarget.selection)
  await snapshotFromEditor(page, check)
  const before = await captureState(check)
  expect(before).toEqual(freshTarget)
  const browserSelection = await captureBrowserSelection(page)
  await expect(dialog.getByLabel("Upload media")).toBeEnabled()
  await snapshotFromEditor(page, check)
  expect(await captureState(check)).toEqual(before)
  expect(await captureBrowserSelection(page)).toEqual(browserSelection)
  await expect(dialog.getByLabel("Media URL")).toBeFocused()
  await expect(editor.locator('[data-slot="editor-media"]')).toHaveCount(0)
  await dialog
    .getByLabel("Media URL")
    .fill("https://media.test/fresh-document.txt")
  await dialog.getByLabel("Media URL").press("Enter")
  await expect(dialog).toHaveCount(0)
  const freshMedia = editor.locator('[data-slot="editor-media"]')
  await expect(
    freshMedia.locator('a[href="https://media.test/fresh-document.txt"]'),
  ).toHaveCount(1)

  const insertedDocument = await expectPlacedMedia(
    page,
    editor,
    "https://media.test/fresh-document.txt",
  )

  await editor.press("ControlOrMeta+z")
  await expect(freshMedia).toHaveCount(0)
  await snapshotFromEditor(page, check)
  expect((await captureState(check)).document).toEqual(changed.document)
  await editor.press("ControlOrMeta+z")
  await snapshotFromEditor(page, check)
  expect((await captureState(check)).document).toEqual(originalDocument)
  await editor.press("ControlOrMeta+Shift+z")
  await snapshotFromEditor(page, check)
  expect((await captureState(check)).document).toEqual(changed.document)
  await editor.press("ControlOrMeta+Shift+z")
  await snapshotFromEditor(page, check)
  expect((await captureState(check)).document).toEqual(insertedDocument)
})

test("prevented trusted shortcut does not change host configuration", async ({
  page,
}) => {
  const { editor, dialog } = await prepare(page)
  const input = dialog.getByLabel("Media URL")

  await input.evaluate((element) => {
    element.addEventListener("keydown", (event) => {
      if (
        event instanceof KeyboardEvent &&
        event.ctrlKey &&
        event.altKey &&
        event.code === "KeyB"
      ) {
        element.setAttribute("data-veto-trusted", String(event.isTrusted))
        event.preventDefault()
        element.setAttribute(
          "data-veto-prevented",
          String(event.defaultPrevented),
        )
      }
    })
  })
  await shortcut(dialog, "b")
  await expect(input).toHaveAttribute("data-veto-trusted", "true")
  await expect(input).toHaveAttribute("data-veto-prevented", "true")
  await expect(dialog.getByLabel("Upload host evidence")).toHaveAttribute(
    "data-config",
    "A",
  )
  await expectNoMedia(editor)
})

for (const [action, key] of [
  ["replaced", "b"],
  ["removed", "d"],
] as const) {
  test(`committed callback ${action} rejects old result and fresh upload works`, async ({
    page,
  }, info) => {
    const { editor, dialog } = await prepare(page)
    await chooseFile(page, dialog, info)
    const evidence = dialog.getByLabel("Upload host evidence")
    await expect(evidence).toHaveAttribute("data-invoked", "A")
    const input = dialog.getByLabel("Media URL")
    const check = page.locator('[aria-label="Selection check"]')
    await snapshotFromEditor(page, check)
    const before = await captureState(check)
    expect(before.selection?.text).toBe("selected")
    await expect(check).toHaveAttribute("data-selection-in-editor", "true")
    const browserSelection = await captureBrowserSelection(page)
    expect(browserSelection).not.toBeNull()
    await expect(input).toBeFocused()
    await expect(evidence).toHaveAttribute("data-pending", "true")
    await expect(evidence).toHaveAttribute("data-aborted", "false")
    await shortcut(dialog, key)
    await expect(evidence).toHaveAttribute(
      "data-config",
      action === "removed" ? "none" : "B",
    )
    await expect(evidence).toHaveAttribute("data-aborted", "true")
    await expect(evidence).toHaveAttribute("data-pending", "true")
    await expect(dialog).toBeVisible()
    await expect(input).toBeFocused()
    await expect(
      dialog.getByRole("button", { name: "Insert", exact: true }),
    ).toBeDisabled()

    if (action === "removed")
      await expect(dialog.getByLabel("Upload media")).toHaveCount(0)
    else await expect(dialog.getByLabel("Upload media")).toBeDisabled()
    await snapshotFromEditor(page, check)
    expect(await captureState(check)).toEqual(before)
    expect(await captureBrowserSelection(page)).toEqual(browserSelection)
    await shortcut(dialog, "o")
    await expect(evidence).toHaveAttribute("data-pending", "false")
    await expect(evidence).toHaveAttribute("data-result-id", "1")
    await expect(evidence).toHaveAttribute("data-aborted", "true")
    await expect(dialog).toBeVisible()
    await expect(input).toBeFocused()
    await snapshotFromEditor(page, check)
    expect(await captureState(check)).toEqual(before)
    expect(await captureBrowserSelection(page)).toEqual(browserSelection)
    await expectNoMedia(editor)
    await expect(editor.locator(`a[href="${uploadUrl("A", 1)}"]`)).toHaveCount(
      0,
    )
    await dialog.getByLabel("Media URL").press("Escape")
    await expect(dialog).toHaveCount(0)
    await freshUpload(page, editor, info)
  })
}

test("failure and invalid URL permit same-file retry without insertion or requests", async ({
  page,
}, info) => {
  const requests: string[] = []
  let overflow = false
  const { editor, dialog } = await prepare(page)
  page.on("request", (request) => {
    if (requests.length < 100) requests.push(request.url())
    else overflow = true
  })
  const evidence = dialog.getByLabel("Upload host evidence")
  await chooseFile(page, dialog, info)
  await expect(dialog.getByLabel("Upload media")).toBeDisabled()
  await shortcut(dialog, "f")
  await expect(dialog.getByLabel("Upload media")).toBeEnabled()
  await expect(dialog.getByRole("alert")).toContainText("Upload failed")

  const failureReport = await new AxeBuilder({ page })
    .include('[role="dialog"]')
    .analyze()

  await info.attach("upload-failure-axe", {
    body: JSON.stringify(failureReport),
    contentType: "application/json",
  })

  expect(failureReport.violations).toEqual([])
  const failurePageReport = await new AxeBuilder({ page }).analyze()
  await info.attach("upload-failure-page-axe", {
    body: JSON.stringify(failurePageReport),
    contentType: "application/json",
  })
  expect(failurePageReport.violations).toEqual([])
  await expectNoMedia(editor)
  await chooseFile(page, dialog, info)
  await expect(evidence).toHaveAttribute("data-calls", "2")
  await expect(dialog.getByLabel("Upload media")).toBeDisabled()
  await shortcut(dialog, "i")
  await expect(evidence).toHaveAttribute("data-pending", "false")
  await expect(dialog.getByRole("alert")).toContainText("Upload failed")
  await expect(dialog.getByLabel("Upload media")).toBeEnabled()
  await expectNoMedia(editor)
  expect(overflow).toBe(false)
  expect(requests).toEqual([])
  await chooseFile(page, dialog, info)
  await expect(evidence).toHaveAttribute("data-calls", "3")
  await expect(dialog.getByLabel("Upload media")).toBeDisabled()
  await shortcut(dialog, "o")
  await expect(dialog).toHaveCount(0)
  await expect(editor.locator(`a[href="${uploadUrl("A", 3)}"]`)).toHaveCount(1)
  await expect(editor.locator(`a[href="${uploadUrl("A", 3)}"]`)).toHaveText(
    fixtureName,
  )
  await expect(page.getByLabel("Upload host evidence")).toHaveAttribute(
    "data-file-unchanged",
    "true",
  )
  await expectReleasedAfterInsertion(page, editor)
  expect(overflow).toBe(false)
  expect(requests).toEqual([])
})

for (const [scenario, key] of [
  ["read-only", "e"],
  ["root unmount", "u"],
  ["close", "Escape"],
] as const) {
  test(`${scenario} while upload is pending`, async ({ page }, info) => {
    const { editor, dialog } = await prepare(page)
    await chooseFile(page, dialog, info)

    if (key === "Escape") await dialog.getByLabel("Media URL").press(key)
    else await shortcut(dialog, key)

    if (key === "e") {
      await expect(editor).toHaveCount(1)
      await expect(editor).toHaveAttribute("contenteditable", "false")
      await shortcut(dialog, "e")
      await expect(editor).toHaveAttribute("contenteditable", "true")
    }

    if (key === "u") {
      await expect(editor).toHaveCount(0)
      await expect(
        page.getByRole("button", { name: "Restore demo editor" }),
      ).toBeFocused()
      await page.getByRole("button", { name: "Resolve upload" }).click()
      await expect(page.getByLabel("Upload host evidence")).toHaveAttribute(
        "data-result-id",
        "1",
      )
      await expect(page.getByLabel("Upload host evidence")).toHaveAttribute(
        "data-file-unchanged",
        "true",
      )
      await expect(page.getByLabel("Upload host evidence")).toHaveAttribute(
        "data-pending",
        "false",
      )
      await page.getByRole("button", { name: "Restore demo editor" }).click()
      await expect(editor).toHaveCount(1)
      await expect(editor.locator('[data-slot="editor-media"]')).toHaveCount(0)
      await editor.click()
      await expect(editor).toBeFocused()
    } else {
      if (key === "e") await dialog.getByLabel("Media URL").press("Escape")
      await expect(dialog).toHaveCount(0)
      await page
        .getByRole("button", { name: "Insert file", exact: true })
        .click()
      await shortcut(dialog, "h")
      await expect(dialog.getByLabel("Upload media")).toBeDisabled()
      await shortcut(dialog, "o")
      await expect(dialog.getByLabel("Upload media")).toBeEnabled()
      await expectNoMedia(editor)
    }
  })
}
