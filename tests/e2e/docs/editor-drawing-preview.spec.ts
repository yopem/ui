import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Locator, type Page } from "@playwright/test"

async function openDrawingExample(page: Page) {
  await page.goto("/editor/examples#public-drawing")
  const example = page.getByTestId("editor-example-public-drawing")

  await example
    .getByRole("button", { name: "Live preview", exact: true })
    .click()

  const editor = example.getByRole("textbox", {
    name: "Public drawing editor",
    exact: true,
  })

  await expect(editor).toHaveAttribute("contenteditable", "true")
  await expect(
    example.getByRole("button", { name: "Insert drawing", exact: true }),
  ).toHaveCount(0)
  await example
    .getByRole("checkbox", {
      name: "Drawing assets are installed",
      exact: true,
    })
    .check()
  await expect(
    example.getByRole("button", { name: "Insert drawing", exact: true }),
  ).toBeEnabled()

  return { editor, example }
}

async function expectLoadedPreview(preview: Locator) {
  await expect(preview).toBeVisible()
  await expect(preview).toHaveAttribute(
    "alt",
    "Preview of drawing with 2 elements",
  )
  await expect
    .poll(() =>
      preview.evaluate(
        (image) =>
          image instanceof HTMLImageElement &&
          image.complete &&
          image.naturalWidth > 0,
      ),
    )
    .toBe(true)
}

function readPreviewSvg(preview: Locator) {
  return preview.evaluate(async (element) => {
    if (!(element instanceof HTMLImageElement))
      throw new Error("Drawing preview is not an image")

    const response = await fetch(element.src)

    if (!response.ok) throw new Error("Drawing preview SVG is unavailable")

    return response.text()
  })
}

function expectSafeSvg(svg: string) {
  expect(svg).toMatch(/<svg(?:\s|>)/iu)
  expect(svg).not.toMatch(/<(?:script|image|foreignObject|a)(?:\s|>)/iu)
  expect(svg).not.toMatch(/\s(?:href|xlink:href)\s*=/iu)
}

async function expectTwoPreviews(drawings: Locator) {
  const previews = drawings.getByTestId("editor-drawing-scene-preview")

  await expect(previews).toHaveCount(2)
  await expectLoadedPreview(previews.nth(0))
  await expectLoadedPreview(previews.nth(1))
  await expect(previews.nth(0)).toHaveAttribute("src", /^blob:/u)
  await expect(previews.nth(1)).toHaveAttribute("src", /^blob:/u)

  const firstUrl = await previews.nth(0).getAttribute("src")
  const secondUrl = await previews.nth(1).getAttribute("src")

  expect(firstUrl).not.toBe(secondUrl)

  const svgs = await Promise.all([
    readPreviewSvg(previews.nth(0)),
    readPreviewSvg(previews.nth(1)),
  ])

  for (const svg of svgs) expectSafeSvg(svg)
}

async function readTwoScenes(drawings: Locator) {
  const first = await drawings.nth(0).getAttribute("data-editor-drawing-scene")
  const second = await drawings.nth(1).getAttribute("data-editor-drawing-scene")

  if (first === null || second === null)
    throw new Error("Missing seeded drawing scene metadata")

  return [first, second]
}

test("shows a fallback for an empty drawing", async ({ page }) => {
  const { editor, example } = await openDrawingExample(page)

  await example
    .getByRole("button", { name: "Insert drawing", exact: true })
    .click()

  const drawing = editor.locator("figure[data-editor-drawing]")

  await expect(drawing).toHaveCount(1)
  const scene = await drawing.getAttribute("data-editor-drawing-scene")

  if (scene === null) throw new Error("Missing empty drawing scene")

  expect(JSON.parse(scene)).toMatchObject({ elements: [] })
  await expect(
    drawing.getByTestId("editor-drawing-preview-status"),
  ).toBeVisible()
  await expect(drawing.getByTestId("editor-drawing-preview-status")).toHaveText(
    /\S/u,
  )
  await expect(drawing.getByTestId("editor-drawing-scene-preview")).toHaveCount(
    0,
  )
  await drawing
    .getByRole("button", { name: "Edit drawing", exact: true })
    .click()

  const dialog = page.getByRole("dialog", { name: "Edit drawing", exact: true })

  await expect(dialog).toBeVisible()
  await page.keyboard.press("Escape")
  await expect(dialog).toBeHidden()

  const accessibility = await new AxeBuilder({ page }).analyze()

  expect(accessibility.violations).toEqual([])
})

test("renders independent drawing previews after selection moves and in read-only mode", async ({
  page,
}, testInfo) => {
  test.slow()
  const errors: string[] = []
  page.on("pageerror", (error) => errors.push(error.message))
  const { editor, example } = await openDrawingExample(page)

  const insertFixture = example.getByRole("button", {
    name: "Insert shape fixture",
    exact: true,
  })

  await insertFixture.click()
  await insertFixture.click()

  const drawings = editor.locator("figure[data-editor-drawing]")

  await expect(drawings).toHaveCount(2)
  const scenes = await readTwoScenes(drawings)

  expect(JSON.parse(scenes[0])).toMatchObject({
    elements: [
      { id: "fixture-rectangle", type: "rectangle" },
      { id: "fixture-ellipse", type: "ellipse" },
    ],
  })
  expect(JSON.parse(scenes[1])).toMatchObject({
    elements: [
      { id: "fixture-rectangle", type: "rectangle" },
      { id: "fixture-ellipse", type: "ellipse" },
    ],
  })
  await expectTwoPreviews(drawings)

  await drawings.nth(0).click()
  await editor.click()
  await page.keyboard.press("ControlOrMeta+End")
  await expectTwoPreviews(drawings)
  expect(await readTwoScenes(drawings)).toEqual(scenes)

  await example
    .getByRole("checkbox", { name: "Read-only editor", exact: true })
    .check()
  await expect(
    drawings.getByRole("button", { name: "View drawing", exact: true }),
  ).toHaveCount(2)
  await expectTwoPreviews(drawings)
  expect(await readTwoScenes(drawings)).toEqual(scenes)

  const accessibility = await new AxeBuilder({ page }).analyze()

  expect(accessibility.violations).toEqual([])
  await testInfo.attach("drawing-inline-previews-read-only.png", {
    body: await page.screenshot({ scale: "css" }),
    contentType: "image/png",
  })
  expect(errors).toEqual([])
})

test("restores independent previews when drawing runtime is re-registered", async ({
  page,
}, testInfo) => {
  test.slow()
  const errors: string[] = []
  page.on("pageerror", (error) => errors.push(error.message))
  const { editor, example } = await openDrawingExample(page)

  const insertFixture = example.getByRole("button", {
    name: "Insert shape fixture",
    exact: true,
  })

  await insertFixture.click()
  await insertFixture.click()

  const drawings = editor.locator("figure[data-editor-drawing]")

  await expect(drawings).toHaveCount(2)
  const scenes = await readTwoScenes(drawings)

  await expectTwoPreviews(drawings)

  const previewUrls = [
    await drawings
      .nth(0)
      .getByTestId("editor-drawing-scene-preview")
      .getAttribute("src"),
    await drawings
      .nth(1)
      .getByTestId("editor-drawing-scene-preview")
      .getAttribute("src"),
  ]

  await example
    .getByRole("checkbox", {
      name: "Drawing assets are installed",
      exact: true,
    })
    .uncheck()
  await expect(
    example.getByRole("button", { name: "Edit drawing", exact: true }),
  ).toHaveCount(0)
  await expect(
    example.getByRole("button", { name: "Insert drawing", exact: true }),
  ).toHaveCount(0)
  await expect(
    drawings.getByTestId("editor-drawing-scene-preview"),
  ).toHaveCount(0)
  await expect(drawings).toHaveCount(2)
  expect(await readTwoScenes(drawings)).toEqual(scenes)

  for (const previewUrl of previewUrls) {
    if (previewUrl === null) throw new Error("Missing drawing preview URL")

    const isRevoked = await page.evaluate(async (url) => {
      try {
        await fetch(url)

        return false
      } catch {
        return true
      }
    }, previewUrl)

    expect(isRevoked).toBe(true)
  }

  await example
    .getByRole("checkbox", {
      name: "Drawing assets are installed",
      exact: true,
    })
    .check()
  await expect(
    example.getByRole("button", { name: "Insert drawing", exact: true }),
  ).toBeEnabled()
  await expectTwoPreviews(drawings)

  const restoredPreviewUrls = [
    await drawings
      .nth(0)
      .getByTestId("editor-drawing-scene-preview")
      .getAttribute("src"),
    await drawings
      .nth(1)
      .getByTestId("editor-drawing-scene-preview")
      .getAttribute("src"),
  ]

  for (const [index, url] of restoredPreviewUrls.entries()) {
    const previousUrl = previewUrls[index]

    if (url === null || previousUrl === null)
      throw new Error("Missing drawing preview URL")

    expect(url).not.toBe(previousUrl)
  }

  expect(await readTwoScenes(drawings)).toEqual(scenes)

  const accessibility = await new AxeBuilder({ page }).analyze()

  expect(accessibility.violations).toEqual([])
  await testInfo.attach("drawing-inline-previews-reregistered.png", {
    body: await page.screenshot({ scale: "css" }),
    contentType: "image/png",
  })
  expect(errors).toEqual([])
})
