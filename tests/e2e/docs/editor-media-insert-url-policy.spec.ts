import type { Locator, Page } from "@playwright/test"

import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

const cases = [
  {
    label: "image",
    url: "https://media.test/url-policy/image.svg",
    tag: "img",
  },
  {
    label: "video",
    url: "https://media.test/url-policy/video.webm",
    tag: "video",
  },
  {
    label: "audio",
    url: "https://media.test/url-policy/audio.wav",
    tag: "audio",
  },
  { label: "file", url: "https://media.test/url-policy/file.txt", tag: "a" },
  {
    label: "embed",
    url: "https://vimeo.com/987654321",
    source: "https://player.vimeo.com/video/987654321",
    tag: "a",
  },
  {
    label: "tweet",
    url: "https://twitter.com/YopemUI/status/987654321",
    source: "https://x.com/YopemUI/status/987654321",
    tag: "a",
  },
  {
    label: "iframe",
    url: "https://embed.example.com/url-policy/frame",
    tag: "a",
  },
] as const

interface MediaEscapeTargetRecord {
  type: string
  key: string
  isTrusted: boolean
  cancelable: boolean
  eventPhase: number
  defaultPreventedBefore: boolean
  defaultPreventedAfter: boolean
}

interface MediaSelectionRecord {
  label: string
  event?: {
    type: string
    trusted: boolean
    key: string | null
    defaultPrevented: boolean
    targetIsNoSubmitForm: boolean
  }
}

declare global {
  interface Window {
    mediaHostSubmitEvidence?: {
      mark: (stage: "initial" | "retry") => void
      stop: () => object
    }
    mediaSelectionEvidence: {
      records: MediaSelectionRecord[]
      dropped: number
      escapeTargetRecords: MediaEscapeTargetRecord[]
      mark: (label: string) => void
      noSubmitForm: HTMLFormElement | null
      stop: () => void
      signal: AbortSignal
    }
  }
}

test.afterEach(async ({ page }) => {
  if (!page.isClosed())
    await page.evaluate(() => {
      window.mediaSelectionEvidence?.stop()
      window.mediaHostSubmitEvidence?.stop()
    })
})

async function startSelectionEvidence(page: Page) {
  await page.evaluate(() => {
    window.mediaSelectionEvidence?.stop()
    const records: MediaSelectionRecord[] = []
    const controller = new AbortController()

    const root = document.querySelector(
      '[aria-label="Media content"][contenteditable]',
    )

    const ids = new WeakMap<Node, number>()
    let nextId = 0

    function nodeId(node: Node) {
      let id = ids.get(node)

      if (id === undefined) {
        id = ++nextId
        ids.set(node, id)
      }

      return id
    }

    function describe(node: Node | null) {
      if (!node) return null
      const element = node instanceof Element ? node : node.parentElement
      const dialog = element?.closest('[role="dialog"]')

      return {
        id: nodeId(node),
        type: node.nodeType,
        name: node.nodeName,
        insideEditor: root?.contains(node) ?? false,
        insideDialog: Boolean(dialog),
        dialogId: dialog ? nodeId(dialog) : null,
        target:
          node === root
            ? "editor"
            : node === document
              ? "document"
              : node === document.body
                ? "body"
                : node === dialog
                  ? "dialog"
                  : element instanceof HTMLInputElement
                    ? "input"
                    : element instanceof HTMLButtonElement
                      ? "button"
                      : "other",
        connected: node.isConnected,
      }
    }

    function record(label: string, event?: Event) {
      const selection = document.getSelection()
      const range = selection?.rangeCount ? selection.getRangeAt(0) : null

      const evidence = {
        label,
        time: performance.now(),
        root: describe(root),
        rootIsCurrent:
          root !== null &&
          root ===
            document.querySelector(
              '[aria-label="Media content"][contenteditable]',
            ),
        active: describe(document.activeElement),
        selection: selection && {
          type: selection.type,
          anchor: describe(selection.anchorNode),
          anchorOffset: selection.anchorOffset,
          focus: describe(selection.focusNode),
          focusOffset: selection.focusOffset,
          direction: !range
            ? null
            : range.collapsed
              ? "collapsed"
              : range.startContainer === selection.anchorNode &&
                  range.startOffset === selection.anchorOffset
                ? "forward"
                : "backward",
        },
        event: event && {
          type: event.type,
          target: describe(event.target instanceof Node ? event.target : null),
          relatedTarget: describe(
            event instanceof FocusEvent && event.relatedTarget instanceof Node
              ? event.relatedTarget
              : null,
          ),
          targetIsNoSubmitForm:
            event.target === window.mediaSelectionEvidence.noSubmitForm,
          trusted: event.isTrusted,
          timestamp: event.timeStamp,
          phase: event.eventPhase,
          cancelable: event.cancelable,
          defaultPrevented: event.defaultPrevented,
          key:
            event instanceof KeyboardEvent
              ? [
                  "Escape",
                  "Enter",
                  "Tab",
                  "Shift",
                  "Control",
                  "Meta",
                  "Alt",
                  "ArrowLeft",
                  "ArrowRight",
                  "Home",
                  "End",
                ].includes(event.key)
                ? event.key
                : "redacted"
              : null,
        },
      }

      if (records.length < 2048) records.push(evidence)
      else window.mediaSelectionEvidence.dropped++
    }

    window.mediaSelectionEvidence = {
      records,
      dropped: 0,
      escapeTargetRecords: [],
      mark: (label: string) => record(label),
      noSubmitForm: null,
      signal: controller.signal,
      stop() {
        controller.abort()
        Reflect.deleteProperty(window, "mediaSelectionEvidence")
      },
    }

    for (const type of [
      "selectionchange",
      "focusin",
      "focusout",
      "keydown",
      "beforeinput",
      "input",
      "submit",
      "click",
    ]) {
      document.addEventListener(type, (event) => record("capture", event), {
        capture: true,
        signal: controller.signal,
      })
      document.addEventListener(type, (event) => record("bubble", event), {
        signal: controller.signal,
      })
    }
  })
}

async function markSelectionEvidence(page: Page, label: string) {
  await page.evaluate((name) => {
    window.mediaSelectionEvidence.mark(name)
  }, label)
}

function selectionEvidence(page: Page) {
  return page.evaluate(() => window.mediaSelectionEvidence.records)
}

function selectionEvidenceArtifact(page: Page) {
  if (page.isClosed())
    return Promise.resolve({ unavailable: "Page closed before collection" })

  return page
    .evaluate(() => {
      const evidence = window.mediaSelectionEvidence

      if (!evidence) return { unavailable: "Recorder was not installed" }

      const result = { records: evidence.records, dropped: evidence.dropped }
      evidence.stop()

      return result
    })
    .catch(() => ({ unavailable: "Evidence collection failed" }))
}

function startNoSubmitEvidence(dialog: Locator) {
  return dialog.locator("form").evaluate((form) => {
    if (!(form instanceof HTMLFormElement)) throw new Error("Expected a form")
    window.mediaSelectionEvidence.noSubmitForm = form

    return window.mediaSelectionEvidence.records.length
  })
}

async function expectNoSubmitEvidence(page: Page, start: number) {
  const records = await selectionEvidence(page)

  const dropped = await page.evaluate(
    () => window.mediaSelectionEvidence.dropped,
  )

  expect(dropped).toBe(0)
  expect(
    records
      .slice(start)
      .filter(
        (record) =>
          record.label === "capture" &&
          record.event?.type === "submit" &&
          record.event.targetIsNoSubmitForm,
      ),
  ).toEqual([])
}

async function startHostSubmitEvidence(page: Page) {
  await page.evaluate(() => {
    window.mediaHostSubmitEvidence?.stop()
    const records: Record<string, string | number | boolean | null>[] = []
    const eventIds = new WeakMap<Event, number>()
    const formIds = new WeakMap<EventTarget, number>()
    const controller = new AbortController()
    let nextEventId = 0
    let nextFormId = 0
    let dropped = 0
    let stage: "initial" | "retry" = "initial"

    function append(record: Record<string, string | number | boolean | null>) {
      if (records.length < 200) records.push(record)
      else dropped++
    }

    function onSubmit(event: Event) {
      let eventId = eventIds.get(event)

      if (eventId === undefined) {
        eventId = ++nextEventId
        eventIds.set(event, eventId)
      }

      let formId = event.target ? formIds.get(event.target) : undefined

      if (event.target && formId === undefined) {
        formId = ++nextFormId
        formIds.set(event.target, formId)
      }

      append({
        kind: "submit",
        stage,
        eventId,
        formId: formId ?? null,
        isForm: event.target instanceof HTMLFormElement,
        isTrusted: event.isTrusted,
        cancelable: event.cancelable,
        defaultPrevented: event.defaultPrevented,
        eventTimestamp: event.timeStamp,
        observedAt: performance.now(),
        phase: event.eventPhase,
      })
    }

    const attributes = [
      "data-mode",
      "data-completed-mode",
      "data-before-key",
      "data-after-key",
      "data-before-size",
      "data-after-size",
      "data-committed-text",
      "data-reentrant-submit-prevented",
    ]

    const allowed = new Set([
      "none",
      "queued-content",
      "queued-no-op",
      "reentrant-content",
      "reentrant-no-op",
      "Before selected after",
      "Host changed same node",
      "Host finished same node",
      "true",
      "false",
    ])

    let observedOutput: Element | null = null

    function recordOutput() {
      const output = document.querySelector(
        'output[aria-label="Host submit evidence"]',
      )

      if (!output) return

      const values = Object.fromEntries(
        attributes.map((name) => {
          const value = output.getAttribute(name)

          return [
            name,
            value === null || allowed.has(value) || /^\d{1,9}$/u.test(value)
              ? value
              : "other",
          ]
        }),
      )

      append({
        kind: "host-evidence",
        stage,
        observedAt: performance.now(),
        ...values,
      })
      observedOutput = output
    }

    function observeMutations(mutations: MutationRecord[]) {
      const output = document.querySelector(
        'output[aria-label="Host submit evidence"]',
      )

      if (
        output &&
        (output !== observedOutput ||
          mutations.some((mutation) => mutation.target === output))
      )
        recordOutput()
    }

    const observer = new MutationObserver(observeMutations)
    observer.observe(document, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: attributes,
    })
    document.addEventListener("submit", onSubmit, {
      capture: true,
      signal: controller.signal,
    })
    document.addEventListener("submit", onSubmit, { signal: controller.signal })
    recordOutput()
    window.mediaHostSubmitEvidence = {
      mark(nextStage) {
        stage = nextStage
        append({ kind: "stage", stage, observedAt: performance.now() })
      },
      stop() {
        observeMutations(observer.takeRecords())
        observer.disconnect()
        controller.abort()
        Reflect.deleteProperty(window, "mediaHostSubmitEvidence")

        return {
          records,
          dropped,
          limitations:
            "Event phases can be stopped. Mutation batches can coalesce. Host callback count and order are not observed.",
        }
      },
    }
  })
}

async function openInsert(
  page: Page,
  label: string,
  hostUpdate = "none",
  beforeOpen?: (editor: Locator) => Promise<void>,
  afterNavigation?: () => Promise<void>,
) {
  const explicitEmbed = label === "tweet" || label === "iframe"

  if (explicitEmbed) {
    await page.goto("/editor/examples#public-media-embeds")
    await page
      .getByTestId("editor-example-public-media-embeds")
      .getByRole("button", { name: "Live preview", exact: true })
      .click()
  } else {
    await page.goto("/editor/media-insert-control")
  }

  await afterNavigation?.()

  const editor = page.getByRole("textbox", {
    name: explicitEmbed ? "Configured media editor" : "Media content",
    exact: true,
  })

  await expect(editor).toHaveAttribute("contenteditable", "true")

  if (hostUpdate !== "none") {
    const mode = page.getByRole("combobox", {
      name: "Host submit update",
      exact: true,
    })

    await mode.selectOption(hostUpdate)
    await expect(mode).toHaveValue(hostUpdate)
  }

  await editor.fill("Before selected after")
  await editor.press("End")

  const insertionPoint = await editor.evaluate((element) => {
    const selection = element.ownerDocument.getSelection()

    return {
      anchorOffset: selection?.anchorOffset,
      focusOffset: selection?.focusOffset,
      inside: element.contains(selection?.anchorNode ?? null),
    }
  })

  await beforeOpen?.(editor)
  await page
    .getByRole("button", { name: `Insert ${label}`, exact: true })
    .click()

  const dialog = page.getByRole("dialog", {
    name: `Insert ${label}`,
    exact: true,
  })

  await expect(dialog).toBeVisible()

  const backgroundEditor = page.getByRole("textbox", {
    name: explicitEmbed ? "Configured media editor" : "Media content",
    exact: true,
    includeHidden: true,
  })

  return {
    editor,
    backgroundEditor,
    insertionPoint,
    dialog,
    input: dialog.getByLabel("Media URL", { exact: true }),
  }
}

for (const item of cases) {
  test(`@a11y MediaInsertControl ${item.label} rejects reader-incompatible URLs before insertion`, async ({
    page,
  }, testInfo) => {
    const requests: string[] = []
    page.on("request", (request) => {
      if (/url-policy|987654321/u.test(request.url()))
        requests.push(request.url())
    })
    await page.route(/url-policy|987654321/u, (route) =>
      route.fulfill({
        contentType:
          item.label === "image"
            ? "image/svg+xml"
            : item.label === "embed" ||
                item.label === "tweet" ||
                item.label === "iframe"
              ? "text/html"
              : "text/plain",
        body:
          item.label === "image"
            ? '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><rect width="32" height="32"/></svg>'
            : item.label === "embed" ||
                item.label === "tweet" ||
                item.label === "iframe"
              ? '<!doctype html><html lang="en"><head><title>Media fixture</title></head><body><main><h1>Media fixture</h1></main></body></html>'
              : "Media URL policy fixture",
      }),
    )

    const { editor, backgroundEditor, dialog, input } = await openInsert(
      page,
      item.label,
    )

    const before = await backgroundEditor.innerHTML()
    await expect(
      dialog.getByRole("button", { name: "Insert", exact: true }),
    ).toBeEnabled()

    const invalid = [
      item.url.replace("https:", "http:"),
      item.url.replace("https://", "https://user:secret@"),
      `${item.url}?token=secret`,
      `${item.url}#secret`,
    ]

    for (const url of invalid) {
      await input.fill(url)
      await dialog.getByRole("button", { name: "Insert", exact: true }).click()
      await expect(dialog).toBeVisible()
      await expect(input).toHaveAttribute("aria-invalid", "true")
      await expect(
        backgroundEditor.locator('[data-slot="editor-media"]'),
      ).toHaveCount(0)
      expect(await backgroundEditor.innerHTML()).toBe(before)
      expect(requests).toEqual([])
    }

    const errorReport = await new AxeBuilder({ page })
      .include('[role="dialog"]')
      .analyze()

    expect(errorReport.violations).toEqual([])
    await testInfo.attach("insert-url-error-axe.json", {
      body: JSON.stringify(errorReport),
      contentType: "application/json",
    })
    await input.fill(item.url)
    await input.press("Enter")
    await expect(dialog).toHaveCount(0)
    const media = editor.locator('[data-slot="editor-media"]')
    await expect(media).toHaveCount(1)
    await expect(media.locator(item.tag)).toHaveAttribute(
      item.tag === "a" ? "href" : "src",
      "source" in item ? item.source : item.url,
    )
    await expect(editor).toContainText("Before selected after")
    await expect(editor).toBeFocused()

    if (item.label === "image")
      await expect
        .poll(() =>
          media
            .locator("img")
            .evaluate((image: HTMLImageElement) => image.naturalWidth),
        )
        .toBe(32)

    if (
      item.label === "embed" ||
      item.label === "tweet" ||
      item.label === "iframe"
    ) {
      expect(requests).toEqual([])
      await expect(media.locator("iframe")).toHaveCount(0)
      await media.getByRole("button", { name: /^Load content from /u }).click()
      await expect(media.locator("iframe")).toHaveAttribute(
        "src",
        item.label === "tweet"
          ? "https://platform.twitter.com/embed/Tweet.html?id=987654321"
          : "source" in item
            ? item.source
            : item.url,
      )
      await expect.poll(() => requests.length).toBe(1)
      await expect(
        media
          .frameLocator("iframe")
          .getByRole("heading", { name: "Media fixture", exact: true }),
      ).toBeVisible()
    }

    const report = await new AxeBuilder({ page })
      .include('[data-slot="editor-media"]')
      .analyze()

    expect(report.violations).toEqual([])
    await testInfo.attach("insert-url-success-axe.json", {
      body: JSON.stringify(report),
      contentType: "application/json",
    })
    await testInfo.attach("insert-url-policy.json", {
      body: JSON.stringify({
        kind: item.label,
        rejected: invalid,
        accepted: item.url,
        requests,
      }),
      contentType: "application/json",
    })
    await testInfo.attach("insert-url-policy.png", {
      body: await editor.screenshot({ scale: "css" }),
      contentType: "image/png",
    })
  })
}

test("rejected insertion keeps native selection and undo history", async ({
  page,
}, testInfo) => {
  try {
    const { editor, dialog, input } = await openInsert(page, "image")
    await page.keyboard.press("Escape")
    await editor.press("Home")

    for (let index = 0; index < 7; index++) await editor.press("ArrowRight")

    for (let index = 0; index < 8; index++)
      await editor.press("Shift+ArrowRight")
    await startSelectionEvidence(page)
    await markSelectionEvidence(page, "before-open")
    expect(await page.evaluate(() => window.getSelection()?.toString())).toBe(
      "selected",
    )

    const initialRange = await editor.evaluate((element) => {
      const selection = element.ownerDocument.getSelection()

      return {
        anchorInside: element.contains(selection?.anchorNode ?? null),
        focusInside: element.contains(selection?.focusNode ?? null),
        anchorOffset: selection?.anchorOffset,
        focusOffset: selection?.focusOffset,
      }
    })

    expect(initialRange).toEqual({
      anchorInside: true,
      focusInside: true,
      anchorOffset: 7,
      focusOffset: 15,
    })

    await page
      .getByRole("button", { name: "Insert image", exact: true })
      .click()
    await expect(dialog).toBeVisible()
    await markSelectionEvidence(page, "after-open")
    await input.fill("https://media.test/url-policy/selection.svg?token=secret")
    await markSelectionEvidence(page, "before-invalid-submit")
    await dialog.getByRole("button", { name: "Insert", exact: true }).click()
    await markSelectionEvidence(page, "after-invalid-submit")
    await expect(input).toHaveAttribute("aria-invalid", "true")
    await markSelectionEvidence(page, "invalid-before-close")
    const closeEvidenceStart = await startNoSubmitEvidence(dialog)
    await page.keyboard.press("Escape")
    await markSelectionEvidence(page, "after-close-request")
    await expect(editor).toBeFocused()
    await markSelectionEvidence(page, "after-close")
    await expectNoSubmitEvidence(page, closeEvidenceStart)
    expect(await page.evaluate(() => window.getSelection()?.toString())).toBe(
      "selected",
    )
    expect(
      await editor.evaluate((element) => {
        const selection = element.ownerDocument.getSelection()

        return {
          anchorInside: element.contains(selection?.anchorNode ?? null),
          focusInside: element.contains(selection?.focusNode ?? null),
          anchorOffset: selection?.anchorOffset,
          focusOffset: selection?.focusOffset,
        }
      }),
    ).toEqual(initialRange)
    await editor.pressSequentially("replacement")
    await markSelectionEvidence(page, "after-replacement")
    await expect(editor).toHaveText("Before replacement after")
    await editor.press("ControlOrMeta+z")
    await expect(editor).toHaveText("Before selected after")
    await editor.press("ControlOrMeta+Shift+z")
    await expect(editor).toHaveText("Before replacement after")
    await expect(editor.locator('[data-slot="editor-media"]')).toHaveCount(0)
    await testInfo.attach("selection-history.png", {
      body: await editor.screenshot({ scale: "css" }),
      contentType: "image/png",
    })
  } finally {
    await testInfo.attach("selection-history-events.json", {
      body: JSON.stringify(await selectionEvidenceArtifact(page)),
      contentType: "application/json",
    })
  }
})

for (const selectionKind of ["backward", "collapsed"] as const) {
  test(`closing an insertion preserves a ${selectionKind} native selection`, async ({
    page,
  }, testInfo) => {
    try {
      const { editor, dialog } = await openInsert(page, "image")
      await page.keyboard.press("Escape")
      await editor.press("Home")

      for (let index = 0; index < 15; index++) await editor.press("ArrowRight")

      if (selectionKind === "backward")
        for (let index = 0; index < 8; index++)
          await editor.press("Shift+ArrowLeft")

      await startSelectionEvidence(page)
      await markSelectionEvidence(page, "before-open")

      const initial = await editor.evaluate((element) => {
        const selection = element.ownerDocument.getSelection()

        return {
          text: selection?.toString(),
          anchorInside: element.contains(selection?.anchorNode ?? null),
          focusInside: element.contains(selection?.focusNode ?? null),
          anchorOffset: selection?.anchorOffset,
          focusOffset: selection?.focusOffset,
        }
      })

      expect(initial).toEqual({
        text: selectionKind === "backward" ? "selected" : "",
        anchorInside: true,
        focusInside: true,
        anchorOffset: 15,
        focusOffset: selectionKind === "backward" ? 7 : 15,
      })
      await page
        .getByRole("button", { name: "Insert image", exact: true })
        .click()
      await expect(dialog).toBeVisible()
      await markSelectionEvidence(page, "after-open")
      const closeEvidenceStart = await startNoSubmitEvidence(dialog)
      await page.keyboard.press("Escape")
      await expect(editor).toBeFocused()
      await markSelectionEvidence(page, "after-close")
      await expectNoSubmitEvidence(page, closeEvidenceStart)
      expect(
        await editor.evaluate((element) => {
          const selection = element.ownerDocument.getSelection()

          return {
            text: selection?.toString(),
            anchorInside: element.contains(selection?.anchorNode ?? null),
            focusInside: element.contains(selection?.focusNode ?? null),
            anchorOffset: selection?.anchorOffset,
            focusOffset: selection?.focusOffset,
          }
        }),
      ).toEqual(initial)
      await editor.pressSequentially("X")
      await expect(editor).toHaveText(
        selectionKind === "backward"
          ? "Before X after"
          : "Before selectedX after",
      )
      await editor.press("ControlOrMeta+z")
      await expect(editor).toHaveText("Before selected after")
      await editor.press("ControlOrMeta+Shift+z")
      await expect(editor).toHaveText(
        selectionKind === "backward"
          ? "Before X after"
          : "Before selectedX after",
      )
      await expect(editor.locator('[data-slot="editor-media"]')).toHaveCount(0)
    } finally {
      await testInfo.attach(`selection-${selectionKind}-events.json`, {
        body: JSON.stringify(await selectionEvidenceArtifact(page)),
        contentType: "application/json",
      })
    }
  })
}

for (const dismissal of ["Escape", "Close"] as const) {
  test(`closing without submit via ${dismissal} keeps content unchanged`, async ({
    page,
  }, testInfo) => {
    const { editor, backgroundEditor, dialog, input } = await openInsert(
      page,
      "image",
    )

    await startSelectionEvidence(page)

    try {
      const before = await backgroundEditor.innerHTML()
      await dialog.locator("form").evaluate((form) => {
        form.addEventListener(
          "submit",
          () => {
            document.documentElement.dataset.mediaSubmitObserved = "true"
          },
          { signal: window.mediaSelectionEvidence.signal },
        )
      })

      await input.fill("https://media.test/url-policy/not-submitted.svg")
      await markSelectionEvidence(page, "before-close-without-submit")
      const closeEvidenceStart = await startNoSubmitEvidence(dialog)

      if (dismissal === "Escape") await page.keyboard.press("Escape")
      else
        await dialog.getByRole("button", { name: "Close", exact: true }).click()

      await expect(dialog).toHaveCount(0)
      await expect(editor).toBeFocused()
      await markSelectionEvidence(page, "after-close-without-submit")
      await expectNoSubmitEvidence(page, closeEvidenceStart)
      expect(
        await page.evaluate(
          () => document.documentElement.dataset.mediaSubmitObserved,
        ),
      ).toBeUndefined()
      expect(await editor.innerHTML()).toBe(before)
      await expect(editor.locator('[data-slot="editor-media"]')).toHaveCount(0)
    } finally {
      await testInfo.attach(`close-${dismissal}-events.json`, {
        body: JSON.stringify(await selectionEvidence(page)),
        contentType: "application/json",
      })
    }
  })
}

test("native Escape preventDefault does not veto dialog dismissal", async ({
  page,
}, testInfo) => {
  const { editor, backgroundEditor, dialog, input } = await openInsert(
    page,
    "file",
  )

  await startSelectionEvidence(page)

  try {
    const before = await backgroundEditor.innerHTML()
    await input.fill("https://media.test/url-policy/not-submitted.txt")
    const closeEvidenceStart = await startNoSubmitEvidence(dialog)
    await input.evaluate((element) => {
      element.addEventListener(
        "keydown",
        (event) => {
          if (!(event instanceof KeyboardEvent) || event.key !== "Escape")
            return
          const defaultPreventedBefore = event.defaultPrevented
          event.preventDefault()
          window.mediaSelectionEvidence.escapeTargetRecords.push({
            type: event.type,
            key: event.key,
            isTrusted: event.isTrusted,
            cancelable: event.cancelable,
            eventPhase: event.eventPhase,
            defaultPreventedBefore,
            defaultPreventedAfter: event.defaultPrevented,
          })
        },
        { signal: window.mediaSelectionEvidence.signal },
      )
    })
    await input.press("Escape")
    await markSelectionEvidence(page, "after-escape-request")
    await expect(dialog).toHaveCount(0)
    await expect(editor).toBeFocused()
    await markSelectionEvidence(page, "after-escape-close")
    expect(
      await page.evaluate(
        () => window.mediaSelectionEvidence.escapeTargetRecords,
      ),
    ).toEqual([
      {
        type: "keydown",
        key: "Escape",
        isTrusted: true,
        cancelable: true,
        eventPhase: 2,
        defaultPreventedBefore: false,
        defaultPreventedAfter: true,
      },
    ])
    await expect(editor).toHaveText("Before selected after")
    expect(await editor.innerHTML()).toBe(before)
    await expect(editor.locator('[data-slot="editor-media"]')).toHaveCount(0)
    await expectNoSubmitEvidence(page, closeEvidenceStart)
  } finally {
    const targetRecords = await page.evaluate(
      () => window.mediaSelectionEvidence.escapeTargetRecords,
    )

    await testInfo.attach("native-escape-events.json", {
      body: JSON.stringify({
        records: await selectionEvidence(page),
        targetListenerExecuted: targetRecords.length > 0,
        targetRecords,
        dialogCount: await dialog.count(),
        dialogVisible: await dialog.isVisible(),
        focus: await backgroundEditor.evaluate((element) => ({
          editorFocused: element.ownerDocument.activeElement === element,
          activeTag: element.ownerDocument.activeElement?.tagName ?? null,
          activeLabel:
            element.ownerDocument.activeElement?.getAttribute("aria-label") ??
            null,
        })),
      }),
      contentType: "application/json",
    })
  }
})

test("host-cancelled submit preserves the insertion bookmark", async ({
  page,
}) => {
  const { editor, backgroundEditor, dialog, input } = await openInsert(
    page,
    "file",
  )

  await input.fill("https://media.test/url-policy/cancelled.txt")
  await dialog.locator("form").evaluate((form) => {
    form.addEventListener("submit", (event) => event.preventDefault(), {
      capture: true,
      once: true,
    })
  })
  await dialog.getByRole("button", { name: "Insert", exact: true }).click()
  await expect(dialog).toBeVisible()
  await expect(
    backgroundEditor.locator('[data-slot="editor-media"]'),
  ).toHaveCount(0)
  await expect(backgroundEditor).toHaveText("Before selected after")
  await dialog.getByRole("button", { name: "Insert", exact: true }).click()
  await expect(dialog).toHaveCount(0)
  await expect(
    editor.locator('a[href="https://media.test/url-policy/cancelled.txt"]'),
  ).toHaveCount(1)
})

for (const mode of [
  "queued-content",
  "queued-no-op",
  "reentrant-content",
  "reentrant-no-op",
]) {
  test(`host submit ${mode} preserves native content and insertion safety`, async ({
    page,
  }, testInfo) => {
    try {
      const { editor, backgroundEditor, insertionPoint, dialog, input } =
        await openInsert(page, "file", mode, undefined, async () => {
          await startHostSubmitEvidence(page)
        })

      expect(insertionPoint).toEqual({
        anchorOffset: 21,
        focusOffset: 21,
        inside: true,
      })
      const url = `https://media.test/url-policy/${mode}.txt`
      await input.fill(url)
      const submit = dialog.getByRole("button", { name: "Insert", exact: true })
      await expect(submit).toBeEnabled()
      await page.evaluate(() => window.mediaHostSubmitEvidence?.mark("initial"))
      await submit.click()

      const host = page.getByRole("region", {
        name: "Media editor",
        exact: true,
        includeHidden: true,
      })

      const evidence = host.getByRole("status", {
        name: "Host submit evidence",
        exact: true,
        includeHidden: true,
      })

      await expect(evidence).toHaveAttribute("data-mode", mode)
      await expect(evidence).toHaveAttribute("data-completed-mode", mode)
      await expect(evidence).toHaveAttribute(
        "data-reentrant-submit-prevented",
        String(mode.startsWith("reentrant")),
      )
      const beforeKey = await evidence.getAttribute("data-before-key")
      expect(beforeKey).toBeTruthy()
      await expect(evidence).toHaveAttribute("data-after-key", beforeKey ?? "")
      await expect(evidence).toHaveAttribute("data-before-size", "21")
      expect(
        Number(await evidence.getAttribute("data-after-size")),
      ).toBeGreaterThanOrEqual(21)
      await expect(evidence).toHaveAttribute(
        "data-committed-text",
        "Before selected after",
      )

      if (mode === "queued-no-op") {
        await expect(dialog).toHaveCount(0)
        await expect(editor.locator(`a[href="${url}"]`)).toHaveCount(1)
        await expect(editor).toContainText("Before selected after")
        await editor.press("ControlOrMeta+z")
        await expect(editor.locator('[data-slot="editor-media"]')).toHaveCount(
          0,
        )
        await expect(editor).toHaveText("Before selected after")
        await editor.press("ControlOrMeta+Shift+z")
        await expect(editor.locator(`a[href="${url}"]`)).toHaveCount(1)
      } else {
        await expect(dialog).toBeVisible()
        await expect(input).toHaveAttribute("aria-invalid", "true")
        await expect(
          backgroundEditor.locator('[data-slot="editor-media"]'),
        ).toHaveCount(0)
        await expect(backgroundEditor).toHaveText(
          mode === "queued-content"
            ? "Host changed same node"
            : mode === "reentrant-content"
              ? "Host finished same node"
              : "Before selected after",
        )

        if (mode !== "reentrant-no-op") await expect(submit).toBeDisabled()
        await page.keyboard.press("Escape")
        await page
          .getByRole("combobox", { name: "Host submit update", exact: true })
          .selectOption("none")
        await editor.click()
        await editor.press("ControlOrMeta+End")
        await page
          .getByRole("button", { name: "Insert file", exact: true })
          .click()
        await input.fill(url)
        await expect(submit).toBeEnabled()
        await page.evaluate(() => window.mediaHostSubmitEvidence?.mark("retry"))
        await submit.click()
        await expect(dialog).toHaveCount(0)
        await expect(editor.locator(`a[href="${url}"]`)).toHaveCount(1)
      }

      await testInfo.attach(`host-submit-${mode}.json`, {
        body: JSON.stringify({
          mode,
          insertionPoint,
          evidence: await evidence.evaluate((element) =>
            Object.fromEntries(
              element
                .getAttributeNames()
                .map((name) => [name, element.getAttribute(name)]),
            ),
          ),
          html: await editor.innerHTML(),
        }),
        contentType: "application/json",
      })
      await testInfo.attach(`host-submit-${mode}.png`, {
        body: await editor.screenshot({ scale: "css" }),
        contentType: "image/png",
      })
    } finally {
      const observations = page.isClosed()
        ? { unavailable: "Page closed before evidence collection" }
        : await page
            .evaluate(
              () =>
                window.mediaHostSubmitEvidence?.stop() ?? {
                  unavailable: "Recorder was not installed",
                },
            )
            .catch(() => ({ unavailable: "Evidence collection failed" }))

      await testInfo.attach(`host-submit-${mode}-events.json`, {
        body: JSON.stringify({ mode, observations }),
        contentType: "application/json",
      })
    }
  })
}

test("fresh insertion sessions survive repeated native edits", async ({
  page,
}, testInfo) => {
  let recording = false

  try {
    const { editor, dialog, input } = await openInsert(
      page,
      "file",
      "none",
      async () => {
        await startSelectionEvidence(page)
        recording = true
        await markSelectionEvidence(page, "before-first-open")
      },
    )

    await markSelectionEvidence(page, "after-first-open")

    for (let index = 0; index < 2; index++) {
      const url = `https://media.test/url-policy/repeat-${index}.txt`
      await input.fill(url)
      await expect(
        dialog.getByRole("button", { name: "Insert", exact: true }),
      ).toBeEnabled()
      await markSelectionEvidence(page, `before-insert-${index}`)
      await input.press("Enter")
      await markSelectionEvidence(page, `after-submit-${index}`)
      await expect(dialog).toHaveCount(0)
      await markSelectionEvidence(page, `after-insert-${index}`)
      await expect(editor.locator('[data-slot="editor-media"]')).toHaveCount(
        index + 1,
      )
      await expect(editor.locator(`a[href="${url}"]`)).toHaveCount(1)
      await expect(editor).toBeFocused()

      if (index === 0) {
        await editor.press("ControlOrMeta+End")
        await markSelectionEvidence(page, "after-end")
        await editor.pressSequentially("Second insertion point")
        await markSelectionEvidence(page, "before-second-open")
        await expect(editor).toContainText("Second insertion point")
        await page
          .getByRole("button", { name: "Insert file", exact: true })
          .click()
        await markSelectionEvidence(page, "after-second-open-request")
        await expect(dialog).toBeVisible()
        await markSelectionEvidence(page, "after-second-open")
      }
    }

    await expect(editor).toContainText("Before selected after")
    await expect(editor).toContainText("Second insertion point")
    await editor.press("ControlOrMeta+z")
    await expect(
      editor.locator('a[href="https://media.test/url-policy/repeat-1.txt"]'),
    ).toHaveCount(0)
    await expect(
      editor.locator('a[href="https://media.test/url-policy/repeat-0.txt"]'),
    ).toHaveCount(1)
    await expect(editor).toContainText("Second insertion point")
    await editor.press("ControlOrMeta+Shift+z")
    await expect(
      editor.locator('a[href="https://media.test/url-policy/repeat-1.txt"]'),
    ).toHaveCount(1)
    await testInfo.attach("repeated-insertions.html", {
      body: await editor.innerHTML(),
      contentType: "text/html",
    })
  } finally {
    if (recording)
      await testInfo.attach("repeated-insertions-events.json", {
        body: JSON.stringify(await selectionEvidence(page)),
        contentType: "application/json",
      })
  }
})

test("read-only transition expires the open insertion session", async ({
  page,
}, testInfo) => {
  const { backgroundEditor, dialog, input } = await openInsert(page, "image")
  await input.fill("https://media.test/url-policy/readonly.svg")
  await expect(
    dialog.getByRole("button", { name: "Insert", exact: true }),
  ).toBeEnabled()
  await input.press("Control+Alt+e")
  await expect(dialog).toBeVisible()
  await expect(backgroundEditor).toHaveAttribute("contenteditable", "false")
  await expect(
    dialog.getByRole("button", { name: "Insert", exact: true }),
  ).toBeDisabled()
  await input.press("Control+Alt+e")
  await expect(dialog).toBeVisible()
  await expect(backgroundEditor).toHaveAttribute("contenteditable", "true")
  await expect(
    dialog.getByRole("button", { name: "Insert", exact: true }),
  ).toBeDisabled()
  await expect(
    backgroundEditor.locator('[data-slot="editor-media"]'),
  ).toHaveCount(0)
  await expect(backgroundEditor).toHaveText("Before selected after")
  await page.keyboard.press("Escape")
  await page.getByRole("button", { name: "Read only", exact: true }).click()

  for (const kind of ["image", "video", "audio", "file", "embed"])
    await expect(
      page.getByRole("button", { name: `Insert ${kind}`, exact: true }),
    ).toBeDisabled()
  await testInfo.attach("readonly-shortcut.html", {
    body: await backgroundEditor.innerHTML(),
    contentType: "text/html",
  })
})

test("HTTPS same-origin private delivery remains usable without URL credentials", async ({
  page,
  context,
  baseURL,
}, testInfo) => {
  if (!baseURL) throw new Error("The docs fixture baseURL is required.")
  const origin = "https://media.test"
  const delivery = `${origin}/private/url-policy/documents/one/assets/image/content`
  const requests: { url: string; cookieMatches: boolean }[] = []
  await context.addCookies([
    {
      name: "media-policy-session",
      value: "fixture",
      url: origin,
      secure: true,
      httpOnly: true,
    },
  ])
  await page.route(`${origin}/**`, async (route) => {
    const url = new URL(route.request().url())

    if (url.pathname.startsWith("/private/url-policy/")) {
      requests.push({
        url: url.href,
        cookieMatches:
          (await route.request().headerValue("cookie"))?.includes(
            "media-policy-session=fixture",
          ) ?? false,
      })
      await route.fulfill({
        contentType: "image/svg+xml",
        body: '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"/>',
      })

      return
    }

    const response = await route.fetch({
      url: new URL(url.pathname + url.search, baseURL).href,
    })

    await route.fulfill({ response })
  })
  await page.goto(`${origin}/editor/media-insert-control`)

  const editor = page.getByRole("textbox", {
    name: "Media content",
    exact: true,
  })

  await expect(editor).toHaveAttribute("contenteditable", "true")
  await editor.fill("Private media")
  await editor.press("End")
  await page.getByRole("button", { name: "Insert image", exact: true }).click()
  const dialog = page.getByRole("dialog", { name: "Insert image", exact: true })
  const input = dialog.getByLabel("Media URL", { exact: true })
  await input.fill(`${delivery}?token=secret`)
  await dialog.getByRole("button", { name: "Insert", exact: true }).click()
  await expect(input).toHaveAttribute("aria-invalid", "true")
  expect(requests).toEqual([])
  await input.fill(delivery)
  await dialog.getByRole("button", { name: "Insert", exact: true }).click()
  await expect(editor.locator("img")).toHaveAttribute("src", delivery)
  await expect.poll(() => requests.length).toBe(1)
  expect(requests[0]?.cookieMatches).toBe(true)
  await testInfo.attach("same-origin-delivery.json", {
    body: JSON.stringify(requests),
    contentType: "application/json",
  })
})

test("a lookalike iframe origin stays inert after insertion", async ({
  page,
}) => {
  const requests: string[] = []
  await page.route("https://embed.example.com.evil.net/**", (route) => {
    requests.push(route.request().url())

    return route.abort()
  })
  const { editor, dialog, input } = await openInsert(page, "iframe")
  const url = "https://embed.example.com.evil.net/url-policy/frame"
  await input.fill(url)
  await dialog.getByRole("button", { name: "Insert", exact: true }).click()
  await expect(dialog).toHaveCount(0)
  const media = editor.locator('[data-slot="editor-media"]')
  await expect(media.locator("a")).toHaveAttribute("href", url)
  await expect(
    media.getByRole("button", { name: /^Load content from /u }),
  ).toHaveCount(0)
  await expect(media.locator("iframe")).toHaveCount(0)
  expect(requests).toEqual([])
})
