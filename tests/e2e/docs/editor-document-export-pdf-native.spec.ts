import { expect, test } from "@playwright/test"

interface CanvasEncoderPrototype {
  toBlob: (
    this: HTMLCanvasElement,
    ...args: Parameters<HTMLCanvasElement["toBlob"]>
  ) => void
}

interface ImageDecoderPrototype {
  decode: (this: HTMLImageElement) => Promise<void>
}

for (const phase of ["decode", "jpeg"] as const) {
  test(`PDF cancellation retains lease during native ${phase}`, async ({
    page,
  }, testInfo) => {
    await page.addInitScript((pendingPhase) => {
      const imagePrototype: ImageDecoderPrototype = HTMLImageElement.prototype
      const decode = imagePrototype.decode
      HTMLImageElement.prototype.decode = function holdDecode() {
        if (pendingPhase !== "decode" || !this.src.startsWith("blob:"))
          return decode.call(this)
        document.documentElement.setAttribute("data-pdf-native-pending", "true")

        return new Promise<void>((resolve) => {
          window.addEventListener("release-native-pdf", () => resolve(), {
            once: true,
          })
        })
      }

      const canvasPrototype: CanvasEncoderPrototype =
        HTMLCanvasElement.prototype

      const toBlob = canvasPrototype.toBlob
      HTMLCanvasElement.prototype.toBlob = function holdJPEG(
        callback,
        type,
        quality,
      ) {
        if (pendingPhase !== "jpeg" || type !== "image/jpeg")
          return toBlob.call(this, callback, type, quality)
        document.documentElement.setAttribute("data-pdf-native-pending", "true")
        window.addEventListener("release-native-pdf", () => callback(null), {
          once: true,
        })
      }
    }, phase)
    await page.goto("/editor/document-pdf-export-control")

    const controls = page.getByRole("group", {
      name: "Document PDF export",
      exact: true,
    })

    const exportButton = controls.getByRole("button", {
      name: "Export document as PDF",
      exact: true,
    })

    const downloads: string[] = []
    page.on("download", (download) =>
      downloads.push(download.suggestedFilename()),
    )
    await exportButton.click()
    await expect(page.locator("html")).toHaveAttribute(
      "data-pdf-native-pending",
      "true",
    )
    await controls
      .getByRole("button", { name: "Cancel document export", exact: true })
      .click()
    await expect(exportButton).toBeEnabled()
    await exportButton.click()
    await expect(controls.getByRole("alert")).toContainText(
      "Another document export",
    )
    await page.evaluate(() =>
      window.dispatchEvent(new Event("release-native-pdf")),
    )
    await expect(page.locator("[data-editor-export-host]")).toHaveCount(0)
    expect(downloads).toEqual([])
    await testInfo.attach("native-pdf-cancel", {
      body: JSON.stringify({ phase, downloads }),
      contentType: "application/json",
    })
  })
}

test("PDF download uses editor owner document inside a frame", async ({
  page,
}, testInfo) => {
  await page.route("**/pdf-export-frame", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: '<!doctype html><html lang="en"><head><title>PDF owner frame</title></head><body><iframe title="PDF owner frame" src="/editor/document-pdf-export-control"></iframe></body></html>',
    }),
  )
  await page.goto("/pdf-export-frame")
  const frame = page.frameLocator('iframe[title="PDF owner frame"]')

  const controls = frame.getByRole("group", {
    name: "Document PDF export",
    exact: true,
  })

  const downloadPromise = page.waitForEvent("download")
  await controls
    .getByRole("button", { name: "Export document as PDF", exact: true })
    .click()
  const download = await downloadPromise
  const path = testInfo.outputPath("owner-frame.pdf")
  await download.saveAs(path)
  expect(await download.failure()).toBeNull()
  await expect(controls).toHaveAttribute("aria-busy", "false")
  await expect(frame.locator("[data-editor-export-host]")).toHaveCount(0)
  await expect(page.locator("[data-editor-export-host]")).toHaveCount(0)
  await testInfo.attach("owner-frame-pdf", {
    path,
    contentType: "application/pdf",
  })
})
