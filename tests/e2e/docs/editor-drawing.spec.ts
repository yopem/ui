import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Locator, type Page } from "@playwright/test"
import { readFile } from "node:fs/promises"

async function openDrawingExample(page: Page) {
  await page.goto("/editor/examples#public-drawing")
  const example = page.getByTestId("editor-example-public-drawing")

  await example
    .getByRole("button", { name: "Live preview", exact: true })
    .click()
  await expect(
    example.getByRole("textbox", {
      name: "Public drawing editor",
      exact: true,
    }),
  ).toHaveAttribute("contenteditable", "true")
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

  return example
}

async function chooseDrawingTool(dialog: Locator, name: "rectangle" | "text") {
  const radio = dialog.getByTestId(`toolbar-${name}`)

  await radio.locator("..").click()
  await expect(radio).toBeChecked()
}

test("draw, apply, cancel, undo, and export a native Excalidraw scene", async ({
  page,
}, testInfo) => {
  test.slow()
  const errors: string[] = []
  const fontRequests: URL[] = []

  page.on("pageerror", (error) => errors.push(error.message))
  page.on("request", (request) => {
    const url = new URL(request.url())

    if (/\.woff2?$/u.test(url.pathname)) fontRequests.push(url)
  })

  const example = await openDrawingExample(page)

  const editor = example.getByRole("textbox", {
    name: "Public drawing editor",
    exact: true,
  })

  await expect(example.getByLabel("Excalidraw asset URL")).toHaveValue(
    "/assets/excalidraw/",
  )
  await example
    .getByRole("button", { name: "Insert drawing", exact: true })
    .click()

  const drawing = editor.locator("figure[data-editor-drawing]")
  const emptyScene = await drawing.getAttribute("data-editor-drawing-scene")

  if (emptyScene === null) throw new Error("Missing initial drawing metadata")

  await example
    .getByRole("button", { name: "Edit drawing", exact: true })
    .click()

  const dialog = page.getByRole("dialog", { name: "Edit drawing", exact: true })

  await expect(dialog).toBeVisible()
  await chooseDrawingTool(dialog, "rectangle")

  const canvas = dialog.locator("canvas").last()
  const bounds = await canvas.boundingBox()

  if (!bounds) throw new Error("Excalidraw canvas is not visible")

  const startX = bounds.x + Math.min(240, bounds.width * 0.55)

  await page.mouse.move(startX, bounds.y + 80)
  await page.mouse.down()
  await page.mouse.move(
    startX + Math.min(140, bounds.width * 0.3),
    bounds.y + 180,
    { steps: 8 },
  )
  await page.mouse.up()
  await chooseDrawingTool(dialog, "text")
  await page.mouse.click(startX, bounds.y + 240)

  const textEditor = dialog.locator("textarea.excalidraw-wysiwyg")

  await expect(textEditor).toBeVisible()
  await textEditor.fill("Local drawing font")
  await textEditor.press("Escape")
  await expect(textEditor).toHaveCount(0)
  await expect(dialog).toBeVisible()
  await expect
    .poll(() =>
      fontRequests.some((url) =>
        url.pathname.startsWith("/assets/excalidraw/fonts/"),
      ),
    )
    .toBe(true)

  const downloadPromise = page.waitForEvent("download")

  await dialog
    .getByRole("button", { name: "Export drawing SVG", exact: true })
    .click()

  const download = await downloadPromise

  expect(download.suggestedFilename()).toBe("drawing.svg")

  const path = testInfo.outputPath("drawing.svg")

  await download.saveAs(path)

  const svg = await readFile(path, "utf8")

  expect(svg).toContain("<svg")
  expect(svg).not.toMatch(/<(?:script|image|foreignObject|a)(?:\s|>)/u)
  expect(svg).not.toMatch(/\s(?:href|xlink:href)\s*=/u)

  await dialog
    .getByRole("button", { name: "Apply drawing", exact: true })
    .click()
  await expect(dialog).toBeHidden()
  await expect
    .poll(() => drawing.getAttribute("data-editor-drawing-scene"))
    .not.toBe(emptyScene)

  const acceptedScene = await drawing.getAttribute("data-editor-drawing-scene")

  if (acceptedScene === null)
    throw new Error("Missing applied drawing metadata")

  await example
    .getByRole("button", { name: "Edit drawing", exact: true })
    .click()
  await expect(dialog).toBeVisible()
  await dialog
    .getByRole("button", { name: "Cancel drawing", exact: true })
    .click()
  await expect(drawing).toHaveAttribute(
    "data-editor-drawing-scene",
    acceptedScene,
  )
  await example.getByRole("button", { name: "Undo", exact: true }).click()
  await expect(drawing).toHaveAttribute("data-editor-drawing-scene", emptyScene)
  await example.getByRole("button", { name: "Redo", exact: true }).click()
  await expect(drawing).toHaveAttribute(
    "data-editor-drawing-scene",
    acceptedScene,
  )

  const accessibility = await new AxeBuilder({ page }).analyze()

  expect(accessibility.violations).toEqual([])
  expect(errors).toEqual([])
  const origin = new URL(page.url()).origin

  expect(fontRequests.map((url) => url.origin)).toEqual(
    fontRequests.map(() => origin),
  )
  await testInfo.attach("drawing-font-requests", {
    body: JSON.stringify(fontRequests.map((url) => url.href)),
    contentType: "application/json",
  })
  await testInfo.attach("drawing-svg", { path, contentType: "image/svg+xml" })
})

test("read-only editor prevents drawing insertion and clears a configured runtime", async ({
  page,
}) => {
  test.slow()
  const example = await openDrawingExample(page)

  await example
    .getByRole("checkbox", { name: "Read-only editor", exact: true })
    .check()
  await expect(
    example.getByRole("button", { name: "Insert drawing", exact: true }),
  ).toBeDisabled()
  await expect(
    example.getByRole("textbox", {
      name: "Public drawing editor",
      exact: true,
    }),
  ).toHaveAttribute("contenteditable", "false")
  await example
    .getByRole("checkbox", { name: "Read-only editor", exact: true })
    .uncheck()
  await expect(
    example.getByRole("button", { name: "Insert drawing", exact: true }),
  ).toBeEnabled()
  await example
    .getByRole("button", { name: "Insert drawing", exact: true })
    .click()
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
    example.getByRole("textbox", {
      name: "Public drawing editor",
      exact: true,
    }),
  ).toContainText("Drawing with 0 elements")

  const accessibility = await new AxeBuilder({ page }).analyze()

  expect(accessibility.violations).toEqual([])
})

test("seeded rectangle and ellipse persist through editing and read-only viewing", async ({
  page,
}, testInfo) => {
  test.slow()
  const errors: string[] = []
  page.on("pageerror", (error) => errors.push(error.message))
  const example = await openDrawingExample(page)
  await example
    .getByRole("button", { name: "Insert shape fixture", exact: true })
    .click()
  const drawing = example.locator("figure[data-editor-drawing]")
  await expect(drawing).toHaveCount(1)
  const initial = await drawing.getAttribute("data-editor-drawing-scene")

  if (initial === null) throw new Error("Missing fixture scene metadata")
  expect(JSON.parse(initial)).toMatchObject({
    elements: [
      { id: "fixture-rectangle", type: "rectangle" },
      { id: "fixture-ellipse", type: "ellipse" },
    ],
  })
  await example
    .getByRole("button", { name: "Edit drawing", exact: true })
    .click()
  const dialog = page.getByRole("dialog", { name: "Edit drawing", exact: true })
  await expect(dialog.locator("canvas").last()).toBeVisible()
  await chooseDrawingTool(dialog, "rectangle")
  const bounds = await dialog.locator("canvas").last().boundingBox()

  if (!bounds) throw new Error("Drawing canvas is unavailable")
  const startX = bounds.x + Math.min(240, bounds.width * 0.55)

  await page.mouse.move(startX, bounds.y + 80)
  await page.mouse.down()
  await page.mouse.move(
    startX + Math.min(140, bounds.width * 0.3),
    bounds.y + 180,
    { steps: 8 },
  )
  await page.mouse.up()
  await dialog
    .getByRole("button", { name: "Apply drawing", exact: true })
    .click()
  await expect(dialog).toBeHidden()
  await expect
    .poll(() => drawing.getAttribute("data-editor-drawing-scene"))
    .not.toBe(initial)
  const saved = await drawing.getAttribute("data-editor-drawing-scene")

  if (saved === null) throw new Error("Missing saved fixture scene metadata")
  await example
    .getByRole("checkbox", { name: "Read-only editor", exact: true })
    .check()
  await expect(
    example.getByRole("button", { name: "Insert shape fixture", exact: true }),
  ).toBeDisabled()
  await example
    .getByRole("button", { name: "View drawing", exact: true })
    .click()
  const viewer = page.getByRole("dialog", { name: "View drawing", exact: true })
  await expect(viewer.locator("canvas").last()).toBeVisible()
  await expect(
    viewer.getByRole("button", { name: "Apply drawing", exact: true }),
  ).toBeDisabled()
  await page.keyboard.press("r")
  await expect(drawing).toHaveAttribute("data-editor-drawing-scene", saved)
  const axe = await new AxeBuilder({ page }).analyze()
  expect(axe.violations).toEqual([])
  await testInfo.attach("drawing-read-only-view.png", {
    body: await page.screenshot({ scale: "css" }),
    contentType: "image/png",
  })
  await viewer
    .getByRole("button", { name: "Cancel drawing", exact: true })
    .click()
  await expect(viewer).toBeHidden()
  await expect(drawing).toHaveAttribute("data-editor-drawing-scene", saved)
  await example
    .getByRole("checkbox", { name: "Read-only editor", exact: true })
    .uncheck()
  await example
    .getByRole("button", { name: "Edit drawing", exact: true })
    .click()
  await expect(dialog.locator("canvas").last()).toBeVisible()
  await dialog
    .getByRole("button", { name: "Cancel drawing", exact: true })
    .click()
  await expect(drawing).toHaveAttribute("data-editor-drawing-scene", saved)
  expect(errors).toEqual([])
})
