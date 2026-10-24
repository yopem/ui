import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"
import {
  mediaOrigin,
  routeMediaResources,
} from "@workspace/tests/editor-media/resources"

test("@a11y media editing supports native resources and read-only mode", async ({
  page,
}, testInfo) => {
  if (testInfo.project.name === "mobile-chromium")
    await page.setViewportSize({ width: 390, height: 844 })

  await routeMediaResources(page)

  const fixture = page.getByRole("region", {
    name: "Media editor",
    exact: true,
  })

  const editor = fixture.getByRole("textbox", {
    name: "Media content",
    exact: true,
  })

  await expect(editor).toHaveAttribute("contenteditable", "true")
  await editor.fill("Before after")
  await editor.press("Home")
  await fixture
    .getByRole("button", { name: "Insert image", exact: true })
    .click()

  const imageDialog = page.getByRole("dialog", {
    name: "Insert image",
    exact: true,
  })

  const imageUrl = imageDialog.getByLabel("Media URL", { exact: true })

  await imageUrl.fill("https://user:secret@example.com/a.png")
  await imageDialog.getByRole("button", { name: "Insert", exact: true }).click()
  await expect(imageDialog.getByRole("alert")).toBeVisible()
  await imageUrl.fill(`${mediaOrigin}/image.svg`)
  await imageDialog.getByRole("button", { name: "Insert", exact: true }).click()

  const image = fixture.locator('[data-slot="editor-media"]').first()

  await expect(image).toBeVisible()
  await expect(editor).toContainText("Before after")
  await image.getByLabel("Alternative text", { exact: true }).fill("Summit")
  await image.getByLabel("Caption", { exact: true }).fill("Mountain")
  const decodedImage = image.getByRole("img", { name: "Summit" })
  await expect(decodedImage).toBeVisible()
  expect(
    await decodedImage.evaluate(async (element: HTMLImageElement) => {
      await element.decode()

      return {
        complete: element.complete,
        width: element.naturalWidth,
        height: element.naturalHeight,
      }
    }),
  ).toEqual({ complete: true, width: 32, height: 32 })
  await expect(image.locator("figcaption")).toHaveText("Mountain")
  await image.getByRole("button", { name: "Select media", exact: true }).click()
  await image.getByLabel("Caption", { exact: true }).focus()
  await image.getByLabel("Caption", { exact: true }).press("End")
  await image.getByLabel("Caption", { exact: true }).press("Backspace")
  await expect(image).toBeVisible()
  await expect(image.getByLabel("Caption", { exact: true })).toHaveValue(
    "Mountai",
  )

  const resize = image.getByRole("slider", { name: "Image width" })

  await resize.focus()
  await resize.press("ArrowRight")
  await expect(resize).toHaveAttribute("aria-valuenow", "336")
  const bounds = await resize.boundingBox()

  if (!bounds) throw new Error("Resize control has no bounds")
  await page.mouse.move(bounds.x + 10, bounds.y + 10)
  await page.mouse.down()
  await page.mouse.move(bounds.x + 42, bounds.y + 10, { steps: 4 })
  await page.mouse.up()
  await expect(resize).toHaveAttribute("aria-valuenow", "368")
  const alignEnd = image.getByRole("button", { name: "Align end", exact: true })
  await alignEnd.click()
  await alignEnd.press("Delete")
  await alignEnd.press("Backspace")
  await expect(image).toBeVisible()
  await expect(alignEnd).toBeFocused()
  await expect(image).toHaveAttribute("data-alignment", "end")

  await editor.locator("p").filter({ hasText: "Before after" }).click()
  await expect(
    image.getByRole("button", { name: "Select media", exact: true }),
  ).toHaveAttribute("aria-pressed", "false")

  const sameRealm = await image.evaluate((element) => {
    const frame = document.createElement("iframe")
    document.body.append(frame)
    const foreignDocument = frame.contentDocument

    if (!foreignDocument) throw new Error("Missing foreign document")
    const select = foreignDocument.createElement("select")
    select.setAttribute("aria-label", "Foreign media control")
    const option = foreignDocument.createElement("option")
    option.textContent = "Media option"
    select.append(option)
    element.append(select)
    frame.remove()

    return select instanceof Element
  })

  expect(sameRealm).toBe(false)

  const foreignControl = image.getByRole("combobox", {
    name: "Foreign media control",
    exact: true,
  })

  await foreignControl.focus()
  await expect(
    image.getByRole("button", { name: "Select media", exact: true }),
  ).toHaveAttribute("aria-pressed", "true")
  await foreignControl.press("Delete")
  await foreignControl.press("Backspace")
  await expect(image).toBeVisible()
  await foreignControl.evaluate((element) => element.remove())

  const editingReport = await new AxeBuilder({ page })
    .include('[data-slot="editor-media"]')
    .analyze()

  expect(editingReport.violations).toEqual([])
  await testInfo.attach("media-editing-axe.json", {
    body: JSON.stringify(editingReport),
    contentType: "application/json",
  })
  await fixture.getByRole("button", { name: "Read only", exact: true }).click()
  await expect(editor).toHaveAttribute("contenteditable", "false")
  await expect(
    fixture.getByRole("button", { name: "Insert image", exact: true }),
  ).toBeDisabled()
  await expect(fixture.getByLabel("Caption", { exact: true })).toHaveCount(0)

  const readonlyReport = await new AxeBuilder({ page })
    .include('[aria-label="Media editor"]')
    .analyze()

  expect(readonlyReport.violations).toEqual([])
  await testInfo.attach("media-readonly-axe.json", {
    body: JSON.stringify(readonlyReport),
    contentType: "application/json",
  })
  await fixture.getByRole("button", { name: "Edit media", exact: true }).click()
  await expect(editor).toHaveAttribute("contenteditable", "true")
  await image.getByRole("button", { name: "Select media", exact: true }).click()
  await image
    .getByRole("button", { name: "Select media", exact: true })
    .press("Delete")
  await expect(image).toHaveCount(0)

  for (const kind of ["video", "audio", "file", "embed"]) {
    await editor.click()
    await fixture
      .getByRole("button", { name: `Insert ${kind}`, exact: true })
      .click()

    const dialog = page.getByRole("dialog", {
      name: `Insert ${kind}`,
      exact: true,
    })

    const url =
      kind === "embed"
        ? "https://vimeo.com/123456"
        : `${mediaOrigin}/${kind === "video" ? "video.webm" : kind === "audio" ? "audio.wav" : "file.txt"}`

    await dialog.getByLabel("Media URL", { exact: true }).fill(url)
    await dialog.getByRole("button", { name: "Insert", exact: true }).click()
  }

  await expect(fixture.locator("video[controls]")).toHaveCount(1)
  await expect(fixture.locator("audio[controls]")).toHaveCount(1)
  await expect(
    fixture.locator(`a[href='${mediaOrigin}/file.txt']`),
  ).toHaveCount(1)
  await expect(fixture.locator("iframe")).toHaveAttribute(
    "sandbox",
    "allow-scripts allow-presentation",
  )

  for (const kind of ["video", "audio"] as const) {
    const resource = fixture.locator(`${kind}[controls]`)
    await resource.evaluate((element: HTMLMediaElement) => element.load())
    await expect
      .poll(() =>
        resource.evaluate((element: HTMLMediaElement) => element.readyState),
      )
      .toBeGreaterThanOrEqual(2)
    await resource.evaluate((element: HTMLMediaElement) => {
      element.addEventListener("keydown", (event) => {
        queueMicrotask(() =>
          element.setAttribute(
            "data-native-key",
            JSON.stringify({
              key: event.key,
              prevented: event.defaultPrevented,
            }),
          ),
        )
      })
    })
    await resource.focus()

    for (const key of [
      "ArrowRight",
      "ArrowLeft",
      "Delete",
      "Backspace",
      "Space",
    ]) {
      await resource.press(key)
      await expect(resource).toBeFocused()
      await expect(resource).toHaveCount(1)

      if (key === "Delete" || key === "Backspace")
        await expect(resource).toHaveAttribute(
          "data-native-key",
          JSON.stringify({ key, prevented: false }),
        )
      await expect(editor).toContainText("Before after")
    }

    await testInfo.attach(`${kind}-decoded.json`, {
      body: JSON.stringify(
        await resource.evaluate((element: HTMLMediaElement) => ({
          source: element.currentSrc,
          readyState: element.readyState,
          error: element.error?.code ?? null,
        })),
      ),
      contentType: "application/json",
    })
  }

  const file = fixture.getByRole("link", { name: "File", exact: true })
  await file.focus()
  await file.press("Backspace")
  await file.press("Delete")
  await expect(file).toBeFocused()
  await expect(file).toHaveCount(1)

  const allKindsReport = await new AxeBuilder({ page })
    .include('[aria-label="Media editor"]')
    .analyze()

  expect(allKindsReport.violations).toEqual([])
  await testInfo.attach("media-native-resources-axe.json", {
    body: JSON.stringify(allKindsReport),
    contentType: "application/json",
  })

  if (testInfo.project.name === "mobile-chromium")
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
      .toBeLessThanOrEqual(390)
})
