import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Locator, type Page } from "@playwright/test"

async function expectedFrameWidth(iframe: Locator, selectedWidth: number) {
  return Math.round(
    await iframe.evaluate(
      (element, requestedWidth) =>
        Math.min(
          requestedWidth,
          element.parentElement?.clientWidth ?? requestedWidth,
        ),
      selectedWidth,
    ),
  )
}

async function openIframeExample(page: Page) {
  await page.goto("/editor/examples#public-iframe")
  const example = page.getByTestId("editor-example-public-iframe")
  await expect(example).toBeVisible()
  await example
    .getByRole("button", { name: "Live preview", exact: true })
    .click()

  return example
}

test("public-iframe: edits a real same-origin editor and responds to keyboard and pointer width input", async ({
  page,
}, testInfo) => {
  const example = await openIframeExample(page)

  const iframe = example.locator('iframe[title="Isolated editor preview"]')

  const editor = page
    .frameLocator('iframe[title="Isolated editor preview"]')
    .getByRole("textbox", { name: "Isolated editor", exact: true })

  const width = example.getByRole("slider", {
    name: "Preview width",
    exact: true,
  })

  const track = example.locator('[data-slot="slider-track"]')

  await expect(iframe).toHaveAttribute("src", "about:blank")
  await expect(iframe).not.toHaveAttribute("srcdoc")
  await expect(editor).toHaveAttribute("contenteditable", "true")
  await expect(width).toHaveAttribute("aria-valuenow", "640")
  await editor.fill("Real iframe editor")
  await editor.press("ControlOrMeta+a")
  await editor.press("ControlOrMeta+b")
  await expect(editor.locator("strong, b")).toHaveText("Real iframe editor")

  await width.focus()
  await width.press("Home")
  await expect(width).toHaveAttribute("aria-valuenow", "320")
  await expect
    .poll(async () =>
      Math.round(
        await iframe.evaluate(
          (element) => element.getBoundingClientRect().width,
        ),
      ),
    )
    .toBe(await expectedFrameWidth(iframe, 320))
  const trackBox = await track.boundingBox()
  expect(trackBox).not.toBeNull()

  if (trackBox)
    await track.click({
      position: { x: trackBox.width * 0.75, y: trackBox.height / 2 },
    })
  await expect(width).toHaveAttribute("aria-valuenow", "800")
  await expect
    .poll(async () =>
      Math.round(
        await iframe.evaluate(
          (element) => element.getBoundingClientRect().width,
        ),
      ),
    )
    .toBe(await expectedFrameWidth(iframe, 800))
  await width.press("End")
  await expect(width).toHaveAttribute("aria-valuenow", "960")
  await expect
    .poll(async () =>
      Math.round(
        await iframe.evaluate(
          (element) => element.getBoundingClientRect().width,
        ),
      ),
    )
    .toBe(await expectedFrameWidth(iframe, 960))

  const frameInfo = await iframe.evaluate((element) => {
    if (!(element instanceof HTMLIFrameElement))
      return { sameOrigin: false, stylesheetCount: 0 }

    const frameDocument = element.contentDocument

    return {
      sameOrigin: frameDocument?.defaultView?.frameElement === element,
      stylesheetCount: frameDocument?.styleSheets.length ?? 0,
    }
  })

  expect(frameInfo.sameOrigin).toBe(true)
  expect(frameInfo.stylesheetCount).toBeGreaterThan(0)
  await testInfo.attach("public-iframe-editor.html", {
    body: await editor.evaluate((element) => element.innerHTML),
    contentType: "text/html",
  })
})

test("public-iframe: exposes a named frame and accessible editor controls", async ({
  page,
}, testInfo) => {
  const example = await openIframeExample(page)
  const iframe = example.locator('iframe[title="Isolated editor preview"]')
  await expect(iframe).toHaveCount(1)
  await expect(
    page
      .frameLocator('iframe[title="Isolated editor preview"]')
      .getByRole("textbox", { name: "Isolated editor", exact: true }),
  ).toBeVisible()

  const report = await new AxeBuilder({ page })
    .include('[data-testid="public-iframe-example"]')
    .analyze()

  await testInfo.attach("public-iframe-a11y.json", {
    body: JSON.stringify(report, null, 2),
    contentType: "application/json",
  })
  expect(report.violations).toEqual([])
})

test("public-iframe: copied source uses complete consumer imports", async ({
  page,
  context,
}, testInfo) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"])

  const example = await openIframeExample(page)
  await example
    .getByRole("button", { name: "Copy source", exact: true })
    .click()
  const source = await page.evaluate(() => navigator.clipboard.readText())

  expect(source).toContain('from "@/components/editor"')
  expect(source).toContain('from "@/components/ui/slider"')
  expect(source).toContain('from "react-dom"')
  expect(source).not.toMatch(/@registry\/|@yopem-ui\//)
  expect(source).not.toMatch(/\.\/fixtures|\.\/shared/)
  await testInfo.attach("public-iframe-consumer.tsx", {
    body: source,
    contentType: "text/plain",
  })
})

test("public-iframe: native clipboard crosses the frame boundary without sharing history", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"])

  const example = await openIframeExample(page)

  const editor = page
    .frameLocator('iframe[title="Isolated editor preview"]')
    .getByRole("textbox", { name: "Isolated editor", exact: true })

  await expect(editor).toHaveAttribute("contenteditable", "true")
  await page.evaluate(() => navigator.clipboard.writeText("Clipboard sentinel"))
  await editor.fill("Native frame clipboard")
  await editor.press("ControlOrMeta+a")
  await editor.press("ControlOrMeta+c")

  const target = example.getByRole("textbox", {
    name: "Parent paste target",
    exact: true,
  })

  await target.click()
  await target.press("ControlOrMeta+v")
  await expect(target).toHaveValue("Native frame clipboard")
  await target.press("ControlOrMeta+z")
  await expect(editor).toHaveText("Native frame clipboard")
})

test("public-iframe: theme markers, responsive resizing, and remount preserve the frame boundary", async ({
  page,
}, testInfo) => {
  test.slow()

  const example = await openIframeExample(page)
  const iframe = example.locator('iframe[title="Isolated editor preview"]')

  const editor = page
    .frameLocator('iframe[title="Isolated editor preview"]')
    .getByRole("textbox", { name: "Isolated editor", exact: true })

  await expect(editor).toHaveAttribute("contenteditable", "true")
  await editor.fill("Keep this frame document while resizing")

  for (const width of [1440, 768, 390]) {
    await page.setViewportSize({ width, height: 1000 })
    await expect
      .poll(() =>
        iframe.evaluate(
          (element) =>
            element instanceof HTMLIFrameElement &&
            element.contentDocument?.documentElement.className ===
              element.ownerDocument.documentElement.className,
        ),
      )
      .toBe(true)
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
      .toBeLessThanOrEqual(width)
    await expect(editor).toHaveText("Keep this frame document while resizing")
    await testInfo.attach(`frame-${width}.png`, {
      body: await example.screenshot({ scale: "css" }),
      contentType: "image/png",
    })
  }

  const nested = await new AxeBuilder({ page })
    .include([
      'iframe[title="Isolated editor preview"]',
      'main[aria-label="Isolated editor document"]',
    ])
    .analyze()

  expect(nested.violations).toEqual([])
  await example
    .getByRole("button", { name: "Live preview", exact: true })
    .click()
  await expect(iframe).toHaveCount(0)
  await example
    .getByRole("button", { name: "Live preview", exact: true })
    .click()
  await expect(editor).toHaveAttribute("contenteditable", "true")
  await expect(editor).toHaveText("Edit inside this same-origin frame.")
})
