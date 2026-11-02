import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Locator, type Page } from "@playwright/test"
import { z } from "zod"

const suffixes = ["?", "#", "?#", "?token=secret", "#fragment"]

const kinds = ["image", "video", "audio", "file", "embed"] as const

const encoded = "https://media.test/empty-delimiters/a%3Fb%23c.svg"

const observation = "https://media.test/observation-control.svg"

async function observeMediaRequests(page: Page) {
  const requests: string[] = []

  page.on("request", (request) => {
    if (new URL(request.url()).hostname !== "localhost")
      requests.push(request.url())
  })
  await page.route("**/*", (route) => {
    const url = new URL(route.request().url())

    if (url.hostname === "localhost") return route.continue()

    if (url.href === observation)
      return route.fulfill({
        contentType: "image/svg+xml",
        body: '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>',
      })

    return route.abort()
  })

  return requests
}

async function verifyObservation(page: Page, requests: string[]) {
  const loaded = await page.evaluate(
    (source) =>
      new Promise<boolean>((resolve) => {
        const image = new Image()
        image.onload = () => resolve(true)
        image.onerror = () => resolve(false)
        image.src = source
      }),
    observation,
  )

  expect(loaded).toBe(true)
  expect(requests).toContain(observation)
  await page.waitForTimeout(500)
}

async function expectNoMediaRequests(
  page: Page,
  requests: string[],
  checkpoint: number,
) {
  await page.waitForTimeout(500)
  expect(requests.slice(checkpoint)).toEqual([])
}

async function selectText(page: Page, editor: Locator) {
  await editor.fill("Before selected after")
  await editor.press("Home")

  for (let i = 0; i < 7; i++) await editor.press("ArrowRight")

  for (let i = 0; i < 8; i++) await editor.press("Shift+ArrowRight")
  expect(await page.evaluate(() => window.getSelection()?.toString())).toBe(
    "selected",
  )
}

async function expectValidInput(input: Locator, value: string) {
  await input.fill(value)
  await expect(input).toHaveValue(value)
  expect(
    await input.evaluate((element: HTMLInputElement) => element.validity.valid),
  ).toBe(true)
}

for (const kind of kinds) {
  for (const suffix of suffixes) {
    test(`insert ${kind} rejects ${JSON.stringify(suffix)} before accepting a valid URL`, async ({
      page,
    }, info) => {
      const requests = await observeMediaRequests(page)
      await page.goto("/editor/media-insert-control")
      await verifyObservation(page, requests)

      const editor = page.getByRole("textbox", {
        name: "Media content",
        exact: true,
      })

      const background = page.locator(
        '[contenteditable][aria-label="Media content"]',
      )

      await expect(background).toHaveCount(1)
      await selectText(page, editor)
      const before = await background.innerHTML()
      await page
        .getByRole("button", { name: `Insert ${kind}`, exact: true })
        .click()

      const dialog = page.getByRole("dialog", {
        name: `Insert ${kind}`,
        exact: true,
      })

      const input = dialog.getByLabel("Media URL", { exact: true })
      const submit = dialog.getByRole("button", { name: "Insert", exact: true })
      await expect(dialog).toHaveCount(1)
      await expect(submit).toBeEnabled()
      await expect(input).not.toHaveAttribute("aria-invalid", "true")
      await expect(dialog.getByRole("alert")).toHaveCount(0)
      await dialog.locator("form").evaluate((form) => {
        form.addEventListener(
          "submit",
          (event) =>
            form.setAttribute("data-observed-submit", String(event.isTrusted)),
          { once: true },
        )
      })

      const base =
        kind === "embed"
          ? "https://vimeo.com/987654321"
          : `https://media.test/empty-delimiters/${kind}`

      const checkpoint = requests.length
      await expectValidInput(input, base + suffix)
      await submit.click()
      await expect(dialog.locator("form")).toHaveAttribute(
        "data-observed-submit",
        "true",
      )
      await expect(dialog).toBeVisible()
      await expect(input).toHaveAttribute("aria-invalid", "true")
      await expect(background).toBeAttached()
      expect(await background.innerHTML()).toBe(before)
      await expect(
        background.locator('[data-slot="editor-media"]'),
      ).toHaveCount(0)
      await expectNoMediaRequests(page, requests, checkpoint)

      const report = await new AxeBuilder({ page })
        .include('[role="dialog"]')
        .analyze()

      expect(report.violations).toEqual([])
      await info.attach("insert-error-axe.json", {
        body: JSON.stringify(report),
        contentType: "application/json",
      })
      await expectValidInput(input, kind === "image" ? encoded : base)
      await input.press("Enter")
      await expect(dialog).toHaveCount(0)
      const media = editor.locator('[data-slot="editor-media"]')
      await expect(media).toHaveCount(1)
      await expect(editor).toContainText("Before selected after")

      const rendered = media
        .locator(
          kind === "image"
            ? "img"
            : kind === "video"
              ? "video"
              : kind === "audio"
                ? "audio"
                : "a",
        )
        .first()

      await expect(rendered).toHaveAttribute(
        kind === "file" || kind === "embed" ? "href" : "src",
        kind === "embed"
          ? "https://player.vimeo.com/video/987654321"
          : kind === "image"
            ? encoded
            : base,
      )

      if (kind === "image") await expect.poll(() => requests).toContain(encoded)

      if (kind === "embed") await expect(media.locator("iframe")).toHaveCount(0)
      await editor.press("ControlOrMeta+z")
      await expect(editor.locator('[data-slot="editor-media"]')).toHaveCount(0)
      await expect(editor).toHaveText("Before selected after")
      await editor.press("ControlOrMeta+Shift+z")
      await expect(editor.locator('[data-slot="editor-media"]')).toHaveCount(1)
      await expect(editor).toContainText("Before selected after")
      await expect(rendered).toHaveAttribute(
        kind === "file" || kind === "embed" ? "href" : "src",
        kind === "embed"
          ? "https://player.vimeo.com/video/987654321"
          : kind === "image"
            ? encoded
            : base,
      )
      await editor
        .locator("p")
        .filter({ hasText: "Before selected after" })
        .click()
      await editor.press("End")
      await page
        .getByRole("button", { name: `Insert ${kind}`, exact: true })
        .click()
      await expect(dialog).toBeVisible()
      await expect(input).not.toHaveAttribute("aria-invalid", "true")
      await expect(dialog.getByRole("alert")).toHaveCount(0)
      const afterInsert = await background.innerHTML()
      const retryCheckpoint = requests.length
      await expectValidInput(input, base + suffix)
      await submit.click()
      await expect(dialog).toBeVisible()
      await expect(input).toHaveAttribute("aria-invalid", "true")
      expect(await background.innerHTML()).toBe(afterInsert)
      await expect(
        background.locator('[data-slot="editor-media"]'),
      ).toHaveCount(1)
      await expectNoMediaRequests(page, requests, retryCheckpoint)
      await input.press("Escape")
      await info.attach("insert-requests.json", {
        body: JSON.stringify({ suffix, checkpoint, requests }),
        contentType: "application/json",
      })
    })
  }

  test(`insert ${kind} preserves selection after rejected URL and Escape`, async ({
    page,
  }, info) => {
    const requests = await observeMediaRequests(page)
    await page.goto("/editor/media-insert-control")
    await verifyObservation(page, requests)

    const editor = page.getByRole("textbox", {
      name: "Media content",
      exact: true,
    })

    await selectText(page, editor)
    await page
      .getByRole("button", { name: `Insert ${kind}`, exact: true })
      .click()

    const dialog = page.getByRole("dialog", {
      name: `Insert ${kind}`,
      exact: true,
    })

    const input = dialog.getByLabel("Media URL", { exact: true })

    const base =
      kind === "embed"
        ? "https://vimeo.com/987654321"
        : `https://media.test/empty-delimiters/${kind}`

    await expect(input).not.toHaveAttribute("aria-invalid", "true")
    const checkpoint = requests.length
    await expectValidInput(input, `${base}?`)
    await dialog.getByRole("button", { name: "Insert", exact: true }).click()
    await expect(input).toHaveAttribute("aria-invalid", "true")
    await expectNoMediaRequests(page, requests, checkpoint)
    await input.press("Escape")
    await expect(editor).toBeFocused()
    expect(await page.evaluate(() => window.getSelection()?.toString())).toBe(
      "selected",
    )
    await editor.pressSequentially("replacement")
    await expect(editor).toHaveText("Before replacement after")
    await editor.press("ControlOrMeta+z")
    await expect(editor).toHaveText("Before selected after")
    await editor.press("ControlOrMeta+Shift+z")
    await expect(editor).toHaveText("Before replacement after")
    await info.attach("insert-state.html", {
      body: await editor.innerHTML(),
      contentType: "text/html",
    })
  })
}

for (const kind of ["image", "embed"] as const) {
  for (const suffix of suffixes) {
    test(`edit ${kind} rejects ${JSON.stringify(suffix)} and preserves history`, async ({
      page,
    }, info) => {
      const requests = await observeMediaRequests(page)
      await page.goto("/editor/media-actions")
      await verifyObservation(page, requests)

      const fixture = page.getByRole("region", {
        name: "Selected media example",
        exact: true,
      })

      const background = page.locator(
        'section[aria-label="Selected media example"] [contenteditable][aria-label="Selected media content"]',
      )

      await expect(background).toHaveCount(1)
      const media = fixture.locator('[data-slot="editor-media"]')
      await expect(media).toHaveCount(5)
      const target = media.nth(kind === "image" ? 0 : 4)
      const rendered = target.locator(kind === "image" ? "img" : "a").first()

      if (kind === "image")
        await expect(rendered).toHaveAttribute("alt", "Grapefruit slice")
      else
        await expect(rendered).toHaveAttribute(
          "href",
          "https://player.vimeo.com/video/76979871",
        )

      const original = await rendered.getAttribute(
        kind === "image" ? "src" : "href",
      )

      expect(original).toBeTruthy()
      const json = fixture.getByLabel("Media JSON", { exact: true })

      const select = target.getByRole("button", {
        name: "Select media",
        exact: true,
      })

      await select.click()
      await expect(select).toHaveAttribute("aria-pressed", "true")
      await expect(
        media.getByRole("button", {
          name: "Select media",
          exact: true,
          pressed: true,
        }),
      ).toHaveCount(1)

      const actions = fixture.getByRole("group", {
        name: "Selected media controls",
        exact: true,
      })

      const caption = actions.getByRole("textbox", {
        name: "Selected caption",
        exact: true,
      })

      await caption.fill("Retained caption")
      await actions
        .getByRole("button", { name: "Align end", exact: true })
        .click()

      if (kind === "image") {
        const width = actions.getByRole("slider", {
          name: "Image width",
          exact: true,
        })

        await width.focus()
        await width.press("ArrowRight")
        await expect(width).toHaveAttribute("aria-valuenow", "336")
      }

      await fixture
        .getByRole("button", { name: "Export media", exact: true })
        .click()
      const baseline = await json.inputValue()

      const documentSchema = z.looseObject({
        root: z.looseObject({
          children: z.array(
            z.looseObject({
              type: z.string(),
              media: z
                .looseObject({
                  kind: z.string(),
                  url: z.string(),
                  alt: z.string(),
                  caption: z.string(),
                  width: z.number(),
                  alignment: z.string(),
                })
                .optional(),
            }),
          ),
        }),
      })

      const originalDocument = documentSchema.parse(JSON.parse(baseline))
      const targetIndex = kind === "image" ? 0 : 4
      const originalNode = originalDocument.root.children[targetIndex]

      if (!originalNode?.media) throw new Error("Missing selected media")
      expect(originalNode.media).toMatchObject({
        kind,
        alt: kind === "image" ? "Grapefruit slice" : "Example media",
        caption: "Retained caption",
        width: kind === "image" ? 336 : 320,
        alignment: "end",
      })

      const trigger = actions.getByRole("button", {
        name: "Edit media source",
        exact: true,
      })

      await expect(trigger).toHaveCount(1)
      const before = await background.innerHTML()
      await trigger.focus()
      await trigger.press("Enter")

      const dialog = page.getByRole("dialog", {
        name: "Edit media source",
        exact: true,
      })

      const input = dialog.getByLabel("Media URL", { exact: true })
      await expect(dialog).toHaveCount(1)
      await expect(input).toHaveValue(original ?? "")
      await expect(input).not.toHaveAttribute("aria-invalid", "true")
      await expect(dialog.getByRole("alert")).toHaveCount(0)

      const base =
        kind === "image"
          ? "https://media.test/empty-delimiters/edit.svg"
          : "https://vimeo.com/987654321"

      const checkpoint = requests.length
      await expectValidInput(input, base + suffix)
      await dialog
        .getByRole("button", { name: "Apply source", exact: true })
        .click()
      await expect(dialog).toBeVisible()
      await expect(input).toHaveAttribute("aria-invalid", "true")
      await expect(dialog.getByRole("alert")).toBeVisible()
      await expect(background).toBeAttached()
      expect(await background.innerHTML()).toBe(before)
      await expect(
        background.locator('[data-slot="editor-media"]'),
      ).toHaveCount(5)
      await expectNoMediaRequests(page, requests, checkpoint)

      const report = await new AxeBuilder({ page })
        .include('[role="dialog"]')
        .analyze()

      expect(report.violations).toEqual([])
      await info.attach("edit-error-axe.json", {
        body: JSON.stringify(report),
        contentType: "application/json",
      })
      await expectValidInput(input, kind === "image" ? encoded : base)
      await dialog
        .getByRole("button", { name: "Apply source", exact: true })
        .click()
      await expect(dialog).toHaveCount(0)

      const expected =
        kind === "image" ? encoded : "https://player.vimeo.com/video/987654321"

      await expect(rendered).toHaveAttribute(
        kind === "image" ? "src" : "href",
        expected,
      )

      if (kind === "image") await expect.poll(() => requests).toContain(encoded)
      await fixture
        .getByRole("button", { name: "Export media", exact: true })
        .click()
      const edited = await json.inputValue()

      const editedDocument = documentSchema.parse(JSON.parse(edited))
      expect(editedDocument).toEqual({
        ...originalDocument,
        root: {
          ...originalDocument.root,
          children: originalDocument.root.children.map((node, index) =>
            index === targetIndex
              ? {
                  ...originalNode,
                  media: { ...originalNode.media, url: expected },
                }
              : node,
          ),
        },
      })
      await fixture.getByRole("button", { name: "Undo", exact: true }).click()
      await expect(rendered).toHaveAttribute(
        kind === "image" ? "src" : "href",
        original ?? "",
      )
      await fixture
        .getByRole("button", { name: "Export media", exact: true })
        .click()
      const undone = await json.inputValue()
      expect(undone).toBe(baseline)
      expect(undone).not.toBe(edited)
      await fixture.getByRole("button", { name: "Redo", exact: true }).click()
      await expect(rendered).toHaveAttribute(
        kind === "image" ? "src" : "href",
        expected,
      )
      await fixture
        .getByRole("button", { name: "Export media", exact: true })
        .click()
      expect(await json.inputValue()).toBe(edited)
      await select.click()
      await expect(select).toHaveAttribute("aria-pressed", "true")
      await trigger.click()
      await expect(dialog).toBeVisible()
      await expect(input).toHaveValue(expected)
      await expect(input).not.toHaveAttribute("aria-invalid", "true")
      await expect(dialog.getByRole("alert")).toHaveCount(0)
      const afterEdit = await background.innerHTML()
      const retryCheckpoint = requests.length
      await expectValidInput(input, base + suffix)
      await dialog
        .getByRole("button", { name: "Apply source", exact: true })
        .click()
      await expect(dialog).toBeVisible()
      await expect(input).toHaveAttribute("aria-invalid", "true")
      await expect(dialog.getByRole("alert")).toBeVisible()
      expect(await background.innerHTML()).toBe(afterEdit)
      await expect(
        background.locator('[data-slot="editor-media"]'),
      ).toHaveCount(5)
      await expectNoMediaRequests(page, requests, retryCheckpoint)
      await input.press("Escape")
      await fixture
        .getByRole("button", { name: "Export media", exact: true })
        .click()
      expect(await json.inputValue()).toBe(edited)
      await fixture.getByRole("button", { name: "Undo", exact: true }).click()
      await fixture
        .getByRole("button", { name: "Export media", exact: true })
        .click()
      expect(await json.inputValue()).toBe(baseline)
      await fixture.getByRole("button", { name: "Redo", exact: true }).click()
      await fixture
        .getByRole("button", { name: "Export media", exact: true })
        .click()
      expect(await json.inputValue()).toBe(edited)
      await info.attach("edit-evidence.json", {
        body: JSON.stringify({ suffix, checkpoint, requests, undone, edited }),
        contentType: "application/json",
      })
    })
  }
}
