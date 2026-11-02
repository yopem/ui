import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

const imageUrl = "https://media.test/updated.svg"

test.beforeEach(async ({ page }) => {
  for (const pattern of [
    "https://media.test/**",
    "https://interactive-examples.mdn.mozilla.net/media/cc0-images/**",
  ]) {
    await page.route(pattern, (route) =>
      route.fulfill({
        contentType: "image/svg+xml",
        body: '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><rect width="32" height="32"/></svg>',
      }),
    )
  }
})

for (const slug of ["media-actions"]) {
  test(`@a11y ${slug} selected media controls`, async ({ page }, testInfo) => {
    await page.goto(`/editor/${slug}`)

    const fixture = page.getByRole("region", {
      name: "Selected media example",
      exact: true,
      includeHidden: true,
    })

    const media = fixture.locator('[data-slot="editor-media"]')
    const first = media.first()
    await expect
      .poll(() =>
        first
          .locator("img")
          .evaluate((image) =>
            image instanceof HTMLImageElement ? image.naturalWidth : 0,
          ),
      )
      .toBeGreaterThan(0)
    const originalURL = await first.locator("img").getAttribute("src")

    if (!originalURL) throw new Error("Media source is missing.")
    await first
      .getByRole("button", { name: "Select media", exact: true })
      .click()

    const actions = fixture.getByRole("group", {
      name: "Selected media controls",
      exact: true,
    })

    const edit = actions.getByRole("button", {
      name: "Edit media source",
      exact: true,
    })

    await edit.focus()
    await edit.press("Enter")

    const dialog = page.getByRole("dialog", {
      name: "Edit media source",
      exact: true,
    })

    const url = dialog.getByLabel("Media URL", { exact: true })

    for (const invalid of [
      "https://user:secret@media.test/a.svg",
      "javascript:alert(1)",
      "https://media.test/a.svg?token=secret",
      "https://media.test/a.svg#secret",
    ]) {
      await url.fill(invalid)
      await dialog
        .getByRole("button", { name: "Apply source", exact: true })
        .click()
      await expect(dialog.getByRole("alert")).toBeVisible()
      await expect(media).toHaveCount(5)
      await expect(first.locator("img")).toHaveAttribute("src", originalURL)
    }

    await url.fill(imageUrl)
    await dialog.evaluate((element) =>
      element.addEventListener("click", (event) => event.preventDefault(), {
        capture: true,
        once: true,
      }),
    )
    await dialog
      .getByRole("button", { name: "Apply source", exact: true })
      .click()
    await expect(dialog).toBeVisible()
    await expect(first.locator("img")).toHaveAttribute("src", originalURL)
    await dialog
      .getByRole("button", { name: "Apply source", exact: true })
      .click()
    await expect(dialog).toHaveCount(0)
    await expect(media).toHaveCount(5)
    await expect(first.locator("img")).toHaveAttribute("src", imageUrl)
    await fixture.getByRole("button", { name: "Undo", exact: true }).click()
    await expect(first.locator("img")).toHaveAttribute("src", originalURL)
    await fixture.getByRole("button", { name: "Redo", exact: true }).click()
    await expect(first.locator("img")).toHaveAttribute("src", imageUrl)
    await first
      .getByRole("button", { name: "Select media", exact: true })
      .click()

    const caption = actions.getByRole("textbox", {
      name: "Selected caption",
      exact: true,
    })

    await caption.fill("First line\nSecond <line> & text")
    await expect(caption).toHaveValue("First line\nSecond <line> & text")
    await expect(first.locator("figcaption")).toHaveText(
      "First line\nSecond <line> & text",
    )
    await expect(caption).toHaveAttribute("maxlength", "10000")
    await fixture
      .getByRole("button", { name: "Export media", exact: true })
      .click()
    const json = fixture.getByLabel("Media JSON", { exact: true })
    const html = fixture.getByLabel("Media HTML", { exact: true })
    expect(
      JSON.parse(await json.inputValue()).root.children[0].media.caption,
    ).toBe("First line\nSecond <line> & text")
    expect(await html.inputValue()).toContain(
      "First line\nSecond &lt;line&gt; &amp; text",
    )
    await fixture
      .getByRole("button", { name: "Reload media JSON", exact: true })
      .click()
    await expect(first.locator("figcaption")).toHaveText(
      "First line\nSecond <line> & text",
    )
    await fixture
      .getByRole("button", { name: "Reload media HTML", exact: true })
      .click()
    await expect(first.locator("figcaption")).toHaveText(
      "First line\nSecond <line> & text",
    )
    await first
      .getByRole("button", { name: "Select media", exact: true })
      .click()

    const resize = actions.getByRole("slider", {
      name: "Image width",
      exact: true,
    })

    await resize.focus()
    await resize.press("ArrowRight")
    await expect(resize).toHaveAttribute("aria-valuenow", "336")
    const bounds = await resize.boundingBox()

    if (!bounds) throw new Error("Missing image resize bounds")
    await page.mouse.move(bounds.x + 10, bounds.y + 10)
    await page.mouse.down()
    await page.mouse.move(bounds.x + 42, bounds.y + 10, { steps: 4 })
    await page.keyboard.press("Escape")
    await page.mouse.up()
    await expect(resize).toHaveAttribute("aria-valuenow", "336")
    await page.mouse.move(bounds.x + 10, bounds.y + 10)
    await page.mouse.down()
    await page.mouse.move(bounds.x + 42, bounds.y + 10, { steps: 4 })
    await page.mouse.up()
    await expect(resize).toHaveAttribute("aria-valuenow", "368")
    await fixture.getByRole("button", { name: "Undo", exact: true }).click()
    await first
      .getByRole("button", { name: "Select media", exact: true })
      .click()
    await expect(resize).toHaveAttribute("aria-valuenow", "336")
    await fixture.getByRole("button", { name: "Redo", exact: true }).click()
    await first
      .getByRole("button", { name: "Select media", exact: true })
      .click()
    await expect(resize).toHaveAttribute("aria-valuenow", "368")
    await page.mouse.move(bounds.x + 10, bounds.y + 10)
    await page.mouse.down()
    await page.mouse.move(bounds.x + 42, bounds.y + 10, { steps: 4 })
    await resize.dispatchEvent("pointercancel", { pointerId: 1 })
    await page.mouse.up()
    await expect(resize).toHaveAttribute("aria-valuenow", "368")
    await actions
      .getByRole("button", { name: "Align end", exact: true })
      .click()
    await expect(first).toHaveAttribute("data-alignment", "end")

    const report = await new AxeBuilder({ page })
      .include('[aria-label="Selected media example"]')
      .analyze()

    expect(report.violations).toEqual([])
    await testInfo.attach("selected-media-axe.json", {
      body: JSON.stringify(report),
      contentType: "application/json",
    })

    for (const [index, source] of [
      [1, "https://media.test/video.webm"],
      [2, "https://media.test/audio.wav"],
      [3, "https://media.test/file.txt"],
      [4, "https://vimeo.com/654321"],
    ] as const) {
      await media
        .nth(index)
        .getByRole("button", { name: "Select media", exact: true })
        .click()
      await expect(actions.getByRole("slider")).toHaveCount(0)
      await edit.click()
      await url.fill(source)
      await dialog
        .getByRole("button", { name: "Apply source", exact: true })
        .click()
      await expect(dialog).toHaveCount(0)
      await expect(media).toHaveCount(5)

      const rendered = media
        .nth(index)
        .locator(index === 1 ? "video" : index === 2 ? "audio" : "a")

      await expect(rendered).toHaveAttribute(
        index < 3 ? "src" : "href",
        index === 4 ? "https://player.vimeo.com/video/654321" : source,
      )
    }

    await first
      .getByRole("button", { name: "Select media", exact: true })
      .click()
    await edit.click()
    await url.fill("https://media.test/stale.svg")
    await fixture
      .getByRole("button", { name: "Host change", exact: true })
      .evaluate((button: HTMLButtonElement) => button.click())
    await dialog
      .getByRole("button", { name: "Apply source", exact: true })
      .click()
    await expect(dialog.getByRole("alert")).toBeVisible()
    await expect(first.locator("img")).toHaveAttribute("src", imageUrl)
    await page.keyboard.press("Escape")
    await first
      .getByRole("button", { name: "Select media", exact: true })
      .click()
    await fixture
      .getByRole("button", { name: "Advanced host checks", exact: true })
      .click()
    await fixture
      .getByRole("checkbox", { name: "Veto media actions", exact: true })
      .check()
    await edit.click()
    await expect(dialog).toHaveCount(0)
    await actions
      .getByRole("button", { name: "Delete media", exact: true })
      .click()
    await expect(media).toHaveCount(5)
    await fixture
      .getByRole("checkbox", { name: "Veto media actions", exact: true })
      .uncheck()
    await first
      .getByRole("button", { name: "Select media", exact: true })
      .click()
    await edit.click()
    await fixture
      .getByRole("button", { name: "Toggle read only", exact: true })
      .evaluate((button: HTMLButtonElement) => button.click())
    await expect(
      dialog.getByRole("button", { name: "Apply source", exact: true }),
    ).toBeDisabled()
    await fixture
      .getByRole("button", { name: "Toggle read only", exact: true })
      .evaluate((button: HTMLButtonElement) => button.click())
    await dialog
      .getByRole("button", { name: "Apply source", exact: true })
      .click()
    await expect(dialog.getByRole("alert")).toBeVisible()
    await expect(first.locator("img")).toHaveAttribute("src", imageUrl)
    await fixture
      .getByRole("button", { name: "Toggle read only", exact: true })
      .evaluate((button: HTMLButtonElement) => button.click())
    await page.keyboard.press("Escape")
    await expect(edit).toBeDisabled()
    await expect(caption).toBeDisabled()
    await expect(
      actions.getByRole("button", { name: "Delete media", exact: true }),
    ).toBeDisabled()
    await expect(media).toHaveCount(5)
    await fixture
      .getByRole("button", { name: "Toggle read only", exact: true })
      .click()
    await first
      .getByRole("button", { name: "Select media", exact: true })
      .click()
    await actions
      .getByRole("button", { name: "Delete media", exact: true })
      .focus()
    await page.keyboard.press("Enter")
    await expect(media).toHaveCount(4)
    await fixture.getByRole("button", { name: "Undo", exact: true }).click()
    await expect(media).toHaveCount(5)
    await testInfo.attach("media-state.json", {
      body: await json.inputValue(),
      contentType: "application/json",
    })
  })
}

for (const [name, slug] of [
  ["MediaEditControl", "media-edit-control"],
  ["MediaCaptionTextarea", "media-caption-textarea"],
  ["MediaImageResize", "media-image-resize"],
  ["MediaAlignButton", "media-align-button"],
  ["MediaDeleteButton", "media-delete-button"],
] as const) {
  test(`@a11y ${name} public preview`, async ({ page }, testInfo) => {
    await page.goto(`/editor/${slug}`)

    const fixture = page.getByRole("region", {
      name: "Selected media example",
      exact: true,
    })

    await fixture
      .locator('[data-slot="editor-media"]')
      .first()
      .getByRole("button", { name: "Select media", exact: true })
      .click()

    const actions = fixture.getByRole("group", {
      name: "Selected media controls",
      exact: true,
    })

    await expect(
      actions.getByRole("button", { name: "Edit media source", exact: true }),
    ).toBeEnabled()

    const report = await new AxeBuilder({ page })
      .include('[aria-label="Selected media example"]')
      .analyze()

    expect(report.violations).toEqual([])
    await testInfo.attach("media-control-axe.json", {
      body: JSON.stringify(report),
      contentType: "application/json",
    })
  })
}

for (const mutation of [
  "replace",
  "select",
  "readonly",
  "readonly-cycle",
  "unmount",
] as const) {
  for (const action of [
    "caption",
    "align",
    "delete",
    "resize",
    "resize-native",
    "resize-page",
    "edit",
  ] as const) {
    test(`media ${action} expires during host ${mutation}`, async ({
      page,
    }, testInfo) => {
      await page.goto("/editor/media-actions")

      const fixture = page.getByRole("region", {
        name: "Selected media example",
        exact: true,
      })

      const actions = fixture.getByRole("group", {
        name: "Selected media controls",
        exact: true,
      })

      await expect(fixture.locator('[data-slot="editor-media"]')).toHaveCount(5)
      await fixture
        .getByRole("button", { name: "Export media", exact: true })
        .click()

      const before = await fixture
        .getByLabel("Media JSON", { exact: true })
        .inputValue()

      await fixture
        .getByRole("button", { name: "Advanced host checks", exact: true })
        .click()
      await fixture
        .getByLabel("Host callback mutation", { exact: true })
        .selectOption(mutation)

      if (action === "resize-native") {
        await fixture
          .getByLabel("Host callback phase", { exact: true })
          .selectOption("change")
      }

      await fixture
        .locator('[data-slot="editor-media"]')
        .first()
        .getByRole("button", { name: "Select media", exact: true })
        .click()

      if (action === "caption") {
        await actions
          .getByRole("textbox", { name: "Selected caption", exact: true })
          .fill("Stale caption")
      } else if (
        action === "resize" ||
        action === "resize-native" ||
        action === "resize-page"
      ) {
        await actions
          .getByRole("slider", { name: "Image width", exact: true })
          .press(action === "resize" ? "ArrowRight" : "PageUp")
      } else {
        await actions
          .getByRole("button", {
            name:
              action === "align"
                ? "Align end"
                : action === "delete"
                  ? "Delete media"
                  : "Edit media source",
            exact: true,
          })
          .click()
      }

      await expect(fixture.locator('[data-slot="editor-media"]')).toHaveCount(5)
      await expect(
        page.getByRole("dialog", { name: "Edit media source", exact: true }),
      ).toHaveCount(0)

      if (mutation === "unmount") {
        await expect(
          actions.locator(
            `[data-fixture-control="${action.startsWith("resize") ? "resize" : action}"]`,
          ),
        ).toHaveCount(0)
        await expect(actions).toHaveCount(1)
      }

      if (mutation === "readonly") {
        await expect(
          actions.getByRole("textbox", {
            name: "Selected caption",
            exact: true,
          }),
        ).toBeDisabled()
      }

      await fixture
        .getByRole("button", { name: "Export media", exact: true })
        .click()

      const after = await fixture
        .getByLabel("Media JSON", { exact: true })
        .inputValue()

      const expected = JSON.parse(before)

      if (mutation === "replace") {
        expected.root.children[0].media.caption = "Host replacement"
        expected.root.children[0].media.url = "https://media.test/host.svg"
        expected.root.children[0].media.alignment = "center"
        expected.root.children[0].media.width = 480
      }

      expect(JSON.parse(after)).toEqual(expected)
      await testInfo.attach("reentrant-media-state.json", {
        body: after,
        contentType: "application/json",
      })
    })
  }

  for (const phase of [
    "pointerdown",
    "pointermove",
    "pointerup",
    "preview",
  ] as const) {
    test(`media resize ${phase} expires during host ${mutation}`, async ({
      page,
    }, testInfo) => {
      await page.goto("/editor/media-actions")

      const fixture = page.getByRole("region", {
        name: "Selected media example",
        exact: true,
      })

      await expect(fixture.locator('[data-slot="editor-media"]')).toHaveCount(5)
      await fixture
        .getByRole("button", { name: "Advanced host checks", exact: true })
        .click()
      await fixture
        .getByLabel("Host callback mutation", { exact: true })
        .selectOption(mutation)
      await fixture
        .getByLabel("Host callback phase", { exact: true })
        .selectOption(phase)
      await fixture
        .locator('[data-slot="editor-media"]')
        .first()
        .getByRole("button", { name: "Select media", exact: true })
        .click()

      const resize = fixture
        .getByRole("group", { name: "Selected media controls", exact: true })
        .getByRole("slider", { name: "Image width", exact: true })

      await resize.scrollIntoViewIfNeeded()
      await expect(resize).toBeInViewport({ ratio: 1 })
      const bounds = await resize.boundingBox()

      if (!bounds) throw new Error("Missing image resize bounds")
      await page.mouse.move(bounds.x + 10, bounds.y + 10)
      await page.mouse.down()
      await page.mouse.move(bounds.x + 42, bounds.y + 10, { steps: 4 })
      await page.mouse.up()
      await expect(
        fixture.getByRole("status", {
          name: "Host callback count",
          exact: true,
        }),
      ).toHaveText(/^[1-9]\d*$/)
      await expect(
        fixture.getByRole("status", { name: "Resize preview", exact: true }),
      ).toHaveText("No preview")
      await fixture
        .getByRole("button", { name: "Export media", exact: true })
        .click()

      const json = await fixture
        .getByLabel("Media JSON", { exact: true })
        .inputValue()

      expect(JSON.parse(json).root.children).toHaveLength(6)
      expect(JSON.parse(json).root.children[0].media).toMatchObject({
        width: mutation === "replace" ? 480 : 320,
        caption: mutation === "replace" ? "Host replacement" : "",
      })

      if (mutation === "select") {
        expect(JSON.parse(json).root.children[1].media.width).toBe(320)
      }

      await testInfo.attach("reentrant-resize-state.json", {
        body: json,
        contentType: "application/json",
      })
    })
  }
}
