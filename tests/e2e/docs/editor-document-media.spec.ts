import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"
import { serializeMediaHtml } from "@yopem-ui/editor/media/html"
import { parseMedia } from "@yopem-ui/editor/media/schema"

test("document media retains native controls and rejects arbitrary HTML", async ({
  page,
}, testInfo) => {
  await page.goto("/docs/editor#optional-document")
  const example = page.getByRole("region", { name: "Document I/O example" })
  const editor = example.getByRole("textbox", { name: "Document editor" })

  const media = parseMedia({
    kind: "video",
    url: "https://example.com/video.mp4",
    alt: "Sample video",
    caption: "Sample caption",
    trackUrl: "https://example.com/captions.vtt",
    width: 640,
    alignment: "center",
  })

  await example.getByLabel("HTML source").fill(serializeMediaHtml(media))
  await example
    .getByRole("button", { name: "Import HTML", exact: true })
    .click()
  await expect(editor.locator("video")).toHaveAttribute("controls", "")
  await expect(editor.locator("video")).toHaveAttribute(
    "aria-label",
    "Sample video",
  )
  await expect(editor.locator("track")).toHaveAttribute(
    "src",
    media.trackUrl ?? "",
  )
  await example
    .getByRole("button", { name: "Export document", exact: true })
    .click()
  const markdown = await example.getByLabel("Markdown output").inputValue()
  expect(markdown).toContain("data-yopem-media")
  await example.getByLabel("Markdown source").fill(markdown)
  await example
    .getByRole("button", { name: "Import Markdown", exact: true })
    .click()
  await expect(editor.locator("video")).toHaveAttribute("src", media.url)
  const before = await editor.innerHTML()
  await example
    .getByLabel("HTML source")
    .fill('<iframe src="https://evil.example/embed"></iframe>')
  await example
    .getByRole("button", { name: "Import HTML", exact: true })
    .click()
  await expect(example.getByRole("alert")).toBeVisible()
  expect(await editor.innerHTML()).toBe(before)
  expect(
    (
      await new AxeBuilder({ page })
        .include('[aria-label="Document I/O example"]')
        .analyze()
    ).violations,
  ).toEqual([])
  await testInfo.attach("document-media", {
    body: await example.screenshot({ scale: "css" }),
    contentType: "image/png",
  })
  await testInfo.attach("document-media-markdown", {
    body: markdown,
    contentType: "text/markdown",
  })
})
