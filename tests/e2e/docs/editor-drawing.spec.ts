import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Page } from "@playwright/test"
import { readFile } from "node:fs/promises"

async function openDrawingExample(page: Page) {
  await page.goto("/editor/examples#public-drawing")
  const example = page.locator("#editor-example-public-drawing")

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

test("draw, apply, cancel, undo, and export a native Excalidraw scene", async ({
  page,
}, testInfo) => {
  test.slow()
  const errors: string[] = []

  page.on("pageerror", (error) => errors.push(error.message))

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
  await dialog.getByTestId("toolbar-rectangle").click()

  const canvas = dialog.locator("canvas").last()
  const bounds = await canvas.boundingBox()

  if (!bounds) throw new Error("Excalidraw canvas is not visible")

  await page.mouse.move(bounds.x + 80, bounds.y + 80)
  await page.mouse.down()
  await page.mouse.move(bounds.x + 220, bounds.y + 180, { steps: 8 })
  await page.mouse.up()

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
  await dialog.getByTestId("toolbar-rectangle").click()
  const bounds = await dialog.locator("canvas").last().boundingBox()

  if (!bounds) throw new Error("Drawing canvas is unavailable")
  await page.mouse.move(bounds.x + 60, bounds.y + 60)
  await page.mouse.down()
  await page.mouse.move(bounds.x + 180, bounds.y + 130, { steps: 8 })
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
