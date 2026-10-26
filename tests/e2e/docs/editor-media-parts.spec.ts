import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

const previewParts = [
  ["MediaPreviewRoot", "media-preview-root"],
  ["MediaPreviewTrigger", "media-preview-trigger"],
  ["MediaPreviewDialog", "media-preview-dialog"],
  ["MediaPreviewGallery", "media-preview-gallery"],
] as const

for (const [name, slug] of previewParts) {
  test(`${name} has usable standalone preview and complete consumer source`, async ({
    page,
    context,
  }, testInfo) => {
    test.slow()
    await context.grantPermissions(["clipboard-read", "clipboard-write"])
    await page.route("https://ui.yopem.com/favicon.svg", (route) =>
      route.fulfill({
        contentType: "image/svg+xml",
        body: '<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1200"><rect width="1600" height="1200" fill="black"/></svg>',
      }),
    )
    await page.goto(`/editor/${slug}`)

    const preview = page.getByRole("group", {
      name: `${name} live preview`,
      exact: true,
    })

    await expect(preview.locator("[contenteditable]")).toHaveCount(0)

    const group = preview.getByRole("region", {
      name:
        name === "MediaPreviewGallery"
          ? "Image gallery preset"
          : "Composed image preview",
      exact: true,
    })

    const trigger = group.getByRole("button", {
      name: "Preview image: Yopem UI mark",
      exact: true,
    })

    await trigger.click()

    const dialog = page.getByRole("dialog", {
      name: "Yopem UI mark",
      exact: true,
    })

    await expect(dialog).toBeVisible()

    const slider = dialog.getByRole("slider", {
      name: "Image zoom",
      exact: true,
    })

    await slider.focus()
    await slider.press("ArrowRight")
    await expect(slider).toHaveAttribute("aria-valuenow", "150")
    const report = await new AxeBuilder({ page }).analyze()
    expect(report.violations).toEqual([])
    await testInfo.attach("media-part-open-axe.json", {
      body: JSON.stringify(report),
      contentType: "application/json",
    })
    await page.keyboard.press("Escape")
    await expect(dialog).toHaveCount(0)
    await expect(trigger).toBeFocused()
    await page.evaluate(() =>
      navigator.clipboard.writeText("Clipboard sentinel"),
    )
    await page
      .getByRole("button", { name: `Copy ${name} usage`, exact: true })
      .click()
    const source = await page.evaluate(() => navigator.clipboard.readText())
    expect(source).toContain(name)
    expect(source).toContain("@/components/editor/media")
    expect(source).not.toMatch(/@workspace|@registry|@yopem-ui|catalog\//u)
  })
}

test("MediaEmbedContent needs consent and revokes loaded frames on policy changes", async ({
  page,
}, testInfo) => {
  test.slow()
  let requests = 0
  await page.route("https://www.youtube-nocookie.com/**", (route) => {
    requests++

    return route.fulfill({
      contentType: "text/html",
      body: "<!doctype html><html lang=en><title>Configured embed</title><main>Configured frame</main></html>",
    })
  })
  await page.goto("/editor/media-embed-content")

  const preview = page.getByRole("group", {
    name: "MediaEmbedContent live preview",
    exact: true,
  })

  await expect(preview.locator("[contenteditable]")).toHaveCount(0)
  await expect(preview.locator("iframe")).toHaveCount(0)
  expect(requests).toBe(0)
  await preview
    .getByRole("button", {
      name: "Load content from www.youtube-nocookie.com",
      exact: true,
    })
    .click()
  const frame = preview.locator("iframe")
  await expect(frame).toHaveAttribute(
    "sandbox",
    "allow-scripts allow-presentation",
  )
  await expect(frame).toHaveAttribute("referrerpolicy", "no-referrer")
  await expect.poll(() => requests).toBe(1)
  await expect(frame.contentFrame().getByRole("main")).toHaveText(
    "Configured frame",
  )
  await preview
    .getByRole("button", { name: "Disable external content", exact: true })
    .click()
  await expect(frame).toHaveCount(0)
  await expect(
    preview.getByRole("button", {
      name: "Load content from www.youtube-nocookie.com",
      exact: true,
    }),
  ).toBeDisabled()
  await preview
    .getByRole("button", { name: "Remove provider policy", exact: true })
    .click()
  await expect(
    preview.getByRole("button", { name: /Load content from/u }),
  ).toHaveCount(0)
  const report = await new AxeBuilder({ page }).analyze()
  expect(report.violations).toEqual([])
  await testInfo.attach("media-embed-policy-axe.json", {
    body: JSON.stringify(report),
    contentType: "application/json",
  })
})
