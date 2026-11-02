import { expect, test } from "@playwright/test"
import {
  editorPartLabel,
  editorParts,
} from "@workspace/apps/docs/src/catalog/editor-parts"
import { editorReviewParts } from "@workspace/apps/docs/src/catalog/editor-review-parts"

const reviewParts = editorParts.filter((part) => part.item === "editor-review")

test("review parts are included in the editor inventory", () => {
  expect(reviewParts.map((part) => part.name)).toEqual(
    editorReviewParts.map((part) => part.name),
  )
})

for (const part of reviewParts) {
  test(`${part.name} has a live preview and public API`, async ({
    page,
    request,
  }) => {
    await page.goto(`/editor/${part.slug}`)
    await expect(
      page.getByRole("heading", {
        name: editorPartLabel(part.name),
        level: 1,
        exact: true,
      }),
    ).toBeVisible()
    await expect(
      page.locator('[data-slot="editor-part-preview"]'),
    ).toBeVisible()
    const markdown = await request.get(`/editor/${part.slug}.md`)
    expect(markdown.status()).toBe(200)
    expect(markdown.headers()["content-type"]).toContain("text/")
  })
}

test("rich replies remain native and read-only rendering keeps content", async ({
  page,
}) => {
  await page.goto("/editor/review-reply-form")

  const draft = page.getByRole("textbox", {
    name: "Reply to thread demo-thread",
  })

  await draft.fill("Native reply")
  await draft.press("Enter")
  await draft.pressSequentially("Second paragraph")
  await page.getByRole("button", { name: "Reply", exact: true }).click()
  await expect(draft).toHaveText("")
  await page.goto("/editor/review-rich-content")
  await expect(page.getByText("Review content", { exact: true })).toBeVisible()
})
