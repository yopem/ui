import type { Page } from "@playwright/test"

import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

const firstImageUrl = "https://ui.yopem.com/favicon.svg"

const secondImageUrl =
  "https://interactive-examples.mdn.mozilla.net/media/cc0-images/grapefruit-slice.jpg"

async function routePreviewImages(page: Page) {
  for (const url of [firstImageUrl, secondImageUrl])
    await page.route(url, (route) =>
      route.fulfill({
        contentType: "image/svg+xml",
        body: '<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1200"><rect width="1600" height="1200" fill="black"/></svg>',
      }),
    )
}

async function openPreviewExample(page: Page) {
  await page.goto("/editor/examples#public-media-preview")
  const example = page.getByTestId("editor-example-public-media-preview")

  await expect(example).toBeVisible()
  await example
    .getByRole("button", { name: "Live preview", exact: true })
    .click()
  await expect(
    example.getByRole("textbox", {
      name: "Public media preview editor",
      exact: true,
    }),
  ).toHaveAttribute("contenteditable", "true")

  return example
}

test("image preview supports accessible gallery navigation and local zoom", async ({
  page,
}, testInfo) => {
  await routePreviewImages(page)
  const example = await openPreviewExample(page)

  const firstTrigger = example
    .locator('[data-slot="editor-media"]')
    .first()
    .getByRole("button", {
      name: "Preview image: Yopem UI mark",
      exact: true,
    })

  const mediaState = example.getByTestId("media-document-state")
  const originalState = await mediaState.getAttribute("data-document")

  await firstTrigger.evaluate((element) => {
    element.addEventListener("click", (event) => event.preventDefault(), {
      once: true,
    })
  })
  await firstTrigger.click()
  await expect(page.getByRole("dialog")).toHaveCount(0)
  await expect(mediaState).toHaveAttribute("data-document", originalState ?? "")
  await firstTrigger.click()
  const dialog = page.getByRole("dialog")
  await expect(dialog).toBeVisible()
  await expect(
    page.getByRole("dialog", { name: "Yopem UI mark", exact: true }),
  ).toBeVisible()
  await expect(
    dialog.getByRole("img", { name: "Yopem UI mark", exact: true }),
  ).toBeVisible()

  const previous = dialog.getByRole("button", {
    name: "Previous image",
    exact: true,
  })

  const next = dialog.getByRole("button", { name: "Next image", exact: true })
  const zoom = dialog.getByRole("slider", { name: "Image zoom", exact: true })
  const zoomOut = dialog.getByRole("button", { name: "Zoom out", exact: true })
  const zoomIn = dialog.getByRole("button", { name: "Zoom in", exact: true })

  await expect(previous).toBeDisabled()
  await expect(next).toBeEnabled()
  await expect(zoomOut).toBeEnabled()
  await zoomOut.evaluate((element) => {
    element.addEventListener("click", (event) => event.preventDefault(), {
      once: true,
    })
  })
  await zoomOut.click()
  await expect(zoom).toHaveAttribute("aria-valuenow", "100")
  await zoom.focus()
  await zoom.press("ArrowLeft")
  await expect(zoom).toHaveAttribute("aria-valuenow", "50")
  await expect(zoomOut).toBeDisabled()

  for (let step = 0; step < 5; step++) await zoom.press("ArrowRight")
  await expect(zoom).toHaveAttribute("aria-valuenow", "300")
  await expect(zoomIn).toBeDisabled()

  const imageViewport = dialog.getByRole("group", {
    name: "Image preview",
    exact: true,
  })

  await imageViewport.focus()
  await expect(imageViewport).toBeFocused()
  await imageViewport.press("ArrowRight")
  await expect
    .poll(() => imageViewport.evaluate((element) => element.scrollLeft))
    .toBeGreaterThan(0)
  await next.click()
  await expect(
    page.getByRole("dialog", { name: "Grapefruit slice", exact: true }),
  ).toBeVisible()
  await expect(next).toBeDisabled()
  await expect(zoom).toHaveAttribute("aria-valuenow", "100")
  await dialog
    .getByRole("button", { name: "Previous image", exact: true })
    .click()
  await expect(dialog).toBeVisible()

  const report = await new AxeBuilder({ page })
    .include('[role="dialog"]')
    .analyze()

  expect(report.violations).toEqual([])
  await testInfo.attach("media-preview-dialog-axe.json", {
    body: JSON.stringify(report),
    contentType: "application/json",
  })

  await page.keyboard.press("Escape")
  await expect(dialog).toHaveCount(0)
  await expect(firstTrigger).toBeFocused()
  await expect(mediaState).toHaveAttribute("data-document", originalState ?? "")
  await expect(
    example.getByRole("button", { name: "Select media", exact: true }).first(),
  ).toHaveAttribute("aria-pressed", "false")
})

test("read-only images stay previewable and media edits remove stale gallery data", async ({
  page,
}) => {
  await routePreviewImages(page)
  const example = await openPreviewExample(page)

  await example
    .getByRole("button", { name: "Set read-only", exact: true })
    .click()

  const firstTrigger = example
    .locator('[data-slot="editor-media"]')
    .first()
    .getByRole("button", {
      name: "Preview image: Yopem UI mark",
      exact: true,
    })

  await firstTrigger.click()
  await expect(
    page.getByRole("dialog", { name: "Yopem UI mark", exact: true }),
  ).toBeVisible()
  await expect(
    example.getByRole("button", { name: "Select media", exact: true }),
  ).toHaveCount(0)

  await page.keyboard.press("Escape")
  await example.getByRole("button", { name: "Edit media", exact: true }).click()
  await example
    .getByRole("textbox", { name: "Alternative text", exact: true })
    .first()
    .fill("Updated mark")

  const updatedTrigger = example.getByRole("button", {
    name: "Preview image: Updated mark",
    exact: true,
  })

  await updatedTrigger.click()
  await expect(
    page.getByRole("dialog", { name: "Updated mark", exact: true }),
  ).toBeVisible()
  await page.keyboard.press("Escape")
  await example
    .getByRole("button", { name: "Delete media", exact: true })
    .first()
    .click()
  await expect(updatedTrigger).toHaveCount(0)
  await expect(page.getByRole("dialog")).toHaveCount(0)
})

test("preview dialog portals into foreign trigger owner document", async ({
  page,
}) => {
  await routePreviewImages(page)
  const example = await openPreviewExample(page)

  const foreignDocument = example.frameLocator(
    'iframe[title="Foreign document media preview"]',
  )

  const trigger = foreignDocument.getByRole("button", {
    name: "Preview image: Yopem UI mark",
    exact: true,
  })

  await expect(trigger).toBeVisible()
  await trigger.click()
  await expect(
    foreignDocument.getByRole("dialog", {
      name: "Yopem UI mark",
      exact: true,
    }),
  ).toBeVisible()
  await page.keyboard.press("Escape")
  await expect(trigger).toBeFocused()
  await expect(
    foreignDocument.getByRole("dialog", {
      name: "Yopem UI mark",
      exact: true,
    }),
  ).toHaveCount(0)
})
