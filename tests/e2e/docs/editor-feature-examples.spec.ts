import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"
import {
  mediaOrigin,
  routeMediaResources,
} from "@workspace/tests/editor-media/resources"
import { resolve } from "node:path"
import { z } from "zod"

const featureExamples = [
  {
    slug: "equation",
    component: "MathExample",
    installNames: ["editor", "editor-math", "editor-typeahead"],
    featureImport: "@/components/editor/math",
  },
  {
    slug: "column",
    component: "ColumnsExample",
    installNames: ["editor", "editor-columns"],
    featureImport: "@/components/editor/columns",
  },
  {
    slug: "date",
    component: "DateExample",
    installNames: ["editor", "editor-date"],
    featureImport: "@/components/editor/date",
  },
  {
    slug: "media",
    component: "MediaExample",
    installNames: ["editor", "editor-media"],
    featureImport: "@/components/editor/media",
  },
] as const

const inventorySchema = z.object({
  examples: z.array(
    z.object({
      slug: z.string().min(1),
      url: z.string().startsWith("/editor/examples#"),
      installNames: z.array(z.string().min(1)).min(1),
    }),
  ),
})

test.beforeEach(async ({ page }) => {
  await page.route("https://ui.yopem.com/favicon.svg", (route) =>
    route.fulfill({
      path: resolve(
        import.meta.dirname,
        "../../../apps/docs/public/favicon.svg",
      ),
    }),
  )
  await page.goto("/editor/examples")
  await expect(page.getByTestId("editor-examples-core")).toBeVisible()
})

test("feature examples publish consumer source through inventory and Markdown", async ({
  request,
}) => {
  const response = await request.get("/api/editor-examples.json")
  expect(response.ok()).toBe(true)
  expect(response.headers()["content-type"]).toContain("application/json")
  const data: unknown = await response.json()
  const inventory = inventorySchema.parse(data)

  for (const { slug, installNames } of featureExamples) {
    const example = inventory.examples.find((entry) => entry.slug === slug)
    expect(example?.url).toBe(`/editor/examples#${slug}`)

    for (const installName of installNames)
      expect(example?.installNames).toContain(installName)
  }

  const markdown = await request.get("/editor/examples.md")
  expect(markdown.ok()).toBe(true)
  expect(markdown.headers()["content-type"]).toContain("text/markdown")
  const source = await markdown.text()

  for (const { featureImport } of featureExamples)
    expect(source).toContain(featureImport)
})

test("equation: edits inline and block math, cancels safely, and inserts by slash", async ({
  page,
}, testInfo) => {
  const example = page.getByTestId("editor-example-equation")

  const editor = example.getByRole("textbox", {
    name: "Math editor",
    exact: true,
  })

  const toolbar = example.getByRole("toolbar", { name: "Math tools" })
  const inline = editor.locator('[data-editor-math="inline"]').first()
  const block = editor.locator('[data-editor-math="block"]').first()

  await expect(inline).toBeVisible()
  await expect(block).toBeVisible()
  await expect(inline).toHaveAttribute("role", "math")
  const original = await inline.getAttribute("data-editor-tex")
  expect(original).toBe("E=mc^2")

  await inline.click()
  await toolbar.getByRole("button", { name: "Edit equation" }).click()
  const editDialog = page.getByRole("dialog", { name: "Edit equation" })
  await expect(editDialog).toBeVisible()
  await page.keyboard.press("Escape")
  await expect(editDialog).toBeHidden()
  await expect(inline).toHaveAttribute("data-editor-tex", original ?? "")

  await inline.click()
  await toolbar.getByRole("button", { name: "Edit equation" }).click()
  const tex = page.getByRole("textbox", { name: "TeX expression" })
  await expect(tex).toHaveAttribute("maxlength", "4096")
  await tex.fill("\\frac{")
  await expect(tex).toHaveAttribute("aria-invalid", "true")
  await expect(
    page.getByRole("button", { name: "Apply equation" }),
  ).toBeDisabled()
  await tex.fill("a^2 + b^2 = c^2")
  await page.getByRole("button", { name: "Apply equation" }).click()
  await expect(inline).toHaveAttribute("data-editor-tex", "a^2 + b^2 = c^2")
  await toolbar.getByRole("button", { name: "Undo" }).click()
  await expect(inline).toHaveAttribute("data-editor-tex", original ?? "")
  await toolbar.getByRole("button", { name: "Redo" }).click()
  await expect(inline).toHaveAttribute("data-editor-tex", "a^2 + b^2 = c^2")

  const blockTex = await block.getAttribute("data-editor-tex")
  expect(blockTex).toBe("\\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}")
  await block.click()
  await toolbar.getByRole("button", { name: "Edit equation" }).click()
  await page
    .getByRole("textbox", { name: "TeX expression" })
    .fill("\\int_{0}^{1} x \\, dx")
  await page.getByRole("button", { name: "Apply equation" }).click()
  await expect(block).toHaveAttribute(
    "data-editor-tex",
    "\\int_{0}^{1} x \\, dx",
  )
  await toolbar.getByRole("button", { name: "Undo" }).click()
  await expect(block).toHaveAttribute("data-editor-tex", blockTex ?? "")
  await toolbar.getByRole("button", { name: "Redo" }).click()
  await expect(block).toHaveAttribute(
    "data-editor-tex",
    "\\int_{0}^{1} x \\, dx",
  )

  await inline.focus()
  await page.keyboard.press("ArrowRight")
  await page.keyboard.type(" after-navigation")
  await expect(editor).toContainText("after-navigation")

  const commandParagraph = editor.locator("p").last()
  await commandParagraph.click()
  await page.keyboard.press("End")
  await page.keyboard.type("/equation")
  await expect(
    page.getByRole("option", { name: "Equation", exact: true }),
  ).toBeVisible()
  await page.keyboard.press("Enter")
  await expect(editor.locator('[data-editor-math="block"]')).toHaveCount(2)

  await editor.locator("p").last().click()
  await page.keyboard.press("End")
  await page.keyboard.type("/inline equation")
  await expect(
    page.getByRole("option", { name: "Inline equation", exact: true }),
  ).toBeVisible()
  await page.keyboard.press("Enter")
  await expect(editor.locator('[data-editor-math="inline"]')).toHaveCount(2)

  const codeParagraph = editor.getByText(
    "Code sample: const area = radius * radius;",
    { exact: true },
  )

  await codeParagraph.click()
  await toolbar.getByRole("button", { name: "Code block" }).click()
  await expect(editor.locator("code")).toContainText(
    "const area = radius * radius;",
  )
  await editor.locator("p").last().click()
  await toolbar.getByRole("button", { name: "Insert table" }).click()
  await expect(editor.locator('[data-slot="editor-table-scroll"]')).toHaveCount(
    1,
  )

  const report = await new AxeBuilder({ page })
    .include('[data-testid="editor-example-equation"]')
    .analyze()

  expect(report.violations).toEqual([])
  await testInfo.attach("equation-axe.json", {
    body: JSON.stringify(report),
    contentType: "application/json",
  })

  await example.getByRole("button", { name: "Read only" }).click()
  await expect(editor).toHaveAttribute("contenteditable", "false")
  await expect(
    toolbar.getByRole("button", { name: "Insert inline equation" }),
  ).toBeDisabled()

  const readonlyReport = await new AxeBuilder({ page })
    .include('[data-testid="editor-example-equation"]')
    .analyze()

  expect(readonlyReport.violations).toEqual([])
  await testInfo.attach("equation-readonly-axe.json", {
    body: JSON.stringify(readonlyReport),
    contentType: "application/json",
  })
  await testInfo.attach("equation-workflow.html", {
    body: await editor.innerHTML(),
    contentType: "text/html",
  })
})

test("column: edits both seeded columns and hides edit boundaries in read-only mode", async ({
  page,
}, testInfo) => {
  const example = page.getByTestId("editor-example-column")

  const editor = example.getByRole("textbox", {
    name: "Column editor",
    exact: true,
  })

  const group = editor.locator('[data-editor-columns="1"]')
  const columns = group.locator('[data-editor-column="1"]')

  await expect(columns).toHaveCount(2)
  await expect(group).toHaveAttribute("data-editor-columns-layout", "60,40")
  await expect(group.locator("[data-editor-column-editable]")).toHaveCount(2)
  await columns.nth(0).click()
  await page.keyboard.press("End")
  await page.keyboard.type(" — updated")
  await columns.nth(1).click()
  await page.keyboard.press("End")
  await page.keyboard.type(" — updated")
  await expect(columns.nth(0)).toContainText("Left column content — updated")
  await expect(columns.nth(1)).toContainText("Right column content — updated")
  const toolbar = example.getByRole("toolbar", { name: "Column tools" })
  await toolbar.getByRole("button", { name: "Undo" }).click()
  await expect(columns.nth(1)).toHaveText("Right column content")
  await toolbar.getByRole("button", { name: "Redo" }).click()
  await expect(columns.nth(1)).toHaveText("Right column content — updated")

  const report = await new AxeBuilder({ page })
    .include('[data-testid="editor-example-column"]')
    .analyze()

  expect(report.violations).toEqual([])
  await testInfo.attach("column-editable-axe.json", {
    body: JSON.stringify(report),
    contentType: "application/json",
  })

  await example.getByRole("button", { name: "Read only" }).click()
  await expect(editor).toHaveAttribute("aria-readonly", "true")
  await expect(group.locator("[data-editor-column-editable]")).toHaveCount(0)
  await expect(
    example.getByRole("button", { name: "Remove columns" }),
  ).toBeDisabled()

  const readonlyReport = await new AxeBuilder({ page })
    .include('[data-testid="editor-example-column"]')
    .analyze()

  expect(readonlyReport.violations).toEqual([])
  await testInfo.attach("column-readonly-axe.json", {
    body: JSON.stringify(readonlyReport),
    contentType: "application/json",
  })
  await testInfo.attach("column-workflow.html", {
    body: await editor.innerHTML(),
    contentType: "text/html",
  })
})

test("date: edits seeded inline date by keyboard and preserves surrounding text", async ({
  page,
}, testInfo) => {
  const example = page.getByTestId("editor-example-date")

  const editor = example.getByRole("textbox", {
    name: "Date editor",
    exact: true,
  })

  const date = editor.locator('[data-editor-date="1"]')
  const dateButton = date.getByRole("button")

  await expect(date).toHaveAttribute("datetime", "2024-01-02")
  await expect(editor).toContainText("Review on")
  await dateButton.click()
  await expect(page.getByRole("grid")).toBeVisible()
  await page.keyboard.press("Escape")
  await expect(date).toHaveAttribute("datetime", "2024-01-02")

  await dateButton.click()
  await page.getByRole("button", { name: /January 2/ }).focus()
  await page.keyboard.press("ArrowRight")
  await page.keyboard.press("Enter")
  await expect(date).toHaveAttribute("datetime", "2024-01-03")
  await expect(editor).toHaveAttribute("contenteditable", "true")
  await expect(editor).toContainText("Review on")
  const toolbar = example.getByRole("toolbar", { name: "Date tools" })
  await toolbar.getByRole("button", { name: "Undo" }).click()
  await expect(date).toHaveAttribute("datetime", "2024-01-02")
  await toolbar.getByRole("button", { name: "Redo" }).click()
  await expect(date).toHaveAttribute("datetime", "2024-01-03")
  await editor.press("End")
  await page.keyboard.type(" — confirmed")
  await expect(editor).toContainText("confirmed")
  await toolbar.getByRole("button", { name: "Undo" }).click()
  await expect(editor).not.toContainText("confirmed")

  const report = await new AxeBuilder({ page })
    .include('[data-testid="editor-example-date"]')
    .analyze()

  expect(report.violations).toEqual([])
  await testInfo.attach("date-workflow.html", {
    body: await editor.innerHTML(),
    contentType: "text/html",
  })

  await example.getByRole("button", { name: "Read only" }).click()
  await expect(editor).toHaveAttribute("aria-readonly", "true")
  await expect(date.getByRole("button")).toBeDisabled()

  const readonlyReport = await new AxeBuilder({ page })
    .include('[data-testid="editor-example-date"]')
    .analyze()

  expect(readonlyReport.violations).toEqual([])
  await testInfo.attach("date-readonly-axe.json", {
    body: JSON.stringify(readonlyReport),
    contentType: "application/json",
  })
})

test("media: validates URLs, edits images, and renders supported media", async ({
  page,
}, testInfo) => {
  await routeMediaResources(page)
  await page.goto("/editor/examples")

  const example = page.getByTestId("editor-example-media")

  const editor = example.getByRole("textbox", {
    name: "Media editor",
    exact: true,
  })

  const toolbar = example.getByRole("toolbar", { name: "Media tools" })

  const mediaItems = example.locator('[data-slot="editor-media"]')
  await expect(mediaItems).toHaveCount(1)
  await expect(
    mediaItems.first().getByRole("img", { name: "Yopem UI mark" }),
  ).toBeVisible()
  await editor
    .getByText(
      "Insert image, video, audio, file, or supported provider content.",
      {
        exact: true,
      },
    )
    .click()
  await page.keyboard.press("End")
  await example.getByRole("button", { name: "Insert image" }).click()
  const imageDialog = page.getByRole("dialog", { name: "Insert image" })
  const imageUrl = imageDialog.getByRole("textbox", { name: "Media URL" })
  await imageUrl.fill("https://user:secret@media.test/image.svg")
  await imageDialog.getByRole("button", { name: "Insert" }).click()
  await expect(imageDialog.getByRole("alert")).toBeVisible()
  await imageUrl.fill(`${mediaOrigin}/image.svg`)
  await imageDialog.getByRole("button", { name: "Insert" }).click()

  const image = mediaItems.nth(1)
  await expect(mediaItems).toHaveCount(2)
  await toolbar.getByRole("button", { name: "Undo" }).click()
  await expect(mediaItems).toHaveCount(1)
  await toolbar.getByRole("button", { name: "Redo" }).click()
  await expect(mediaItems).toHaveCount(2)

  const alternativeText = image.getByRole("textbox", {
    name: "Alternative text",
  })

  const caption = image.getByRole("textbox", { name: "Caption" })
  await alternativeText.fill("Mountain summit")
  await caption.fill("North ridge at sunrise")
  await expect(
    image.getByRole("img", { name: "Mountain summit" }),
  ).toBeVisible()
  await expect(image.locator("figcaption")).toHaveText("North ridge at sunrise")
  const imageWidth = image.getByRole("slider", { name: "Image width" })
  await imageWidth.focus()
  await page.keyboard.press("ArrowRight")
  await expect(imageWidth).toHaveAttribute("aria-valuenow", "336")

  for (const [kind, url] of [
    ["video", `${mediaOrigin}/video.webm`],
    ["audio", `${mediaOrigin}/audio.wav`],
    ["file", `${mediaOrigin}/file.txt`],
    ["embed", "https://vimeo.com/123456"],
  ] as const) {
    await editor.locator("p").last().click()
    await example.getByRole("button", { name: `Insert ${kind}` }).click()
    const dialog = page.getByRole("dialog", { name: `Insert ${kind}` })
    await dialog.getByRole("textbox", { name: "Media URL" }).fill(url)
    await dialog.getByRole("button", { name: "Insert" }).click()
  }

  await expect(example.locator("video[controls]")).toHaveCount(1)
  await expect(example.locator("audio[controls]")).toHaveCount(1)
  await expect(
    example.locator(`a[href="${mediaOrigin}/file.txt"]`),
  ).toHaveCount(1)
  await expect(example.locator("iframe")).toHaveAttribute(
    "sandbox",
    "allow-scripts allow-presentation",
  )
  await expect(example.locator('[data-slot="editor-media"] img')).toBeVisible()

  const report = await new AxeBuilder({ page })
    .include('[data-testid="editor-example-media"]')
    .analyze()

  expect(report.violations).toEqual([])
  await testInfo.attach("media-preview-axe.json", {
    body: JSON.stringify(report),
    contentType: "application/json",
  })
  await testInfo.attach("media-workflow.html", {
    body: await editor.innerHTML(),
    contentType: "text/html",
  })

  await example.getByRole("button", { name: "Read only" }).click()
  await expect(editor).toHaveAttribute("aria-readonly", "true")
  await expect(image.getByRole("textbox", { name: "Caption" })).toHaveCount(0)
  await expect(
    example.getByRole("button", { name: "Insert image" }),
  ).toBeDisabled()
  await expect(example.locator("video[controls]")).toHaveCount(1)
  await expect(example.locator("audio[controls]")).toHaveCount(1)
  await expect(example.locator("iframe")).toBeVisible()

  const readonlyReport = await new AxeBuilder({ page })
    .include('[data-testid="editor-example-media"]')
    .analyze()

  expect(readonlyReport.violations).toEqual([])
  await testInfo.attach("media-readonly-axe.json", {
    body: JSON.stringify(readonlyReport),
    contentType: "application/json",
  })
})

test("feature examples copy complete consumer source from the gallery", async ({
  page,
  context,
}, testInfo) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"])

  for (const { slug, component, featureImport } of featureExamples) {
    const example = page.getByTestId(`editor-example-${slug}`)
    await example.getByRole("button", { name: "Copy source" }).click()
    const copyButton = example.getByRole("button", { name: "Copy source" })
    await expect(copyButton).toHaveText("Copied")
    const source = await page.evaluate(() => navigator.clipboard.readText())
    expect(source).toContain('"use client"')
    expect(source).toContain('from "@/components/editor"')
    expect(source).toContain(`from "${featureImport}"`)
    expect(source).toContain(`export function ${component}`)
    expect(source).not.toMatch(
      /@registry\/|@yopem-ui\/|@workspace\/|from ["'](?:\.\.?\/)/,
    )
    await testInfo.attach(`${slug}-consumer-source.tsx`, {
      body: source,
      contentType: "text/plain",
    })
  }
})
