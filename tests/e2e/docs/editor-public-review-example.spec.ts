import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

test.beforeEach(async ({ page }) => {
  test.slow()
  await page.goto("/editor/examples#public-review")

  const example = page.getByTestId("editor-example-public-review")
  await expect(example).toBeVisible()
  await example
    .getByRole("button", { name: "Live preview", exact: true })
    .click()
  await expect(
    example.getByRole("textbox", {
      name: "Public review document",
      exact: true,
    }),
  ).toHaveAttribute("contenteditable", "true")
})

test("public-review: anchors discussion, replies, resolution, and new comments", async ({
  page,
}) => {
  const example = page.getByTestId("editor-example-public-review")

  const editor = example.getByRole("textbox", {
    name: "Public review document",
    exact: true,
  })

  const panel = example.getByRole("complementary", {
    name: "Document review",
  })

  const thread = panel.getByRole("region", {
    name: "Thread public-review-anchor",
    exact: true,
  })

  await expect(editor).toHaveAttribute("contenteditable", "true")
  await expect(editor.locator("mark")).toContainText(
    "Anchor this discussion to the sample paragraph.",
  )
  await thread
    .getByRole("button", { name: "Go to thread", exact: true })
    .click()
  await expect(editor).toBeFocused()

  const reply = thread.getByRole("textbox", {
    name: "Reply to thread public-review-anchor",
    exact: true,
  })

  await expect(reply).toHaveAttribute("contenteditable", "true")
  await reply.fill("I checked the anchored passage.")
  await thread.getByRole("button", { name: "Reply", exact: true }).click()
  await expect(thread.getByRole("article")).toHaveCount(2)
  await expect(reply).toBeFocused()

  await thread
    .getByRole("button", { name: "Resolve thread", exact: true })
    .click()
  await expect(
    thread.getByRole("heading", { name: "Resolved thread", exact: true }),
  ).toBeVisible()
  await expect(reply).toHaveCount(0)
  await thread
    .getByRole("button", { name: "Reopen thread", exact: true })
    .click()
  await expect(reply).toBeVisible()

  await editor.press("ControlOrMeta+a")
  await example
    .getByRole("button", { name: "Comment on selection", exact: true })
    .click()
  await example
    .getByRole("textbox", { name: "New comment", exact: true })
    .fill("Please review this selected passage.")
  await example
    .getByRole("button", { name: "Add comment", exact: true })
    .click()

  const createdThread = panel
    .getByRole("region")
    .filter({ hasText: "Please review this selected passage." })

  await expect(createdThread.getByRole("article")).toHaveCount(1)
  await createdThread
    .getByRole("button", { name: "Go to thread", exact: true })
    .click()
  await expect(editor).toBeFocused()
})

test("public-review: creates inline insert, delete, and format suggestions with decisions and undo", async ({
  page,
}) => {
  const example = page.getByTestId("editor-example-public-review")

  const editor = example.getByRole("textbox", {
    name: "Public review document",
    exact: true,
  })

  const toolbar = example.getByRole("toolbar").filter({
    has: page.getByRole("button", { name: "Suggest edits", exact: true }),
  })

  const panel = example.getByRole("complementary", {
    name: "Document review",
  })

  await editor.fill("Original review text.")
  await toolbar
    .getByRole("button", { name: "Suggest edits", exact: true })
    .click()
  await expect(
    toolbar.getByRole("button", { name: "Suggest edits", exact: true }),
  ).toHaveAttribute("aria-pressed", "true")

  await editor.focus()
  await editor.press("ControlOrMeta+End")
  await editor.pressSequentially(" Added")
  await expect(editor.locator('[data-editor-suggestion="insert"]')).toHaveText(
    " Added",
  )
  await panel
    .getByRole("button", { name: "Reject suggestion", exact: true })
    .click()
  await expect(editor).toHaveText("Original review text.")
  await toolbar.getByRole("button", { name: "Undo", exact: true }).click()
  await expect(editor).toHaveText("Original review text. Added")
  await panel
    .getByRole("button", { name: "Accept suggestion", exact: true })
    .click()
  await expect(editor.locator('[data-editor-suggestion="insert"]')).toHaveCount(
    0,
  )

  await editor.focus()
  await editor.press("ControlOrMeta+a")
  await editor.press("Backspace")
  await expect(editor.locator('[data-editor-suggestion="delete"]')).toHaveText(
    "Original review text. Added",
  )
  await panel
    .getByRole("button", { name: "Accept suggestion", exact: true })
    .click()
  await expect(editor).toHaveText("")
  await toolbar.getByRole("button", { name: "Undo", exact: true }).click()
  await expect(editor.locator('[data-editor-suggestion="delete"]')).toHaveText(
    "Original review text. Added",
  )
  await panel
    .getByRole("button", { name: "Reject suggestion", exact: true })
    .click()
  await expect(editor).toHaveText("Original review text. Added")

  await editor.focus()
  await editor.press("ControlOrMeta+a")
  await toolbar.getByRole("button", { name: "Bold", exact: true }).click()
  await expect(editor.locator('[data-editor-suggestion="format"]')).toHaveText(
    "Original review text. Added",
  )
  await panel
    .getByRole("button", { name: "Reject suggestion", exact: true })
    .click()
  await expect(editor.locator("strong, b")).toHaveCount(0)
  await expect(editor).toHaveText("Original review text. Added")
})

test("public-review: local profile policy and read-only mode disable review actions", async ({
  page,
}) => {
  const example = page.getByTestId("editor-example-public-review")

  const editor = example.getByRole("textbox", {
    name: "Public review document",
    exact: true,
  })

  const toolbar = example.getByRole("toolbar").filter({
    has: page.getByRole("button", { name: "Suggest edits", exact: true }),
  })

  const panel = example.getByRole("complementary", {
    name: "Document review",
  })

  const thread = panel.getByRole("region", {
    name: "Thread public-review-anchor",
    exact: true,
  })

  await editor.fill("Policy check.")
  await toolbar
    .getByRole("button", { name: "Suggest edits", exact: true })
    .click()
  await editor.focus()
  await editor.press("ControlOrMeta+End")
  await editor.pressSequentially("!")

  const accept = panel.getByRole("button", {
    name: "Accept suggestion",
    exact: true,
  })

  await expect(accept).toBeEnabled()

  await example
    .getByRole("button", { name: "Use observer profile", exact: true })
    .click()
  await expect(accept).toBeDisabled()
  await expect(
    panel.getByRole("button", { name: "Reject suggestion", exact: true }),
  ).toBeDisabled()
  await expect(
    example.getByRole("button", { name: "Comment on selection", exact: true }),
  ).toBeDisabled()
  await expect(
    thread.getByRole("button", { name: "Resolve thread", exact: true }),
  ).toBeDisabled()
  await expect(
    thread.getByRole("button", { name: "Reply", exact: true }),
  ).toBeDisabled()

  await example
    .getByRole("button", { name: "Use reviewer profile", exact: true })
    .click()
  await expect(accept).toBeEnabled()
  await accept.click()
  await expect(editor).toHaveText("Policy check.!")

  await example
    .getByRole("button", { name: "Set document read-only", exact: true })
    .click()
  await expect(editor).toHaveAttribute("contenteditable", "false")
  await expect(editor).toHaveAttribute("aria-readonly", "true")
  const readonlyText = await editor.innerText()
  await editor.click()
  await page.keyboard.type("Read-only input must not change the document")
  await expect.poll(() => editor.innerText()).toBe(readonlyText)
  await expect(
    toolbar.getByRole("button", { name: "Suggest edits", exact: true }),
  ).toBeDisabled()
  await expect(
    example.getByRole("button", { name: "Comment on selection", exact: true }),
  ).toBeDisabled()
  await expect(
    thread.getByRole("button", { name: "Resolve thread", exact: true }),
  ).toBeDisabled()
  await expect(
    thread.getByRole("button", { name: "Reply", exact: true }),
  ).toBeDisabled()

  await example
    .getByRole("button", { name: "Enable document editing", exact: true })
    .click()
  await expect(editor).toHaveAttribute("contenteditable", "true")
  await editor.focus()
  await expect(editor).toBeFocused()
})

test("public-review: anchors and discussion controls remain accessible at phone widths", async ({
  page,
}, testInfo) => {
  const example = page.getByTestId("editor-example-public-review")

  const thread = example.getByRole("region", {
    name: "Thread public-review-anchor",
    exact: true,
  })

  await expect(thread.getByRole("article")).toHaveCount(1)

  for (const width of [1440, 768, 390]) {
    await page.setViewportSize({ width, height: 900 })
    await thread.scrollIntoViewIfNeeded()
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
      .toBeLessThanOrEqual(width)
    await testInfo.attach(`review-${width}.png`, {
      body: await example.screenshot({ scale: "css" }),
      contentType: "image/png",
    })
  }

  const report = await new AxeBuilder({ page })
    .include('[data-testid="editor-example-public-review"]')
    .analyze()

  expect(report.violations).toEqual([])
})
