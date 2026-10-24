import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

for (const width of [1440, 768, 390]) {
  test(`@a11y native review thread and decision workflow ${width}`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 })
    await page.goto("/components/editor-review")

    const editor = page.getByRole("textbox", {
      name: "Review document",
      exact: true,
    })

    await editor.fill("Original text")
    await editor.press("Home")
    await editor.press("Shift+End")
    await page
      .getByRole("button", { name: "Comment on selection", exact: true })
      .click()
    await page
      .getByRole("textbox", { name: "New comment", exact: true })
      .fill("Please check")
    await page.getByRole("button", { name: "Add comment", exact: true }).click()
    const panel = page.getByRole("complementary", { name: "Document review" })
    const reply = panel.getByRole("textbox", { name: /^Reply to thread / })
    await reply.fill("Checked")
    await panel.getByRole("button", { name: "Reply", exact: true }).click()
    await expect(panel.getByRole("article")).toHaveCount(2)
    await expect(reply).toBeFocused()
    await panel
      .getByRole("button", { name: "Resolve thread", exact: true })
      .click()
    await expect(
      panel.getByRole("button", { name: "Reopen thread", exact: true }),
    ).toBeFocused()
    await expect(reply).toHaveCount(0)
    await panel
      .getByRole("button", { name: "Reopen thread", exact: true })
      .click()
    await expect(reply).toBeVisible()
    await page
      .getByRole("button", { name: "Suggest edits", exact: true })
      .click()
    await editor.click()
    await editor.press("End")
    await editor.pressSequentially("!")
    await expect(editor).toHaveText("Original text!")
    await panel
      .getByRole("button", { name: "Go to suggestion", exact: true })
      .click()
    await expect(editor).toBeFocused()
    await panel
      .getByRole("button", { name: "Reject suggestion", exact: true })
      .click()
    await expect(editor).toHaveText("Original text")
    await editor.press("ControlOrMeta+z")
    await expect(editor).toHaveText("Original text!")
    await panel
      .getByRole("button", { name: "Accept all suggestions", exact: true })
      .click()
    await expect(editor).toHaveText("Original text!")
    const axe = await new AxeBuilder({ page }).analyze()
    await testInfo.attach(`review-${width}-axe.json`, {
      body: JSON.stringify(axe),
      contentType: "application/json",
    })
    await testInfo.attach(`review-${width}.png`, {
      body: await page.screenshot({ fullPage: true }),
      contentType: "image/png",
    })
    expect(axe.violations).toEqual([])
  })
}

test("native formatting survives rejected deletion decorations", async ({
  page,
}, testInfo) => {
  await page.goto("/components/editor-review")

  const editor = page.getByRole("textbox", {
    name: "Review document",
    exact: true,
  })

  await editor.fill("Original text")
  await editor.press("Home")
  await editor.press("Shift+End")
  await page.getByRole("button", { name: "Underline", exact: true }).click()
  await expect(editor.getByText("Original text", { exact: true })).toHaveCSS(
    "text-decoration-line",
    "underline",
  )
  await page.getByRole("button", { name: "Suggest edits", exact: true }).click()
  await editor.press("Backspace")
  await expect(editor).toHaveText("Original text")
  const original = editor.getByText("Original text", { exact: true })
  await expect(original).toHaveCSS("text-decoration-line", /underline/)
  await expect(original).toHaveCSS("text-decoration-line", /line-through/)
  await original.evaluate((element) =>
    element.setAttribute("title", "Host caption"),
  )
  await page
    .getByRole("button", { name: "Reject suggestion", exact: true })
    .click()
  await expect(editor).toHaveText("Original text")
  await expect(editor.getByText("Original text", { exact: true })).toHaveCSS(
    "text-decoration-line",
    "underline",
  )
  await expect(original).toHaveAttribute("title", "Host caption")
  await testInfo.attach("review-decoration.png", {
    body: await page.screenshot({ fullPage: true }),
    contentType: "image/png",
  })
})

test("host replacement expires the captured anchor before comment submission", async ({
  page,
}, testInfo) => {
  await page.goto("/components/editor-review")

  const editor = page.getByRole("textbox", {
    name: "Review document",
    exact: true,
  })

  await editor.fill("Original text")
  await editor.press("Home")
  await editor.press("Shift+End")
  await page
    .getByRole("button", { name: "Comment on selection", exact: true })
    .click()
  await page
    .getByRole("textbox", { name: "New comment", exact: true })
    .fill("Stale anchor")
  await page
    .getByRole("button", { name: "Change reviewer", exact: true })
    .click()
  await page.getByRole("button", { name: "Add comment", exact: true }).click()

  const panel = page.getByRole("complementary", {
    name: "Document review",
    exact: true,
  })

  await expect(panel.getByRole("article")).toHaveCount(0)
  await expect(panel.getByRole("status")).not.toBeEmpty()
  await expect(editor).toHaveText("Original text")
  await testInfo.attach("review-stale-host.png", {
    body: await page.screenshot({ fullPage: true }),
    contentType: "image/png",
  })
})

test("readonly discussion permission stays separate from document editing", async ({
  page,
}, testInfo) => {
  await page.goto("/components/editor-review")

  const editor = page.getByRole("textbox", {
    name: "Review document",
    exact: true,
  })

  await editor.fill("Original text")
  await editor.press("Home")
  await editor.press("Shift+End")
  await page
    .getByRole("button", { name: "Comment on selection", exact: true })
    .click()
  await page
    .getByRole("textbox", { name: "New comment", exact: true })
    .fill("Discussion")
  await page.getByRole("button", { name: "Add comment", exact: true }).click()
  await page
    .getByRole("button", { name: "Read-only document", exact: true })
    .click()
  await expect(editor).toHaveAttribute("contenteditable", "false")
  await expect(
    page.getByRole("textbox", { name: "Reply", exact: false }),
  ).not.toBeEditable()
  await expect(
    page.getByRole("button", { name: "Reply", exact: true }),
  ).toBeDisabled()
  await page
    .getByRole("button", { name: "Allow read-only discussion", exact: true })
    .click()
  await page
    .getByRole("textbox", { name: "Reply", exact: false })
    .fill("Allowed reply")
  await page.getByRole("button", { name: "Reply", exact: true }).click()

  const panel = page.getByRole("complementary", {
    name: "Document review",
    exact: true,
  })

  await expect(panel.getByRole("article")).toHaveCount(2)
  await expect(editor).toHaveText("Original text")
  await page
    .getByRole("button", { name: "Hide discussions", exact: true })
    .click()
  await expect(panel.getByRole("article")).toHaveCount(0)
  await testInfo.attach("review-readonly.png", {
    body: await page.screenshot({ fullPage: true }),
    contentType: "image/png",
  })
})

test("native clipboard preserves normal text and fails closed while suggesting", async ({
  page,
}, testInfo) => {
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"])
  await page.goto("/components/editor-review")

  const editor = page.getByRole("textbox", {
    name: "Review document",
    exact: true,
  })

  await editor.fill("Original")
  await editor.press("Home")
  await editor.press("Shift+End")
  await editor.press("ControlOrMeta+c")
  await editor.press("End")
  await editor.press("ControlOrMeta+v")
  await expect(editor).toHaveText("OriginalOriginal")
  await page.getByRole("button", { name: "Suggest edits", exact: true }).click()
  await editor.press("ControlOrMeta+v")
  await editor.press("Home")
  await editor.press("Shift+End")
  await editor.press("ControlOrMeta+x")
  await expect(editor).toHaveText("OriginalOriginal")
  await expect(
    page
      .getByRole("complementary", { name: "Document review", exact: true })
      .getByRole("status"),
  ).not.toBeEmpty()
  await testInfo.attach("review-clipboard.png", {
    body: await page.screenshot({ fullPage: true }),
    contentType: "image/png",
  })
})

test("revoked review policy blocks decisions and native history", async ({
  page,
}, testInfo) => {
  await page.goto("/components/editor-review")

  const editor = page.getByRole("textbox", {
    name: "Review document",
    exact: true,
  })

  await editor.fill("Original")
  await page.getByRole("button", { name: "Suggest edits", exact: true }).click()
  await editor.press("End")
  await editor.press("x")
  await page
    .getByRole("button", { name: "Deny review actions", exact: true })
    .click()
  await expect(
    page.getByRole("button", { name: "Accept all suggestions", exact: true }),
  ).toBeDisabled()
  await editor.press("ControlOrMeta+z")
  await expect(editor).toHaveText("Originalx")
  await page.getByRole("button", { name: "Suggest edits", exact: true }).click()
  await expect(
    page.getByRole("button", { name: "Suggest edits", exact: true }),
  ).toHaveAttribute("aria-pressed", "false")
  await page
    .getByRole("button", { name: "Allow review actions", exact: true })
    .click()
  await page
    .getByRole("button", { name: "Reject all suggestions", exact: true })
    .click()
  await expect(editor).toHaveText("Original")
  await testInfo.attach("review-policy.png", {
    body: await page.screenshot({ fullPage: true }),
    contentType: "image/png",
  })
})

test("overlapping discussions keep separate selectable anchors after thread deletion", async ({
  page,
}, testInfo) => {
  await page.goto("/components/editor-review")

  const editor = page.getByRole("textbox", {
    name: "Review document",
    exact: true,
  })

  await editor.fill("Original text")
  await editor.press("Home")
  await editor.press("Shift+End")
  await page
    .getByRole("button", { name: "Comment on selection", exact: true })
    .click()
  await page
    .getByRole("textbox", { name: "New comment", exact: true })
    .fill("First anchor")
  await page.getByRole("button", { name: "Add comment", exact: true }).click()
  await editor.press("Home")
  await editor.press("ArrowRight")
  await editor.press("ArrowRight")
  await editor.press("Shift+End")
  await page
    .getByRole("button", { name: "Comment on selection", exact: true })
    .click()
  await page
    .getByRole("textbox", { name: "New comment", exact: true })
    .fill("Second anchor")
  await page.getByRole("button", { name: "Add comment", exact: true }).click()

  const panel = page.getByRole("complementary", {
    name: "Document review",
    exact: true,
  })

  await expect(panel.getByRole("article")).toHaveCount(2)
  await panel
    .getByRole("button", { name: "Go to thread", exact: true })
    .nth(1)
    .click()
  expect(
    await page.evaluate(() => window.getSelection()?.toString().length ?? 0),
  ).toBeGreaterThan(0)
  await panel
    .getByRole("button", { name: "Delete thread", exact: true })
    .first()
    .click()
  await expect(panel.getByRole("article")).toHaveCount(1)
  await panel.getByRole("button", { name: "Go to thread", exact: true }).click()
  expect(
    await page.evaluate(() => window.getSelection()?.toString().length ?? 0),
  ).toBeGreaterThan(0)
  await expect(editor).toHaveText("Original text")
  expect(
    (
      await new AxeBuilder({ page })
        .include('[data-slot="editor-content"]')
        .include('[aria-label="Document review"]')
        .analyze()
    ).violations,
  ).toEqual([])
  await testInfo.attach("review-overlap.png", {
    body: await page.screenshot({ fullPage: true }),
    contentType: "image/png",
  })
})

for (const width of [1440, 768, 390]) {
  test(`@a11y rich discussion and document text diff ${width}`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 })
    await page.goto("/components/editor-review")

    const editor = page.getByRole("textbox", {
      name: "Review document",
      exact: true,
    })

    await editor.fill("Original")
    await editor.press("Home")
    await editor.press("Shift+End")
    await page
      .getByRole("button", { name: "Comment on selection", exact: true })
      .click()

    const draft = page.getByRole("textbox", {
      name: "New comment",
      exact: true,
    })

    await expect
      .poll(() =>
        page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      )
      .toBe(true)
    await draft.fill("Rich note")
    await draft.press("ControlOrMeta+a")
    await draft.press("ControlOrMeta+b")
    await page
      .getByRole("button", { name: "Keyboard in New comment", exact: true })
      .click()
    await page.getByRole("button", { name: "Add comment", exact: true }).click()
    const panel = page.getByRole("complementary", { name: "Document review" })
    await expect(panel.locator("kbd strong")).toHaveText("Rich note")
    await panel
      .getByRole("button", { name: "Edit comment", exact: true })
      .click()

    const edit = page.getByRole("textbox", {
      name: "Edit comment",
      exact: true,
    })

    await expect(edit).toBeFocused()
    await expect(
      panel.getByRole("button", { name: "Edit comment", exact: true }),
    ).toBeDisabled()
    await edit.press("ControlOrMeta+a")
    await edit.press("ControlOrMeta+i")
    await page
      .getByRole("button", { name: "Save comment", exact: true })
      .click()
    await expect(panel.locator("kbd em")).toContainText("Rich note")
    await expect(
      panel.getByRole("button", { name: "Edit comment", exact: true }),
    ).toBeFocused()
    await editor.click()
    await editor.press("Home")
    await page
      .getByRole("button", { name: "Review replacement", exact: true })
      .click()
    await page
      .getByRole("textbox", { name: "Proposed document text", exact: true })
      .fill("Changed")
    await page
      .getByRole("button", { name: "Suggest document text", exact: true })
      .click()
    await panel
      .getByRole("button", { name: "Accept all suggestions", exact: true })
      .click()
    await expect(editor).toHaveText("Changed")
    const axe = await new AxeBuilder({ page }).analyze()
    expect(axe.violations).toEqual([])
    await testInfo.attach(`rich-diff-${width}-axe.json`, {
      body: JSON.stringify(axe),
      contentType: "application/json",
    })
    await testInfo.attach(`rich-diff-${width}.png`, {
      body: await page.screenshot({ fullPage: true }),
      contentType: "image/png",
    })
  })
}

test("caption updates preserve the captured anchor without replacing host access", async ({
  page,
}, testInfo) => {
  await page.goto("/components/editor-review")

  const editor = page.getByRole("textbox", {
    name: "Review document",
    exact: true,
  })

  await editor.fill("Original")
  await editor.press("Home")
  await editor.press("Shift+End")
  await page
    .getByRole("button", { name: "Comment on selection", exact: true })
    .click()
  await page
    .getByRole("textbox", { name: "New comment", exact: true })
    .fill("Keep anchor")

  const caption = page.getByRole("textbox", {
    name: "Document caption",
    exact: true,
  })

  await caption.fill("Updated caption")
  await expect(caption).toBeFocused()
  await page.getByRole("button", { name: "Add comment", exact: true }).click()
  await expect(
    page
      .getByRole("complementary", { name: "Document review" })
      .getByRole("article"),
  ).toHaveCount(1)
  await expect(editor).toHaveText("Original")
  await testInfo.attach("review-caption.png", {
    body: await page.screenshot({ fullPage: true }),
    contentType: "image/png",
  })
})

test("comment shortcut opens a native rich draft at a collapsed caret", async ({
  page,
}, testInfo) => {
  await page.goto("/components/editor-review")

  const editor = page.getByRole("textbox", {
    name: "Review document",
    exact: true,
  })

  await editor.fill("Original")
  await editor.press("End")
  await editor.press("ControlOrMeta+Shift+m")
  await expect(
    page.getByRole("textbox", { name: "New comment", exact: true }),
  ).toBeFocused()
  await page
    .getByRole("textbox", { name: "New comment", exact: true })
    .fill("Keyboard note")
  await page.getByRole("button", { name: "Add comment", exact: true }).click()
  const panel = page.getByRole("complementary", { name: "Document review" })
  await expect(panel.getByRole("article")).toHaveCount(1)
  await expect(
    panel.getByRole("button", { name: "Go to thread", exact: true }),
  ).toBeEnabled()
  await expect(editor).toHaveText("Original")
  await testInfo.attach("review-comment-shortcut.png", {
    body: await page.screenshot({ fullPage: true }),
    contentType: "image/png",
  })
})

for (const width of [1440, 768, 390]) {
  test(`native repeated deletion keeps one decision and original content ${width}`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 })
    await page.goto("/components/editor-review")

    const editor = page.getByRole("textbox", {
      name: "Review document",
      exact: true,
    })

    const panel = page.getByRole("complementary", { name: "Document review" })
    await editor.fill("Original text")
    await page
      .getByRole("button", { name: "Suggest edits", exact: true })
      .click()

    for (const [position, key] of [
      ["End", "Backspace"],
      ["Home", "Delete"],
    ] as const) {
      await editor.click()
      await editor.press(position)
      await editor.press(key)
      await editor.press(key)
      await expect(editor).toHaveText("Original text")

      const reject = panel.getByRole("button", {
        name: "Reject suggestion",
        exact: true,
      })

      await expect(reject).toHaveCount(1)
      await reject.click()
      await expect(editor).toHaveText("Original text")
    }

    await testInfo.attach(`review-delete-${width}.png`, {
      body: await page.screenshot({ fullPage: true }),
      contentType: "image/png",
    })
  })
}
