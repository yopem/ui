import AxeBuilder from "@axe-core/playwright"
import {
  expect,
  test,
  type Locator,
  type Page,
  type TestInfo,
} from "@playwright/test"
import { z } from "zod"

const storagePrefix = "yopem-ui:notion-like:v1:document:"

const knownPages = [
  ["link", "Link"],
  ["mention", "Mention"],
  ["playground", "Playground"],
  ["ai", "AI"],
  ["copilot", "Copilot"],
  ["callout", "Callout"],
  ["equation", "Equation"],
  ["upload", "Upload"],
  ["slash-menu", "Slash Menu"],
  ["block-menu", "Block Menu"],
  ["floating-toolbar", "Floating Toolbar"],
  ["media-toolbar", "Media Toolbar"],
  ["table-of-contents", "Table of Contents"],
] as const

type KnownPageId = (typeof knownPages)[number][0]

type StorageFault = "getter" | "read" | "quota"

interface PersistenceAudit {
  writes: { key: string; value: string }[]
  prematureEditable: string[]
  unsafeMounted: boolean
}

declare global {
  interface Window {
    potionPersistenceAudit?: PersistenceAudit
  }
}

const runtimeErrors = new WeakMap<Page, string[]>()

const element = { version: 1, direction: null, format: "", indent: 0 }

function text(value: string) {
  return {
    type: "text",
    version: 1,
    text: value,
    detail: 0,
    format: 0,
    mode: "normal",
    style: "",
  }
}

function documentWith(
  children: unknown[],
  state?: Record<string, z.infer<ReturnType<typeof z.json>>>,
) {
  const root = { ...element, type: "root", children }

  return JSON.stringify({ root: state ? { ...root, $: state } : root })
}

function plainDocument(value: string) {
  return documentWith([
    { ...element, type: "paragraph", children: [text(value)] },
  ])
}

async function installStorage(
  page: Page,
  entries: [string, string][] = [],
  fault?: StorageFault,
  expectedInitialText?: string,
) {
  await page.addInitScript(
    ({ prefix, saved, failure, expectedText }) => {
      if (!location.protocol.startsWith("http")) return
      const storage = window.localStorage

      const seedFlag = `${prefix}e2e-seeded`

      if (sessionStorage.getItem(seedFlag) !== "true") {
        for (const [key, value] of saved) storage.setItem(key, value)
        sessionStorage.setItem(seedFlag, "true")
      }

      const audit: PersistenceAudit = {
        writes: [],
        prematureEditable: [],
        unsafeMounted: false,
      }

      window.potionPersistenceAudit = audit
      const getItem = Storage.prototype.getItem.bind(storage)
      const setItem = Storage.prototype.setItem.bind(storage)
      const sessionGetItem = Storage.prototype.getItem.bind(sessionStorage)
      const sessionSetItem = Storage.prototype.setItem.bind(sessionStorage)

      Storage.prototype.getItem = function getStoredItem(key: string) {
        if (this === storage && key.startsWith(prefix) && failure === "read")
          throw new DOMException("Blocked document storage", "SecurityError")

        return this === storage ? getItem(key) : sessionGetItem(key)
      }

      Storage.prototype.setItem = function setStoredItem(
        key: string,
        value: string,
      ) {
        if (this === storage && key.startsWith(prefix)) {
          if (failure === "quota")
            throw new DOMException(
              "Document quota exceeded",
              "QuotaExceededError",
            )
          audit.writes.push({ key, value })
        }

        if (this === storage) setItem(key, value)
        else sessionSetItem(key, value)
      }

      if (failure === "getter")
        Object.defineProperty(window, "localStorage", {
          configurable: true,
          get() {
            throw new DOMException("Blocked storage access", "SecurityError")
          },
        })

      new MutationObserver(() => {
        const editor = document.querySelector(
          '[data-testid="notion-like-workspace"] [role="textbox"][aria-label="Workspace document"]',
        )

        if (
          expectedText &&
          editor?.getAttribute("contenteditable") === "true" &&
          !editor.textContent?.includes(expectedText)
        )
          audit.prematureEditable.push(editor.textContent ?? "")

        if (editor?.textContent?.includes("rejected-draft-REA"))
          audit.unsafeMounted = true
      }).observe(document, {
        childList: true,
        subtree: true,
        attributes: true,
      })
    },
    {
      prefix: storagePrefix,
      saved: entries,
      failure: fault,
      expectedText: expectedInitialText,
    },
  )
}

async function openPreview(page: Page) {
  const example = page.getByTestId("editor-example-notion-like")
  await example
    .getByRole("button", { name: "Live preview", exact: true })
    .click()
  const workspace = example.getByTestId("notion-like-workspace")
  await expect(workspace).toBeVisible()

  return workspace
}

async function openWorkspace(page: Page) {
  await page.goto("/editor/examples#notion-like")

  return openPreview(page)
}

function nativeEditor(workspace: Locator) {
  return workspace.getByRole("textbox", {
    name: "Workspace document",
    exact: true,
  })
}

async function choosePage(page: Page, workspace: Locator, name: string) {
  const trigger = workspace.getByRole("button", {
    name: "Open workspace pages",
    exact: true,
  })

  const mobile = await trigger.isVisible()

  if (mobile) await trigger.click()

  const navigation = mobile
    ? page.getByRole("dialog", { name: "Workspace pages", exact: true })
    : workspace.getByTestId("workspace-sidebar")

  await navigation.getByRole("button", { name, exact: true }).click()
  await expect(
    page.getByRole("dialog", { name: "Workspace pages", exact: true }),
  ).toBeHidden()
  await expect(nativeEditor(workspace)).toHaveAttribute(
    "contenteditable",
    "true",
  )
}

async function appendText(page: Page, workspace: Locator, value: string) {
  const editor = nativeEditor(workspace)
  await expect(editor).toHaveAttribute("contenteditable", "true")
  await editor.click()
  await editor.press("ControlOrMeta+End")
  await page.keyboard.type(value)
  await expect(editor).toContainText(value.trim())
}

function storedDocument(page: Page, id: KnownPageId) {
  return page.evaluate(
    (key) => localStorage.getItem(key),
    `${storagePrefix}${id}`,
  )
}

async function copyDocument(page: Page, workspace: Locator) {
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"], {
    origin: new URL(page.url()).origin,
  })
  await page.evaluate(() => navigator.clipboard.writeText(""))
  await workspace
    .getByRole("button", { name: "Copy page JSON", exact: true })
    .click()
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .not.toBe("")
  const source = await page.evaluate(() => navigator.clipboard.readText())
  const value: unknown = JSON.parse(source)
  z.object({
    root: z.object({ type: z.literal("root"), children: z.array(z.unknown()) }),
  }).parse(value)

  return source
}

async function expectSaved(
  page: Page,
  workspace: Locator,
  id: KnownPageId,
  marker: string,
) {
  await expect.poll(() => storedDocument(page, id)).toContain(marker)
  await expect(
    workspace.getByRole("status", {
      name: "Document save status",
      exact: true,
    }),
  ).toHaveAttribute("data-save-state", "saved")
  const saved = await storedDocument(page, id)
  const copied = await copyDocument(page, workspace)
  const storedValue: unknown = JSON.parse(saved ?? "null")
  const copiedValue: unknown = JSON.parse(copied)
  expect(storedValue).toEqual(copiedValue)

  return copied
}

async function scanPage(page: Page, testInfo: TestInfo, name: string) {
  const report = await new AxeBuilder({ page }).analyze()
  await testInfo.attach(`${name}-whole-page-axe.json`, {
    body: JSON.stringify(report),
    contentType: "application/json",
  })
  expect(report.violations).toEqual([])
}

test.beforeEach(({ page }) => {
  const errors: string[] = []
  runtimeErrors.set(page, errors)
  page.on("pageerror", (error) => errors.push(error.message))
})

test.afterEach(async ({ page }, testInfo) => {
  const errors = runtimeErrors.get(page) ?? []
  await testInfo.attach("persistence-runtime-errors.json", {
    body: JSON.stringify(errors),
    contentType: "application/json",
  })
  expect(errors).toEqual([])
})

for (const [id, name] of knownPages) {
  test(`${name}: native document survives real reload; history starts empty`, async ({
    page,
  }, testInfo) => {
    await installStorage(page)
    let workspace = await openWorkspace(page)
    await choosePage(page, workspace, name)
    const marker = `persistence-${id}-REA`
    await appendText(page, workspace, ` ${marker}`)
    const before = await expectSaved(page, workspace, id, marker)
    await expect(
      workspace.getByRole("button", { name: "Undo", exact: true }),
    ).toBeEnabled()
    await page.reload()
    workspace = await openPreview(page)
    await choosePage(page, workspace, name)
    await expect(nativeEditor(workspace)).toContainText(marker)
    expect(await copyDocument(page, workspace)).toBe(before)
    await expect(
      workspace.getByRole("button", { name: "Undo", exact: true }),
    ).toBeDisabled()
    await expect(
      workspace.getByRole("button", { name: "Redo", exact: true }),
    ).toBeDisabled()
    await nativeEditor(workspace).press("ControlOrMeta+z")
    await expect(nativeEditor(workspace)).toContainText(marker)
    await testInfo.attach(`${id}-restored-document.json`, {
      body: before,
      contentType: "application/json",
    })
  })
}

const registeredFeatureDocuments = [
  {
    id: "mention",
    name: "Mention",
    source: documentWith([
      {
        ...element,
        type: "paragraph",
        children: [
          {
            ...text("@Ada Lovelace"),
            type: "mention",
            mode: "token",
            identity: { id: "docs-fixture-ada", label: "Ada Lovelace" },
          },
        ],
      },
      { ...element, type: "paragraph", children: [] },
    ]),
    selector: '[data-slot="editor-mention"]',
  },
  {
    id: "equation",
    name: "Equation",
    source: documentWith([
      {
        ...element,
        type: "paragraph",
        children: [
          { type: "editor-math", version: 1, kind: "inline", tex: "x^2" },
        ],
      },
      { type: "editor-math", version: 1, kind: "block", tex: "y^3" },
      { ...element, type: "paragraph", children: [] },
    ]),
    selector: '[data-editor-math="block"] math',
  },
  {
    id: "table-of-contents",
    name: "Table of Contents",
    source: documentWith([
      { type: "editor-toc", version: 1 },
      {
        ...element,
        type: "heading",
        tag: "h2",
        children: [text("Restored heading")],
      },
      { ...element, type: "paragraph", children: [] },
    ]),
    selector: "[data-editor-toc] a",
  },
  {
    id: "media-toolbar",
    name: "Media Toolbar",
    source: documentWith([
      {
        type: "yopem-media",
        version: 1,
        media: {
          kind: "image",
          url: "https://media.test/potion-restored.svg",
          alt: "Restored image",
          caption: "Restored caption",
          name: "File",
          width: 384,
          alignment: "end",
        },
      },
      { ...element, type: "paragraph", children: [] },
    ]),
    selector: '[data-slot="editor-media"] figcaption',
  },
] as const

for (const feature of registeredFeatureDocuments) {
  test(`${feature.name}: registered feature restores without initialization writes @a11y`, async ({
    page,
  }, testInfo) => {
    const source = ` \n${feature.source}\n `
    await installStorage(page, [[`${storagePrefix}${feature.id}`, source]])
    await page.route("https://media.test/**", (route) =>
      route.fulfill({
        contentType: "image/svg+xml",
        body: '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180"><rect width="320" height="180" fill="gray"/></svg>',
      }),
    )
    let workspace = await openWorkspace(page)
    await choosePage(page, workspace, feature.name)
    await expect(
      nativeEditor(workspace).locator(feature.selector),
    ).toBeVisible()
    expect(await storedDocument(page, feature.id)).toBe(source)
    expect(
      await page.evaluate(() => window.potionPersistenceAudit?.writes),
    ).toEqual([])
    await expect(
      workspace.getByRole("status", {
        name: "Document save status",
        exact: true,
      }),
    ).toHaveAttribute("data-save-state", "saved")
    await expect(
      workspace.getByRole("button", { name: "Undo", exact: true }),
    ).toBeDisabled()

    if (feature.id === "media-toolbar") {
      const editor = nativeEditor(workspace)
      const paragraph = editor.locator(":scope > p:last-child")
      await expect(paragraph).toHaveCount(1)
      await paragraph.click()
      await editor.press("ControlOrMeta+End")
      await expect(editor).toBeFocused()
      await expect
        .poll(() =>
          paragraph.evaluate((element) => {
            const selection = element.ownerDocument.getSelection()

            return (
              selection?.isCollapsed === true &&
              element.contains(selection.anchorNode) &&
              element.contains(selection.focusNode)
            )
          }),
        )
        .toBe(true)
      await page.keyboard.type(" registered-feature-REA")
      await expect(editor).toContainText("registered-feature-REA")
    } else {
      await appendText(page, workspace, " registered-feature-REA")
    }

    const saved = await expectSaved(
      page,
      workspace,
      feature.id,
      "registered-feature-REA",
    )

    await page.reload()
    workspace = await openPreview(page)
    await choosePage(page, workspace, feature.name)
    await expect(
      nativeEditor(workspace).locator(feature.selector),
    ).toBeVisible()
    expect(await copyDocument(page, workspace)).toBe(saved)
    await expect(
      workspace.getByRole("button", { name: "Undo", exact: true }),
    ).toBeDisabled()
    await scanPage(page, testInfo, `registered-${feature.id}`)
    await testInfo.attach(`${feature.id}-registered-restore.json`, {
      body: saved,
      contentType: "application/json",
    })
  })
}

test("AI and Slash Menu keep separate documents, including after preview unmount", async ({
  page,
}, testInfo) => {
  await installStorage(page)
  let workspace = await openWorkspace(page)
  await appendText(page, workspace, " AI-isolated-REA")
  const ai = await expectSaved(page, workspace, "ai", "AI-isolated-REA")
  await choosePage(page, workspace, "Slash Menu")
  await appendText(page, workspace, " slash-isolated-REA")

  const slash = await expectSaved(
    page,
    workspace,
    "slash-menu",
    "slash-isolated-REA",
  )

  await expect(nativeEditor(workspace)).not.toContainText("AI-isolated-REA")
  expect(await storedDocument(page, "ai")).toBe(ai)
  await page
    .getByTestId("editor-example-notion-like")
    .getByRole("button", { name: "Live preview", exact: true })
    .click()
  await expect(workspace).toHaveCount(0)
  workspace = await openPreview(page)
  await expect(nativeEditor(workspace)).toContainText("AI-isolated-REA")
  await page.reload()
  workspace = await openPreview(page)
  await expect(nativeEditor(workspace)).toContainText("AI-isolated-REA")
  await choosePage(page, workspace, "Slash Menu")
  expect(await copyDocument(page, workspace)).toBe(slash)
  expect(await storedDocument(page, "ai")).toBe(ai)
  await testInfo.attach("separate-page-documents.json", {
    body: JSON.stringify({ ai, slash }),
    contentType: "application/json",
  })
})

test("Playground: native task, table cell, formatting, undo and redo survive reload @a11y", async ({
  page,
}, testInfo) => {
  await installStorage(page)
  let workspace = await openWorkspace(page)
  await choosePage(page, workspace, "Playground")
  const editor = nativeEditor(workspace)
  const task = editor.getByRole("checkbox").first()
  await expect(task).not.toBeChecked()
  await task.focus()
  await task.press("Space")
  await expect(task).toBeChecked()
  const cell = editor.getByRole("cell").first()
  await cell.click()
  await page.keyboard.press("End")
  await page.keyboard.type(" cell-REA")
  await expect(cell).toContainText("cell-REA")
  await appendText(page, workspace, " formatted-REA")
  await editor.press("Home")
  await editor.press("Shift+End")
  await editor.press("ControlOrMeta+b")
  await expect(editor.locator("strong, b")).toContainText("formatted-REA")

  const before = await expectSaved(
    page,
    workspace,
    "playground",
    "formatted-REA",
  )

  await workspace.getByRole("button", { name: "Undo", exact: true }).click()
  await expect(editor.locator("strong, b")).toHaveCount(0)
  await workspace.getByRole("button", { name: "Redo", exact: true }).click()
  await expect(editor.locator("strong, b")).toContainText("formatted-REA")
  await expectSaved(page, workspace, "playground", "formatted-REA")
  await page.reload()
  workspace = await openPreview(page)
  await choosePage(page, workspace, "Playground")
  await expect(
    nativeEditor(workspace).getByRole("checkbox").first(),
  ).toBeChecked()
  await expect(nativeEditor(workspace).getByRole("cell").first()).toContainText(
    "cell-REA",
  )
  await expect(nativeEditor(workspace).locator("strong, b")).toContainText(
    "formatted-REA",
  )
  expect(await copyDocument(page, workspace)).toBe(before)
  await appendText(page, workspace, " history-after-reload-REA")
  await workspace.getByRole("button", { name: "Undo", exact: true }).click()
  await expect(nativeEditor(workspace)).not.toContainText(
    "history-after-reload-REA",
  )
  await workspace.getByRole("button", { name: "Redo", exact: true }).click()
  await expect(nativeEditor(workspace)).toContainText(
    "history-after-reload-REA",
  )
  await expectSaved(page, workspace, "playground", "history-after-reload-REA")
  await scanPage(page, testInfo, "restored-playground")
  await testInfo.attach("restored-playground.json", {
    body: before,
    contentType: "application/json",
  })
})

test("saved data wins hydration; no editable starter or initialization write", async ({
  page,
}, testInfo) => {
  const marker = "loaded-before-editable-REA"
  const source = ` \n${plainDocument(marker)}\n `
  const unknownKey = `${storagePrefix}not-a-known-page`
  const futureKey = "yopem-ui:notion-like:v2:document:ai"
  await installStorage(
    page,
    [
      [`${storagePrefix}ai`, source],
      [unknownKey, "unknown-page-sentinel"],
      [futureKey, "future-version-sentinel"],
    ],
    undefined,
    marker,
  )
  const scripts = Promise.withResolvers<void>()
  await page.route("**/assets/*.js", async (route) => {
    await scripts.promise
    await route.continue()
  })

  try {
    await page.goto("/editor/examples#notion-like", { waitUntil: "commit" })

    const editors = page
      .getByTestId("notion-like-workspace")
      .locator('[contenteditable="true"]')

    await expect(editors).toHaveCount(0)
    await page.keyboard.type("pre-ready-rejected-REA")
    scripts.resolve()
    const workspace = await openPreview(page)
    await expect(nativeEditor(workspace)).toHaveAttribute(
      "contenteditable",
      "true",
    )
    await expect(nativeEditor(workspace)).toHaveText(marker)
    expect(await storedDocument(page, "ai")).toBe(source)
    expect(await page.evaluate(() => window.potionPersistenceAudit)).toEqual({
      writes: [],
      prematureEditable: [],
      unsafeMounted: false,
    })
    await appendText(page, workspace, " accepted-after-ready-REA")

    const copied = await expectSaved(
      page,
      workspace,
      "ai",
      "accepted-after-ready-REA",
    )

    expect(copied).not.toContain("pre-ready-rejected-REA")
    expect(
      await page.evaluate(
        (keys) => keys.map((key) => localStorage.getItem(key)),
        [unknownKey, futureKey],
      ),
    ).toEqual(["unknown-page-sentinel", "future-version-sentinel"])
    await testInfo.attach("hydration-restored-document.json", {
      body: copied,
      contentType: "application/json",
    })
  } finally {
    scripts.resolve()
    await page.unrouteAll({ behavior: "wait" })
  }
})

type NestedBlock = typeof element & {
  type: "quote" | "paragraph"
  children: (NestedBlock | ReturnType<typeof text>)[]
}

let deepNode: NestedBlock = {
  ...element,
  type: "paragraph",
  children: [text("rejected-draft-REA")],
}

for (let depth = 0; depth < 65; depth += 1)
  deepNode = { ...element, type: "quote", children: [deepNode] }

const rejectedParagraph = {
  ...element,
  type: "paragraph",
  children: [text("rejected-draft-REA")],
}

const rejectedDocuments = [
  ["malformed", "{"],
  ["empty", ""],
  ["null-root", '{"root":null}'],
  ["unsupported-node", documentWith([{ type: "potion-unknown", version: 1 }])],
  [
    "unsupported-version",
    documentWith([
      {
        ...element,
        type: "paragraph",
        version: 2,
        children: [text("rejected-draft-REA")],
      },
    ]),
  ],
  [
    "unregistered-date",
    documentWith([
      {
        ...element,
        type: "paragraph",
        children: [{ type: "editor-date", version: 1, date: "2025-01-15" }],
      },
    ]),
  ],
  [
    "unsafe-url",
    documentWith([
      {
        ...element,
        type: "paragraph",
        children: [
          {
            ...element,
            type: "link",
            url: "javascript:alert('rejected-draft-REA')",
            children: [text("rejected-draft-REA")],
          },
        ],
      },
    ]),
  ],
  [
    "unsafe-style",
    documentWith([
      {
        ...element,
        type: "paragraph",
        children: [
          {
            ...text("rejected-draft-REA"),
            style:
              "background-image:url(https://potion-persistence-probe.invalid/leak)",
          },
        ],
      },
    ]),
  ],
  [
    "unsafe-key",
    documentWith([rejectedParagraph], { ["__proto__"]: { polluted: true } }),
  ],
  [
    "unregistered-slot",
    JSON.stringify({
      root: {
        ...element,
        type: "root",
        children: [rejectedParagraph],
        $slots: {
          hidden: {
            type: "editor-math",
            version: 1,
            kind: "block",
            tex: "x+1",
          },
        },
      },
    }),
  ],
  [
    "invalid-presentation-state",
    documentWith([
      {
        ...element,
        type: "paragraph",
        children: [text("rejected-draft-REA")],
        $: {
          editorBlockPresentation: { lineHeight: "900", textIndent: "0px" },
        },
      },
    ]),
  ],
  [
    "review-metadata",
    documentWith([rejectedParagraph], {
      yopemReview: { authorId: "untrusted" },
    }),
  ],
  [
    "private-node-state",
    documentWith([rejectedParagraph], {
      accessToken: "must-not-load",
      aiChat: [],
      files: [],
    }),
  ],
  [
    "non-document-envelope",
    JSON.stringify({
      root: { ...element, type: "root", children: [rejectedParagraph] },
      account: "must-not-load",
      aiChat: [],
      files: [],
    }),
  ],
  [
    "invalid-table",
    documentWith([
      {
        ...element,
        type: "table",
        children: [
          {
            ...element,
            type: "tablerow",
            children: [
              {
                ...element,
                type: "tablecell",
                headerState: 0,
                colSpan: 1,
                rowSpan: 1000,
                children: [{ ...element, type: "paragraph", children: [] }],
              },
            ],
          },
        ],
      },
    ]),
  ],
  ["excessive-depth", documentWith([deepNode])],
  [
    "structure-budget",
    documentWith([rejectedParagraph], {
      extra: Array.from({ length: 65_537 }, () => ({})),
    }),
  ],
  ["oversized-ascii", plainDocument("x".repeat(1_048_577))],
  ["oversized-utf8", plainDocument("€".repeat(400_000))],
] as const

for (const [name, source] of rejectedDocuments) {
  test(`reject ${name} before mount; retain bytes and usable memory draft @a11y`, async ({
    page,
  }, testInfo) => {
    await installStorage(page, [[`${storagePrefix}ai`, source]])
    const networkWrites: string[] = []
    const dialogs: string[] = []
    page.on("request", (request) => {
      if (
        !["GET", "HEAD"].includes(request.method()) ||
        request.resourceType() === "websocket" ||
        request.url().includes("potion-persistence-probe.invalid")
      )
        networkWrites.push(`${request.method()} ${request.url()}`)
    })
    page.on("dialog", async (dialog) => {
      dialogs.push(dialog.message())
      await dialog.dismiss()
    })
    let workspace = await openWorkspace(page)

    const status = workspace.getByRole("status", {
      name: "Document save status",
      exact: true,
    })

    await expect(status).toHaveAttribute("data-save-state", "rejected")
    await expect(
      workspace.getByRole("alert", {
        name: "Document storage error",
        exact: true,
      }),
    ).toBeVisible()
    await expect(nativeEditor(workspace)).not.toContainText(
      "rejected-draft-REA",
    )
    expect(await storedDocument(page, "ai")).toBe(source)
    expect(
      await page.evaluate(() => window.potionPersistenceAudit?.unsafeMounted),
    ).toBe(false)
    await scanPage(page, testInfo, `rejected-${name}`)
    await appendText(page, workspace, " memory-recovery-REA")
    const copied = await copyDocument(page, workspace)
    expect(copied).toContain("memory-recovery-REA")
    expect(copied).not.toContain("must-not-load")
    expect(
      await page.evaluate(() => window.potionPersistenceAudit?.unsafeMounted),
    ).toBe(false)
    expect(await storedDocument(page, "ai")).toBe(source)
    await choosePage(page, workspace, "Slash Menu")
    await appendText(page, workspace, " independent-safe-REA")
    await expectSaved(page, workspace, "slash-menu", "independent-safe-REA")
    await choosePage(page, workspace, "AI")
    await expect(nativeEditor(workspace)).toContainText("memory-recovery-REA")
    await page.reload()
    workspace = await openPreview(page)
    await expect(
      workspace.getByRole("status", {
        name: "Document save status",
        exact: true,
      }),
    ).toHaveAttribute("data-save-state", "rejected")
    expect(await storedDocument(page, "ai")).toBe(source)
    expect(
      await page.evaluate(() => window.potionPersistenceAudit?.writes ?? []),
    ).toEqual([])
    expect(
      await page.evaluate(() => Object.hasOwn(Object.prototype, "polluted")),
    ).toBe(false)
    expect(networkWrites).toEqual([])
    expect(dialogs).toEqual([])
    await testInfo.attach(`rejected-${name}-memory-copy.json`, {
      body: copied,
      contentType: "application/json",
    })
  })
}

for (const fault of ["getter", "read", "quota"] as const) {
  test(`${fault}: honest memory-only status; navigation and JSON copy work @a11y`, async ({
    page,
  }, testInfo) => {
    const source = plainDocument("last-durable-REA")
    await installStorage(page, [[`${storagePrefix}ai`, source]], fault)
    const workspace = await openWorkspace(page)
    await appendText(page, workspace, " unsaved-memory-REA")
    await expect(
      workspace.getByRole("status", {
        name: "Document save status",
        exact: true,
      }),
    ).toHaveAttribute("data-save-state", "memory-only")
    await expect(
      workspace.getByRole("alert", {
        name: "Document storage error",
        exact: true,
      }),
    ).toBeVisible()
    const copied = await copyDocument(page, workspace)
    expect(copied).toContain("unsaved-memory-REA")
    await choosePage(page, workspace, "Link")
    await appendText(page, workspace, " second-memory-REA")
    await choosePage(page, workspace, "AI")
    await expect(nativeEditor(workspace)).toContainText("unsaved-memory-REA")

    const docsGroup = page
      .getByRole("navigation", { name: "Documentation", exact: true })
      .getByRole("button", { name: "Media and drawings", exact: true })

    if (await docsGroup.isVisible()) await docsGroup.hover()

    await scanPage(page, testInfo, `memory-only-${fault}`)
    expect(
      await page.evaluate(() => window.potionPersistenceAudit?.writes ?? []),
    ).toEqual([])

    if (fault === "quota") {
      expect(await storedDocument(page, "ai")).toBe(source)
      await page.reload()
      const restored = await openPreview(page)
      await expect(nativeEditor(restored)).toHaveText("last-durable-REA")
    }

    await testInfo.attach(`${fault}-memory-copy.json`, {
      body: copied,
      contentType: "application/json",
    })
  })
}

for (const exit of ["switch", "unmount", "navigation"] as const) {
  test(`latest native input flushes on immediate ${exit}`, async ({
    page,
  }, testInfo) => {
    await installStorage(page)
    let workspace = await openWorkspace(page)
    const editor = nativeEditor(workspace)
    await expect(editor).toHaveAttribute("contenteditable", "true")
    await editor.click()
    await editor.press("ControlOrMeta+End")
    await page.keyboard.type(` immediate-${exit}-REA`)

    if (exit === "switch") {
      await choosePage(page, workspace, "Link")
      await choosePage(page, workspace, "AI")
    } else if (exit === "unmount") {
      await page
        .getByTestId("editor-example-notion-like")
        .getByRole("button", { name: "Live preview", exact: true })
        .click()
      await expect(workspace).toHaveCount(0)
      workspace = await openPreview(page)
    } else {
      await page.goto("/editor/examples")
      await page.goto("/editor/examples#notion-like")
      workspace = await openPreview(page)
    }

    await expect(nativeEditor(workspace)).toContainText(`immediate-${exit}-REA`)
    await page.reload()
    workspace = await openPreview(page)
    await expect(nativeEditor(workspace)).toContainText(`immediate-${exit}-REA`)

    const source = await expectSaved(
      page,
      workspace,
      "ai",
      `immediate-${exit}-REA`,
    )

    await testInfo.attach(`${exit}-flushed-document.json`, {
      body: source,
      contentType: "application/json",
    })
  })
}
